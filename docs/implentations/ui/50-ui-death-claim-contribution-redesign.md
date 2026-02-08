# Death Claims & Contributions — UI Redesign Spec

**Version:** 2.0  
**Last Updated:** February 2026  
**Status:** Final  
**Replaces:** `50-ui-death-claim-part-1.md`, `50-ui-death-claim-part-1-extension-1.md`, `50-ui-death-claim-part-2-contributions.md`

---

## Summary of Changes from v1

| Area | v1 | v2 (This Spec) |
|------|-----|-----------------|
| Claims Dashboard | 7+ summary stat cards in 2 rows, heavy layout | Compact stats strip + action-oriented table |
| Claim Details | 4 tabs with 5 status-variant sections | Hybrid layout: sticky header card + contextual action banner + 3 tabs |
| Approval/Verification Actions | Embedded inside Overview tab with radio buttons | Contextual action banner below header, role-aware (viewMode) |
| Contribution Cycles | Embedded inside Claim Details "Cycle" tab only | Dedicated lightweight admin sub-route (`/claims/cycles`) + still in Claim Details |
| My Contributions | Standalone page `/my-contributions` | Moved to Member Profile → Contributions tab (viewMode-aware) |
| Submit Claim Form | 3-step wizard | **No change** — kept as-is |
| My Claims (Nominee) | Standalone page (future) | **Deferred** — not in this spec |

---

## Page Inventory

| # | Page | URL | Description |
|---|------|-----|-------------|
| 1 | Claims Listing | `/claims` | Primary listing with stats strip, filters, and table |
| 2 | Claim Details | `/claims/:claimId` | Hybrid layout — header card + action banner + 3 tabs |
| 3 | Submit Claim | `/claims/new` | **No change** — 3-step wizard (see v1 spec) |
| 4 | Contribution Cycles | `/claims/cycles` | Lightweight admin table of all cycles |
| 5 | Member Profile → Contributions Tab | `/members/:memberId/profile` | Member's contribution history (viewMode-aware) |

---

## Navigation

Death Claims appears as a **top-level sidebar nav item** with a sub-menu:

```
💀 Death Claims
   ├── Claims              → /claims
   ├── Submit Claim        → /claims/new
   └── Contribution Cycles → /claims/cycles
```

The Member Profile → Contributions tab is accessed via the existing Member Profile route, not through the Death Claims nav.

---

## Shared Components

### Record Cash Collection Modal

**Used in:** Claim Details → Contributions tab, Agent Profile → Contributions tab, Member Profile → Contributions tab

**Trigger:** "Record Payment" inline action on any `Pending` contribution row.

```
┌─────────────────────────────────────────────┐
│ Record Cash Collection                    ✕ │
├─────────────────────────────────────────────┤
│                                             │
│  Member:   Ahmed Said (MEM-00234)           │
│  Cycle:    CC-2025-00015                    │
│  Amount:   OMR 10.000                       │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Payment Reference (optional)               │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│              [Cancel]  [Confirm Collection] │
└─────────────────────────────────────────────┘
```

- **API:** `POST /api/contributions/{contributionId}/record-cash`
- **Body:** `{ "cashReceiptReference": "string?" }`
- **On success:** Row updates to `Collected` status, cycle progress stats refresh.
- **Already implemented** in Agent Profile and Member Profile specs — same shared modal component.

### Mark Missed Confirmation

**Trigger:** Secondary action (dropdown or icon) on `Pending` contribution rows.

```
┌─────────────────────────────────────────────┐
│ Mark as Missed?                           ✕ │
├─────────────────────────────────────────────┤
│                                             │
│  This will mark the contribution for        │
│  Ahmed Said (MEM-00234) as missed for       │
│  cycle CC-2025-00015.                       │
│                                             │
│  This may affect the member's standing      │
│  if consecutive misses occur.               │
│                                             │
│                  [Cancel]  [Mark as Missed] │
└─────────────────────────────────────────────┘
```

- **API:** `POST /api/contributions/{contributionId}/mark-missed`
- **On success:** Row updates to `Missed` status.

### Status Badges (Claim)

| Status | Color | Label |
|--------|-------|-------|
| Reported | Blue/Gray | `● Reported` |
| UnderVerification | Amber | `● Under Verification` |
| Verified | Teal | `● Verified` |
| PendingApproval | Purple | `● Pending Approval` |
| Approved | Green | `● Approved` |
| Settled | Dark Green | `● Settled` |
| Rejected | Red | `● Rejected` |

