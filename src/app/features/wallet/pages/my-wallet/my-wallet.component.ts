import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { WalletService } from '../../../../core/services/wallet.service';
import { WalletStore } from '../../../../core/state/wallet.store';
import { ToastService } from '../../../../core/services/toast.service';
// import { DepositRequestModalComponent } from '../../../components/deposit-request-modal/deposit-request-modal.component';
import { WalletBalanceCardComponent } from '../../components/wallet-balance-card/wallet-balance-card.component';
import { RecordDepositModalComponent } from '../../components/record-deposit-modal/record-deposit-modal.component';

@Component({
  selector: 'app-my-wallet',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BreadcrumbsComponent,
    // DepositRequestModalComponent,
    RecordDepositModalComponent,
    WalletBalanceCardComponent
  ],
  templateUrl: './my-wallet.component.html',
  styleUrls: ['./my-wallet.component.css']
})
export class MyWalletComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);
  private walletStore = inject(WalletStore);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State from store
  wallet = this.walletStore.wallet;
  loading = this.walletStore.loading;
  error = this.walletStore.error;

  // Local state
  showDepositModal = signal(false);

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'My Wallet', current: true }
  ];

  // Computed values from store
  isLowBalance = this.walletStore.isLowBalance;
  recommendedTopUp = this.walletStore.recommendedTopUp;
  currentBalance = this.walletStore.currentBalance;
  memberCode = this.walletStore.memberCode;
  memberId = this.walletStore.memberId;
  agentInfo = this.walletStore.agentInfo;
  pendingDepositsCount = this.walletStore.pendingDepositsCount;

  // Tab configuration
  tabs = [
    { label: 'Overview', route: '/my-wallet/overview', icon: 'home' },
    { label: 'Transactions', route: '/my-wallet/transactions', icon: 'list' },
    { label: 'Deposits', route: '/my-wallet/deposits', icon: 'deposit' }
  ];

  ngOnInit(): void {
    this.loadWallet();
  }

  ngOnDestroy(): void {
    // Clear wallet store when leaving
    this.walletStore.clearWallet();
  }

  loadWallet(): void {
    this.walletStore.setLoading(true);
    this.walletStore.setError(null);

    this.walletService.getMyWallet().subscribe({
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
  }

  openDepositModal(): void {
    this.showDepositModal.set(true);
  }

  closeDepositModal(): void {
    this.showDepositModal.set(false);
  }

  onDepositRequestCreated(): void {
    this.closeDepositModal();
    this.loadWallet();
    this.toastService.success('Deposit request submitted successfully');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
