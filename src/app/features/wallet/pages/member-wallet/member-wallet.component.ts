import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { WalletService } from '../../../../core/services/wallet.service';
import { WalletStore } from '../../../../core/state/wallet.store';
import { ToastService } from '../../../../core/services/toast.service';
import { WalletBalanceCardComponent } from '../../components/wallet-balance-card/wallet-balance-card.component';
import { MemberInfoCardComponent } from '../../../members/components/member-info-card/member-info-card.component';
import { RecordDepositModalComponent } from '../../components/record-deposit-modal/record-deposit-modal.component';
import { AdjustmentModalComponent } from '../../components/adjustment-modal/adjustment-modal.component';
import { WalletSummary, WalletWithMember } from '../../../../shared/models/wallet.model';
import { AccessService } from '../../../../core/services/access.service';


@Component({
  selector: 'app-member-wallet',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BreadcrumbsComponent,
    WalletBalanceCardComponent,
    MemberInfoCardComponent,
    RecordDepositModalComponent,
    AdjustmentModalComponent
  ],
  templateUrl: './member-wallet.component.html',
  styleUrls: ['./member-wallet.component.css']
})
export class MemberWalletComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);
  private walletStore = inject(WalletStore);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private accessService = inject(AccessService);

  // View mode from route data
  viewMode = this.accessService.viewMode

  // Route params
  memberId = signal<string | null>(null);
  walletId = signal<string | null>(null);

  // State from store
  wallet = this.walletStore.wallet;
  loading = this.walletStore.loading;
  error = this.walletStore.error;

  // Extended wallet data for admin view (includes member info)
  walletWithMember = signal<WalletWithMember | null>(null);

  // Modal states
  showRecordDepositModal = signal(false);
  showAdjustmentModal = signal(false);

  // Computed values from store
  isLowBalance = this.walletStore.isLowBalance;
  recommendedTopUp = this.walletStore.recommendedTopUp;
  currentBalance = this.walletStore.currentBalance;
  memberCode = this.walletStore.memberCode;
  memberName = this.walletStore.memberName;
  agentInfo = this.walletStore.agentInfo;
  pendingDepositsCount = this.walletStore.pendingDepositsCount;

  // Computed: Determine if current view is agent or admin
  isAgentView = computed(() => this.viewMode() === 'agent');
  isAdminView = computed(() => this.viewMode() === 'admin');

  // Computed: Base route for tabs
  baseRoute = computed(() => {
    if (this.isAgentView()) {
      return `/agents/members/${this.memberId()}/wallet`;
    }
    return `/admin/wallets/${this.walletId()}`;
  });

  // Tab configuration - computed based on view mode
  tabs = computed(() => [
    { label: 'Overview', path: 'overview', icon: 'home' },
    { label: 'Transactions', path: 'transactions', icon: 'list' },
    { label: 'Deposits', path: 'deposits', icon: 'deposit' }
  ]);

  // Breadcrumbs - computed based on view mode
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    if (this.isAgentView()) {
      return [
        { label: 'Members', route: '/members' },
        { label: this.memberName() || 'Member', route: `/members/${this.memberId()}/profile` },
        { label: 'Wallet', current: true }
      ];
    }
    return [
      { label: 'Wallet Management', route: '/wallet/admin' },
      { label: this.memberName() || 'Wallet', current: true }
    ];
  });

  // Member info for member info card
  memberInfo = computed(() => {
    const w = this.wallet();
    const wm = this.walletWithMember();
    if (wm?.member) {
      return {
        memberId: wm.member.memberId,
        memberCode: wm.member.memberCode,
        firstName: wm.member.firstName,
        lastName: wm.member.lastName
      };
    }
    if (w && w.memberCode) {
      return {
        memberId: w.memberId,
        memberCode: w.memberCode,
        firstName: w.memberName?.split(' ')[0] || '',
        lastName: w.memberName?.split(' ').slice(1).join(' ') || ''
      };
    }
    return null;
  });

  ngOnInit(): void {
    // (depracted logic) Get view mode from route data 


    // Get memberId or walletId from route
    const mId = this.route.snapshot.paramMap.get('memberId');
    const wId = this.route.snapshot.paramMap.get('walletId');

    if (mId) {
      this.memberId.set(mId);
    }
    if (wId) {
      this.walletId.set(wId);
    }

    this.loadWallet();
  }

  ngOnDestroy(): void {
    this.walletStore.clearWallet();
  }

  loadWallet(): void {
    this.walletStore.setLoading(true);
    this.walletStore.setError(null);

    if (this.isAdminView() && this.walletId()) {
      // Admin view: Get wallet by ID
      this.walletService.getWalletById(this.walletId()!).subscribe({
        next: (data) => {
          this.walletWithMember.set(data);
          // Convert WalletWithMember to WalletSummary for store
          const summary: WalletSummary = {
            walletId: data.walletId,
            memberId: data.memberId,
            memberCode: data.member?.memberCode,
            memberName: `${data.member?.firstName} ${data.member?.lastName}`,
            currentBalance: data.currentBalance,
            recentTransactions: []
          };
          this.walletStore.setWallet(summary);
          this.walletStore.setLoading(false);
        },
        error: (err) => {
          console.error('Failed to load wallet:', err);
          this.walletStore.setError('Failed to load wallet. Please try again.');
          this.walletStore.setLoading(false);
        }
      });
    } else if (this.memberId()) {
      // Agent view: Get wallet by member ID
      this.walletService.getWalletSummary(this.memberId()!).subscribe({
        next: (data) => {
          this.walletStore.setWallet(data);
          this.walletStore.setLoading(false);
        },
        error: (err) => {
          console.error('Failed to load wallet:', err);
          this.walletStore.setError('Failed to load wallet. Please try again.');
          this.walletStore.setLoading(false);
        }
      });
    } else {
      this.walletStore.setError('No member ID or wallet ID provided.');
      this.walletStore.setLoading(false);
    }
  }

  // Modal handlers
  openRecordDepositModal(): void {
    this.showRecordDepositModal.set(true);
  }

  closeRecordDepositModal(): void {
    this.showRecordDepositModal.set(false);
  }

  onDepositRecorded(): void {
    this.closeRecordDepositModal();
    this.loadWallet();
    this.toastService.success('Deposit recorded successfully');
  }

  openAdjustmentModal(): void {
    this.showAdjustmentModal.set(true);
  }

  closeAdjustmentModal(): void {
    this.showAdjustmentModal.set(false);
  }

  onAdjustmentCompleted(): void {
    this.closeAdjustmentModal();
    this.loadWallet();
    this.toastService.success('Wallet adjusted successfully');
  }

  // Navigation
  goBack(): void {
    if (this.isAgentView()) {
      this.router.navigate(['/members', this.memberId(), 'profile']);
    } else {
      this.router.navigate(['/wallet/admin']);
    }
  }

  getTabRoute(tabPath: string): string {
    return `${this.baseRoute()}/${tabPath}`;
  }

  // Utility
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
