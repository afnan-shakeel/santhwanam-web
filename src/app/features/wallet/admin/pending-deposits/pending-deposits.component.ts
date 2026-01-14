import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { WalletService } from '../../../../core/services/wallet.service';
import { ToastService } from '../../../../core/services/toast.service';
import { WalletDepositRequest } from '../../../../shared/models/wallet.model';

type SortOption = 'oldest' | 'newest' | 'amount-high' | 'amount-low';

@Component({
  selector: 'app-pending-deposits',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbsComponent,
    PaginationComponent
  ],
  templateUrl: './pending-deposits.component.html',
  styleUrls: ['./pending-deposits.component.css']
})
export class PendingDepositsComponent implements OnInit {
  private walletService = inject(WalletService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Data
  pendingDeposits = signal<WalletDepositRequest[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 10;

  // Filters
  filterForm: FormGroup = this.fb.group({
    agentId: [''],
    amountMin: [''],
    amountMax: ['']
  });
  
  sortBy = signal<SortOption>('oldest');

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Wallet Management', route: '/admin/wallets' },
    { label: 'Pending Deposits', current: true }
  ];

  // Computed
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize));
  
  totalAmount = computed(() => {
    return this.pendingDeposits().reduce((sum, d) => sum + d.amount, 0);
  });

  sortedDeposits = computed(() => {
    const deposits = [...this.pendingDeposits()];
    switch (this.sortBy()) {
      case 'newest':
        return deposits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return deposits.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'amount-high':
        return deposits.sort((a, b) => b.amount - a.amount);
      case 'amount-low':
        return deposits.sort((a, b) => a.amount - b.amount);
      default:
        return deposits;
    }
  });

  ngOnInit(): void {
    this.loadPendingDeposits();
  }

  loadPendingDeposits(): void {
    this.loading.set(true);
    
    const params: any = {
      page: this.page(),
      limit: this.pageSize
    };

    // Add agent filter if set
    const agentId = this.filterForm.value.agentId;
    if (agentId) {
      params.collectedBy = agentId;
    }

    this.walletService.getAdminPendingDeposits(params).subscribe({
      next: (response) => {
        this.pendingDeposits.set(response.requests);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pending deposits:', err);
        this.loading.set(false);
        this.toastService.error('Failed to load pending deposits');
      }
    });
  }

  onApplyFilters(): void {
    this.page.set(1);
    this.loadPendingDeposits();
  }

  onClearFilters(): void {
    this.filterForm.reset();
    this.page.set(1);
    this.loadPendingDeposits();
  }

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortBy.set(select.value as SortOption);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadPendingDeposits();
  }

  reviewApproval(approvalRequestId: string | null): void {
    if (approvalRequestId) {
      this.router.navigate(['/approvals/my-approvals', approvalRequestId]);
    } else {
      this.toastService.warning('No approval request found for this deposit');
    }
  }

  viewMemberWallet(memberId: string): void {
    this.router.navigate(['/members', memberId, 'wallet']);
  }

  goBack(): void {
    this.router.navigate(['/admin/wallets']);
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
