import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { WalletService } from '../../../../core/services/wallet.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  WalletWithMember,
  WalletDepositRequest,
  WalletStatistics
} from '../../../../shared/models/wallet.model';

@Component({
  selector: 'app-wallet-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent
  ],
  templateUrl: './wallet-dashboard.component.html',
  styleUrls: ['./wallet-dashboard.component.css']
})
export class WalletDashboardComponent implements OnInit {
  private walletService = inject(WalletService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Statistics
  statistics = signal<WalletStatistics | null>(null);
  statsLoading = signal(true);

  // Pending Deposits Preview (top 5)
  pendingDeposits = signal<WalletDepositRequest[]>([]);
  pendingLoading = signal(true);
  pendingTotal = signal(0);

  // Low Balance Preview (top 5)
  lowBalanceWallets = signal<WalletWithMember[]>([]);
  lowBalanceLoading = signal(true);
  lowBalanceTotal = signal(0);

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Wallet Management', current: true }
  ];

  // Computed
  pendingTotalAmount = computed(() => {
    return this.pendingDeposits().reduce((sum, d) => sum + d.amount, 0);
  });

  ngOnInit(): void {
    this.loadStatistics();
    this.loadPendingDepositsPreview();
    this.loadLowBalancePreview();
  }

  loadStatistics(): void {
    this.statsLoading.set(true);
    this.walletService.getWalletStatistics().subscribe({
      next: (stats) => {
        this.statistics.set(stats);
        this.statsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load statistics:', err);
        this.statsLoading.set(false);
      }
    });
  }

  loadPendingDepositsPreview(): void {
    this.pendingLoading.set(true);
    this.walletService.getAdminPendingDeposits({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        this.pendingDeposits.set(response.requests);
        this.pendingTotal.set(response.total);
        this.pendingLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pending deposits:', err);
        this.pendingLoading.set(false);
      }
    });
  }

  loadLowBalancePreview(): void {
    this.lowBalanceLoading.set(true);
    this.walletService.getLowBalanceWallets({ page: 1, limit: 5, threshold: 200 }).subscribe({
      next: (response) => {
        this.lowBalanceWallets.set(response.wallets);
        this.lowBalanceTotal.set(response.total);
        this.lowBalanceLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load low balance wallets:', err);
        this.lowBalanceLoading.set(false);
      }
    });
  }

  // Navigation
  navigateToPendingDeposits(): void {
    this.router.navigate(['/admin/wallets/pending-deposits']);
  }

  navigateToLowBalance(): void {
    this.router.navigate(['/admin/wallets/low-balance']);
  }

  navigateToAllWallets(): void {
    this.router.navigate(['/admin/wallets/list']);
  }

  navigateToReports(): void {
    this.toastService.info('Reports feature coming soon');
  }

  reviewApproval(approvalRequestId: string | null): void {
    if (approvalRequestId) {
      this.router.navigate(['/approvals/my-approvals', approvalRequestId]);
    } else {
      this.toastService.warning('No approval request found for this deposit');
    }
  }

  viewWallet(walletId: string): void {
    this.router.navigate(['/admin/wallets', walletId]);
  }

  // Formatting
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
