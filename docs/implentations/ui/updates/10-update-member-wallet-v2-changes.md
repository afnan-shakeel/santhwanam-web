# Wallet UI - Changes Document

**Purpose:** This document outlines the changes required to the already-implemented member wallet screens.

**Target:** AI agent working on wallet UI implementation

**Date:** January 2025

---

## Summary of Changes

| Change | Type | Impact |
|--------|------|--------|
| 1. Consolidate member screens into tabs | **Restructure** | High |
| 2. Create shared wallet components | **Refactor** | Medium |
| 3. Unify Agent/Admin views with viewMode | **New Pattern** | Medium |
| 4. Remove wallet debit acknowledgment | **Simplification** | Low |

---

## Change 1: Member Wallet — Separate Pages → Tabbed Layout

### Current Implementation (To Be Changed)

```
/my-wallet                    → Wallet Overview (separate page)
/my-wallet/transactions       → Transaction History (separate page)
/my-wallet/deposits           → Deposit Requests (separate page)
```

Each page loads independently, balance displayed on each page separately.

### New Implementation (Required)

```
/my-wallet                    → Parent component with header + tabs
├── /my-wallet/overview       → Overview tab (child route)
├── /my-wallet/transactions   → Transactions tab (child route)
└── /my-wallet/deposits       → Deposits tab (child route)
```

Single page with persistent header showing balance, tabs for navigation.

### What to Change

#### 1.1 Create Parent Container Component

**File:** `src/app/features/wallet/pages/my-wallet/my-wallet.component.ts`

```typescript
@Component({
  selector: 'app-my-wallet',
  template: `
    <!-- Persistent Header - Always Visible -->
    <div class="wallet-page">
      <div class="wallet-header">
        <h1>My Wallet</h1>
        <span class="member-code">{{memberCode}}</span>
      </div>
      
      <!-- Balance Card - Always Visible -->
      <app-wallet-balance-card
        [balance]="wallet?.currentBalance"
        [isLowBalance]="wallet?.alerts?.isLowBalance"
        [recommendedTopUp]="wallet?.alerts?.recommendedTopUp"
        [showRequestDeposit]="true"
        (requestDeposit)="openRequestDepositModal()">
      </app-wallet-balance-card>
      
      <!-- Agent Info -->
      <div class="agent-info" *ngIf="wallet?.agent">
        <span>Your Agent: {{wallet.agent.agentName}}</span>
        <a href="tel:{{wallet.agent.phone}}">{{wallet.agent.phone}}</a>
      </div>
      
      <!-- Tab Navigation -->
      <nav class="wallet-tabs">
        <a routerLink="overview" routerLinkActive="active">Overview</a>
        <a routerLink="transactions" routerLinkActive="active">Transactions</a>
        <a routerLink="deposits" routerLinkActive="active">
          Deposits
          <span class="badge" *ngIf="pendingDepositsCount > 0">
            {{pendingDepositsCount}}
          </span>
        </a>
      </nav>
      
      <!-- Child Route Content -->
      <div class="tab-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class MyWalletComponent implements OnInit {
  wallet: WalletSummary;
  memberCode: string;
  pendingDepositsCount: number = 0;
  
  constructor(
    private walletService: WalletService,
    private modalService: ModalService
  ) {}
  
  ngOnInit() {
    this.loadWalletData();
  }
  
  loadWalletData() {
    this.walletService.getMyWallet().subscribe(data => {
      this.wallet = data;
      this.memberCode = data.memberCode;
      this.pendingDepositsCount = data.pendingDepositRequests?.length || 0;
    });
  }
  
  openRequestDepositModal() {
    this.modalService.open(RequestDepositModalComponent, {
      data: { agent: this.wallet.agent }
    }).afterClosed().subscribe(result => {
      if (result) this.loadWalletData();
    });
  }
}
```

#### 1.2 Update Route Configuration

**File:** `src/app/features/wallet/wallet-routing.module.ts`

```typescript
// BEFORE (Current)
const routes: Routes = [
  { path: 'my-wallet', component: WalletOverviewComponent },
  { path: 'my-wallet/transactions', component: WalletTransactionsComponent },
  { path: 'my-wallet/deposits', component: WalletDepositsComponent },
];

