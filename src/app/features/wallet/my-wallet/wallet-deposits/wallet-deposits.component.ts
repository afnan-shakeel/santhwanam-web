import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { WalletStore } from '../../../../core/state/wallet.store';
import { WalletService } from '../../../../core/services/wallet.service';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import {
  WalletDepositRequest,
  DepositRequestStatus,
  DepositRequestQueryParams
} from '../../../../shared/models/wallet.model';

@Component({
  selector: 'app-wallet-deposits',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectComponent
  ],
  templateUrl: './wallet-deposits.component.html',
  styleUrls: ['./wallet-deposits.component.css']
})
export class WalletDepositsComponent implements OnInit {
  private walletStore = inject(WalletStore);
  private walletService = inject(WalletService);
  private fb = inject(FormBuilder);

  // State
  deposits = signal<WalletDepositRequest[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  hasMore = signal(false);

  // Filter form
  filterForm: FormGroup = this.fb.group({
    status: ['']
  });

  // Status filter options
  statusOptions: SelectOption[] = [
    { value: '', label: 'All Status' },
    { value: 'PendingApproval', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  // Grouped deposits
  pendingDeposits = computed(() =>
    this.deposits().filter(d => d.requestStatus === 'PendingApproval' || d.requestStatus === 'Draft')
  );

  completedDeposits = computed(() =>
    this.deposits().filter(d => d.requestStatus === 'Approved' || d.requestStatus === 'Rejected')
  );

  // Get memberId from store
  memberId = this.walletStore.memberId;

  ngOnInit(): void {
    this.loadDeposits();
  }

  loadDeposits(): void {
    const memberId = this.memberId();
    if (!memberId) {
      this.error.set('Unable to load deposits. Please try again.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.filterForm.value;
    
    // Build params object, only including defined values
    const params: DepositRequestQueryParams = {
      page: this.currentPage(),
      limit: this.pageSize()
    };
    
    // Only add status if it has a value
    if (formValue.status) {
      params.status = formValue.status;
    }

    this.walletService.getDepositRequests(memberId, params).subscribe({
      next: (response) => {
        if (this.currentPage() === 1) {
          this.deposits.set(response.requests);
        } else {
          this.deposits.update(current => [...current, ...response.requests]);
        }
        this.total.set(response.total);
        this.hasMore.set(this.deposits().length < response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load deposit requests:', err);
        this.error.set('Failed to load deposit requests. Please try again.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadDeposits();
  }

  loadMore(): void {
    this.currentPage.update(p => p + 1);
    this.loadDeposits();
  }

  getStatusBadgeClass(status: DepositRequestStatus): string {
    switch (status) {
      case 'PendingApproval':
      case 'Draft':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getStatusLabel(status: DepositRequestStatus): string {
    switch (status) {
      case 'Draft':
        return 'Draft';
      case 'PendingApproval':
        return 'Pending Approval';
      case 'Approved':
        return 'Approved';
      case 'Rejected':
        return 'Rejected';
      default:
        return status;
    }
  }

  getStatusIcon(status: DepositRequestStatus): string {
    switch (status) {
      case 'PendingApproval':
      case 'Draft':
        return '🟡';
      case 'Approved':
        return '✅';
      case 'Rejected':
        return '❌';
      default:
        return '•';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatShortDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  }
}
