import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletStore } from '../../../core/state/wallet.store';
import {
  WalletTransaction,
  WalletSummary,
  WalletTransactionType,
  WalletTransactionStatus,
  TransactionQueryParams
} from '../../../shared/models/wallet.model';
import { SelectOption } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-wallet-transactions',
  standalone: true,
  imports: [
    CommonModule,
    NgTemplateOutlet,
    ReactiveFormsModule,
    BreadcrumbsComponent,
    SelectComponent,
    PaginationComponent
  ],
  templateUrl: './wallet-transactions.component.html',
  styleUrls: ['./wallet-transactions.component.css']
})
export class WalletTransactionsComponent implements OnInit {
  private walletService = inject(WalletService);
  private walletStore = inject(WalletStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Make Math available in template
  Math = Math;

  // State
  transactions = signal<WalletTransaction[]>([]);
  loading = signal(true);
  total = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);

  // Filter form
  filterForm: FormGroup = this.fb.group({
    type: [''],
    status: [''],
    startDate: [''],
    endDate: ['']
  });

  // Select options
  typeOptions: SelectOption[] = [
    { value: '', label: 'All Types' },
    { value: 'Deposit', label: 'Deposits' },
    { value: 'Debit', label: 'Debits' },
    { value: 'Refund', label: 'Refunds' },
    { value: 'Adjustment', label: 'Adjustments' }
  ];

  statusOptions: SelectOption[] = [
    { value: '', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Reversed', label: 'Reversed' }
  ];

  // Breadcrumbs (only used in standalone mode)
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Members', route: '/members' },
    { label: 'Wallet', route: '' },
    { label: 'Transactions', current: true }
  ];

  // Computed
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  // Check if viewing own wallet (child route) or member wallet (standalone)
  memberId = signal<string | null>(null);
  isChildRoute = signal(false);

  // Get wallet from store when used as child route
  wallet = computed(() => this.isChildRoute() ? this.walletStore.wallet() : null);
  currentBalance = computed(() => this.wallet()?.currentBalance ?? 0);

  ngOnInit(): void {
    // Check if we have a memberId in the route (admin viewing member wallet)
    const routeMemberId = this.route.snapshot.paramMap.get('memberId');
    if (routeMemberId) {
      // Standalone mode - admin/agent viewing member wallet
      this.memberId.set(routeMemberId);
      this.isChildRoute.set(false);
      this.breadcrumbs = [
        { label: 'Members', route: '/members' },
        { label: 'Wallet', route: `/members/${routeMemberId}/wallet` },
        { label: 'Transactions', current: true }
      ];
      this.loadTransactions();
    } else {
      // Child route mode - member viewing own wallet
      this.isChildRoute.set(true);
      const storeWallet = this.walletStore.wallet();
      if (storeWallet?.memberId) {
        this.memberId.set(storeWallet.memberId);
        this.loadTransactions();
      } else {
        // Fallback: load wallet to get memberId
        this.walletService.getMyWallet().subscribe({
          next: (wallet) => {
            this.memberId.set(wallet.memberId);
            this.loadTransactions();
          },
          error: (err) => {
            console.error('Failed to load wallet:', err);
            this.loading.set(false);
          }
        });
      }
    }
  }

  loadTransactions(): void {
    const memberId = this.memberId();
    if (!memberId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.fetchTransactions(memberId);
  }

  private fetchTransactions(memberId: string): void {
    const formValue = this.filterForm.value;
    
    // Build params object, only including defined values
    const params: TransactionQueryParams = {
      page: this.currentPage(),
      limit: this.pageSize()
    };
    
    // Only add optional params if they have values
    if (formValue.type) {
      params.type = formValue.type;
    }
    if (formValue.status) {
      params.status = formValue.status;
    }
    if (formValue.startDate) {
      params.startDate = new Date(formValue.startDate).toISOString();
    }
    if (formValue.endDate) {
      params.endDate = new Date(formValue.endDate).toISOString();
    }

    this.walletService.getTransactions(memberId, params).subscribe({
      next: (response) => {
        this.transactions.set(response.transactions);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load transactions:', err);
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadTransactions();
  }

  clearFilters(): void {
    this.filterForm.reset({
      type: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadTransactions();
  }

  goBack(): void {
    const memberId = this.memberId();
    if (memberId && !this.isOwnWallet()) {
      this.router.navigate(['/members', memberId, 'wallet']);
    } else {
      this.router.navigate(['/my-wallet']);
    }
  }

  // Utility methods
  getTransactionIcon(type: WalletTransactionType, status: string): string {
    if (status === 'Pending') return '🕐';
    if (status === 'Failed') return '❌';
    if (status === 'Reversed') return '↩️';
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

  getStatusBadgeClass(status: WalletTransactionStatus): string {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Reversed':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  isCredit(type: WalletTransactionType): boolean {
    return type === 'Deposit' || type === 'Refund';
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
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(formValue.type || formValue.status || formValue.startDate || formValue.endDate);
  }

  getMaxShowing(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.total());
  }

  private isOwnWallet(): boolean {
    return this.isChildRoute();
  }
}