### Status Badges (Contribution)

| Status | Color | Label |
|--------|-------|-------|
| Pending | Amber | `Pending` |
| WalletDebitRequested | Blue | `Wallet Debit` |
| Collected | Green | `Collected` |
| Missed | Red | `Missed` |
| Exempted | Gray | `Exempted` |

---

## Page 1: Claims Listing

**URL:** `/claims`  
**API:** `GET /api/death-claims` (primary), `GET /api/death-claims/dashboard/stats` (stats strip), `GET /api/death-claims/requiring-action` (action items)  
**Access:** All admin roles, agents (scoped to their members)

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Death Claims                                 [+ Submit Claim]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┬────────────┬───────────┬──────────┬───────────┐  │
│  │ Pending  │ Under      │ Approved  │ Settled  │ Total     │  │
│  │ Action   │ Contrib.   │           │ (YTD)    │ (YTD)     │  │
│  │  3       │  5         │  2        │  35      │  45       │  │
│  └──────────┴────────────┴───────────┴──────────┴───────────┘  │
│                                                                 │
│  Filters: [Status ▾] [Forum ▾] [Area ▾] [Unit ▾] [Search...]  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Claim       │ Deceased       │ Filed By   │ Benefit │ St │  │
│  ├─────────────┼────────────────┼────────────┼─────────┼────┤  │
│  │ DC-00012    │ John Smith     │ Mary J.    │ OMR 5K  │ 🟡 │  │
│  │ Jan 15      │ MEM-00456      │ Agent      │         │    │  │
│  ├─────────────┼────────────────┼────────────┼─────────┼────┤  │
│  │ DC-00011    │ Jane Doe       │ Ali F.     │ OMR 5K  │ 🟢 │  │
│  │ Jan 12      │ MEM-00455      │ Agent      │         │    │  │
│  ├─────────────┼────────────────┼────────────┼─────────┼────┤  │
│  │ DC-00010    │ Alice Brown    │ Sam K.     │ OMR 3K  │ ✅ │  │
│  │ Jan 08      │ MEM-00454      │ Agent      │ Tier B  │    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Showing 1–20 of 45                          [1] [2] [3] [→]  │
└─────────────────────────────────────────────────────────────────┘
```

### Stats Strip

A single compact row of stats — not large cards. Each stat is separated by a vertical divider.

- **API:** `GET /api/death-claims/dashboard/stats`
- **Fields displayed:** `pendingVerification` → "Pending Action", `underContribution` → "Under Contribution", `approvedForPayout` → "Approved", total settled YTD (derived), `totalThisYear` → "Total (YTD)"
- **Behavior:** Clicking a stat filters the table by that status.

### Filters

| Filter | Type | API Param |
|--------|------|-----------|
| Status | Dropdown (multi-select) | `claimStatus` |
| Forum | Dropdown | `forumId` |
| Area | Dropdown (dependent on Forum) | `areaId` |
| Unit | Dropdown (dependent on Area) | `unitId` |
| Search | Text input | Uses `POST /api/death-claims/search` |

### Table Columns

| Column | Source Field | Notes |
|--------|-------------|-------|
| Claim | `claimNumber`, `createdAt` | Claim code + submission date |
| Deceased | `memberName`, `memberCode` | Member name + code |
| Filed By | `reportedBy` (resolved name), `reportedByRole` | Name + role badge |
| Benefit | `benefitAmount`, tier name | Amount + tier |
| Status | `claimStatus` | Status badge |

- **Row click:** Navigate to `/claims/:claimId`
- **Sorted by:** `createdAt` descending (most recent first)

### Role-Based Behavior

| Role | Scope | Actions |
|------|-------|---------|
| super_admin, forum_admin | All claims in their scope | `[+ Submit Claim]` button visible |
| area_admin, unit_admin | Claims in their area/unit | `[+ Submit Claim]` button visible |
| agent | Only their members' claims | `[+ Submit Claim]` button visible |
| member | N/A — members don't access this page | — |

---

## Page 2: Claim Details

**URL:** `/claims/:claimId`  
**API:** `GET /api/death-claims/{claimId}` (primary), `GET /api/death-claims/{claimId}/documents`, cycle and contribution APIs as needed  
**Access:** All admin roles, agents (scoped), nominees (future)

### Overall Structure

The page has 3 distinct vertical zones:

1. **Header Card** — Always visible. Claim identity, status, key facts.
2. **Action Banner** — Contextual. Changes based on `claimStatus` + viewer's role (viewMode). Shows the primary action needed.
3. **Tabs** — Details & Documents, Contributions, Activity Log.

```
┌─────────────────────────────────────────────────────────┐
│ ← Death Claims    DC-2025-00012                         │  ← Breadcrumb
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HEADER CARD (always visible)                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ John Smith — Death Claim          [● Status]    │   │
│  │ DC-2025-00012 · MEM-2025-00456                  │   │
│  │─────────────────────────────────────────────────│   │
│  │ Death Date    │ Benefit    │ Filed By  │ Nominee│   │
│  │ Jan 12, 2025  │ OMR 5,000  │ Mary J.   │ Sarah  │   │
│  │ Muscat, Oman  │ Tier A     │ Jan 15    │ Spouse │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ACTION BANNER (contextual — see below)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⏳ Documents require verification   [Actions]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Details & Documents] [Contributions] [Activity Log]   │
│  ───────────────────────────────────────────────────    │
│                                                         │
│  (Tab content below)                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Header Card

