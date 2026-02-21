# Bulk Wallet Deposit

## Spec: Bulk Deposit for Agents via Member Listing

**Status:** Draft
**Date:** February 21, 2026
**Scope:** New API endpoint + UI enhancement on Agent Member Listing
**Depends on:** Auto-Pay on Wallet Deposit spec, Unified Wallet-Based Contribution Collection spec

---

## 1. Summary

Agents collect cash from multiple members during a single field visit. Currently, they must enter each wallet deposit one by one — navigating to each member, entering an amount, submitting, repeating. For 20-30 members, this is tedious and error-prone.

This spec introduces a **Bulk Deposit** mode on the existing Agent Member Listing screen. The agent toggles into bulk mode, enters deposit amounts against multiple members in a single table view, reviews the total, and submits. The backend processes each deposit as an **individual transaction** (with auto-pay), returning per-member results.

### Core Principle

> **One visit, one submission. The agent enters all collected amounts in a single screen and submits them together.**

---

## 2. User Flow

```
Agent opens Member Listing (existing screen)
  → Clicks "Bulk Deposit" button
  → Table enters edit mode: Amount input column appears
  → Non-Active members have disabled inputs
  → Agent enters amounts for members who paid
  → Sticky bottom bar shows running total + member count
  → Agent clicks "Review & Submit"
  → Confirmation modal: total member count + total amount
  → Agent confirms
  → Backend processes each deposit individually (with auto-pay)
  → Results screen: per-member success/failure + auto-settle summary
  → Agent clicks "Done" → exits bulk mode
```

---

## 3. UI Design

### 3.1 Entry Point

A **"Bulk Deposit"** button is added next to the existing "Register Member" button in the Members tab table header.

```
┌─────────────────────────────────────────────────────────────┐
│ Members                      [₹ Bulk Deposit] [+ Register] │
└─────────────────────────────────────────────────────────────┘
```

When clicked:
- "Bulk Deposit" and "Register Member" buttons are replaced by a blue info banner
- An "Amount" column appears as the last column in the table
- "Registered" and "View" columns are hidden
- A sticky bottom bar slides up from the bottom of the screen

---

### 3.2 Bulk Mode — Table View

```
┌─────────────────────────────────────────────────────────────┐
│ Members                                                      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💳 Bulk Deposit Mode                         [Cancel]  │ │
│ │    Enter deposit amounts for each member.               │ │
│ │    Only active members can receive deposits.            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Search members...]                          [All Status ▾] │
│                                                              │
│ MEMBER        │ CONTACT  │ STATUS  │ PENDING  │ WALLET │ AMOUNT  │
│───────────────┼──────────┼─────────┼──────────┼────────┼─────────│
│ Jon Snow      │ 789...   │ Active  │ 2 (₹200) │ ₹100 ⚠│ [  500] │ ← green bg
│ MEM-..039     │          │         │          │        │         │
│───────────────┼──────────┼─────────┼──────────┼────────┼─────────│
│ Tenth of D..  │ 837...   │Deceased │ 0        │ ₹100 ⚠│  ---    │ ← disabled/dim
│ MEM-..035     │          │         │          │        │         │
│───────────────┼──────────┼─────────┼──────────┼────────┼─────────│
│ Sixth of D..  │ 273...   │ Active  │ 3 (₹300) │₹1,000  │ [     ] │
│ MEM-..030     │          │         │          │        │         │
│───────────────┼──────────┼─────────┼──────────┼────────┼─────────│
│ Fifth of D..  │ 928...   │ Active  │ 1 (₹100) │ ₹250   │ [  200] │ ← green bg
│ MEM-..028     │          │         │          │        │         │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
║ Members: 2        Total: ₹700      [Cancel] [Review & Submit] ║
═══════════════════════════════════════════════════════════════
```

**Table column changes in bulk mode:**

| Normal Mode | Bulk Mode |
|-------------|-----------|
| Member | Member (unchanged) |
| Contact | Contact (unchanged) |
| Status | Status (unchanged) |
| Pending Contrib | Pending Contrib (unchanged) |
| Wallet | Wallet (unchanged) |
| Registered | **Hidden** |
| View (link) | **Hidden** |
| — | **Amount** (new, input field) |

**Row behavior:**
- **Active members:** Amount input enabled, free entry (number, min 0)
- **Non-Active members (Deceased, Suspended):** Row dimmed (opacity), input disabled with `---` placeholder
- **Rows with entered amounts:** Light green background highlight, input border turns green
- **Rows without amounts:** Normal appearance

