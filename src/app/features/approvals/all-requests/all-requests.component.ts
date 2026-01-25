import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ApprovalWorkflowService } from '../../../core/services/approval-workflow.service';
import { 
  ApprovalRequest, 
  ApprovalRequestStatus,
  ModuleType
} from '../../../shared/models/approval-workflow.model';
import { SearchRequest, SearchResponse } from '../../../shared/models/search.model';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { DatatableComponent } from '../../../shared/components/datatable/datatable.component';
import { DataTableColumn, DataTableConfig, DataTableAction } from '../../../shared/models/datatable.model';

@Component({
  selector: 'app-all-requests',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, DatatableComponent],
  templateUrl: './all-requests.component.html',
  styleUrls: ['./all-requests.component.css']
})
export class AllRequestsComponent implements OnInit {
  private approvalService = inject(ApprovalWorkflowService);
  private router = inject(Router);

  requestData = signal<SearchResponse<ApprovalRequest>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  loading = signal(false);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Approvals', route: '/approvals' },
    { label: 'All Requests', current: true }
  ];

  // Stats computed from data
  stats = computed(() => {
    const allItems = this.requestData().items;
    return {
      pending: allItems.filter(r => r.status === 'Pending').length,
      approved: allItems.filter(r => r.status === 'Approved').length,
      rejected: allItems.filter(r => r.status === 'Rejected').length,
      total: this.requestData().total
    };
  });

  columns: DataTableColumn<ApprovalRequest>[] = [
    {
      key: 'requestId',
      label: 'Request ID',
      sortable: true,
      format: (value: string) => value.substring(0, 8)
    },
    {
      key: 'workflow.workflowName',
      label: 'Type',
      sortable: true
    },
    {
      key: 'workflow.module',
      label: 'Module',
      sortable: true,
      type: 'badge',
      format: (value: ModuleType | undefined) => value || '-'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      type: 'badge'
    },
    {
      key: 'currentStageOrder',
      label: 'Current Stage',
      sortable: true,
      format: (value: number | null | undefined) => value ? `Stage ${value}` : 'Completed'
    },
    {
      key: 'requestedByUser.firstName',
      label: 'Submitted By',
      sortable: true,
      type: 'text',
      format: (value: string, item: ApprovalRequest) => {
        const lastName = item.requestedByUser?.lastName || '';
        return `${value} ${lastName}`.trim();
      }
    },
    {
      key: 'requestedAt',
      label: 'Submitted',
      sortable: true,
      type: 'date'
    }
  ];

  actions: DataTableAction<ApprovalRequest>[] = [
    {
      label: 'View Details',
      callback: (request: ApprovalRequest) => this.onViewRequest(request)
    }
  ];

  tableConfig: DataTableConfig<ApprovalRequest> = {
    columns: this.columns,
    actions: this.actions,
    showActions: true,
    pageSize: 10
  };

  ngOnInit(): void {
    this.emitSearch();
  }

  emitSearch(): void {
    const request: SearchRequest = {
      page: this.requestData().page,
      pageSize: this.requestData().pageSize,
      sortBy: 'requestedAt',
      sortOrder: 'desc'
    };
    this.loadRequests(request);
  }

  onSearchChange(request: SearchRequest): void {
    this.loadRequests(request);
  }

  loadRequests(request: SearchRequest): void {
    this.loading.set(true);
    
    request.eagerLoad = ['workflow', 'stageExecutions', 'requestedByUser'];
    this.approvalService.searchApprovalRequests(request).subscribe({
      next: (response) => {
        this.requestData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load approval requests:', error);
        this.loading.set(false);
      }
    });
  }

  onViewRequest(request: ApprovalRequest): void {
    this.router.navigate(['/approvals/my-approvals', request.requestId]);
  }

  getStatusBadgeClass(status: ApprovalRequestStatus): string {
    const classes = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || classes['Pending'];
  }

  getModuleBadgeClass(module: ModuleType): string {
    const classes = {
      'Membership': 'bg-blue-100 text-blue-800',
      'Wallet': 'bg-purple-100 text-purple-800',
      'Claims': 'bg-orange-100 text-orange-800',
      'Contributions': 'bg-green-100 text-green-800',
      'Organization': 'bg-indigo-100 text-indigo-800'
    };
    return classes[module] || 'bg-gray-100 text-gray-800';
  }
}