Always visible regardless of active tab. Displays at-a-glance claim identity.

**Top row:** Deceased member name + "— Death Claim" label on left. Status badge on right.

**Facts row:** 4 columns separated by vertical dividers:

| Fact | Source |
|------|--------|
| Death Date + Place | `deathDate`, `deathPlace` |
| Benefit Amount + Tier | `benefitAmount`, tier name |
| Filed By + Date | Reporter name, role, `reportedDate` |
| Nominee + Relationship | `nomineeName`, `nomineeRelation` |

### Action Banner

Sits directly below the header card (visually connected — no gap, rounded only at bottom). The banner is the **primary call-to-action** for the current user.

**The banner shows different content based on:**
1. The claim's `claimStatus`
2. The viewer's role/permissions (viewMode)

#### Banner Variants

**Status: Reported**

| Viewer | Banner |
|--------|--------|
| Agent / filing user | 🔵 "Claim reported — upload required documents to proceed." → `[Upload Documents]` |
| Admin | 🔵 "Claim reported — awaiting document upload from agent." → _(no action)_ |

**Status: UnderVerification**

| Viewer | Banner |
|--------|--------|
| Admin with verify permission | ⏳ "Documents require verification. Review and verify before submitting for approval." → `[Request More Docs]` `[Verify & Send for Approval]` |
| Agent / others | ⏳ "Documents are being verified by administration." → _(no action)_ |

- **"Verify & Send for Approval"** calls `POST /api/death-claims/{claimId}/verify` (with optional verificationNotes), then `POST /api/death-claims/{claimId}/submit`.
- **"Request More Docs"** opens a modal/dialog (same as v1 spec — agent is notified to upload additional documents).

**Status: PendingApproval**

| Viewer | Banner |
|--------|--------|
| Approver (per workflow stage) | 📋 "Awaiting your approval decision. All documents verified." → `[Reject]` `[Approve Claim]` |
| Non-approver admin | 📋 "Submitted for approval on {date}. Awaiting management decision." → _(no action)_ |
| Agent | 📋 "Claim is under management review." → _(no action)_ |

- **"Approve"** triggers the approval workflow execution API.
- **"Reject"** opens a rejection modal (reason required).
- These actions are **gated by the approval workflow** — only the user assigned to the current stage sees the action buttons.

**Status: Approved**

| Viewer | Banner |
|--------|--------|
| Admin with settle permission | 💰 "Approved — Ready for benefit payout. Contribution cycle in progress." → `[Record Settlement]` |
| Others | 💰 "Claim approved. Contribution collection is in progress." → _(no action)_ |

- **"Record Settlement"** calls `POST /api/death-claims/{claimId}/settle` via a settlement modal (fields: payment method, payment reference, payment date, nominee acknowledgment file).

**Status: Settled**

| Viewer | Banner |
|--------|--------|
| All | ✓ "Claim Settled — Benefit of OMR {amount} paid to {nominee} via {method} on {date}." → `[View Receipt]` |

**Status: Rejected**

| Viewer | Banner |
|--------|--------|
| Admin | ✕ "Claim Rejected — {rejectionReason}" → `[Reopen Claim]` (if applicable) |
| Agent | ✕ "Claim Rejected — {rejectionReason}" → _(no action)_ |