**Pending Contrib column enhancement:** In bulk mode, show count with total amount — e.g., `2 (₹200)` — giving the agent context on how much is pending while they enter amounts.

---

### 3.3 Sticky Bottom Bar

Fixed to the bottom of the viewport. Slides up when bulk mode is entered, slides down when exited.

```
═══════════════════════════════════════════════════════════════
║  MEMBERS          TOTAL AMOUNT                              ║
║  2                ₹700              [Cancel] [Review & Submit] ║
═══════════════════════════════════════════════════════════════
```

- **Members count:** Number of members with a non-zero amount entered
- **Total Amount:** Sum of all entered amounts
- **"Review & Submit"** button: Disabled when member count is 0
- **"Cancel"** button: Exits bulk mode, clears all entered amounts

The bar updates in real-time as the agent enters/clears amounts.

---

### 3.4 Confirmation Modal

Triggered by "Review & Submit". Simple summary — not per-member breakdown.

```
┌──────────────────────────────────────┐
│ Confirm Bulk Deposit            [✕]  │
├──────────────────────────────────────┤
│                                       │
│  ┌────────────┬────────────────────┐ │
│  │     2      │      ₹700          │ │
│  │  Members   │   Total Amount     │ │
│  └────────────┴────────────────────┘ │
│                                       │
│  ℹ️ Each deposit will be processed   │
│     individually. Pending            │
│     contributions will be            │
│     auto-settled from each           │
│     member's wallet. Your cash       │
│     custody will increase by the     │
│     total amount.                    │
│                                       │
├──────────────────────────────────────┤
│              [Cancel] [Confirm & Submit] │
└──────────────────────────────────────┘
```

---

### 3.5 Processing State

After confirmation, a centered overlay with spinner and progress counter.

```
┌──────────────────────────┐
│         ⟳                │
│  Processing Deposits...  │
│  3 of 5 completed        │
└──────────────────────────┘
```

The progress counter updates as the backend response streams in (or after the full response is received, updating visually per item).

---

### 3.6 Results Screen

After all deposits are processed, a results modal shows the outcome.

```
┌─────────────────────────────────────────────┐
│ Bulk Deposit Results                   [✕]  │
├─────────────────────────────────────────────┤
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ Deposits Processed      2 members        ││
│ │ Contributions Settled   3 contributions  ││
│ │─────────────────────────────────────────-││
│ │ Total Deposited         ₹700             ││
│ └──────────────────────────────────────────┘│
│                                              │
│ ✅ Jon Snow                          ₹500   │
│    MEM-2026-00039                            │
│    2 contrib. settled (₹200)                 │
│                                              │
│ ✅ Fifth of Dawood                   ₹200   │
│    MEM-2026-00028                            │
│    1 contrib. settled (₹100)                 │
│                                              │
├─────────────────────────────────────────────┤
│                                     [Done]  │
└─────────────────────────────────────────────┘
```

**Per-member result item shows:**
- ✅ (success) or ❌ (failed) icon
- Member name and code
- Deposit amount
- Number of contributions auto-settled with total amount, OR "No pending contributions"
- If failed: error reason (e.g., "Member wallet not found")

**"Done" button:** Closes modal and exits bulk mode. Table returns to normal view with refreshed data.

---

## 4. API Design

### 4.1 Endpoint: Bulk Wallet Deposit

**Endpoint:** `POST /api/wallet/deposits/bulk`
**Triggered by:** Agent
**Auth:** Agent role, scoped to their assigned members

**Request:**

```json
{
  "deposits": [
    {
      "memberId": "uuid-1",
      "amount": 500
    },
    {
      "memberId": "uuid-2",
      "amount": 200
    }
  ]
}
```

**Validation (before processing):**
- `deposits` array must have 1-50 items
- Each `amount` must be > 0
- Each `memberId` must be unique within the array (no duplicates)
- All members must belong to the requesting agent
- All members must have Active status

