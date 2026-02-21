import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { ApprovalWorkflowService } from '../../../../core/services/approval-workflow.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  StatusSummary,
  ApprovalRequestStatus,
  ApprovalRequest
} from '../../../../shared/models/approval-workflow.model';
import { SearchRequest, Filter } from '../../../../shared/models/search.model';

import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { SubmissionCardComponent } from '../../components/submission-card/submission-card.component';

type SubmissionTab = 'in-progress' | 'approved' | 'rejected' | 'all';

@Component({
  selector: 'app-my-submissions',
  standalone: true,
  imports: [
    CommonModule,
    SelectComponent,
    PaginationComponent,
    BreadcrumbsComponent,
    SubmissionCardComponent
  ],
  templateUrl: './my-submissions.component.html',
  styleUrls: ['./my-submissions.component.css']
})
export class MySubmissionsComponent implements OnInit {
  private approvalService = inject(ApprovalWorkflowService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  // State
  submissions = signal<ApprovalRequest[]>([]);
  summary = signal<StatusSummary>({});
  loading = signal(false);
  activeTab = signal<SubmissionTab>('in-progress');
  currentPage = signal(1);
  totalPages = signal(0);
  totalItems = signal(0);
  pageSize = 10;

  // Filters
  selectedEntityType = signal<string>('');

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Approvals' },
    { label: 'My Submissions', current: true }
  ];

  entityTypeOptions: SelectOption<string>[] = [
    { value: '', label: 'All Types' },
    { value: 'Member', label: 'Member Registration' },
    { value: 'DeathClaim', label: 'Death Claim' },
    { value: 'WalletDepositRequest', label: 'Wallet Deposit' },
    { value: 'CashHandover', label: 'Cash Handover' }
  ];

  tabCounts = computed(() => {
    const s = this.summary();
    return {
      'in-progress': s['Pending'] ?? 0,
      approved: s['Approved'] ?? 0,
      rejected: s['Rejected'] ?? 0,
      all: (s['Pending'] ?? 0) + (s['Approved'] ?? 0) + (s['Rejected'] ?? 0) + (s['Cancelled'] ?? 0)
    };
  });

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab') as SubmissionTab | null;
    if (tab && ['in-progress', 'approved', 'rejected', 'all'].includes(tab)) {
      this.activeTab.set(tab);
    }
    this.loadSubmissions();
  }

  switchTab(tab: SubmissionTab): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadSubmissions();
  }

  onEntityTypeChange(value: string | null): void {
    this.selectedEntityType.set(value ?? '');
    this.currentPage.set(1);
    this.loadSubmissions();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSubmissions();
  }

  loadSubmissions(): void {
    this.loading.set(true);

    const statusMap: Record<string, ApprovalRequestStatus | null> = {
      'in-progress': 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      all: null
    };

    const filters: Filter[] = [];
    const status = statusMap[this.activeTab()];
    if (status) {
      filters.push({ field: 'status', operator: 'equals', value: status });
    }

    if (this.selectedEntityType()) {
      filters.push({ field: 'entityType', operator: 'equals', value: this.selectedEntityType() });
    }

    const request: SearchRequest = {
      filters,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: this.currentPage(),
      pageSize: this.pageSize,
      eagerLoad: ['workflow', 'executions', 'executions.stage', 'executions.assignedApprover', 'executions.reviewedByUser', 'rejectedByUser']
    };

    this.approvalService.searchMySubmissions(request).subscribe({
      next: (res) => {
        this.submissions.set(res.items);
        this.summary.set(res.summary ?? {});
        this.totalPages.set(res.pagination.totalPages);
        this.totalItems.set(res.pagination.totalItems);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load submissions', 'Please try again.');
        this.loading.set(false);
      }
    });
  }
}