// AFTER (New)
const routes: Routes = [
  {
    path: 'my-wallet',
    component: MyWalletComponent,  // Parent container
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: WalletOverviewTabComponent },
      { path: 'transactions', component: WalletTransactionsTabComponent },
      { path: 'deposits', component: WalletDepositsTabComponent }
    ]
  }
];
```

#### 1.3 Refactor Existing Components into Tab Components

**Rename/Refactor:**

| Current | New | Changes |
|---------|-----|---------|
| `WalletOverviewComponent` | `WalletOverviewTabComponent` | Remove balance card (moved to parent), keep stats + recent transactions |
| `WalletTransactionsComponent` | `WalletTransactionsTabComponent` | Remove header, keep filters + list |
| `WalletDepositsComponent` | `WalletDepositsTabComponent` | Remove header, keep list |

#### 1.4 Overview Tab — Remove Balance, Keep Stats

**File:** `wallet-overview-tab.component.ts`

```typescript
// BEFORE: Had its own balance card
// AFTER: Only shows quick stats and recent transactions

@Component({
  template: `
    <!-- Quick Stats -->
    <app-wallet-stats [stats]="stats"></app-wallet-stats>
    
    <!-- Recent Transactions (Last 5) -->
    <div class="recent-transactions">
      <div class="section-header">
        <h3>Recent Transactions</h3>
        <a routerLink="../transactions">View All →</a>
      </div>
      <app-wallet-transaction-list 
        [transactions]="recentTransactions"
        [compact]="true">
      </app-wallet-transaction-list>
    </div>
    
    <!-- How Wallet Works -->
    <div class="info-section">
      <h4>ℹ️ How Wallet Works</h4>
      <ul>
        <li>Your wallet is used to automatically pay contributions</li>
        <li>Contact your agent to add money to your wallet</li>
      </ul>
    </div>
  `
})
export class WalletOverviewTabComponent implements OnInit {
  stats: WalletStats;
  recentTransactions: WalletTransaction[];
  
  constructor(private walletService: WalletService) {}
  
  ngOnInit() {
    // Can get data from parent via service or load independently
    this.walletService.getMyWallet().subscribe(data => {
      this.stats = data.stats;
      this.recentTransactions = data.recentTransactions?.slice(0, 5);
    });
  }
}
```

#### 1.5 Transactions Tab — Remove Header

**File:** `wallet-transactions-tab.component.ts`

```typescript
// BEFORE: Had "Transaction History" header with balance
// AFTER: Just filters and list (header is in parent)

@Component({
  template: `
    <!-- Filters -->
    <div class="filters">
      <select [(ngModel)]="filters.type">
        <option value="all">All Types</option>
        <option value="Deposit">Deposits Only</option>
        <option value="Debit">Debits Only</option>
      </select>
      <input type="date" [(ngModel)]="filters.fromDate">
      <input type="date" [(ngModel)]="filters.toDate">
      <button (click)="applyFilters()">Apply</button>
    </div>
    
    <!-- Export -->
    <div class="export-actions">
      <button (click)="downloadPDF()">Download PDF</button>
      <button (click)="downloadExcel()">Download Excel</button>
    </div>
    
    <!-- Transaction List -->
    <app-wallet-transaction-list 
      [transactions]="transactions"
      [loading]="loading">
    </app-wallet-transaction-list>
    
    <!-- Pagination -->
    <app-pagination 
      [total]="total" 
      [page]="page" 
      [limit]="limit"
      (pageChange)="onPageChange($event)">
    </app-pagination>
  `
})
export class WalletTransactionsTabComponent { ... }
```

---

## Change 2: Create Shared Presentational Components

### Components to Extract

Create these reusable components in `src/app/features/wallet/components/`:

#### 2.1 WalletBalanceCardComponent

**File:** `components/wallet-balance-card/wallet-balance-card.component.ts`

```typescript
@Component({
  selector: 'app-wallet-balance-card',
  template: `
    <div class="balance-card">
      <div class="balance-label">Current Balance</div>
      <div class="balance-amount">₹ {{balance | number:'1.2-2'}}</div>
      
      <div class="low-balance-alert" *ngIf="isLowBalance">
        <span class="icon">⚠️</span>
        <span>Low balance - Add ₹{{recommendedTopUp}} recommended</span>
      </div>
      
      <button *ngIf="showRequestDeposit" 
              class="btn btn-primary"
              (click)="requestDeposit.emit()">
        Request Deposit
      </button>
      
      <button *ngIf="showRecordDeposit"
              class="btn btn-primary"
              (click)="recordDeposit.emit()">
        Record Deposit
      </button>
      
      <button *ngIf="showAdjustment"
              class="btn btn-secondary"
              (click)="adjust.emit()">
        Manual Adjustment
      </button>
    </div>
  `
})
export class WalletBalanceCardComponent {
  @Input() balance: number;
  @Input() isLowBalance: boolean = false;
  @Input() recommendedTopUp: number;
  
