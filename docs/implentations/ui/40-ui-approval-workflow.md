# Approval Workflow Module - UI Brief

---

## **Purpose**

Manages multi-step approval processes for entities (member registrations, death claims, agent registrations, etc.) through configurable sequential stages.

---

## **Core Components**

### **1. Workflows (Templates)**
Reusable approval blueprints defining the process.

**Example:** "Member Registration Approval" has 3 stages:
- Agent Review → Unit Head Approval → Admin Final Approval

### **2. Stages**
Individual steps within a workflow, executed sequentially.
- Each stage assigned to a specific role (Agent, UnitHead, Admin)
- Can be required or optional

### **3. Requests (Instances)**
Created when an entity needs approval.
- Links to workflow template
- Tracks current stage and overall status (Pending/Approved/Rejected)
- References the entity being approved (memberId, claimId)

### **4. Executions (Progress)**
Records what happens at each stage:
- Who approved/rejected
- When they acted
- Comments provided

---

## **Example Flow**

```
Submit Member Registration
  ↓
Create Approval Request (uses "member_registration" workflow)
  ↓
Stage 1: Agent reviews → Approves (execution recorded)
  ↓
Stage 2: Unit Head reviews → Approves (execution recorded)
  ↓
Stage 3: Admin reviews → Approves (execution recorded)
  ↓
Member automatically activated
```

---

## **3 UI Pages**

### **Page 1: Workflows** (Admin config)
- List all workflow templates
- Create/edit workflows and their stages
- Rarely accessed

### **Page 2: My Approvals** (Primary user page)
- Shows items awaiting current user's approval
- Quick approve/reject actions
- Most frequently used

### **Page 3: All Requests** (Admin monitoring)
- System-wide view of all approval requests
- Filter by status, type, date
- Audit trail

---

## **Key Data Relationships**

```
Workflow (1) ──has many──> Stages (n)
Request (1) ──uses one──> Workflow (1)
Request (1) ──has many──> Executions (n)
Execution (1) ──references one──> Stage (1)
```

---

## **User Actions**

**Approvers:** View pending items, approve/reject with comments
**Admins:** Configure workflows, monitor all requests, override if needed
**Submitters:** Track status of their submissions

---

## **Status Flow**

Request: Pending → (all stages approved) → Approved → Triggers action (e.g., activate member)
Request: Pending → (any stage rejected) → Rejected → Triggers rejection action

# Approval Module - UI Design Recommendation

---

## **Recommended Structure: 3 Pages**

### **1. Approval Workflows (Admin/Config)**
**URL:** `/admin/approvals/workflows`

**Purpose:** Configure approval templates (rarely accessed)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Approval Workflows                    [+ New]   │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Member Registration Approval       [Active] │ │
│ │ 3 stages • Used 156 times                   │ │
│ │ [View/Edit]                                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Death Claim Approval              [Active]  │ │
│ │ 4 stages • Used 23 times                    │ │
│ │ [View/Edit]                                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

Click "View/Edit" → Modal/Drawer with stages:
┌─────────────────────────────────────┐
│ Member Registration Approval        │
├─────────────────────────────────────┤
│ Stage 1: Agent Review               │
│   Role: Agent                       │
│   [Edit] [Delete]                   │
├─────────────────────────────────────┤
│ Stage 2: Unit Head Approval         │
│   Role: UnitHead                    │
│   [Edit] [Delete]                   │
├─────────────────────────────────────┤
│ [+ Add Stage]                       │
└─────────────────────────────────────┘
```

---

### **2. My Approvals (User-facing - Primary)**
**URL:** `/approvals/pending` or `/my-approvals`

**Purpose:** Where users approve/reject items (most frequently used)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ My Approvals                                    │
├─────────────────────────────────────────────────┤
│ [Pending: 5] [Approved: 23] [Rejected: 2]      │
├─────────────────────────────────────────────────┤
│ Filters: [Type ▾] [Date ▾] [Status ▾]         │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔴 Member Registration                      │ │
│ │ MEM-2025-00456 • John Doe                   │ │
│ │ Submitted: 2 days ago by Agent Mary         │ │
│ │ Current: Unit Head Approval (You)           │ │
│ │                      [Reject] [Approve]     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔴 Death Claim                              │ │
│ │ CLM-2025-00012 • Jane Smith                 │ │
│ │ Submitted: 5 hours ago by Agent John        │ │
│ │ Current: Admin Verification (You)           │ │
│ │                      [Reject] [Approve]     │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

Click item → Details modal:
┌─────────────────────────────────────┐
│ Member Registration - MEM-00456     │
├─────────────────────────────────────┤
│ Member: John Doe                    │
│ Agent: Mary Johnson                 │
│ Tier: Tier A                        │
│ [View Full Details]                 │
├─────────────────────────────────────┤
│ Approval Progress:                  │
│ ✅ Stage 1: Agent Review (Mary)     │
│    Approved on Jan 10              │
│ 🔵 Stage 2: Unit Head (You)         │
│    Waiting for your action         │
│ ⚪ Stage 3: Admin Final             │
│    Not started                     │
├─────────────────────────────────────┤
│ Comments: ____________________      │
│                                     │
│           [Reject] [Approve]        │
└─────────────────────────────────────┘
```

