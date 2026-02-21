import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApprovalWorkflowService } from '../../../../core/services/approval-workflow.service';
import { AppStore } from '../../../../core/state/app.store';
import { ToastService } from '../../../../core/services/toast.service';
import {
  StatusSummary,
  ExecutionStatus,
  ApprovalExecution
} from '../../../../shared/models/approval-workflow.model';
import { SearchRequest, Filter } from '../../../../shared/models/search.model';

import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { TaskCardComponent } from '../../components/task-card/task-card.component';
import { HistoryCardComponent } from '../../components/history-card/history-card.component';

type TaskTab = 'action' | 'completed' | 'rejected';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [
    CommonModule,
    SelectComponent,
    PaginationComponent,
    BreadcrumbsComponent,
    TaskCardComponent,
    HistoryCardComponent
  ],
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.css']
})
export class MyTasksComponent implements OnInit {
  private approvalService = inject(ApprovalWorkflowService);
  private appStore = inject(AppStore);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  tasks = signal<ApprovalExecution[]>([]);
  summary = signal<StatusSummary>({});
  loading = signal(false);
  processingId = signal<string | null>(null);
  activeTab = signal<TaskTab>('action');
  currentPage = signal(1);
  totalPages = signal(0);
  totalItems = signal(0);
  pageSize = 10;

  // Filters
  selectedEntityType = signal<string>('');
  selectedWorkflow = signal<string>('');

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Approvals' },
    { label: 'My Tasks', current: true }
  ];

  entityTypeOptions: SelectOption<string>[] = [
    { value: '', label: 'All Types' },
    { value: 'Member', label: 'Member Registration' },
    { value: 'DeathClaim', label: 'Death Claim' },
    { value: 'WalletDepositRequest', label: 'Wallet Deposit' },
    { value: 'CashHandover', label: 'Cash Handover' }
  ];

  currentUserId = computed(() => this.appStore.user()?.id ?? '');

  tabCounts = computed(() => {
    const s = this.summary();
    return {
      action: s['Pending'] ?? 0,
      completed: s['Approved'] ?? 0,
      rejected: s['Rejected'] ?? 0
    };
  });

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'completed' || tab === 'rejected') {
      this.activeTab.set(tab);
    }
    this.loadTasks();
  }

  switchTab(tab: TaskTab): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadTasks();
  }

  onEntityTypeChange(value: string | null): void {
    this.selectedEntityType.set(value ?? '');
    this.currentPage.set(1);
    this.loadTasks();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    const statusMap: Record<TaskTab, ExecutionStatus> = {
      action: 'Pending',
      completed: 'Approved',
      rejected: 'Rejected'
    };

    const filters: Filter[] = [
      { field: 'status', operator: 'equals', value: statusMap[this.activeTab()] }
    ];

    if (this.selectedEntityType()) {
      filters.push({ field: 'request.entityType', operator: 'equals', value: this.selectedEntityType() });
    }

    const request: SearchRequest = {
      filters,
      sortBy: this.activeTab() === 'action' ? 'createdAt' : 'reviewedAt',
      sortOrder: 'desc',
      page: this.currentPage(),
      pageSize: this.pageSize,
      eagerLoad: ['request', 'stage', 'reviewedByUser', 'request.executions', 'request.executions.stage']
    };

    this.approvalService.searchMyTasks(request).subscribe({
      next: (res) => {
        this.tasks.set(res.items);
        this.summary.set(res.summary ?? {});
        this.totalPages.set(res.pagination.totalPages);
        this.totalItems.set(res.pagination.totalItems);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load tasks', 'Please try again.');
        this.loading.set(false);
      }
    });
  }

  onApprove(event: { executionId: string; comments: string }): void {
    this.processingId.set(event.executionId);
    const req: Partial<ApprovalExecution> = {
      executionId: event.executionId,
      decision: 'Approve',
      comments: event.comments || undefined
    };
    this.approvalService.processApproval(req).subscribe({
      next: () => {
        this.toast.success('Approved successfully');
        this.processingId.set(null);
        this.loadTasks();
      },
      error: () => {
        this.toast.error('Approval failed', 'Please try again.');
        this.processingId.set(null);
      }
    });
  }

  onReject(event: { executionId: string; comments: string }): void {
    if (!event.comments?.trim()) {
      this.toast.warning('Comments required', 'Please provide a reason for rejection.');
      return;
    }
    this.processingId.set(event.executionId);
    const req: Partial<ApprovalExecution> = {
      executionId: event.executionId,
      decision: 'Reject',
      comments: event.comments
    };
    this.approvalService.processApproval(req).subscribe({
      next: () => {
        this.toast.success('Rejected successfully');
        this.processingId.set(null);
        this.loadTasks();
      },
      error: () => {
        this.toast.error('Rejection failed', 'Please try again.');
        this.processingId.set(null);
      }
    });
  }
}