  // Action buttons - show based on context
  @Input() showRequestDeposit: boolean = false;  // Member
  @Input() showRecordDeposit: boolean = false;   // Agent
  @Input() showAdjustment: boolean = false;      // Admin
  
  @Output() requestDeposit = new EventEmitter<void>();
  @Output() recordDeposit = new EventEmitter<void>();
  @Output() adjust = new EventEmitter<void>();
}
```

#### 2.2 WalletStatsComponent

**File:** `components/wallet-stats/wallet-stats.component.ts`

```typescript
@Component({
  selector: 'app-wallet-stats',
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Deposits</div>
        <div class="stat-value positive">₹ {{stats?.totalDeposits | number}}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Debits</div>
        <div class="stat-value negative">₹ {{stats?.totalDebits | number}}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending Deposits</div>
        <div class="stat-value pending">₹ {{stats?.pendingDeposits | number}}</div>
      </div>
    </div>
  `
})
export class WalletStatsComponent {
  @Input() stats: WalletStats;
}
```

#### 2.3 WalletTransactionListComponent

**File:** `components/wallet-transaction-list/wallet-transaction-list.component.ts`

```typescript
@Component({
  selector: 'app-wallet-transaction-list',
  template: `
    <div class="transaction-list" [class.compact]="compact">
      <div *ngIf="loading" class="loading">Loading...</div>
      
      <div *ngIf="!loading && transactions?.length === 0" class="empty">
        No transactions found
      </div>
      
      <div *ngFor="let txn of transactions" class="transaction-item">
        <div class="txn-icon">
          <span *ngIf="txn.transactionType === 'Deposit'">✓</span>
          <span *ngIf="txn.transactionType === 'Debit'">↓</span>
        </div>
        <div class="txn-details">
          <div class="txn-description">{{txn.description}}</div>
          <div class="txn-meta">
            {{txn.createdAt | date:'MMM d, y h:mm a'}}
            <span *ngIf="txn.reference"> • {{txn.reference}}</span>
          </div>
        </div>
        <div class="txn-amount" [class.positive]="txn.transactionType === 'Deposit'"
                                [class.negative]="txn.transactionType === 'Debit'">
          {{txn.transactionType === 'Deposit' ? '+' : '-'}} ₹{{txn.amount | number}}
        </div>
        <div class="txn-balance" *ngIf="!compact">
          Balance: ₹{{txn.balanceAfter | number}}
        </div>
      </div>
    </div>
  `
})
export class WalletTransactionListComponent {
  @Input() transactions: WalletTransaction[];
  @Input() loading: boolean = false;
  @Input() compact: boolean = false;  // For overview tab (less detail)
}
```

#### 2.4 MemberInfoCardComponent (For Agent/Admin Views)

**File:** `components/member-info-card/member-info-card.component.ts`

```typescript
@Component({
  selector: 'app-member-info-card',
  template: `
    <div class="member-info-card">
      <div class="avatar">👤</div>
      <div class="info">
        <div class="name">{{member?.memberName}}</div>
        <div class="meta">
          {{member?.memberCode}} • {{member?.tier}}
          <span *ngIf="member?.phone"> • 📞 {{member?.phone}}</span>
        </div>
        <div class="meta" *ngIf="showAgent && member?.agent">
          Agent: {{member?.agent?.agentName}}
        </div>
        <div class="meta" *ngIf="showUnit && member?.unit">
          Unit: {{member?.unit?.unitName}}
        </div>
      </div>
      <a *ngIf="showProfileLink" 
         [routerLink]="profileLink" 
         class="profile-link">
        View Full Profile →
      </a>
    </div>
  `
})
export class MemberInfoCardComponent {
  @Input() member: MemberInfo;
  @Input() showAgent: boolean = false;
  @Input() showUnit: boolean = false;
  @Input() showProfileLink: boolean = true;
  @Input() profileLink: string;
}
```

---

## Change 3: Agent/Admin View — Unified with ViewMode

### New Component: MemberWalletComponent

This component serves both Agent and Admin views, using `viewMode` to control differences.

**File:** `src/app/features/wallet/pages/member-wallet/member-wallet.component.ts`

```typescript
@Component({
  selector: 'app-member-wallet',
  template: `
    <div class="wallet-page member-wallet">
      <!-- Back Navigation -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">← Back</button>
        <h1>{{viewMode === 'agent' ? 'Member Wallet' : 'Wallet Details'}}</h1>
      </div>
      
      <!-- Member Info Card -->
      <app-member-info-card
        [member]="member"
        [showAgent]="viewMode === 'admin'"
        [showUnit]="viewMode === 'admin'"
        [profileLink]="getProfileLink()">
      </app-member-info-card>
      
      <!-- Balance Card with Role-Specific Actions -->
      <app-wallet-balance-card
        [balance]="wallet?.currentBalance"
        [isLowBalance]="wallet?.alerts?.isLowBalance"
        [recommendedTopUp]="wallet?.alerts?.recommendedTopUp"
        [showRecordDeposit]="viewMode === 'agent'"
        [showAdjustment]="viewMode === 'admin'"
        (recordDeposit)="openRecordDepositModal()"
        (adjust)="openAdjustmentModal()">
      </app-wallet-balance-card>
      
      <!-- Agent Only: Pending Cash Collections -->
      <div *ngIf="viewMode === 'agent' && pendingCollections?.length > 0" 
           class="pending-collections">
        <h3>⚠️ Pending Cash Collection</h3>
        <div *ngFor="let c of pendingCollections" class="collection-item">
          <span>{{c.cycleNumber}} • ₹{{c.expectedAmount}} • Due: {{c.deadline | date}}</span>
          <a [routerLink]="['/agent/contributions', c.contributionId, 'collect']">
            Collect →
          </a>
        </div>
      </div>
      
      <!-- Tab Navigation -->
      <nav class="wallet-tabs">
        <a routerLink="overview" routerLinkActive="active">Overview</a>
        <a routerLink="transactions" routerLinkActive="active">Transactions</a>
        <a routerLink="deposits" routerLinkActive="active">
          {{viewMode === 'agent' ? 'My Deposits' : 'All Deposits'}}
        </a>
      </nav>
      
      <!-- Child Route Content -->
      <div class="tab-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class MemberWalletComponent implements OnInit {
  viewMode: 'agent' | 'admin';
  memberId: string;
  walletId: string;
  
  wallet: WalletSummary;
  member: MemberInfo;
  pendingCollections: PendingContribution[];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private walletService: WalletService,
    private modalService: ModalService
  ) {}
  
  ngOnInit() {
    // Get viewMode from route data
    this.viewMode = this.route.snapshot.data['viewMode'];
    
    // Get ID from route params
    this.memberId = this.route.snapshot.params['memberId'];
    this.walletId = this.route.snapshot.params['walletId'];
    
    this.loadData();
  }
  
  loadData() {
    if (this.viewMode === 'agent') {
      this.walletService.getMemberWallet(this.memberId).subscribe(data => {
        this.wallet = data;
        this.member = data.member;
        this.pendingCollections = data.pendingCashContributions;
      });
    } else {
      this.walletService.getAdminWalletDetails(this.walletId).subscribe(data => {
        this.wallet = data;
        this.member = data.member;
      });
    }
  }
  
  getProfileLink(): string {
    if (this.viewMode === 'agent') {
      return `/agent/members/${this.memberId}/profile`;
    }
    return `/admin/members/${this.member?.memberId}/profile`;
  }
  
  goBack() {
    if (this.viewMode === 'agent') {
      this.router.navigate(['/agent/members', this.memberId]);
    } else {
      this.router.navigate(['/admin/wallets']);
    }
  }
  
  openRecordDepositModal() { ... }
  openAdjustmentModal() { ... }
}
```

### Route Configuration for Agent/Admin

**File:** `wallet-routing.module.ts`

```typescript
const routes: Routes = [
  // Member's own wallet (unchanged path, new structure)
  {
    path: 'my-wallet',
    component: MyWalletComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: WalletOverviewTabComponent },
      { path: 'transactions', component: WalletTransactionsTabComponent },
      { path: 'deposits', component: WalletDepositsTabComponent }
    ]
  },
  
  // Agent viewing member's wallet
  {
    path: 'agent/members/:memberId/wallet',
    component: MemberWalletComponent,
    data: { viewMode: 'agent' },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: MemberWalletOverviewTabComponent },
      { path: 'transactions', component: WalletTransactionsTabComponent },  // Shared
      { path: 'deposits', component: AgentDepositsTabComponent }
    ]
  },
  
  // Admin viewing wallet
  {
    path: 'admin/wallets/:walletId',
    component: MemberWalletComponent,
    data: { viewMode: 'admin' },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: MemberWalletOverviewTabComponent },
      { path: 'transactions', component: AdminTransactionsTabComponent },
      { path: 'deposits', component: AdminDepositsTabComponent }
    ]
  }
];
```

---

## Change 4: Remove Wallet Debit Acknowledgment

### What to Remove

Since wallet debits are now auto-processed, remove any UI related to:

1. **Debit acknowledgment screens** — Delete if implemented
2. **"Pending Acknowledgment" status** — Remove from enums/displays
3. **"WalletDebitRequested" contribution status** — Remove from enums/displays
4. **Agent pending acknowledgments dashboard** — Not needed

### Files to Check/Update

```
- Remove: pending-acknowledgments.component.ts (if exists)
- Update: contribution-status.enum.ts (remove WalletDebitRequested)
- Update: debit-request-status.enum.ts (remove PendingAcknowledgment, Acknowledged)
- Update: Any UI showing debit request status badges
```

### New Contribution Statuses

```typescript
enum ContributionStatus {
  Pending = 'Pending',       // Needs cash collection (wallet was insufficient)
  Collected = 'Collected',   // Payment received (auto-debit or cash)
  Missed = 'Missed',         // Deadline passed
  Exempted = 'Exempted'      // Member exempted
}

