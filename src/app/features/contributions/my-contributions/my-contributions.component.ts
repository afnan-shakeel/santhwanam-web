import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ContributionsService } from '../../../core/services/contributions.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  MyContributionsSummary,
  MyPendingContribution,
  MemberContributionWithRelations,
  ContributionHistoryStatus
} from '../../../shared/models/contribution.model';

@Component({
  selector: 'app-my-contributions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbsComponent],
  templateUrl: './my-contributions.component.html',
  styleUrls: ['./my-contributions.component.css']
})
export class MyContributionsComponent implements OnInit {
  private contributionsService = inject(ContributionsService);
  private toastService = inject(ToastService);

  // Expose Math for template
  readonly Math = Math;

  // Data
  summary = signal<MyContributionsSummary | null>(null);
  pendingContributions = signal<MyPendingContribution[]>([]);
  contributionHistory = signal<MemberContributionWithRelations[]>([]);

  // Loading states
  summaryLoading = signal(true);
  pendingLoading = signal(true);
  historyLoading = signal(true);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  pageSize = 10;

  // Filters
  statusFilter = signal<ContributionHistoryStatus | ''>('');

  statusOptions: { value: ContributionHistoryStatus | ''; label: string }[] = [
    { value: '', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'WalletDebitRequested', label: 'Wallet Debit Requested' },
    { value: 'Acknowledged', label: 'Acknowledged' },
    { value: 'Collected', label: 'Collected' },
    { value: 'Missed', label: 'Missed' },
    { value: 'Exempted', label: 'Exempted' }
  ];

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'My Contributions', current: true }
  ];

  // Computed
  hasWalletSufficient = computed(() => {
    const s = this.summary();
    const pending = this.pendingContributions();
    if (!s || pending.length === 0) return true;
    const totalPending = pending.reduce((sum, p) => sum + p.contributionAmount, 0);
    return s.walletBalance >= totalPending;
  });

  ngOnInit(): void {
    this.loadSummary();
    this.loadPendingContributions();
    this.loadHistory();
  }

  loadSummary(): void {
    this.summaryLoading.set(true);
    this.contributionsService.getMyContributionsSummary().subscribe({
      next: (response) => {
        this.summary.set(response.data);
        this.summaryLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load contribution summary:', error);
        this.summaryLoading.set(false);
      }
    });
  }

  loadPendingContributions(): void {
    this.pendingLoading.set(true);
    this.contributionsService.getMyPendingContributions().subscribe({
      next: (response) => {
        this.pendingContributions.set(response.pendingContributions);
        this.pendingLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load pending contributions:', error);
        this.pendingLoading.set(false);
      }
    });
  }

  loadHistory(): void {
    this.historyLoading.set(true);
    const params: { status?: ContributionHistoryStatus; page: number; limit: number } = {
      page: this.currentPage(),
      limit: this.pageSize
    };

    if (this.statusFilter()) {
      params.status = this.statusFilter() as ContributionHistoryStatus;
    }

    this.contributionsService.getMyContributionsHistory(params).subscribe({
      next: (response) => {
        this.contributionHistory.set(response.contributions);
        this.totalPages.set(response.pagination?.totalPages);
        this.totalItems.set(response.pagination?.total);
        this.historyLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load contribution history:', error);
        this.historyLoading.set(false);
      }
    });
  }

  onStatusFilterChange(): void {
    this.currentPage.set(1);
    this.loadHistory();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadHistory();
    }
  }

  getStatusBadgeClasses(status: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'Collected':
      case 'Acknowledged':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Pending':
      case 'WalletDebitRequested':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Missed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'Exempted':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'WalletDebitRequested':
        return 'Processing';
      case 'Acknowledged':
        return 'Paid';
      case 'Collected':
        return 'Paid';
      default:
        return status;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getDaysLeftLabel(daysLeft: number): string {
    if (daysLeft < 0) {
      return `${Math.abs(daysLeft)} days overdue`;
    } else if (daysLeft === 0) {
      return 'Due today';
    } else if (daysLeft === 1) {
      return '1 day left';
    } else {
      return `${daysLeft} days left`;
    }
  }

  getDaysLeftClasses(daysLeft: number): string {
    if (daysLeft < 0) {
      return 'text-red-600 font-medium';
    } else if (daysLeft <= 3) {
      return 'text-yellow-600 font-medium';
    } else {
      return 'text-gray-600';
    }
  }

  getUrgencyClasses(daysLeft: number): string {
    if (daysLeft < 0) {
      return 'border-red-300 bg-red-50';
    } else if (daysLeft <= 3) {
      return 'border-yellow-300 bg-yellow-50';
    } else {
      return 'border-gray-200 bg-white';
    }
  }
}