**No Banner:** If no action is relevant for the current viewer, the banner area is simply not rendered (the tabs start immediately after the header card).

---

### Tab 1: Details & Documents

Combines claim information, nominee details, documents, and deceased member summary into a single scrollable tab.

#### Section: Death Details + Nominee Details (side by side)

Two cards in a 2-column grid.

**Death Details Card:**

| Field | Source |
|-------|--------|
| Cause of Death | `causeOfDeath` |
| Place of Death | `deathPlace` |
| Doctor Name | From submission form (if captured) |
| Additional Notes | `initialNotes` |

**Nominee Details Card:**

| Field | Source |
|-------|--------|
| Name | `nomineeName` |
| Relationship | `nomineeRelation` |
| Contact | `nomineeContactNumber` |
| Bank Account | From nominee details (if captured) |

#### Section: Documents

**API:** `GET /api/death-claims/{claimId}/documents`

```
Documents                                         [+ Upload]
┌─────────────────────────────────────────────────────────┐
│ 📄 Death Certificate                                    │
│    PDF · 1.2 MB · Jan 15, 2025         Verified  [View] │
├─────────────────────────────────────────────────────────┤
│ 📄 Medical Report                                       │
│    PDF · 2.5 MB · Jan 15, 2025         Verified  [View] │
├─────────────────────────────────────────────────────────┤
│ 📄 Nominee ID                                           │
│    JPG · 800 KB · Jan 15, 2025         Pending   [View] [✓] [✕] │
├─────────────────────────────────────────────────────────┤
│ 📄 Bank Account Proof                                   │
│    PDF · 900 KB · Jan 15, 2025         Pending   [View] [✓] [✕] │
└─────────────────────────────────────────────────────────┘
```

**Document row fields:**
- Document type icon + name (`documentName`)
- File metadata: `mimeType`, `fileSize`, `uploadedAt`
- Verification status badge: `verificationStatus`
- Actions based on status + viewer role:

| Document Status | Viewer with verify permission | Others |
|----------------|-------------------------------|--------|
| Pending | `[View]` `[✓ Verify]` `[✕ Reject]` | `[View]` |
| Verified | `[View]` | `[View]` |
| Rejected | `[View]` (shows rejection reason on hover/tooltip) | `[View]` |

- **Individual verify/reject:** `POST /api/death-claims/{claimId}/documents/{documentId}/verify` with `{ "status": "Verified" | "Rejected", "rejectionReason": "string?" }`
- **Document download:** `GET /api/death-claims/{claimId}/documents/{documentId}/download`
- **Upload button:** Only visible when claim is in `Reported` or `UnderVerification` status and viewer is the filing agent or an admin.

#### Section: Deceased Member Summary

Collapsible card with basic member info + link to full profile.

**Fields:** memberCode (link), tier, agent (link), unit/area/forum, join date, status at death.

---

### Tab 2: Contributions

Shows the contribution cycle linked to this claim.

**APIs:**
- Cycle: `GET /api/contributions/cycles/{cycleId}` (cycleId obtained from claim detail or lookup)
- Contributions list: `GET /api/contributions/cycles/{cycleId}/contributions`

#### Before Cycle Exists (Reported / UnderVerification / PendingApproval)

```
┌─────────────────────────────────────────────────────────┐
│                        📊                               │
│          No contribution cycle yet                      │
│   A cycle will be created when this claim is approved.  │
└─────────────────────────────────────────────────────────┘
```

#### After Cycle Exists (Approved / Settled)

**Cycle Progress Card:**

```
Cycle CC-2025-00015                    Deadline: Feb 15, 2025 (5 days left)
┌─────────────────────────────────────────────────────────┐
│  OMR 3,500 / OMR 5,000                            70%  │
│  ████████████████████████████░░░░░░░░░░░░              │
│                                                         │
│  350 collected  ·  140 pending  ·  10 missed            │
└─────────────────────────────────────────────────────────┘
```

**Fields from ContributionCycle:**
- `cycleNumber`, `collectionDeadline`
- `totalCollectedAmount` / `totalExpectedAmount`
- `membersCollected`, `membersPending`, `membersMissed`

**If cycle is Closed:** Show "Closed" label instead of deadline countdown. For settled claims, deadline label shows "(Closed)" in green.

**Admin actions on cycle card:**
- `[Close Cycle]` button — only for active cycles, only for admins with permission.
- **API:** `POST /api/contributions/cycles/{cycleId}/close`