// REMOVED: WalletDebitRequested
```

### New Debit Request Statuses

```typescript
enum WalletDebitRequestStatus {
  Completed = 'Completed',     // Auto-processed successfully
  Failed = 'Failed',           // Insufficient balance at processing
  Invalidated = 'Invalidated'  // Member paid cash instead
}

// REMOVED: PendingAcknowledgment, Acknowledged
```

---

## File Structure Summary

### New Files to Create

```
src/app/features/wallet/
├── components/
│   ├── wallet-balance-card/
│   │   ├── wallet-balance-card.component.ts
│   │   ├── wallet-balance-card.component.html
│   │   └── wallet-balance-card.component.scss
│   ├── wallet-stats/
│   │   └── ...
│   ├── wallet-transaction-list/
│   │   └── ...
│   └── member-info-card/
│       └── ...
│
├── pages/
│   ├── my-wallet/
│   │   ├── my-wallet.component.ts          # NEW: Parent container
│   │   ├── overview-tab/                    # REFACTORED from WalletOverviewComponent
│   │   ├── transactions-tab/                # REFACTORED
│   │   └── deposits-tab/                    # REFACTORED
│   │
│   └── member-wallet/
│       ├── member-wallet.component.ts       # NEW: Agent/Admin container
│       ├── overview-tab/
│       ├── transactions-tab/
│       └── deposits-tab/
```

### Files to Refactor

| Current | Action | New Location |
|---------|--------|--------------|
| `wallet-overview.component.ts` | Refactor → Tab | `my-wallet/overview-tab/` |
| `wallet-transactions.component.ts` | Refactor → Tab | `my-wallet/transactions-tab/` |
| `wallet-deposits.component.ts` | Refactor → Tab | `my-wallet/deposits-tab/` |

### Files to Delete

| File | Reason |
|------|--------|
| `pending-acknowledgments.component.ts` | Auto-debit, no longer needed |
| `acknowledge-debit-modal.component.ts` | Auto-debit, no longer needed |

---

## Testing Checklist

After implementing changes, verify:

- [ ] `/my-wallet` redirects to `/my-wallet/overview`
- [ ] Balance card stays visible when switching tabs
- [ ] Tab navigation updates URL correctly
- [ ] Browser back/forward works with tabs
- [ ] Deep linking to `/my-wallet/transactions` works
- [ ] Request Deposit modal opens from parent
- [ ] Pending deposits badge shows correct count
- [ ] Agent view shows member info card
- [ ] Agent view shows pending cash collections
- [ ] Admin view shows adjustment button
- [ ] Mobile: Tabs are swipeable (if implemented)

---

## Questions for Implementation

1. **Data Loading Strategy:** 
   - Load all data in parent and pass to children?
   - Or let each tab load its own data?
   - Recommendation: Load summary in parent, let transactions/deposits tabs paginate independently

2. **Tab State Persistence:**
   - Should filters persist when switching tabs?
   - Recommendation: Reset filters on tab switch (simpler)

3. **Mobile Tab Behavior:**
   - Swipeable tabs?
   - Or just clickable tab buttons?
   - Recommendation: Start with clickable, add swipe later if needed