---

### **3. All Approval Requests (Admin/Monitor)**
**URL:** `/admin/approvals/requests`

**Purpose:** Admin oversight of ALL approvals in system

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ All Approval Requests                           │
├─────────────────────────────────────────────────┤
│ Stats: Pending: 12 | Approved: 234 | Rejected: 8│
├─────────────────────────────────────────────────┤
│ Filters: [Workflow ▾] [Status ▾] [Date ▾]      │
├─────────────────────────────────────────────────┤
│                                                 │
│ Table View:                                     │
│ ┌────┬───────────┬──────────┬─────────┬──────┐ │
│ │ ID │ Type      │ Entity   │ Status  │ Age  │ │
│ ├────┼───────────┼──────────┼─────────┼──────┤ │
│ │001 │Member Reg │MEM-00456 │Pending  │2d    │ │
│ │002 │Death Claim│CLM-00012 │Pending  │5h    │ │
│ │003 │Member Reg │MEM-00455 │Approved │1w    │ │
│ └────┴───────────┴──────────┴─────────┴──────┘ │
└─────────────────────────────────────────────────┘

Click row → Same details modal as "My Approvals"
```

---

## **Why This Structure?**

**3 pages because:**
1. **Workflows** = Configuration (admins only, rarely changed)
2. **My Approvals** = Daily user action (approvers' primary screen)
3. **All Requests** = Monitoring/auditing (admin oversight)

**Key Benefits:**
- ✅ Separation of concerns (config vs. action vs. monitoring)
- ✅ "My Approvals" is user-focused (only items they can act on)
- ✅ "All Requests" gives admins system-wide view
- ✅ Workflows hidden from regular users (reduces confusion)

---


## Api snippets (OpenApi)

```
    "/api/approval-workflow/workflows": {
      "post": {
        "tags": ["Approval Workflow - Workflows"],
        "summary": "Create a new approval workflow",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["workflowCode", "workflowName", "module", "entityType", "stages"],
                "properties": {
                  "workflowCode": { "type": "string" },
                  "workflowName": { "type": "string" },
                  "description": { "type": "string" },
                  "module": { "type": "string", "enum": ["Membership", "Wallet", "Claims", "Contributions", "Organization"] },
                  "entityType": { "type": "string" },
                  "isActive": { "type": "boolean" },
                  "requiresAllStages": { "type": "boolean" },
                  "stages": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "stageName": { "type": "string" },
                        "stageOrder": { "type": "integer" },
                        "approverType": { "type": "string", "enum": ["Role", "SpecificUser", "Hierarchy"] },
                        "roleId": { "type": "string", "format": "uuid", "nullable": true },
                        "userId": { "type": "string", "format": "uuid", "nullable": true },
                        "hierarchyLevel": { "type": "string", "enum": ["Unit", "Area", "Forum"], "nullable": true },
                        "isOptional": { "type": "boolean" },
                        "autoApprove": { "type": "boolean" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Workflow created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "workflowId": { "type": "string", "format": "uuid" },
                    "workflowCode": { "type": "string" },
                    "workflowName": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/approval-workflow/workflows/search": {
      "post": {
        "tags": ["Approval Workflow - Workflows"],
        "summary": "Search approval workflows",
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
            "description": "Search results",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ApprovalWorkflowsSearchResponse" }
              }
            }
          }
        }
      }
    },
    "/api/approval-workflow/workflows/{workflowId}": {
      "get": {
        "tags": ["Approval Workflow - Workflows"],
        "summary": "Get workflow by ID",
        "parameters": [
          {
            "name": "workflowId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": {
            "description": "Workflow details",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "workflowId": { "type": "string", "format": "uuid" },
                    "workflowCode": { "type": "string" },
                    "workflowName": { "type": "string" },
                    "module": { "type": "string" },
                    "stages": { "type": "array", "items": {
                      "type": "object"
                    } }
                  }
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": ["Approval Workflow - Workflows"],
        "summary": "Update workflow",
        "parameters": [
          {
            "name": "workflowId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "workflowName": { "type": "string" },
                  "description": { "type": "string", "nullable": true },
                  "isActive": { "type": "boolean" },
                  "requiresAllStages": { "type": "boolean" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Workflow updated successfully" }
        }
      }
    },

```

## Api Snippet fopr approval requests (Open Api)
```
    "/api/approval-workflow/workflows/all": {
      "get": {
        "tags": ["Approval Workflow - Workflows"],
        "summary": "List all workflows (including inactive)",
        "responses": {
          "200": {
            "description": "List of all workflows",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "workflowId": { "type": "string", "format": "uuid" },
                      "workflowCode": { "type": "string" },
                      "isActive": { "type": "boolean" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/approval-workflow/requests": {
      "post": {
        "tags": ["Approval Workflow - Requests"],
        "summary": "Submit a new approval request",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["workflowCode", "entityType", "entityId"],
                "properties": {
                  "workflowCode": { "type": "string" },
                  "entityType": { "type": "string" },
                  "entityId": { "type": "string", "format": "uuid" },
                  "forumId": { "type": "string", "format": "uuid", "nullable": true },
                  "areaId": { "type": "string", "format": "uuid", "nullable": true },
                  "unitId": { "type": "string", "format": "uuid", "nullable": true }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Approval request submitted",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "requestId": { "type": "string", "format": "uuid" },
                    "status": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/approval-workflow/requests/search": {
      "post": {
        "tags": ["Approval Workflow - Requests"],
        "summary": "Search approval requests",
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
            "description": "Search results",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ApprovalRequestsSearchResponse" }
              }
            }
          }
        }
      }
    },
    "/api/approval-workflow/requests/process": {
      "post": {
        "tags": ["Approval Workflow - Requests"],
        "summary": "Process an approval (approve or reject)",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["executionId", "decision"],
                "properties": {
                  "executionId": { "type": "string", "format": "uuid" },
                  "decision": { "type": "string", "enum": ["Approve", "Reject"] },
                  "comments": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Approval processed successfully" }
        }
      }
    },
    "/api/approval-workflow/requests/{requestId}": {
      "get": {
        "tags": ["Approval Workflow - Requests"],
        "summary": "Get approval request by ID",
        "parameters": [
          {
            "name": "requestId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": {
            "description": "Approval request details",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "requestId": { "type": "string", "format": "uuid" },
                    "workflowCode": { "type": "string" },
                    "entityType": { "type": "string" },
                    "status": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/approval-workflow/requests/entity/{entityType}/{entityId}": {
      "get": {
        "tags": ["Approval Workflow - Requests"],
        "summary": "Get approval request by entity",
        "parameters": [
          {
            "name": "entityType",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          },
          {
            "name": "entityId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": {
            "description": "Approval request for the entity",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "requestId": { "type": "string", "format": "uuid" },
                    "entityType": { "type": "string" },
                    "status": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/approval-workflow/approvals/pending/{approverId}": {
      "get": {
        "tags": ["Approval Workflow - Approvals"],
        "summary": "Get pending approvals for an approver",
        "parameters": [
          {
            "name": "approverId",
            "in": "path",
            "required": true,
            "schema": { "type": "string", "format": "uuid" }
          }
        ],
        "responses": {
          "200": {
            "description": "List of pending approvals",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "executionId": { "type": "string", "format": "uuid" },
                      "requestId": { "type": "string", "format": "uuid" },
                      "stageName": { "type": "string" },
                      "status": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
```

### NOTE:
* the search api will return the approval stages by using the eager load field (its value as ["stages"])

