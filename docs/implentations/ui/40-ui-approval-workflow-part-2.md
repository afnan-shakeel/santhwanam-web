# User-Scoped Approval Views — Complete Specification

**Module:** Approval Workflow  
**Version:** 1.0  
**Date:** February 2026  
**Status:** Draft  
**Depends on:** `20-domain-approval-workflow.md`, `40-ui-approval-workflow.md`, `access-management-admin-level-changes.md`

---

# Table of Contents

1. [Overview](#1-overview)
2. [Database Changes](#2-database-changes)
3. [API Specifications](#3-api-specifications)
4. [UI Specifications](#4-ui-specifications)
5. [Component Architecture](#5-component-architecture)
6. [Navigation & Permissions](#6-navigation--permissions)
7. [Implementation Checklist](#7-implementation-checklist)

---

# 1. Overview

## 1.1 Problem Statement

The current approval workflow system provides only a basic request-level search API (`POST /requests/search`) and a pending-only approver endpoint (`GET /approvals/pending/{approverId}`). Three gaps exist:

1. **Approvers** cannot see their full approval history (only pending items), and the UI is request-centric rather than stage/execution-centric.
2. **Submitters** (agents, admins who initiated a request) have no way to track the progress of their submissions.
3. **Entity context** is absent from approval views — approvers must navigate to the source entity page to understand what they're approving.
4. **No detail page** — there is no dedicated view showing the full approval journey (all stages, decisions, comments) for a single request.

## 1.2 Solution Summary

| Change Area | What Changes |
|---|---|
| **Database** | 3 new columns on `approval_requests` for entity context snapshot |
| **New APIs** | 2 new user-scoped search endpoints (approver + submitter perspective) |
| **Updated APIs** | Enhanced `createApprovalRequest` to accept context; enriched `GET /requests/:requestId` response |
| **Deprecated APIs** | `GET /approvals/pending/{approverId}` (superseded by new search) |
| **New UI Pages** | 3 pages: My Approval Tasks, My Submissions, Approval Request Detail |

## 1.3 Terminology

| Term | Definition |
|------|-----------|
| **Task** | An `ApprovalStageExecution` assigned to the current user — their unit of work |
| **Submission** | An `ApprovalRequest` where `requestedBy` is the current user |
| **Entity Context** | A JSON snapshot of the source entity's key attributes captured at submission time |
| **Entity Label** | A human-readable string identifying the entity (e.g., "John Doe (MEM-2025-00456)") |

---

# 2. Database Changes

## 2.1 Schema Modifications

### Table: `approval_requests` — New Columns

```sql
ALTER TABLE approval_requests ADD COLUMN entity_label VARCHAR(255);
ALTER TABLE approval_requests ADD COLUMN entity_context JSONB;
ALTER TABLE approval_requests ADD COLUMN entity_context_snapshot_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `entity_label` | `VARCHAR(255)` | Yes | Human-readable label. E.g., `"John Doe (MEM-2025-00456)"` |
| `entity_context` | `JSONB` | Yes | Structured snapshot of entity attributes at submission time |
| `entity_context_snapshot_at` | `TIMESTAMP` | No | When the snapshot was captured (defaults to `CURRENT_TIMESTAMP`) |

### New Indexes

```sql
CREATE INDEX idx_requests_requested_by ON approval_requests(requested_by, status);
CREATE INDEX idx_executions_approver_all ON approval_stage_executions(assigned_approver_id, status, created_at DESC);
```

**Rationale:**
- `idx_requests_requested_by`: Powers the "My Submissions" search (filter by submitter + status).
- `idx_executions_approver_all`: Powers the "My Approval Tasks" search across all statuses (not just pending). The existing `idx_executions_approver` only covers `(assigned_approver_id, status)` — adding `created_at DESC` improves sort performance.

## 2.2 Prisma Schema Additions

```prisma
model ApprovalRequest {
  // ... existing fields ...

  // NEW: Entity context snapshot
  entityLabel              String?   @map("entity_label")
  entityContext             Json?     @map("entity_context") @db.JsonB
  entityContextSnapshotAt   DateTime  @default(now()) @map("entity_context_snapshot_at")
}
```

## 2.3 Entity Context JSON Shapes (Per Entity Type)

These are **not enforced by the DB** (JSONB is schemaless). Each submitting module provides its own shape. Documented here for frontend consumption.

### Member Registration

```json
{
  "memberName": "John Doe",
  "memberCode": "MEM-2025-00456",
  "dateOfBirth": "1985-03-15",
  "contactNumber": "+968 9123 4567",
  "email": "john.doe@email.com",
  "tier": "Tier A • ₹100/contribution • ₹50,000 benefit",
  "agent": "Mary Johnson (AGT-001)",
  "unit": "Ruwi Central",
  "hierarchy": "Ruwi Central → Muscat → Oman Forum",
  "nomineeCount": 2,
  "documentsUploaded": 3,
  "registrationStep": "Completed"
}
```

### Death Claim

```json
{
  "claimNumber": "DC-2025-00012",
  "deceasedName": "Jane Smith",
  "deceasedCode": "MEM-2025-00089",
  "deathDate": "2025-01-10",
  "causeOfDeath": "Natural causes",
  "benefitAmount": 50000,
  "tier": "Tier A",
  "nominee": "Ali Smith (Son)",
  "nomineeContact": "+968 9456 7890",
  "agent": "John Kumar (AGT-005)",
  "unit": "Ruwi Central",
  "documentsVerified": "3/4",
  "verificationStatus": "Completed",
  "verificationNotes": "All documents authentic. Hospital confirmed."
}
```

### Wallet Deposit Request

```json
{
  "memberName": "Ali Hassan",
  "memberCode": "MEM-2025-00123",
  "depositAmount": 1000,
  "currentBalance": 250,
  "balanceAfterDeposit": 1250,
  "collectionDate": "2025-01-14",
  "collectedBy": "Agent Mary (AGT-001)",
  "paymentMethod": "Cash",
  "notes": "Monthly top-up"
}
```

### Cash Handover

```json
{
  "handoverCode": "CH-2025-00045",
  "amount": 15000,
  "from": "Agent Mary (AGT-001)",
  "to": "Ahmed (Unit Admin - Ruwi Central)",
  "lineItemCount": 12,
  "breakdown": {
    "contributions": 8500,
    "walletDeposits": 6500
  },
  "initiatedAt": "2025-01-14T10:30:00Z"
}
```

## 2.4 Migration Notes

- All three new columns are nullable or have defaults — **no data backfill required** for existing rows.
- Existing approval requests will have `entity_label = NULL` and `entity_context = NULL`. The UI handles this gracefully by showing the `entityType + entityId` as a fallback label.

---

# 3. API Specifications

## 3.1 Modified APIs

### 3.1.1 `createApprovalRequest` — Accept Entity Context

**Change:** The internal `createApprovalRequest` function (called by source modules when submitting an entity for approval) now accepts three additional fields.

**Updated Input:**

```typescript
interface CreateApprovalRequestInput {
  // Existing fields
  workflowCode: string;
  entityType: string;
  entityId: string;
  forumId?: string;
  areaId?: string;
  unitId?: string;
  submittedBy: string;

  // NEW fields
  entityLabel?: string;      // Human-readable label
  entityContext?: object;     // JSONB snapshot
}
```

`entityContextSnapshotAt` is auto-set to `new Date()` at creation time — not provided by the caller.

**Example — Member Registration submission:**

```typescript
await createApprovalRequest({
  workflowCode: 'member_registration',
  entityType: 'Member',
  entityId: memberId,
  forumId: member.forumId,
  areaId: member.areaId,
  unitId: member.unitId,
  submittedBy: member.createdBy,

  // NEW
  entityLabel: `${member.firstName} ${member.lastName} (${member.memberCode})`,
  entityContext: {
    memberName: `${member.firstName} ${member.lastName}`,
    memberCode: member.memberCode,
    dateOfBirth: member.dateOfBirth,
    contactNumber: member.contactNumber,
    email: member.email,
    tier: `${tier.tierName} • ₹${tier.contributionAmount}/contribution • ₹${tier.deathBenefitAmount} benefit`,
    agent: `${agent.firstName} ${agent.lastName} (${agent.agentCode})`,
    unit: unit.unitName,
    hierarchy: `${unit.unitName} → ${area.areaName} → ${forum.forumName}`,
    nomineeCount: nominees.length,
    documentsUploaded: documents.length,
    registrationStep: member.registrationStep,
  },
}, trx);
```

**Impact:** Each module that calls `createApprovalRequest` needs to be updated to provide the context. Affected modules:

| Module | Function | Entity Type |
|--------|----------|-------------|
| Membership | `submitMemberRegistration()` | `Member` |
| Death Claims | `submitClaimForApproval()` | `DeathClaim` |
| Wallet | `submitWalletDepositForApproval()` | `WalletDepositRequest` |
| Cash Management | `initiateCashHandover()` | `CashHandover` |

---

### 3.1.2 `GET /api/approval-workflow/requests/{requestId}` — Enriched Response

**Change:** Enhance the existing endpoint to return full detail including entity context, all stage executions with reviewer names, workflow metadata, and requester info.

**Existing Response (minimal):**
```json
{
  "requestId": "uuid",
  "workflowCode": "string",
  "entityType": "string",
  "status": "string"
}
```

**New Response (enriched):**
```json
{
  "requestId": "uuid",
  "workflowId": "uuid",
  "entityType": "Member",
  "entityId": "uuid",
  "status": "Pending",
  "currentStageOrder": 2,

  "entityLabel": "John Doe (MEM-2025-00456)",
  "entityContext": { "...per entity type shape..." },
  "entityContextSnapshotAt": "2025-01-12T08:00:00Z",

  "forumId": "uuid",
  "areaId": "uuid",
  "unitId": "uuid",

  "requestedBy": {
    "userId": "uuid",
    "name": "Mary Johnson",
    "role": "Agent"
  },
  "requestedAt": "2025-01-12T08:00:00Z",

  "workflow": {
    "workflowId": "uuid",
    "workflowCode": "member_registration",
    "workflowName": "Member Registration Approval",
    "module": "Membership",
    "totalStages": 3
  },

  "executions": [
    {
      "executionId": "uuid",
      "stageId": "uuid",
      "stageOrder": 1,
      "stageName": "Unit Admin Review",
      "status": "Approved",
      "assignedApprover": {
        "userId": "uuid",
        "name": "Ahmed Al-Rashid",
        "role": "Unit Admin",
        "scopeEntityName": "Ruwi Central"
      },
      "reviewedBy": {
        "userId": "uuid",
        "name": "Ahmed Al-Rashid"
      },
      "reviewedAt": "2025-01-14T14:30:00Z",
      "decision": "Approve",
      "comments": "Documents complete. Member verified in person."
    },
    {
      "executionId": "uuid",
      "stageId": "uuid",
      "stageOrder": 2,
      "stageName": "Forum Admin Approval",
      "status": "Pending",
      "assignedApprover": {
        "userId": "uuid",
        "name": "Sarah Ahmed",
        "role": "Forum Admin",
        "scopeEntityName": "Oman Forum"
      },
      "reviewedBy": null,
      "reviewedAt": null,
      "decision": null,
      "comments": null
    },
    {
      "executionId": "uuid",
      "stageId": "uuid",
      "stageOrder": 3,
      "stageName": "Super Admin Final Approval",
      "status": "Pending",
      "assignedApprover": {
        "userId": "uuid",
        "name": "Khalid",
        "role": "Super Admin",
        "scopeEntityName": null
      },
      "reviewedBy": null,
      "reviewedAt": null,
      "decision": null,
      "comments": null
    }
  ],

  "approvedBy": null,
  "approvedAt": null,
  "rejectedBy": null,
  "rejectedAt": null,
  "rejectionReason": null,

  "createdAt": "2025-01-12T08:00:00Z",
  "updatedAt": "2025-01-14T14:30:00Z"
}
```

**Key enrichments:**
- `requestedBy` expanded to include `name` and `role` (join to `users` + `user_roles`)
- `workflow` object with metadata
- `executions` array with `stageName` (from `approval_stages`), `assignedApprover` object with name/role/scope (join to `users` + `user_roles`), and `reviewedBy` object with name
- `entityLabel`, `entityContext`, `entityContextSnapshotAt` — the new columns

**Backend implementation:** Use Prisma `include` with nested selects:

```typescript
const request = await prisma.approvalRequest.findUnique({
  where: { requestId },
  include: {
    workflow: {
      select: {
        workflowId: true, workflowCode: true,
        workflowName: true, module: true,
        stages: { select: { stageId: true }, orderBy: { stageOrder: 'asc' } }
      }
    },
    requestedByUser: { select: { userId: true, firstName: true, lastName: true } },
    executions: {
      orderBy: { stageOrder: 'asc' },
      include: {
        stage: { select: { stageName: true } },
        assignedApproverUser: {
          select: { userId: true, firstName: true, lastName: true }
        },
        reviewedByUser: {
          select: { userId: true, firstName: true, lastName: true }
        }
      }
    }
  }
});
```

Then map/reshape to the response format above. Reviewer role and scope info can be resolved from cached role data or a lightweight join.

---

## 3.2 New APIs

### 3.2.1 `POST /api/approval-workflow/approvals/my-tasks/search`

**Purpose:** Search approval stage executions assigned to the authenticated user (approver perspective).

**Tags:** `Approval Workflow - Approvals`

**Auth:** Bearer token required. `userId` extracted from JWT — not provided in request body.

**Request Body:** Standard `SearchRequest` schema.

```json
{
  "filters": [
    { "field": "status", "operator": "equals", "value": "Pending" }
  ],
  "sortBy": "createdAt",
  "sortOrder": "desc",
  "page": 1,
  "pageSize": 20,
  "eagerLoad": ["request", "request.workflow", "stage"]
}
```

**Supported filter fields:**

| Field | Operators | Description |
|-------|-----------|-------------|
| `status` | `equals`, `in` | Execution status: `Pending`, `Approved`, `Rejected`, `Skipped` |
| `request.entityType` | `equals`, `in` | Filter by entity type: `Member`, `DeathClaim`, etc. |
| `request.workflowCode` | `equals` | Filter by workflow |
| `reviewedAt` | `gte`, `lte`, `between` | Date range for completed tasks |
| `createdAt` | `gte`, `lte`, `between` | Date range for creation |

**Backend logic:**

```typescript
async searchMyTasks(userId: string, searchRequest: SearchRequest) {
  // 1. Force-inject user scope — non-overridable
  const scopedFilters = [
    { field: 'assignedApproverId', operator: 'equals', value: userId },
    ...searchRequest.filters
  ];

  // 2. Run search against ApprovalStageExecution
  const results = await this.searchService.search(
    'ApprovalStageExecution',
    { ...searchRequest, filters: scopedFilters }
  );

  // 3. Compute summary counts (grouped COUNT on execution status for this user)
  const summary = await prisma.approvalStageExecution.groupBy({
    by: ['status'],
    where: { assignedApproverId: userId },
    _count: true
  });

  return { ...results, summary: formatSummary(summary) };
}
```

**Response:**

```json
{
  "items": [
    {
      "executionId": "uuid",
      "requestId": "uuid",
      "stageId": "uuid",
      "stageOrder": 2,
      "status": "Pending",
      "assignedApproverId": "uuid",
      "reviewedBy": null,
      "reviewedAt": null,
      "decision": null,
      "comments": null,
      "createdAt": "2025-01-12T08:00:00Z",
      "updatedAt": "2025-01-14T14:30:00Z",

      "stage": {
        "stageId": "uuid",
        "stageName": "Forum Admin Approval",
        "stageOrder": 2
      },

      "request": {
        "requestId": "uuid",
        "entityType": "Member",
        "entityId": "uuid",
        "status": "Pending",
        "currentStageOrder": 2,
        "entityLabel": "John Doe (MEM-2025-00456)",
        "entityContext": { "...snapshot..." },
        "entityContextSnapshotAt": "2025-01-12T08:00:00Z",
        "requestedBy": "uuid",
        "requestedAt": "2025-01-12T08:00:00Z",
        "forumId": "uuid",
        "areaId": "uuid",
        "unitId": "uuid",

        "workflow": {
          "workflowCode": "member_registration",
          "workflowName": "Member Registration Approval"
        },

        "requestedByUser": {
          "userId": "uuid",
          "name": "Mary Johnson"
        },

        "executions": [
          {
            "executionId": "uuid",
            "stageOrder": 1,
            "stageName": "Unit Admin Review",
            "status": "Approved",
            "assignedApproverName": "Ahmed Al-Rashid",
            "reviewedAt": "2025-01-14T14:30:00Z",
            "decision": "Approve"
          },
          {
            "executionId": "uuid",
            "stageOrder": 2,
            "stageName": "Forum Admin Approval",
            "status": "Pending",
            "assignedApproverName": "Sarah Ahmed",
            "reviewedAt": null,
            "decision": null
          },
          {
            "executionId": "uuid",
            "stageOrder": 3,
            "stageName": "Super Admin Final",
            "status": "Pending",
            "assignedApproverName": "Khalid",
            "reviewedAt": null,
            "decision": null
          }
        ]
      }
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3,
  "summary": {
    "Pending": 5,
    "Approved": 38,
    "Rejected": 2,
    "Skipped": 0
  }
}
```

**Notes:**
- The `request.executions` array is a lightweight summary of all stages (for rendering the stage pipeline). It does NOT include full comments — those are on the detail page.
- The `summary` object powers tab badge counts.
- The `eagerLoad: ["request", "request.workflow", "stage"]` is required for the full card rendering. Without eager loading, the response returns only execution-level fields.

---

### 3.2.2 `POST /api/approval-workflow/requests/my-submissions/search`

**Purpose:** Search approval requests submitted by the authenticated user (submitter perspective).

**Tags:** `Approval Workflow - Requests`

**Auth:** Bearer token required. `userId` extracted from JWT.

**Request Body:** Standard `SearchRequest` schema.

```json
{
  "filters": [
    { "field": "status", "operator": "equals", "value": "Pending" }
  ],
  "sortBy": "createdAt",
  "sortOrder": "desc",
  "page": 1,
  "pageSize": 20,
  "eagerLoad": ["workflow", "executions"]
}
```

**Supported filter fields:**

| Field | Operators | Description |
|-------|-----------|-------------|
| `status` | `equals`, `in` | Request status: `Pending`, `Approved`, `Rejected`, `Cancelled` |
| `entityType` | `equals`, `in` | Filter by entity type |
| `createdAt` | `gte`, `lte`, `between` | Date range |

**Backend logic:**

```typescript
async searchMySubmissions(userId: string, searchRequest: SearchRequest) {
  const scopedFilters = [
    { field: 'requestedBy', operator: 'equals', value: userId },
    ...searchRequest.filters
  ];

  const results = await this.searchService.search(
    'ApprovalRequest',
    { ...searchRequest, filters: scopedFilters }
  );

  const summary = await prisma.approvalRequest.groupBy({
    by: ['status'],
    where: { requestedBy: userId },
    _count: true
  });

  return { ...results, summary: formatSummary(summary) };
}
```

**Response:**

```json
{
  "items": [
    {
      "requestId": "uuid",
      "entityType": "Member",
      "entityId": "uuid",
      "entityLabel": "John Doe (MEM-2025-00456)",
      "status": "Pending",
      "currentStageOrder": 2,
      "requestedAt": "2025-01-12T08:00:00Z",

      "workflow": {
        "workflowCode": "member_registration",
        "workflowName": "Member Registration Approval",
        "totalStages": 3
      },

      "executions": [
        {
          "stageOrder": 1,
          "stageName": "Unit Admin Review",
          "status": "Approved",
          "assignedApproverName": "Ahmed Al-Rashid",
          "reviewedAt": "2025-01-14T14:30:00Z"
        },
        {
          "stageOrder": 2,
          "stageName": "Forum Admin Approval",
          "status": "Pending",
          "assignedApproverName": "Sarah Ahmed",
          "reviewedAt": null
        },
        {
          "stageOrder": 3,
          "stageName": "Super Admin Final",
          "status": "Pending",
          "assignedApproverName": "Khalid",
          "reviewedAt": null
        }
      ],

      "rejectionReason": null,
      "rejectedBy": null,
      "rejectedAt": null,
      "approvedAt": null,
      "createdAt": "2025-01-12T08:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3,
  "summary": {
    "Pending": 3,
    "Approved": 45,
    "Rejected": 2,
    "Cancelled": 0
  }
}
```

**Notes:**
- No `entityContext` in this response — the submitter already knows what they submitted. Keeps the payload lighter.
- The `executions` summary shows who's assigned to each stage and whether they've acted — this powers the pipeline visualization and the "Waiting on: X" info.

---

## 3.3 API Deprecation

### `GET /api/approval-workflow/approvals/pending/{approverId}`

**Status:** Deprecated — superseded by `POST /approvals/my-tasks/search` with `status = Pending` filter.

**Migration:** The old endpoint remains functional for backward compatibility but should not be used in new UI. It will be removed in a future version.

**Reasons for deprecation:**
- Takes `approverId` as a path param (security concern — one user could query another's approvals)
- Only returns pending items, not full history
- No pagination, filtering, or sorting
- No entity context in the response

---

## 3.4 OpenAPI Additions

```json
{
  "/api/approval-workflow/approvals/my-tasks/search": {
    "post": {
      "tags": ["Approval Workflow - Approvals"],
      "summary": "Search current user's approval tasks (approver perspective)",
      "description": "Returns approval stage executions assigned to the authenticated user. UserId derived from JWT. Supports filtering by status, entityType, workflowCode, date range. Response includes summary counts for tab badges.",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/SearchRequest" }
          }
        }
      },
      "responses": {
        "200": {
          "description": "User-scoped approval executions with summary",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "items": {
                    "type": "array",
                    "items": { "$ref": "#/components/schemas/ApprovalTaskItem" }
                  },
                  "total": { "type": "integer" },
                  "page": { "type": "integer" },
                  "pageSize": { "type": "integer" },
                  "totalPages": { "type": "integer" },
                  "summary": {
                    "type": "object",
                    "properties": {
                      "Pending": { "type": "integer" },
                      "Approved": { "type": "integer" },
                      "Rejected": { "type": "integer" },
                      "Skipped": { "type": "integer" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "/api/approval-workflow/requests/my-submissions/search": {
    "post": {
      "tags": ["Approval Workflow - Requests"],
      "summary": "Search current user's submitted approval requests",
      "description": "Returns approval requests where requestedBy = authenticated user. Supports filtering by status, entityType, date range. Response includes summary counts.",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/SearchRequest" }
          }
        }
      },
      "responses": {
        "200": {
          "description": "User-scoped approval requests with summary",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "items": {
                    "type": "array",
                    "items": { "$ref": "#/components/schemas/ApprovalSubmissionItem" }
                  },
                  "total": { "type": "integer" },
                  "page": { "type": "integer" },
                  "pageSize": { "type": "integer" },
                  "totalPages": { "type": "integer" },
                  "summary": {
                    "type": "object",
                    "properties": {
                      "Pending": { "type": "integer" },
                      "Approved": { "type": "integer" },
                      "Rejected": { "type": "integer" },
                      "Cancelled": { "type": "integer" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

# 4. UI Specifications

## 4.1 Page Overview

| # | Page | URL | Primary User | API |
|---|------|-----|-------------|-----|
| 1 | My Approval Tasks | `/approvals/my-tasks` | Approvers (Unit/Area/Forum/Super Admin) | `POST /approvals/my-tasks/search` |
| 2 | My Submissions | `/approvals/my-submissions` | Submitters (Agents, Admins) | `POST /requests/my-submissions/search` |
| 3 | Approval Request Detail | `/approvals/requests/:requestId` | All roles | `GET /requests/:requestId` (enriched) |
| 4 | All Requests (existing) | `/admin/approvals/requests` | Admin/Monitor | `POST /requests/search` (existing) |
| 5 | Workflow Config (existing) | `/admin/approvals/workflows` | Super Admin | Existing APIs |

Pages 1, 2, and 3 are **new**. Pages 4 and 5 are **existing** (from `40-ui-approval-workflow.md`) with minor enhancements.

---

## 4.2 Page 1: My Approval Tasks

**URL:** `/approvals/my-tasks`  
**API:** `POST /api/approval-workflow/approvals/my-tasks/search`  
**Primary Object:** `ApprovalStageExecution`

### Layout

```
┌─────────────────────────────────────────────────┐
│ Page Header                                     │
│   Title: "My Approval Tasks"                    │
│   Subtitle: "Items requiring your review"       │
├─────────────────────────────────────────────────┤
│ Status Tabs (pill-style)                        │
│   [Action Required (5)] [Completed (38)]        │
│   [Rejected (2)]                                │
│   Badge counts from response.summary            │
├─────────────────────────────────────────────────┤
│ Filters Bar                                     │
│   [Entity Type ▾] [Workflow ▾] [Date Range]     │
├─────────────────────────────────────────────────┤
│ Content (varies by active tab)                  │
│                                                 │
│ Tab: Action Required → Task Cards (expanded)    │
│ Tab: Completed → History Cards (compact)        │
│ Tab: Rejected → History Cards (compact)         │
└─────────────────────────────────────────────────┘
```

### Tab: Action Required

Each card is a **task card** — expanded, with inline approve/reject.

**Card anatomy:**

```
┌──────────────────────────────────────────────────┐
│ HEADER: Entity Type + Stage Name                 │
│   Red-tinted background for urgency              │
├──────────────────────────────────────────────────┤
│ ENTITY SUMMARY (entity-type specific)            │
│   Rendered by a pluggable summary component      │
│   based on entityType from the response          │
│   See Section 4.5 for per-type layouts           │
├──────────────────────────────────────────────────┤
│ SNAPSHOT NOTICE                                  │
│   "ℹ️ Snapshot at time of submission"             │
│   [View Full Details →] link                     │
├──────────────────────────────────────────────────┤
│ STAGE PIPELINE                                   │
│   ✅ Stage1 ──▶ 🔵 You ──▶ ⚪ Stage3            │
│   Horizontal for ≤3 stages                       │
│   Vertical timeline for 4+ stages                │
├──────────────────────────────────────────────────┤
│ ACTION AREA                                      │
│   Comments textarea (optional)                   │
│   [View Full Details]  [Reject]  [✓ Approve]     │
└──────────────────────────────────────────────────┘
```

**"View Full Details" navigates to:** `/approvals/requests/:requestId`

**Approve/Reject calls:** `POST /api/approval-workflow/requests/process` (existing) with `{ executionId, decision, comments }`.

On success: remove the card from the list with a brief success toast, decrement the "Action Required" count, increment "Completed" or "Rejected" count.

### Tab: Completed

Compact history cards. Each shows:
- Status badge: "✅ You Approved"
- Entity type + entity label (from `request.entityLabel`)
- Your stage name + date acted
- **Final request status** (important — shows if downstream stages approved or rejected after you)
- "View Details →" link to detail page

### Tab: Rejected

Same compact layout as Completed, but:
- Status badge: "🔴 You Rejected"
- Shows the user's own rejection comment inline

### Filter Behavior

Tab selection maps to `status` filter:
- "Action Required" → `{ field: "status", operator: "equals", value: "Pending" }`
- "Completed" → `{ field: "status", operator: "equals", value: "Approved" }`
- "Rejected" → `{ field: "status", operator: "equals", value: "Rejected" }`

Additional filters (Entity Type, Workflow, Date Range) are additive.

---

## 4.3 Page 2: My Submissions

**URL:** `/approvals/my-submissions`  
**API:** `POST /api/approval-workflow/requests/my-submissions/search`  
**Primary Object:** `ApprovalRequest`

### Layout

```
┌─────────────────────────────────────────────────┐
│ Page Header                                     │
│   Title: "My Submissions"                       │
│   Subtitle: "Track approval progress"           │
├─────────────────────────────────────────────────┤
│ Status Tabs                                     │
│   [In Progress (3)] [Approved (45)]             │
│   [Rejected (2)] [All (50)]                     │
├─────────────────────────────────────────────────┤
│ Filters: [Entity Type ▾] [Date Range]           │
├─────────────────────────────────────────────────┤
│ Submission Cards                                │
└─────────────────────────────────────────────────┘
```

### Submission Card Anatomy

```
┌──────────────────────────────────────────────────┐
│ HEADER: Status badge + Submission date           │
│   Yellow (In Progress), Green (Approved),        │
│   Red (Rejected)                                 │
├──────────────────────────────────────────────────┤
│ ENTITY INFO (lightweight — no full snapshot)     │
│   Icon + Entity type + Entity label              │
│   E.g., "👤 Member Registration"                 │
│         "John Doe (MEM-2025-00456)"              │
├──────────────────────────────────────────────────┤
│ STAGE PIPELINE                                   │
│   ✅ Unit Admin ──▶ 🔵 Forum Admin ──▶ ⚪ Final │
│   Shows who approved, who's waiting              │
├──────────────────────────────────────────────────┤
│ CONTEXT INFO (varies by tab)                     │
│                                                  │
│ In Progress:                                     │
│   "Waiting on: Sarah (Forum Admin) • ⏱️ 1d 4h"  │
│                                                  │
│ Approved:                                        │
│   "Approved by: Khalid (Super Admin) • 12 Jan"   │
│                                                  │
│ Rejected:                                        │
│   Rejection reason block with who/when/why       │
├──────────────────────────────────────────────────┤
│ FOOTER: [View Details →]                         │
└──────────────────────────────────────────────────┘
```

**"View Details" navigates to:** `/approvals/requests/:requestId`

### Tab to filter mapping

- "In Progress" → `{ field: "status", operator: "equals", value: "Pending" }`
- "Approved" → `{ field: "status", operator: "equals", value: "Approved" }`
- "Rejected" → `{ field: "status", operator: "equals", value: "Rejected" }`
- "All" → no status filter

### Waiting Time Calculation (Frontend)

```typescript
// For the current pending stage execution:
const pendingExecution = request.executions.find(e => e.status === 'Pending' && e.stageOrder === request.currentStageOrder);
const waitingSince = pendingExecution
  ? (previousExecution?.reviewedAt || request.requestedAt)  // time since last stage completed or request was created
  : null;

const waitingDuration = waitingSince ? formatDuration(Date.now() - new Date(waitingSince)) : null;
// Color: green (<12h), amber (12h-48h), red (>48h)
```

---

## 4.4 Page 3: Approval Request Detail

**URL:** `/approvals/requests/:requestId`  
**API:** `GET /api/approval-workflow/requests/:requestId` (enriched)  
**Primary Object:** `ApprovalRequest` with full executions

### Layout

```
┌─────────────────────────────────────────────────┐
│ Back Link                                       │
│   "← Back to My Approval Tasks"                 │
│   (or My Submissions / All Requests depending   │
│    on referrer; use route state or fallback to   │
│    My Tasks)                                     │
├─────────────────────────────────────────────────┤
│ SECTION: Header Card                            │
│   Entity type badge + entity label + status     │
│   Submitted by + time ago                       │
│   ID strip: entity code, request ID, workflow   │
├─────────────────────────────────────────────────┤
│ SECTION: Outcome Banner (only if finalized)     │
│   Green banner for Approved with outcome text   │
│   Red banner for Rejected with reason           │
│   Hidden when status = Pending                  │
├─────────────────────────────────────────────────┤
│ SECTION: Entity Details (snapshot card)          │
│   Entity-type-specific context grid             │
│   Snapshot notice + "View Entity Page →"        │
├─────────────────────────────────────────────────┤
│ SECTION: Approval Journey (vertical timeline)   │
│   All stages with full details:                 │
│   - Stage name, assigned approver (name + role) │
│   - Decision badge (Approved/Rejected/Pending)  │
│   - Reviewed date                               │
│   - Full comments (if any)                      │
│   - "YOU" tag on your stage                     │
│   - Waiting time for current pending stage      │
│   - "Skipped" for stages after a rejection      │
├─────────────────────────────────────────────────┤
│ SECTION: Action Card (conditional)              │
│   Only shown if:                                │
│   - Request status = Pending                    │
│   - Current user = assignedApproverId for the   │
│     execution at currentStageOrder              │
│                                                 │
│   Teal-bordered card:                           │
│   "✍️ Your Decision"                            │
│   Comments textarea                             │
│   [Reject] [✓ Approve]                          │
│                                                 │
│   If user is NOT the approver and request is    │
│   pending: show blue info banner                │
│   "Waiting for approval by X (role)"            │
├─────────────────────────────────────────────────┤
```

### Back Link Logic

```typescript
// Determine back link from route state or navigation history
const backLink = this.route.snapshot.queryParamMap.get('from');
switch (backLink) {
  case 'my-tasks': return { label: '← Back to My Approval Tasks', route: '/approvals/my-tasks' };
  case 'my-submissions': return { label: '← Back to My Submissions', route: '/approvals/my-submissions' };
  case 'all-requests': return { label: '← Back to All Requests', route: '/admin/approvals/requests' };
  default: return { label: '← Back to My Approval Tasks', route: '/approvals/my-tasks' };
}
```

### Entity Route Resolution (Frontend)

```typescript
getEntityRoute(entityType: string, entityId: string, entityContext?: any): string | null {
  switch (entityType) {
    case 'Member':
      return `/members/${entityId}`;
    case 'DeathClaim':
      return `/claims/${entityId}`;
    case 'WalletDepositRequest':
      // Need memberId from context to build wallet route
      return entityContext?.memberId
        ? `/members/${entityContext.memberId}/wallet`
        : null;
    case 'CashHandover':
      return `/cash/handovers/${entityId}`;
    default:
      return null; // hide the link for unknown types
  }
}
```

### Action Card Visibility Logic

```typescript
const currentExecution = request.executions.find(
  e => e.stageOrder === request.currentStageOrder && e.status === 'Pending'
);

const isCurrentApprover = currentExecution?.assignedApprover?.userId === this.authContext.user.userId;

// Show action card only if pending and current user is the assigned approver
showActionCard = request.status === 'Pending' && isCurrentApprover;

// Show info banner if pending but user is NOT the approver (submitter/admin viewing)
showWaitingBanner = request.status === 'Pending' && !isCurrentApprover;
```

### Post-Action Behavior

After approve/reject:
1. Call `POST /requests/process` with `{ executionId, decision, comments }`.
2. On success, re-fetch the request detail to show updated journey.
3. Show success toast: "Approved successfully" or "Rejected successfully."
4. The action card disappears, and the outcome banner appears (if this was the final stage for approve/reject).

---

## 4.5 Entity Summary Components — Per-Type Layouts

These components receive `entityContext: JSON` and render entity-specific content. Used in both the Task Card (Page 1) and the Detail Page (Page 3).

### Member Registration Summary

```
┌──────────────────────────────────────────────────┐
│ 👤 {memberName}                    {memberCode}   │
│                                                   │
│ TIER          BENEFIT       DOB          CONTACT  │
│ Tier A •      ₹50,000      15 Mar 1985  +968 ... │
│ ₹100/cont                                        │
│                                                   │
│ AGENT                      UNIT                   │
│ Mary Johnson (AGT-001)     Ruwi Central           │
│                                                   │
│ HIERARCHY                                         │
│ Ruwi Central → Muscat → Oman Forum               │
│                                                   │
│ 📋 2 Nominees    📎 3 Documents                    │
└──────────────────────────────────────────────────┘
```

### Death Claim Summary

```
┌──────────────────────────────────────────────────┐
│ 💀 Claim for: {deceasedName}       {claimNumber}  │
│                                                   │
│ DECEASED              DEATH DATE                  │
│ {name} ({code})       10 Jan 2025                 │
│                                                   │
│ CAUSE                                             │
│ Natural causes                                    │
│                                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │ 💰 Benefit: ₹50,000          Tier: Tier A   │ │
│ └──────────────────────────────────────────────┘ │
│                                                   │
│ NOMINEE                CONTACT                    │
│ Ali Smith (Son)        +968 9456 7890             │
│                                                   │
│ AGENT                  UNIT                       │
│ John Kumar (AGT-005)   Ruwi Central               │
│                                                   │
│ ✅ 3/4 Docs verified   ✅ Verification Complete   │
│                                                   │
│ VERIFICATION NOTES:                               │
│ "All documents authentic. Hospital confirmed."    │
└──────────────────────────────────────────────────┘
```

### Wallet Deposit Summary

```
┌──────────────────────────────────────────────────┐
│ 💳 {memberName}                    {memberCode}   │
│                                                   │
│ DEPOSIT                BALANCE CHANGE             │
│ ₹1,000 • Cash         ₹250 → ₹1,250             │
│                                                   │
│ COLLECTED BY           COLLECTION DATE            │
│ Agent Mary (AGT-001)   14 Jan 2025                │
│                                                   │
│ NOTES                                             │
│ "Monthly top-up"                                  │
└──────────────────────────────────────────────────┘
```

### Cash Handover Summary

```
┌──────────────────────────────────────────────────┐
│ 💰 Cash Handover — ₹{amount}     {handoverCode}  │
│                                                   │
│ FROM                   TO                         │
│ Agent Mary (AGT-001)   Ahmed (Unit Admin)         │
│                                                   │
│ ITEMS                  INITIATED                  │
│ 12 line items          14 Jan, 10:30 AM           │
│                                                   │
│ BREAKDOWN                                         │
│ Contributions: ₹8,500  •  Deposits: ₹6,500       │
└──────────────────────────────────────────────────┘
```

### Generic Fallback Summary

For unknown entity types where no custom component exists:

```
┌──────────────────────────────────────────────────┐
│ {entityLabel}                                     │
│                                                   │
│ (Renders entityContext as key-value pairs)         │
│ Key1: Value1                                      │
│ Key2: Value2                                      │
│ ...                                               │
└──────────────────────────────────────────────────┘
```

---

## 4.6 Stage Pipeline Component

### Shared component: `StagePipelineComponent`

**Input:**
```typescript
@Input() executions: StageExecutionSummary[];  // ordered by stageOrder
@Input() currentStageOrder: number;
@Input() currentUserId?: string;               // to highlight "You" node
@Input() mode: 'horizontal' | 'vertical' | 'auto' = 'auto';
```

**Behavior:**
- `auto` mode: horizontal for ≤3 stages, vertical for 4+ stages.
- Each node shows: status dot (✅ done, 🔵 current, ⚪ waiting, 🔴 rejected), stage name, approver name, reviewed date.
- The node where `assignedApproverId === currentUserId` gets a "YOU" tag.
- Connectors between nodes are colored green for completed transitions.

**Horizontal layout** (≤3 stages):
```
✅ Stage1 name ──▶ 🔵 Stage2 name ──▶ ⚪ Stage3 name
   Approver           You (current)       Approver
   Jan 14                                 Pending
```

**Vertical layout** (4+ stages):
```
✅ ── Stage 1: Agent Submission
│      Mary Johnson • 14 Jan, 10:30 AM
│
✅ ── Stage 2: Unit Admin Review
│      Ahmed • 14 Jan, 2:15 PM
│
🔵 ── Stage 3: Area Admin Approval (YOU)
│      Waiting for your action
│
⚪ ── Stage 4: Forum Admin Final
       Not started
```

---

# 5. Component Architecture

```
approvals/
├── pages/
│   ├── my-tasks/
│   │   ├── my-tasks.component.ts              // Container: tabs, filters, API calls
│   │   ├── my-tasks.component.html
│   │   └── my-tasks.component.scss
│   │
│   ├── my-submissions/
│   │   ├── my-submissions.component.ts        // Container: tabs, filters, API calls
│   │   ├── my-submissions.component.html
│   │   └── my-submissions.component.scss
│   │
│   └── request-detail/
│       ├── request-detail.component.ts        // Container: fetch request, role-aware sections
│       ├── request-detail.component.html
│       └── request-detail.component.scss
│
├── components/
│   ├── task-card/                              // Expanded card with inline actions (Action Required tab)
│   │   ├── task-card.component.ts
│   │   ├── task-card.component.html
│   │   └── task-card.component.scss
│   │
│   ├── history-card/                           // Compact card (Completed/Rejected tabs)
│   │   ├── history-card.component.ts
│   │   ├── history-card.component.html
│   │   └── history-card.component.scss
│   │
│   ├── submission-card/                        // Card for My Submissions page
│   │   ├── submission-card.component.ts
│   │   ├── submission-card.component.html
│   │   └── submission-card.component.scss
│   │
│   ├── stage-pipeline/                         // Shared horizontal/vertical pipeline
│   │   ├── stage-pipeline.component.ts
│   │   ├── stage-pipeline.component.html
│   │   └── stage-pipeline.component.scss
│   │
│   ├── approval-journey/                       // Full vertical timeline for detail page
│   │   ├── approval-journey.component.ts
│   │   ├── approval-journey.component.html
│   │   └── approval-journey.component.scss
│   │
│   ├── action-card/                            // Teal-bordered approve/reject card
│   │   ├── action-card.component.ts
│   │   ├── action-card.component.html
│   │   └── action-card.component.scss
│   │
│   ├── outcome-banner/                         // Green/red outcome banner for finalized requests
│   │   ├── outcome-banner.component.ts
│   │   ├── outcome-banner.component.html
│   │   └── outcome-banner.component.scss
│   │
│   └── entity-summaries/                       // Pluggable per entity type
│       ├── member-summary.component.ts
│       ├── death-claim-summary.component.ts
│       ├── wallet-deposit-summary.component.ts
│       ├── cash-handover-summary.component.ts
│       └── generic-summary.component.ts        // Fallback for unknown types
│
├── services/
│   └── approval.service.ts                     // API calls, response mapping
│
├── models/
│   └── approval.models.ts                      // TypeScript interfaces
│
└── approval-routing.module.ts                  // Route definitions
```

### Route Configuration

```typescript
const routes: Routes = [
  {
    path: 'approvals',
    children: [
      { path: 'my-tasks', component: MyTasksComponent },
      { path: 'my-submissions', component: MySubmissionsComponent },
      { path: 'requests/:requestId', component: RequestDetailComponent },
    ]
  }
];
```

---

# 6. Navigation & Permissions

## 6.1 Sidebar Menu

```
Sidebar:
├── ...
├── Approvals                               // Menu group
│   ├── My Tasks (5)                        // Badge from summary.Pending
│   ├── My Submissions                      // Visible if user has submitted anything
│   └── All Requests                        // Admin only (permission-gated)
├── Admin
│   └── Workflow Config                     // Super Admin only
└── ...
```

## 6.2 Menu Visibility Rules

| Menu Item | Visible To | Permission |
|-----------|-----------|------------|
| My Tasks | Any user who is assigned as an approver in at least one execution | `approval.tasks.view` |
| My Submissions | Any user who has submitted at least one approval request | `approval.submissions.view` |
| All Requests | Forum Admin, Super Admin | `approval.requests.view.all` |
| Workflow Config | Super Admin | `approval.workflows.manage` |

**Practical shortcut:** Show "My Tasks" and "My Submissions" to all admin/agent roles by default. The pages gracefully show "No items" if the user has no tasks or submissions. This avoids an extra API call to check existence before showing the menu.

## 6.3 Badge Count

The sidebar badge on "My Tasks" shows the count of pending tasks. Source: `GET /api/approval-workflow/approvals/count` (existing endpoint from `api-admin-entity-profiles.md`) or from the `summary.Pending` value of the first search call.

---

# 7. Implementation Checklist

## Phase 1: Database & Backend

- [ ] **DB Migration:** Add `entity_label`, `entity_context`, `entity_context_snapshot_at` columns to `approval_requests`
- [ ] **DB Migration:** Add new indexes (`idx_requests_requested_by`, `idx_executions_approver_all`)
- [ ] **Prisma Schema:** Update `ApprovalRequest` model with new fields
- [ ] **Update `createApprovalRequest`:** Accept and persist `entityLabel`, `entityContext`
- [ ] **Update Member module:** Provide entity context in `submitMemberRegistration()`
- [ ] **Update Death Claims module:** Provide entity context in `submitClaimForApproval()`
- [ ] **Update Wallet module:** Provide entity context in `submitWalletDepositForApproval()`
- [ ] **Update Cash Management module:** Provide entity context in `initiateCashHandover()`
- [ ] **New endpoint:** `POST /approvals/my-tasks/search`
- [ ] **New endpoint:** `POST /requests/my-submissions/search`
- [ ] **Enrich endpoint:** `GET /requests/:requestId` — full response with executions, reviewer names, entity context

## Phase 2: Frontend — Shared Components

- [ ] **StagePipelineComponent:** Horizontal/vertical adaptive pipeline
- [ ] **Entity summary components:** Member, DeathClaim, WalletDeposit, CashHandover, Generic
- [ ] **ActionCardComponent:** Teal-bordered approve/reject card
- [ ] **OutcomeBannerComponent:** Green/red outcome banner
- [ ] **ApprovalJourneyComponent:** Full vertical timeline
- [ ] **HistoryCardComponent:** Compact card for completed/rejected tabs
- [ ] **SubmissionCardComponent:** Card for My Submissions page
- [ ] **TaskCardComponent:** Expanded card with inline actions
- [ ] **ApprovalService:** API calls and response mapping

## Phase 3: Frontend — Pages

- [ ] **MyTasksComponent:** Page with tabs, filters, task cards
- [ ] **MySubmissionsComponent:** Page with tabs, filters, submission cards
- [ ] **RequestDetailComponent:** Full detail page with journey + conditional action
- [ ] **Sidebar navigation:** Add menu items with badge counts
- [ ] **Route configuration:** Register new routes

## Phase 4: Polish

- [ ] **Mobile responsiveness:** Test all pages at 390px width
- [ ] **Loading states:** Skeleton loaders for cards during API fetch
- [ ] **Empty states:** "No pending tasks" / "No submissions" illustrations
- [ ] **Error handling:** API failure toasts, retry logic
- [ ] **Success toasts:** Post approve/reject confirmation
- [ ] **Deprecation:** Mark `GET /approvals/pending/{approverId}` as deprecated in OpenAPI spec

---

# Appendix A: HTML Prototypes

Interactive HTML prototypes have been created for visual reference:

1. **My Approval Tasks + My Submissions** — `approval-ui-prototype.html`
   - Switchable between both pages
   - All tabs functional (Action Required, Completed, Rejected, In Progress, Approved, etc.)
   - Mobile/Desktop viewport toggle
   - All four entity type snapshots (Member, Death Claim, Wallet Deposit, Cash Handover)

2. **Approval Request Detail Page** — `approval-detail-prototype.html`
   - Four scenarios: Pending (Approver), Approved, Rejected, Submitter View
   - Full vertical approval journey timeline
   - Conditional action card and info banners
   - Mobile/Desktop viewport toggle

---

*End of specification.*