**Member Contributions Table:**

```
Filter chips: [All (500)] [Collected (350)] [Pending (140)] [Missed (10)]
Search: [Search member...]

┌──────────────┬──────────┬────────┬──────────┬──────────┬─────────┐
│ Member       │ Agent    │ Amount │ Method   │ Status   │ Actions │
├──────────────┼──────────┼────────┼──────────┼──────────┼─────────┤
│ AS Ahmed     │ Mary J.  │ OMR 10 │ Wallet   │ Collected│         │
│ MEM-00234    │          │        │          │          │         │
├──────────────┼──────────┼────────┼──────────┼──────────┼─────────┤
│ FK Fatima    │ Mary J.  │ OMR 10 │ Cash     │ Collected│         │
│ MEM-00189    │          │        │          │          │         │
├──────────────┼──────────┼────────┼──────────┼──────────┼─────────┤
│ RN Rashid    │ Ali F.   │ OMR 10 │ —        │ Pending  │ [Record]│
│ MEM-00312    │          │        │          │          │  [···]  │
├──────────────┼──────────┼────────┼──────────┼──────────┼─────────┤
│ HM Hassan    │ Ali F.   │ OMR 10 │ —        │ Missed   │         │
│ MEM-00098    │          │        │          │          │         │
└──────────────┴──────────┴────────┴──────────┴──────────┴─────────┘
Showing 1–20 of 500              [1] [2] [3] ... [25] [→]
```

**API:** `GET /api/contributions/cycles/{cycleId}/contributions?status=X&agentId=X&searchTerm=X&page=X&limit=20`

**Table columns:**

| Column | Source | Notes |
|--------|--------|-------|
| Member | Avatar initials + `memberName`, `memberCode` | Avatar colored by member initials |
| Agent | Resolved agent name | |
| Amount | `contributionAmount` | |
| Method | `paymentMethod` | "Wallet", "Cash", or "—" if pending |
| Status | `contributionStatus` | Badge styling |
| Actions | Based on status + viewMode | See below |

**Inline row actions:**

| Contribution Status | Viewer with collection permission | Others |
|--------------------|-----------------------------------|--------|
| Pending | `[Record Payment]` primary button + `[···]` dropdown with "Mark Missed" | No actions |
| WalletDebitRequested | No actions (system handles) | No actions |
| Collected | No actions (read-only) | No actions |
| Missed | `[Record Late Payment]` (optional, same modal as Record Payment) | No actions |
| Exempted | No actions | No actions |

**"Record Payment"** → Opens the shared **Record Cash Collection Modal** (see Shared Components).

**"Mark Missed"** → Opens the shared **Mark Missed Confirmation** dialog.

**Collection permission:** Agents can act on their own members. Unit/Area/Forum admins can act on members within their scope.

**Filter chips:** Clicking a chip filters by `contributionStatus`. "All" shows everything. The count in parentheses comes from the cycle stats.

**Bulk Actions (Future — Placeholder Only):**

A `[Bulk Actions]` toggle button will be shown (disabled / grayed out) in the table header area. When implemented:
- Activating it shows checkboxes on each `Pending` row
- A floating action bar appears: "X selected — [Record Payment] [Mark Missed]"
- **Not wired to any API currently.** Marked as "Coming Soon" in UI.

---

### Tab 3: Activity Log

**Status: Dev in Progress**

This tab will display a chronological timeline of all claim events. Until the backend timeline API is available, show a placeholder:

```
┌─────────────────────────────────────────────────────────┐
│                        🚧                               │
│              Activity Log                               │
│      This feature is under development.                 │
│   A detailed timeline of claim events will appear here. │
└─────────────────────────────────────────────────────────┘
```

**Future API needed:** `GET /api/death-claims/{claimId}/activity`

**Expected timeline events (for future implementation):**
- Claim submitted
- Documents uploaded
- Document verified/rejected (individual)
- All documents verified
- Sent for approval
- Approval stage completed (per stage)
- Claim approved / rejected
- Contribution cycle started
- Contribution cycle closed
- Settlement recorded

Each event should include: event type, timestamp, actor (name + role), description, and any relevant metadata.

---

## Page 3: Contribution Cycles (Admin View)

**URL:** `/claims/cycles`  
**API:** `POST /api/contributions/cycles/search` (listing), `GET /api/contributions/cycles/summary` (stats)  
**Access:** Admin roles only (unit_admin and above)

### Purpose

