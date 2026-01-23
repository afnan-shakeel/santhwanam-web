import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApprovalWorkflowService } from '../../../core/services/approval-workflow.service';
import { 
  ApprovalRequest, 
  ApprovalRequestStatus, 
  ModuleType 
} from '../../../shared/models/approval-workflow.model';
import { SearchRequest, SearchResponse } from '../../../shared/models/search.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-my-approvals',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, PaginationComponent],
  templateUrl: './my-approvals.component.html',
  styleUrls: ['./my-approvals.component.css']
})
export class MyApprovalsComponent implements OnInit {
  private approvalService = inject(ApprovalWorkflowService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  approvals = signal<ApprovalRequest[]>([]);
  approvalsData = signal<SearchResponse<ApprovalRequest>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  loading = signal(false);
  currentPage = signal(1);
  pageSize = 10;
  
  // Tab state
  activeTab = signal<ApprovalRequestStatus>('Pending');
  
  // Filter state
  selectedModule = signal<ModuleType | ''>('');
  fromDate = signal('');
  toDate = signal('');

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Approvals', route: '/approvals' },
    { label: 'My Approvals', current: true }
  ];

  // Computed counts for tabs - these show counts from current page data
  // For accurate total counts, you'd need separate API calls
  pendingCount = computed(() => this.activeTab() === 'Pending' ? this.approvalsData().total : 0);
  approvedCount = computed(() => this.activeTab() === 'Approved' ? this.approvalsData().total : 0);
  rejectedCount = computed(() => this.activeTab() === 'Rejected' ? this.approvalsData().total : 0);

  // Approvals are now filtered server-side, so just return all items
  filteredApprovals = computed(() => {
    return this.approvals();
  });

  moduleOptions: { value: ModuleType | ''; label: string }[] = [
    { value: '', label: 'All Modules' },
    { value: 'Membership', label: 'Membership' },
    { value: 'Wallet', label: 'Wallet' },
    { value: 'Claims', label: 'Claims' },
    { value: 'Contributions', label: 'Contributions' },
    { value: 'Organization', label: 'Organization' }
  ];

  ngOnInit(): void {
    // Subscribe to query params to read status
    this.route.queryParamMap.subscribe(params => {
      const status = params.get('status') as ApprovalRequestStatus;
      if (status && ['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(status)) {
        this.activeTab.set(status);
      }
      this.loadApprovals();
    });
  }

  loadApprovals(): void {
    this.loading.set(true);
    
    const filters: any[] = [
      { field: 'status', operator: 'equals', value: this.activeTab() }
    ];

    if (this.selectedModule()) {
      filters.push({ field: 'module', operator: 'equals', value: this.selectedModule() });
    }

    if (this.fromDate()) {
      filters.push({ field: 'requestedAt', operator: 'gte', value: this.fromDate() });
    }

    if (this.toDate()) {
      filters.push({ field: 'requestedAt', operator: 'lte', value: this.toDate() });
    }

    const request: SearchRequest = {
      page: this.currentPage(),
      pageSize: this.pageSize,
      filters,
      sortBy: 'requestedAt',
      sortOrder: 'desc',
      eagerLoad: ['workflow', 'requestedByUser']
    };

    this.approvalService.searchApprovalRequests(request).subscribe({
      next: (response) => {
        this.approvals.set(response.items);
        this.approvalsData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load approvals:', error);
        this.loading.set(false);
      }
    });
  }

  setActiveTab(status: ApprovalRequestStatus): void {
    this.activeTab.set(status);
    this.currentPage.set(1); // Reset to first page on tab change
    
    // Update URL query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status },
      queryParamsHandling: 'merge'
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadApprovals();
  }

  onModuleChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedModule.set(select.value as ModuleType | '');
    this.currentPage.set(1); // Reset to first page
    this.loadApprovals();
  }

  onFromDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fromDate.set(input.value);
  }

  onToDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.toDate.set(input.value);
  }

  applyDateFilter(): void {
    this.currentPage.set(1); // Reset to first page
    this.loadApprovals();
  }

  clearFilters(): void {
    this.selectedModule.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.currentPage.set(1); // Reset to first page
    this.loadApprovals();
  }

  viewDetails(request: ApprovalRequest): void {
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

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  }
}
