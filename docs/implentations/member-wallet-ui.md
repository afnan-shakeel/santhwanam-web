# Member Wallet UI Design

---

## **Overview**

The wallet is a **member's prepaid balance** used for contributions. UI should make it easy to:
1. Check balance
2. See transaction history
3. Request deposits
4. Track pending deposits

---

## **Recommended Structure: 2 Views**

### **1. Wallet Overview (Member View)**
### **2. Wallet Management (Admin/Agent View)**

---

## **1. Member Wallet Overview** 

**URL:** `/members/:memberId/wallet` or `/my-wallet`

**Purpose:** Member sees their wallet balance and history

### **Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ My Wallet                                   MEM-2025-00456  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │          Current Balance                             │   │
│  │          ₹ 2,500.00                                  │   │
│  │                                                       │   │
│  │  Low Balance ⚠️  Add ₹500 to maintain coverage       │   │
│  │                                    [Request Deposit] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Quick Stats                                          │   │
│  │ ┌──────────┬──────────┬──────────┬──────────┐       │   │
│  │ │ Deposits │ Debits   │ Pending  │ Total    │       │   │
│  │ │ ₹5,000   │ ₹2,500   │ ₹1,000   │ In/Out   │       │   │
│  │ └──────────┴──────────┴──────────┴──────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Recent Activity                        [View All]          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ Deposit Approved                    + ₹1,000     │   │
│  │    Jan 15, 2025 • Balance: ₹3,500                   │   │
│  │    Via Agent Mary • Ref: DEP-2025-001               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ↓ Contribution Deducted                - ₹100       │   │
│  │    Jan 10, 2025 • Balance: ₹2,500                   │   │
│  │    Death Claim CC-2025-005                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🕐 Deposit Pending                     ₹500         │   │
│  │    Jan 5, 2025 • Awaiting approval                  │   │
│  │    Submitted via Agent John                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Click "Request Deposit" → Modal:
┌─────────────────────────────────────┐
│ Request Wallet Deposit              │
├─────────────────────────────────────┤
│ Amount: ____________ ₹              │
│                                     │
│ Payment Method:                     │
│ ○ Cash (via Agent)                  │
│ ○ Bank Transfer                     │
│                                     │
│ Notes: ____________________         │
│        (optional)                   │
│                                     │
│              [Cancel] [Submit]      │
└─────────────────────────────────────┘
```

---

## **2. Wallet Management (Admin/Agent View)**

**URL:** `/admin/wallets` or `/agent/wallet-deposits`

**Purpose:** Approve deposits, monitor wallets, handle refunds

### **Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Wallet Management                                           │
├─────────────────────────────────────────────────────────────┤
│ [Pending Deposits: 5] [All Wallets] [Low Balance: 12]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Pending Deposit Requests                                    │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🔴 MEM-2025-00456 • John Doe             ₹1,000     │   │
│ │    Requested: 2 hours ago                           │   │
│ │    Agent: Mary Johnson • Method: Cash               │   │
│ │                           [Reject] [Approve]        │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ 🔴 MEM-2025-00457 • Jane Smith           ₹500       │   │
│ │    Requested: 1 day ago                             │   │
│ │    Agent: John Doe • Method: Bank Transfer          │   │
│ │                           [Reject] [Approve]        │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Low Balance Alerts                                          │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ⚠️ MEM-2025-00458 • Alice Brown         ₹50         │   │
│ │    Last contribution: Jan 10 • Tier: A              │   │
│ │    [Contact Member] [View Details]                  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Search All Wallets:                                         │
│ [Search by member code, name...] 🔍                        │
│                                                             │
│ ┌────────┬──────────────┬──────────┬────────┬─────────┐   │
│ │ Member │ Name         │ Balance  │ Status │ Actions │   │
│ ├────────┼──────────────┼──────────┼────────┼─────────┤   │
│ │MEM-456 │ John Doe     │ ₹2,500   │ Active │ [View]  │   │
│ │MEM-457 │ Jane Smith   │ ₹4,200   │ Active │ [View]  │   │
│ │MEM-458 │ Alice Brown  │ ₹50 ⚠️   │ Active │ [View]  │   │
│ └────────┴──────────────┴──────────┴────────┴─────────┘   │
└─────────────────────────────────────────────────────────────┘

Click "View" → Wallet Details Modal:
┌─────────────────────────────────────────┐
│ Wallet Details - John Doe               │
│ MEM-2025-00456                          │
├─────────────────────────────────────────┤
│ Current Balance: ₹2,500                 │
│ Total Deposits: ₹5,000                  │
│ Total Debits: ₹2,500                    │
│ Pending Deposits: ₹1,000                │
├─────────────────────────────────────────┤
│ Transaction History (Last 30 days)      │
│                                         │
│ Jan 15: Deposit +₹1,000                 │
│ Jan 10: Contribution -₹100              │
│ Jan 05: Deposit +₹2,000                 │
│ Dec 28: Contribution -₹100              │
│                                         │
│               [Download Statement]      │
│               [Manual Adjustment]       │
└─────────────────────────────────────────┘
```