A lightweight admin convenience page to monitor all contribution cycles at a glance — without navigating into individual claims. Each row links to the parent claim's Contributions tab for full management.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Contribution Cycles                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┬──────────────────┬────────────────────┐      │
│  │ Active       │ Total Collecting │ Avg Completion     │      │
│  │ Cycles       │                  │                    │      │
│  │  5           │ OMR 25,000       │ 72%                │      │
│  └──────────────┴──────────────────┴────────────────────┘      │
│                                                                 │
│  Filters: [Status: Active ▾]  [Search...]                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Cycle      │ Claim     │ Deceased      │Progress│Deadline│  │
│  ├────────────┼───────────┼───────────────┼────────┼────────┤  │
│  │ CC-00015   │ DC-00012  │ John Smith    │ ██░ 70%│ Feb 15 │  │
│  │            │           │ Tier A        │ 350/500│ 5 days │  │
│  ├────────────┼───────────┼───────────────┼────────┼────────┤  │
│  │ CC-00014   │ DC-00011  │ Jane Doe      │ ███ 85%│ Feb 12 │  │
│  │            │           │ Tier A        │ 425/500│ 2 days │  │
│  ├────────────┼───────────┼───────────────┼────────┼────────┤  │
│  │ CC-00013   │ DC-00010  │ Alice Brown   │ ████100%│ Closed │  │
│  │            │           │ Tier B        │ 300/300│        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Showing 1–20 of 12                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Stats Strip

**API:** `GET /api/contributions/cycles/summary`

| Stat | Source |
|------|--------|
| Active Cycles | `activeCyclesCount` |
| Total Collecting | `totalCollecting` |
| Avg Completion | `avgCompletionPercentage` |

### Table Columns

| Column | Source | Notes |
|--------|--------|-------|
| Cycle | `cycleNumber` | |
| Claim | `claimNumber` | Link to `/claims/:claimId` |
| Deceased | `deceasedMemberName`, tier | |
| Progress | Visual mini progress bar + `membersCollected`/`totalMembers` | Inline bar |
| Deadline | `collectionDeadline` + days remaining | Red text if < 3 days, amber if < 7 |

- **Row click:** Navigate to `/claims/:claimId` → auto-select Contributions tab.
- **Default filter:** Active cycles only. Toggle to see "All" or "Closed".

### Filters

| Filter | Type | Notes |
|--------|------|-------|
| Status | Dropdown: Active, Closed, All | Default: Active |
| Search | Text input | Searches by cycle number, claim number, or deceased member name |

---

## Page 5: Member Profile → Contributions Tab

**URL:** `/members/:memberId/profile` (Contributions tab)  
**Replaces:** The standalone `/my-contributions` page from v1.

This is an **addition to the existing Member Profile tabs** (Overview, Nominees, Documents). The Contributions tab was previously listed as "Future Implementation" — this spec defines it.

### APIs Used

**1st-person (member viewing own profile):**
- `GET /api/contributions/my-contributions/summary`
- `GET /api/contributions/my-contributions/pending`
- `GET /api/contributions/my-contributions/history`

