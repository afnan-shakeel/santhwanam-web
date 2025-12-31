import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { WalletService } from '../../../core/services/wallet.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  WalletSummary,
  WalletTransaction,
  WalletTransactionType
} from '../../../shared/models/wallet.model';
import { DepositRequestModalComponent } from './deposit-request-modal/deposit-request-modal.component';

@Component({
  selector: 'app-my-wallet',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    DepositRequestModalComponent
  ],
  templateUrl: './my-wallet.component.html',
  styleUrls: ['./my-wallet.component.css']
})
export class MyWalletComponent implements OnInit {
  private walletService = inject(WalletService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  wallet = signal<WalletSummary | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showDepositModal = signal(false);

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'My Wallet', current: true }
  ];

  // Computed values
  isLowBalance = computed(() => {
    const w = this.wallet();
    return w ? w.alerts?.isLowBalance ?? w.currentBalance < 200 : false;
  });

  recommendedTopUp = computed(() => {
    const w = this.wallet();
    return w?.alerts?.recommendedTopUp ?? 500;
  });

  ngOnInit(): void {
    this.loadWallet();
  }

  loadWallet(): void {
    this.loading.set(true);
    this.error.set(null);

    this.walletService.getMyWallet().subscribe({
      next: (data) => {
        this.wallet.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load wallet:', err);
        this.error.set('Failed to load wallet. Please try again.');
        this.loading.set(false);
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

  viewAllTransactions(): void {
    this.router.navigate(['/my-wallet/transactions']);
  }

  // Helper methods for template
  getTransactionIcon(type: WalletTransactionType, status: string): string {
    if (status === 'Pending') return '🕐';
    switch (type) {
      case 'Deposit': return '✅';
      case 'Debit': return '↓';
      case 'Refund': return '↩️';
      case 'Adjustment': return '⚙️';
      default: return '•';
    }
  }

  getTransactionLabel(type: WalletTransactionType): string {
    switch (type) {
      case 'Deposit': return 'Deposit';
      case 'Debit': return 'Contribution Deducted';
      case 'Refund': return 'Refund';
      case 'Adjustment': return 'Adjustment';
      default: return type;
    }
  }

  isCredit(type: WalletTransactionType): boolean {
    return type === 'Deposit' || type === 'Refund' ||
      (type === 'Adjustment' && true); // For positive adjustments
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