If validation fails, the entire request is rejected with a 400 error before any processing begins.

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDeposits": 2,
      "successCount": 2,
      "failedCount": 0,
      "totalAmountDeposited": 700,
      "totalContributionsSettled": 3,
      "totalAmountSettled": 300
    },
    "results": [
      {
        "memberId": "uuid-1",
        "memberCode": "MEM-2026-00039",
        "memberName": "Jon Snow",
        "status": "success",
        "depositAmount": 500,
        "autoPayResult": {
          "settledContributions": [
            {
              "contributionId": "uuid",
              "cycleCode": "CC-2025-00015",
              "amount": 100
            },
            {
              "contributionId": "uuid",
              "cycleCode": "CC-2025-00018",
              "amount": 100
            }
          ],
          "remainingPending": [],
          "finalBalance": 400
        }
      },
      {
        "memberId": "uuid-2",
        "memberCode": "MEM-2026-00028",
        "memberName": "Fifth of Dawood",
        "status": "success",
        "depositAmount": 200,
        "autoPayResult": {
          "settledContributions": [
            {
              "contributionId": "uuid",
              "cycleCode": "CC-2025-00020",
              "amount": 100
            }
          ],
          "remainingPending": [],
          "finalBalance": 350
        }
      }
    ]
  }
}
```

**Failed deposit result example:**

```json
{
  "memberId": "uuid-3",
  "memberCode": "MEM-2026-00025",
  "memberName": "Fourth of Dawood",
  "status": "failed",
  "depositAmount": 300,
  "error": "Wallet not found for member",
  "autoPayResult": null
}
```

---

### 4.2 Backend Processing Logic

```javascript
async function processBulkDeposit(input, agentUserId) {

  // 1. Pre-validation (fail-fast, before any processing)
  const memberIds = input.deposits.map(d => d.memberId);

  // Check for duplicates
  if (new Set(memberIds).size !== memberIds.length) {
    throw new ValidationError('Duplicate member IDs in request');
  }

  // Verify all members belong to agent and are Active
  const members = await db.members.findAll({
    where: {
      memberId: { [Op.in]: memberIds },
      agentId: agentUserId,
      memberStatus: 'Active'
    },
    include: [{ model: db.wallets, as: 'wallet' }]
  });

  if (members.length !== memberIds.length) {
    const foundIds = members.map(m => m.memberId);
    const missing = memberIds.filter(id => !foundIds.includes(id));
    throw new ValidationError(`Invalid or unauthorized members: ${missing.join(', ')}`);
  }

  // 2. Process each deposit individually
  const results = [];

  for (const depositInput of input.deposits) {
    try {
      const result = await processIndividualDeposit({
        memberId: depositInput.memberId,
        amount: depositInput.amount,
        collectedBy: agentUserId
      });

      results.push({
        memberId: depositInput.memberId,
        memberCode: result.memberCode,
        memberName: result.memberName,
        status: 'success',
        depositAmount: depositInput.amount,
        autoPayResult: result.autoPayResult
      });

    } catch (error) {
      const member = members.find(m => m.memberId === depositInput.memberId);
      results.push({
        memberId: depositInput.memberId,
        memberCode: member?.memberCode || 'Unknown',
        memberName: member?.fullName || 'Unknown',
        status: 'failed',
        depositAmount: depositInput.amount,
        error: error.message,
        autoPayResult: null
      });
    }
  }

  // 3. Build summary
  const successResults = results.filter(r => r.status === 'success');
  const failedResults = results.filter(r => r.status === 'failed');

  const summary = {
    totalDeposits: results.length,
    successCount: successResults.length,
    failedCount: failedResults.length,
    totalAmountDeposited: successResults.reduce((sum, r) => sum + r.depositAmount, 0),
    totalContributionsSettled: successResults.reduce((sum, r) =>
      sum + (r.autoPayResult?.settledContributions?.length || 0), 0),
    totalAmountSettled: successResults.reduce((sum, r) =>
      sum + (r.autoPayResult?.settledContributions?.reduce((s, c) => s + c.amount, 0) || 0), 0)
  };

  return { summary, results };
}
```

### 4.3 Individual Deposit Processing

Each deposit is processed in its **own database transaction**. This is the existing wallet deposit flow enhanced with auto-pay (from the Auto-Pay spec).

```javascript
async function processIndividualDeposit(input) {
  return await db.transaction(async (trx) => {

    // 1. Get member with wallet
    const member = await db.members.findByPk(input.memberId, {
      include: [{ model: db.wallets, as: 'wallet' }]
    }, { transaction: trx });

    if (!member || !member.wallet) {
      throw new Error('Wallet not found for member');
    }

    const wallet = member.wallet;
    const amount = input.amount;

    // 2. Credit wallet balance
    await db.wallets.increment('currentBalance', {
      by: amount,
      where: { walletId: wallet.walletId }
    }, { transaction: trx });

    // 3. GL Entry — Cash collected → Wallet liability
    const journalEntry = await glService.createJournalEntry({
      entries: [
        {
          accountCode: "1001",
          debit: amount,
          description: `Wallet deposit collected from ${member.memberCode}`
        },
        {
          accountCode: "2100",
          credit: amount,
          description: `Wallet deposit for ${member.memberCode}`
        }
      ],
      sourceModule: "Wallets",
      sourceEntityId: wallet.walletId,
      sourceTransactionType: "WalletDepositCollection",
      createdBy: input.collectedBy
    }, trx);

    // 4. Wallet transaction — Deposit
    const newBalance = Number(wallet.currentBalance) + amount;
    await db.walletTransactions.create({
      transactionId: generateUUID(),
      walletId: wallet.walletId,
      transactionType: 'Deposit',
      amount: amount,
      balanceAfter: newBalance,
      sourceModule: 'Wallets',
      sourceEntityId: wallet.walletId,
      description: `Cash deposit via bulk deposit`,
      journalEntryId: journalEntry.entryId,
      status: 'Completed',
      createdBy: input.collectedBy,
      createdAt: new Date()
    }, { transaction: trx });

    // 5. Increase agent cash custody
    await increaseCashCustody({
      userId: input.collectedBy,
      amount: amount,
      sourceModule: 'Wallets',
      sourceEntityId: wallet.walletId,
      sourceTransactionType: 'WalletDepositCollection'
    }, trx);

    // 6. Auto-pay pending contributions
    const autoPayResult = await autoPayPendingContributions({
      memberId: input.memberId,
      walletId: wallet.walletId,
      depositedBy: input.collectedBy
    }, trx);

    // 7. Emit event
    await emitEvent('WalletDepositCompleted', {
      memberId: input.memberId,
      depositAmount: amount,
      contributionsSettled: autoPayResult.settledContributions.length,
      totalAutoPayAmount: autoPayResult.settledContributions
        .reduce((sum, c) => sum + c.amount, 0),
      finalBalance: autoPayResult.finalBalance,
      viaBulkDeposit: true
    });

    return {
      memberCode: member.memberCode,
      memberName: member.fullName,
      autoPayResult
    };
  });
}
```

**Key design decision: Individual transactions, not batch.**

Each member's deposit is its own DB transaction. If one fails, the others still succeed. This means:
- No single point of failure for the entire batch
- Partial success is possible (and reported clearly)
- Each transaction is lightweight (~50-100ms)
- Total processing time for 30 members: ~1.5-3 seconds

---

## 5. Validation Rules

### 5.1 Frontend Validation (before API call)

| Rule | Behavior |
|------|----------|
| No amounts entered | "Review & Submit" button disabled |
| Amount ≤ 0 | Input rejects (min=0, number type) |
| Non-numeric input | Input rejects (type=number) |
| Decimal amounts | Allowed (2 decimal places max) |

### 5.2 Backend Validation (fail-fast)

| Rule | Error |
|------|-------|
| Empty deposits array | 400: "At least one deposit required" |
| More than 50 deposits | 400: "Maximum 50 deposits per batch" |
| Duplicate memberIds | 400: "Duplicate member IDs in request" |
| Member not assigned to agent | 400: "Invalid or unauthorized members" |
| Member not Active | 400: "Invalid or unauthorized members" |
| Amount ≤ 0 | 400: "Amount must be greater than 0" |

All pre-validation runs before any deposits are processed. If validation fails, no deposits are attempted.

---

## 6. Edge Cases

### 6.1 Some Members Fail, Others Succeed

Results array contains a mix of `status: "success"` and `status: "failed"` items. The results modal clearly shows which succeeded and which failed with error reasons. Agent can retry failed ones individually or via another bulk deposit.

### 6.2 All Members Fail

Summary shows `successCount: 0`, `failedCount: N`. Results modal shows all failures. No cash custody changes, no GL entries.

### 6.3 Agent Submits During Active Contribution Cycle

No conflict. Each deposit processes independently, and auto-pay handles any pending contributions. Race condition with cycle-start auto-debit is handled by the contribution status check (already `Collected` contributions are skipped).

### 6.4 Same Member Appears in Multiple Concurrent Bulk Requests

The individual transaction approach handles this naturally — each transaction acquires row-level locks. The second request will process after the first completes for that member.

### 6.5 Network Timeout on Large Batch

For 30 members at ~100ms each, total is ~3 seconds. Well within typical HTTP timeout limits (30-60s). If needed in the future, the endpoint can be made async with a job ID and polling pattern.

### 6.6 Agent Navigates Away During Processing

Frontend should show a blocking overlay (already designed). Browser back/refresh should trigger an "Are you sure?" confirmation. If the request was already sent, the backend completes processing regardless.

---

## 7. Performance Considerations

### 7.1 Current Scale (MVP)

For 20-30 members per batch:
- Pre-validation: ~50ms (single query to verify all members)
- Per-deposit processing: ~50-100ms (1 DB transaction with ~10-15 operations)
- Total: ~1.5-3 seconds for 30 members
- Synchronous processing is sufficient

### 7.2 Future Scale (Queue-Based)

When batches exceed 50-100 members, migrate to async processing:

```
POST /api/wallet/deposits/bulk
  → Returns { batchId: "uuid", status: "processing" }

