import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { WalletService } from '../../../core/services/wallet.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  WalletWithMember,
  WalletDepositRequest,
  WalletStatistics,
  DepositRequestStatus
} from '../../../shared/models/wallet.model';
import { WalletDetailsModalComponent } from './wallet-details-modal/wallet-details-modal.component';

type TabType = 'pending' | 'all' | 'low-balance';

@Component({
  selector: 'app-wallet-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbsComponent,
    PaginationComponent,
    WalletDetailsModalComponent
  ],
  templateUrl: './wallet-management.component.html',
  styleUrls: ['./wallet-management.component.css']
})
export class WalletManagementComponent implements OnInit {
  private walletService = inject(WalletService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Tab state
  activeTab = signal<TabType>('pending');

  // Statistics
  statistics = signal<WalletStatistics | null>(null);

  // Pending Deposits
  pendingDeposits = signal<WalletDepositRequest[]>([]);
  pendingLoading = signal(false);
  pendingTotal = signal(0);
  pendingPage = signal(1);

  // All Wallets
  allWallets = signal<WalletWithMember[]>([]);
  walletsLoading = signal(false);
  walletsTotal = signal(0);
  walletsPage = signal(1);
  searchQuery = signal('');

  // Low Balance Wallets
  lowBalanceWallets = signal<WalletWithMember[]>([]);
  lowBalanceLoading = signal(false);
  lowBalanceTotal = signal(0);
  lowBalancePage = signal(1);

  // Modal
  selectedWallet = signal<WalletWithMember | null>(null);
  showWalletDetails = signal(false);

  // Search form
  searchForm: FormGroup = this.fb.group({
    search: ['']
  });

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Wallet Management', current: true }
  ];

  pageSize = 10;

  // Computed
  pendingTotalPages = computed(() => Math.ceil(this.pendingTotal() / this.pageSize));
  walletsTotalPages = computed(() => Math.ceil(this.walletsTotal() / this.pageSize));
  lowBalanceTotalPages = computed(() => Math.ceil(this.lowBalanceTotal() / this.pageSize));

  ngOnInit(): void {
    this.loadStatistics();
    this.loadPendingDeposits();
  }

  loadStatistics(): void {
    this.walletService.getWalletStatistics().subscribe({
      next: (stats) => this.statistics.set(stats),
      error: (err) => console.error('Failed to load statistics:', err)
    });
  }

  loadPendingDeposits(): void {
    this.pendingLoading.set(true);
    this.walletService.getAdminPendingDeposits({
      page: this.pendingPage(),
      limit: this.pageSize
    }).subscribe({
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

  loadAllWallets(): void {
    this.walletsLoading.set(true);
    this.walletService.getAdminWallets({
      page: this.walletsPage(),
      limit: this.pageSize,
      search: this.searchQuery() || undefined
    }).subscribe({
      next: (response) => {
        this.allWallets.set(response.wallets);
        this.walletsTotal.set(response.total);
        this.walletsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load wallets:', err);
        this.walletsLoading.set(false);
      }
    });
  }

  loadLowBalanceWallets(): void {
    this.lowBalanceLoading.set(true);
    this.walletService.getLowBalanceWallets({
      page: this.lowBalancePage(),
      limit: this.pageSize,
      threshold: 200
    }).subscribe({
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

  onTabChange(tab: TabType): void {
    this.activeTab.set(tab);
    switch (tab) {
      case 'pending':
        this.loadPendingDeposits();
        break;
      case 'all':
        this.loadAllWallets();
        break;
      case 'low-balance':
        this.loadLowBalanceWallets();
        break;
    }
  }

  onSearch(): void {
    this.searchQuery.set(this.searchForm.value.search || '');
    this.walletsPage.set(1);
    this.loadAllWallets();
  }

  onPendingPageChange(page: number): void {
    this.pendingPage.set(page);
    this.loadPendingDeposits();
  }

  onWalletsPageChange(page: number): void {
    this.walletsPage.set(page);
    this.loadAllWallets();
  }

  onLowBalancePageChange(page: number): void {
    this.lowBalancePage.set(page);
    this.loadLowBalanceWallets();
  }

  viewWalletDetails(wallet: WalletWithMember): void {
    this.selectedWallet.set(wallet);
    this.showWalletDetails.set(true);
  }

  closeWalletDetails(): void {
    this.showWalletDetails.set(false);
    this.selectedWallet.set(null);
  }

  viewMemberWallet(memberId: string): void {
    this.router.navigate(['/members', memberId, 'wallet']);
  }

  viewAdminWallet(walletId: string): void {
    this.router.navigate(['/admin/wallets', walletId]);
  }

  reviewApproval(approvalRequestId: string | null): void {
    if (approvalRequestId) {
      this.router.navigate(['/approvals/my-approvals', approvalRequestId]);
    } else {
      this.toastService.warning('No approval request found for this deposit');
    }
  }

  getStatusBadgeClass(status: DepositRequestStatus): string {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'PendingApproval':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
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

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return this.formatDate(dateString);
  }
}
