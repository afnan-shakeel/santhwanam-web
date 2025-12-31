import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { WalletService } from '../../../core/services/wallet.service';
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Make Math available in template
  Math = Math;

  // State
  wallet = signal<WalletSummary | null>(null);
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

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'My Wallet', route: '/my-wallet' },
    { label: 'Transactions', current: true }
  ];

  // Computed
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  // Check if viewing own wallet or member wallet
  memberId = signal<string | null>(null);
  isOwnWallet = computed(() => !this.memberId());

  ngOnInit(): void {
    // Check if we have a memberId in the route (admin viewing member wallet)
    const routeMemberId = this.route.snapshot.paramMap.get('memberId');
    if (routeMemberId) {
      this.memberId.set(routeMemberId);
      this.breadcrumbs = [
        { label: 'Members', route: '/members' },
        { label: 'Wallet', route: `/members/${routeMemberId}/wallet` },
        { label: 'Transactions', current: true }
      ];
    }

    this.loadWallet();
    this.loadTransactions();
  }

  loadWallet(): void {
    const memberId = this.memberId();
    const request$ = memberId
      ? this.walletService.getWalletSummary(memberId)
      : this.walletService.getMyWallet();

    request$.subscribe({
      next: (data) => {
        this.wallet.set(data);
        // Store memberId from wallet if viewing own wallet
        if (!memberId && data.memberId) {
          this.memberId.set(data.memberId);
        }
      },
      error: (err) => console.error('Failed to load wallet:', err)
    });
  }

  loadTransactions(): void {
    this.loading.set(true);

    const memberId = this.memberId();
    if (!memberId && !this.wallet()) {
      // Need to load wallet first to get memberId
      this.walletService.getMyWallet().subscribe({
        next: (wallet) => {
          this.wallet.set(wallet);
          this.memberId.set(wallet.memberId);
          this.fetchTransactions(wallet.memberId);
        },
        error: (err) => {
          console.error('Failed to load wallet:', err);
          this.loading.set(false);
        }
      });
      return;
    }

    this.fetchTransactions(memberId || this.wallet()!.memberId);
  }

  private fetchTransactions(memberId: string): void {
    const formValue = this.filterForm.value;
    const params: TransactionQueryParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
      type: formValue.type || undefined,
      status: formValue.status || undefined,
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString() : undefined,
      endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined
    };

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
}