GET /api/wallet/deposits/bulk/:batchId
  → Returns progress + results as they complete

Frontend polls or uses WebSocket for real-time updates
```

This is not needed for MVP but the API response structure is designed to support this transition. The `summary` + `results` format works identically for sync and async responses.

---

## 8. Permissions

| Check | Rule |
|-------|------|
| Role | Agent only |
| Scope | Agent can only deposit for their assigned members |
| Member status | Only Active members |
| Validation | All members checked before processing begins |

Admin roles (Unit, Area, Forum) do not have access to this endpoint — bulk deposit is an agent-level field operation.

---

## 9. Frontend Component Architecture

### 9.1 Existing Component Modified

**`agent-member-list.component.ts`** — Add bulk deposit mode toggle and state management.

**New state:**
```typescript
bulkMode = signal(false);
depositAmounts = signal<Record<string, number>>({});

// Computed
enteredDeposits = computed(() => {
  const amounts = this.depositAmounts();
  return Object.entries(amounts)
    .filter(([_, amount]) => amount > 0)
    .map(([memberId, amount]) => ({ memberId, amount }));
});

totalAmount = computed(() =>
  this.enteredDeposits().reduce((sum, d) => sum + d.amount, 0)
);

memberCount = computed(() => this.enteredDeposits().length);
```

### 9.2 New Components

| Component | Purpose |
|-----------|---------|
| `bulk-deposit-banner` | Blue info banner shown in bulk mode |
| `bulk-deposit-sticky-bar` | Fixed bottom bar with totals and submit |
| `bulk-deposit-confirm-modal` | Confirmation modal with member count + total |
| `bulk-deposit-results-modal` | Results display with per-member outcomes |

### 9.3 Service

```typescript
// wallet.service.ts (existing, add method)
bulkDeposit(deposits: { memberId: string; amount: number }[]): Observable<BulkDepositResponse> {
  return this.http.post<BulkDepositResponse>('/api/wallet/deposits/bulk', { deposits });
}
```

---

## 10. Impact on Existing Modules

### 10.1 Agent Member Listing
**Impact:** Medium — new mode toggle, conditional column rendering, sticky bar integration

### 10.2 Wallet Module
**Impact:** Low — reuses existing `processWalletDeposit` + `autoPayPendingContributions` logic

### 10.3 Cash Management
**Impact:** Low — `increaseCashCustody` called per deposit (same as individual deposits)

### 10.4 General Ledger
**Impact:** Low — same GL entries as individual deposits, just N times

### 10.5 Contribution Module
**Impact:** None — auto-pay handles contribution settlement transparently

---

## 11. Migration / Rollout

### 11.1 No Schema Changes

No new database tables or columns. The bulk endpoint orchestrates existing operations.

### 11.2 Rollout Steps

1. Implement `POST /api/wallet/deposits/bulk` endpoint
2. Add bulk mode toggle to agent member listing component
3. Create bulk deposit UI components (banner, sticky bar, modals)
4. Test with varying batch sizes (1, 10, 30, 50)
5. Monitor: track `WalletDepositCompleted` events with `viaBulkDeposit: true`

### 11.3 Backward Compatibility

- Individual deposit endpoint (`POST /api/wallet/deposits`) unchanged
- Existing agent deposit flow via member detail page still works
- Bulk deposit is additive — no existing functionality modified

---

## 12. Summary

| Aspect | Detail |
|--------|--------|
| Entry point | "Bulk Deposit" button on Agent Member Listing |
| Mode | Inline table edit (Amount column appears) |
| Visible members | All members, non-Active disabled |
| Amount input | Free entry by agent |
| Confirmation | Modal with member count + total amount |
| Processing | Individual transactions (each deposit independent) |
| Auto-pay | Yes, triggered per deposit (FIFO by due date) |
| Results | Per-member success/failure + auto-settle details |
| Max batch size | 50 (MVP) |
| New endpoints | `POST /api/wallet/deposits/bulk` |
| Schema changes | None |
| Future scaling | Queue-based async processing when batch > 50 |