---

## **Key UI Components**

### **1. Balance Card (Prominent)**

```jsx
<Card highlight>
  <Text size="small" color="muted">Current Balance</Text>
  <Text size="3xl" weight="bold">₹ 2,500.00</Text>
  
  {balance < minimumBalance && (
    <Alert variant="warning">
      Low Balance ⚠️ Add ₹500 to maintain coverage
    </Alert>
  )}
  
  <Button variant="primary">Request Deposit</Button>
</Card>
```

---

### **2. Transaction List Item**

```jsx
<TransactionItem>
  <Icon>
    {type === 'credit' ? '✅' : '↓'}
    {status === 'pending' ? '🕐' : null}
  </Icon>
  
  <Content>
    <Title>
      {type === 'credit' ? 'Deposit Approved' : 'Contribution Deducted'}
    </Title>
    <Meta>
      {date} • Balance: ₹{balanceAfter}
      {reference && `• ${reference}`}
    </Meta>
  </Content>
  
  <Amount positive={type === 'credit'}>
    {type === 'credit' ? '+' : '-'} ₹{amount}
  </Amount>
</TransactionItem>
```

---

### **3. Status Badges**

```jsx
<Badge color={getStatusColor(status)}>
  {status === 'Pending' && '🕐 Pending'}
  {status === 'Approved' && '✅ Approved'}
  {status === 'Rejected' && '❌ Rejected'}
  {status === 'Completed' && '✓ Completed'}
</Badge>
```

---

### **4. Low Balance Alert**

```jsx
{balance < tier.contributionAmount * 2 && (
  <Alert variant="warning" icon="⚠️">
    Your balance is low. Add ₹{recommendedTopUp} to cover next 
    {Math.floor(recommendedTopUp / tier.contributionAmount)} contributions.
    <Button size="sm" variant="link">Add Now</Button>
  </Alert>
)}
```

---

## **Detailed View: Transaction History Page**

**URL:** `/members/:memberId/wallet/transactions`

```
┌─────────────────────────────────────────────────────────────┐
│ Wallet Transactions - John Doe (MEM-2025-00456)            │
├─────────────────────────────────────────────────────────────┤
│ Current Balance: ₹2,500                                     │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Type ▾] [Date Range ▾] [Download PDF] [Excel]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────┬─────────────────┬─────────┬────────┬──────────┐   │
│ │ Date │ Description     │ Type    │ Amount │ Balance  │   │
│ ├──────┼─────────────────┼─────────┼────────┼──────────┤   │
│ │Jan 15│ Deposit         │ Credit  │+₹1,000 │ ₹3,500   │   │
│ │      │ Ref: DEP-001    │         │        │          │   │
│ ├──────┼─────────────────┼─────────┼────────┼──────────┤   │
│ │Jan 10│ Contribution    │ Debit   │-₹100   │ ₹2,500   │   │
│ │      │ CC-2025-005     │         │        │          │   │
│ ├──────┼─────────────────┼─────────┼────────┼──────────┤   │
│ │Jan 05│ Deposit Pending │ Pending │ ₹500   │ -        │   │
│ │      │ Awaiting appr.  │         │        │          │   │
│ └──────┴─────────────────┴─────────┴────────┴──────────┘   │
│                                                             │
│ Showing 10 of 45 transactions            [1] [2] [3] [4]  │
└─────────────────────────────────────────────────────────────┘
```

---

## **Mobile-First Considerations**

### **Simplified Mobile View:**

```
┌──────────────────────────┐
│ My Wallet           ☰    │
├──────────────────────────┤
│                          │
│   Current Balance        │
│   ₹ 2,500                │
│                          │
│   [Request Deposit]      │
│                          │
├──────────────────────────┤
│ Recent Activity          │
│                          │
│ ✅ Deposit      +₹1,000  │
│ Jan 15 • ₹3,500         │
│                          │
│ ↓ Contribution   -₹100   │
│ Jan 10 • ₹2,500         │
│                          │
│ 🕐 Pending       ₹500    │
│ Jan 05                   │
│                          │
│       [View All]         │
└──────────────────────────┘
```

---

## **Interactive Features**

### **1. Auto-refresh Balance**
```jsx
// Real-time updates when transactions occur
useEffect(() => {
  const interval = setInterval(() => {
    refetchBalance();
  }, 30000); // Every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

---

### **2. Transaction Filters**
```jsx
<Filters>
  <Select label="Type">
    <option value="all">All Transactions</option>
    <option value="credit">Deposits Only</option>
    <option value="debit">Debits Only</option>
  </Select>
  
  <DateRangePicker 
    label="Date Range"
    onChange={handleDateChange}
  />
  
  <Select label="Status">
    <option value="all">All</option>
    <option value="completed">Completed</option>
    <option value="pending">Pending</option>
  </Select>