**3rd-person (agent/admin viewing a member's profile):**
- `GET /api/contributions/member/{memberId}/history` (with `status` filter)
- Summary stats derived from history data or a future summary endpoint

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Overview] [Contributions] [Nominees] [Documents]           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Contribution Summary                                       │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │ Total      │ This Year  │ Pending    │ Missed     │     │
│  │ Contributed│            │ Payments   │ (YTD)      │     │
│  │ OMR 120    │ OMR 120    │    1       │    0       │     │
│  └────────────┴────────────┴────────────┴────────────┘     │
│                                                             │
│  Pending Contributions                (only if count > 0)  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 CC-2025-00015                                    │   │
│  │    For: Jane Doe (MEM-00455) · Tier A               │   │
│  │    Amount: OMR 10  ·  Due: Feb 15 (5 days left)     │   │
│  │                                       [Record] [···]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Contribution History                                       │
│  Filters: [Status: All ▾]  [Search...]                     │
│                                                             │
│  ┌──────────┬──────────────┬────────┬──────────┬────────┐  │
│  │ Date     │ Cycle / For  │ Amount │ Method   │ Status │  │
│  ├──────────┼──────────────┼────────┼──────────┼────────┤  │
│  │ Jan 20   │ CC-00014     │ OMR 10 │ Wallet   │ Paid   │  │
│  │          │ John Smith   │        │          │        │  │
│  ├──────────┼──────────────┼────────┼──────────┼────────┤  │
│  │ Jan 15   │ CC-00013     │ OMR 10 │ Wallet   │ Paid   │  │
│  │          │ Bob Wilson   │        │          │        │  │
│  ├──────────┼──────────────┼────────┼──────────┼────────┤  │
│  │ Jan 10   │ CC-00012     │ OMR 10 │ Cash     │ Paid   │  │
│  │          │ Mary Jones   │        │          │        │  │
│  └──────────┴──────────────┴────────┴──────────┴────────┘  │
│  Showing 1–20 of 12                                        │
└─────────────────────────────────────────────────────────────┘
```

### Contribution Summary Strip

**1st-person API:** `GET /api/contributions/my-contributions/summary`

| Stat | Source |
|------|--------|
| Total Contributed | `totalContributed` |
| This Year | `thisYear` |
| Pending Payments | `pendingCount` |
| Missed (YTD) | Derived from history or future field |

**3rd-person:** Use `GET /api/contributions/member/{memberId}/history` and aggregate client-side, or use future summary endpoint.

### Pending Contributions Section

Only rendered if there are pending contributions (`pendingCount > 0`).

**1st-person API:** `GET /api/contributions/my-contributions/pending`  
**3rd-person:** `GET /api/contributions/member/{memberId}/history?status=Pending`

Each pending item shows as a card with: cycle code, deceased member name + code, tier, amount, deadline, and days remaining.

**Actions (viewMode-dependent):**

| Viewer | Actions on Pending Items |
|--------|--------------------------|
| Member (1st person) | No actions — contributions are collected by agents or auto-debited |
| Agent viewing their member | `[Record Payment]` `[···]` (Mark Missed) |
| Admin viewing any member | `[Record Payment]` `[···]` (Mark Missed) |

- **"Record Payment"** → Opens the shared **Record Cash Collection Modal**.
- **"Mark Missed"** → Opens the shared **Mark Missed Confirmation** dialog.

### Contribution History Table

**1st-person API:** `GET /api/contributions/my-contributions/history?page=X&limit=20`  
**3rd-person API:** `GET /api/contributions/member/{memberId}/history?status=X&page=X&limit=20`

| Column | Source | Notes |
|--------|--------|-------|
| Date | `collectedAt` or `createdAt` | |
| Cycle / For | `cycleNumber` (from relation), deceased member name | Cycle links to `/claims/:claimId` |
| Amount | `contributionAmount` | |
| Method | `paymentMethod` | "Wallet", "Cash", or "—" |
| Status | `contributionStatus` | Badge |

**Filter:** Status dropdown (All, Collected, Pending, Missed).

---

## Component Architecture

```
death-claims/
├── components/                              # Shared
│   ├── claim-status-badge/
│   ├── contribution-status-badge/
│   ├── claim-header-card/                   # Header card with facts row
│   ├── claim-action-banner/                 # Contextual banner (status + viewMode)
│   ├── record-cash-modal/                   # Shared across 3 pages
│   ├── mark-missed-dialog/                  # Shared confirmation dialog
│   ├── document-list/                       # Document rows with actions
│   ├── contribution-progress-card/          # Progress bar + stats
│   └── contribution-table/                  # Reusable table with filters + inline actions
│
├── pages/
│   ├── claims-listing/                      # Page 1
│   │   └── claims-listing.component.ts
│   │
│   ├── claim-details/                       # Page 2
│   │   ├── claim-details.component.ts       # Parent — header + banner + tab router
│   │   ├── details-documents-tab/           # Tab 1
│   │   ├── contributions-tab/               # Tab 2
│   │   └── activity-log-tab/                # Tab 3 (placeholder for now)
│   │
│   ├── submit-claim/                        # Page 3 — NO CHANGE
│   │   └── (existing 3-step wizard)
│   │
│   └── contribution-cycles/                 # Page 4
│       └── contribution-cycles.component.ts
│
└── services/
    ├── death-claims.service.ts              # All claim API calls
    └── contributions.service.ts             # All contribution API calls