</Filters>
```

---

### **3. Quick Actions**
```jsx
<ActionMenu>
  <MenuItem icon="💰" onClick={requestDeposit}>
    Request Deposit
  </MenuItem>
  <MenuItem icon="📄" onClick={downloadStatement}>
    Download Statement
  </MenuItem>
  <MenuItem icon="🔔" onClick={setAlert}>
    Set Low Balance Alert
  </MenuItem>
  <MenuItem icon="📧" onClick={emailStatement}>
    Email Statement
  </MenuItem>
</ActionMenu>
```

---

## **Data Structure for UI**

### **Wallet Summary Response:**
```typescript
{
  walletId: "uuid",
  memberId: "uuid",
  memberCode: "MEM-2025-00456",
  memberName: "John Doe",
  currentBalance: 2500.00,
  
  stats: {
    totalDeposits: 5000.00,
    totalDebits: 2500.00,
    pendingDeposits: 1000.00,
    transactionCount: 25
  },
  
  alerts: {
    isLowBalance: true,
    minimumRequired: 200.00,
    recommendedTopUp: 500.00
  },
  
  recentTransactions: [
    {
      transactionId: "uuid",
      transactionType: "Credit",
      amount: 1000.00,
      balanceAfter: 3500.00,
      description: "Deposit Approved",
      reference: "DEP-2025-001",
      status: "Completed",
      createdAt: "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

## **Best Practices**

### **Visual Hierarchy:**
1. **Balance** (largest, most prominent)
2. **Quick actions** (Request Deposit button)
3. **Alerts** (low balance warnings)
4. **Recent transactions** (scrollable list)

---

### **Color Coding:**
- 🟢 **Green:** Credits/deposits
- 🔴 **Red:** Debits/contributions
- 🟡 **Yellow/Orange:** Pending transactions
- ⚠️ **Warning:** Low balance alerts

---

### **Accessibility:**
- Clear labels for screen readers
- High contrast for amounts
- Icons with text labels
- Keyboard navigation support

---

### **Performance:**
- Paginated transaction history (10-20 per page)
- Lazy load older transactions
- Cache balance for offline viewing
- Optimistic UI updates

---

## **User Flows**

### **Flow 1: Request Deposit**
```
Member clicks "Request Deposit"
  ↓
Modal opens with form
  ↓
Enter amount + payment method
  ↓
Submit request
  ↓
Success message + "Pending approval"
  ↓
Transaction appears in history as "Pending"
```

---

### **Flow 2: Admin Approves Deposit**
```
Admin sees pending request
  ↓
Reviews details
  ↓
Clicks "Approve"
  ↓
Confirmation dialog
  ↓
GL entry created, wallet updated
  ↓
Member sees updated balance + notification
```

---

### **Flow 3: Low Balance Alert**
```
System checks balance daily
  ↓
If balance < 2× contribution amount
  ↓
Show warning banner
  ↓
Member clicks "Add Now"
  ↓
Redirect to deposit request
```

---

## **Summary**

**Key Screens:**
1. **Wallet Overview** - Balance + recent activity
2. **Transaction History** - Full paginated list
3. **Request Deposit** - Form modal
4. **Wallet Management** (Admin) - Approve deposits, monitor balances

**Design Principles:**
- Balance is hero element
- Clear visual distinction between credits/debits
- Prominent low balance warnings
- Easy deposit request flow
- Transaction history with filters
- Mobile-responsive design

---

# Wallet Module - API Endpoints

**Total Implemented APIs: 16**

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | /wallet/members/:memberId/wallet | GET | Get wallet summary |
| 2 | /wallet/my-wallet | GET | Get logged-in member's wallet |
| 3 | /wallet/members/:memberId/wallet/transactions | GET | Transaction history |
| 4 | /wallet/members/:memberId/wallet/deposit-requests | POST | Request deposit |
| 5 | /wallet/deposit-requests/:requestId/submit | POST | Submit for approval |
| 6 | /wallet/members/:memberId/wallet/deposit-requests | GET | List deposit requests |
| 7 | /wallet/members/:memberId/wallet/debit-requests | GET | List debit requests |
| 8 | /wallet/members/:memberId/wallet/debit-requests | POST | Create debit request |
| 9 | /wallet/admin/deposits/pending | GET | Pending deposits |
| 10 | /wallet/debit-requests/pending | GET | Pending acknowledgments |
| 11 | /wallet/debit-requests/:debitRequestId/acknowledge | POST | Acknowledge debit |
| 12 | /wallet/debit-requests/:debitRequestId/invalidate | POST | Invalidate debit |
| 13 | /wallet/admin/wallets | GET | List all wallets |
| 14 | /wallet/admin/wallets/low-balance | GET | Low balance wallets |
| 15 | /wallet/admin/wallets/:walletId | GET | Wallet details |
| 16 | /wallet/admin/wallets/:walletId/adjust | POST | Manual adjustment |
| 17 | /wallet/admin/wallets/statistics | GET | Wallet statistics |