```

**Member Profile integration:** The `contribution-table` and `contribution-progress-card` components are shared and imported into the member-profile feature module for the Contributions tab.

---

## Route Configuration

```typescript
// death-claims.routes.ts
{
  path: 'claims',
  children: [
    { path: '', component: ClaimsListingComponent },
    { path: 'new', component: SubmitClaimComponent },          // No change
    { path: 'cycles', component: ContributionCyclesComponent },
    { path: ':claimId', component: ClaimDetailsComponent },
  ]
}
```

---

## API Summary

### Death Claims APIs Used

| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/death-claims` | GET | Claims Listing — primary list with filters |
| `/api/death-claims/search` | POST | Claims Listing — text search |
| `/api/death-claims/dashboard/stats` | GET | Claims Listing — stats strip |
| `/api/death-claims/requiring-action` | GET | Claims Listing — action items |
| `/api/death-claims/{claimId}` | GET | Claim Details — header card + all data |
| `/api/death-claims/{claimId}/documents` | GET | Claim Details → Tab 1 documents |
| `/api/death-claims/{claimId}/documents/{documentId}/verify` | POST | Tab 1 — individual doc verify/reject |
| `/api/death-claims/{claimId}/documents/{documentId}/download` | GET | Tab 1 — document viewer/download |
| `/api/death-claims/{claimId}/verify` | POST | Action banner — verify all docs |
| `/api/death-claims/{claimId}/submit` | POST | Action banner — send for approval |
| `/api/death-claims/{claimId}/settle` | POST | Action banner — record settlement |

### Contribution APIs Used

| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/contributions/cycles/summary` | GET | Contribution Cycles page — stats |
| `/api/contributions/cycles/search` | POST | Contribution Cycles page — listing |
| `/api/contributions/cycles/{cycleId}` | GET | Claim Details → Tab 2 — cycle card |
| `/api/contributions/cycles/{cycleId}/contributions` | GET | Claim Details → Tab 2 — members table |
| `/api/contributions/cycles/{cycleId}/close` | POST | Claim Details → Tab 2 — close cycle |
| `/api/contributions/{contributionId}/record-cash` | POST | Shared modal — record cash collection |
| `/api/contributions/{contributionId}/mark-missed` | POST | Shared dialog — mark missed |
| `/api/contributions/my-contributions/summary` | GET | Member Profile → Contributions tab (1st person) |
| `/api/contributions/my-contributions/pending` | GET | Member Profile → Contributions tab (1st person) |
| `/api/contributions/my-contributions/history` | GET | Member Profile → Contributions tab (1st person) |
| `/api/contributions/member/{memberId}/history` | GET | Member Profile → Contributions tab (3rd person) |
| `/api/contributions/search` | POST | Used for advanced search/filtering |

### API Gap

| Need | Status | Notes |
|------|--------|-------|
| `GET /api/death-claims/{claimId}/activity` | ❌ Missing | Activity Log tab needs this. Using placeholder UI until implemented. |

---

## Implementation Notes

1. **Action banner is the core UX improvement.** It replaces the cluttered status-variant sections from v1. One clear message, one or two action buttons, contextually shown. Implement this carefully with proper viewMode + permission checks.

2. **viewMode pattern:** Same as wallet and member profile — check `authContext` to determine if the viewer is the relevant agent, an admin within scope, or the member themselves. The `claim-action-banner` component takes `claim` data + `authContext` as inputs and renders accordingly.

3. **Record Cash Modal is shared.** Create it once in `death-claims/components/` and import it into agent-profile and member-profile feature modules. All 3 entry points call the same `POST /api/contributions/{contributionId}/record-cash` endpoint.

4. **Activity Log tab:** Implement as a placeholder with "Under Development" message. When the API is ready, it will render a vertical timeline component. No frontend work beyond the placeholder is needed now.

5. **Contribution tab on Claim Details vs Member Profile:** The claim-level view shows contributions for a single cycle (all members). The member-level view shows contributions for a single member (all cycles). Same table component, different data source and column emphasis.

6. **Bulk actions:** Design the UI toggle button as disabled/"Coming Soon" in the contributions table. No API or logic needed yet. When implemented, it will add checkbox selection + a floating action bar.

7. **Stats strip interactions:** Clicking a stat in the Claims Listing stats strip should filter the table by that status. This is a frontend-only behavior — it sets the `claimStatus` filter parameter.

8. **Mobile responsive:** Stats strip stacks to 2×2 or 3×2 grid on mobile. Tables switch to card-based layouts. Action banner stacks icon/text/buttons vertically.


## Published HTML VIEW (claude artifact publish)
- link: https://claude.ai/public/artifacts/e3f4cfff-da2c-4798-bef5-b6e6d3dec8b9