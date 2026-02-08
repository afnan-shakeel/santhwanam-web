import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ListingPageHeaderComponent } from '../../../../shared/components/listing-page-header/listing-page-header.component';
import { DatatableComponent } from '../../../../shared/components/datatable/datatable.component';
import { DeathClaimsService } from '../../../../core/services/death-claims.service';
import { DeathClaim, DeathClaimDashboardStats, ClaimStatus } from '../../../../shared/models/death-claim.model';
import { DataTableConfig } from '../../../../shared/models/datatable.model';
import { SearchRequest, SearchResponse } from '../../../../shared/models/search.model';

interface StatItem {
  label: string;
  value: number | string;
  filterStatus?: ClaimStatus | ClaimStatus[];
  color: string;
}

@Component({
  selector: 'app-claims-listing',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ListingPageHeaderComponent,
    DatatableComponent
  ],
  templateUrl: './claims-listing.component.html',
  styleUrls: ['./claims-listing.component.css']
})
export class ClaimsListingComponent implements OnInit {
  private claimsService = inject(DeathClaimsService);
  private router = inject(Router);

  // State
  stats = signal<DeathClaimDashboardStats | null>(null);
  statsLoading = signal(true);
  claimsData = signal<SearchResponse<DeathClaim>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  tableLoading = signal(false);
  activeStatFilter = signal<string | null>(null);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Death Claims', current: true }
  ];

  statItems = signal<StatItem[]>([]);

  tableConfig: DataTableConfig<DeathClaim> = {
    columns: [
      {
        key: 'claimNumber',
        label: 'Claim',
        sortable: true
      },
      {
        key: 'memberName',
        label: 'Deceased',
        sortable: true
      },
      {
        key: 'reportedBy',
        label: 'Filed By',
        sortable: false
      },
      {
        key: 'benefitAmount',
        label: 'Benefit',
        sortable: true,
        format: (value: number) => value ? `OMR ${value.toLocaleString('en', { minimumFractionDigits: 3 })}` : '—'
      },
      {
        key: 'claimStatus',
        label: 'Status',
        sortable: true,
        type: 'badge'
      },
      {
        key: 'reportedDate',
        label: 'Filed',
        sortable: true,
        type: 'date'
      }
    ],
    actions: [
      {
        label: 'View Details',
        callback: (claim: DeathClaim) => this.onViewClaim(claim)
      }
    ],
    searchFields: ['claimNumber', 'memberName', 'memberCode'],
    filters: [
      {
        key: 'claimStatus',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Reported', value: 'Reported' },
          { label: 'Under Verification', value: 'UnderVerification' },
          { label: 'Pending Approval', value: 'PendingApproval' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Settled', value: 'Settled' },
          { label: 'Rejected', value: 'Rejected' }
        ]
      }
    ],
    eagerLoad: ['member', 'tier', 'reporter']
  };

  ngOnInit(): void {
    this.loadStats();
    this.loadClaims();
  }

  onSearch(request: SearchRequest): void {
    // Merge any active stat filter
    const statFilter = this.activeStatFilter();
    if (statFilter) {
      request.filters = request.filters || [];
      const hasStatusFilter = request.filters.some(f => f.field === 'claimStatus');
      if (!hasStatusFilter) {
        request.filters.push({ field: 'claimStatus', value: statFilter, operator: 'equals' });
      }
    }

    this.tableLoading.set(true);
    request.sortBy = request.sortBy || 'reportedDate';
    request.sortOrder = request.sortOrder || 'desc';
    request.eagerLoad = ['member', 'tier', 'reporter'];

    this.claimsService.searchClaims(request).subscribe({
      next: (res) => {
        this.claimsData.set(res);
        this.tableLoading.set(false);
      },
      error: () => this.tableLoading.set(false)
    });
  }

  onStatClick(stat: StatItem): void {
    if (stat.filterStatus) {
      const statusValue = Array.isArray(stat.filterStatus) ? stat.filterStatus[0] : stat.filterStatus;
      const currentFilter = this.activeStatFilter();
      if (currentFilter === statusValue) {
        this.activeStatFilter.set(null);
      } else {
        this.activeStatFilter.set(statusValue);
      }
      this.loadClaims();
    }
  }

  onSubmitClaim(): void {
    this.router.navigate(['/claims/new']);
  }

  onViewClaim(claim: DeathClaim): void {
    this.router.navigate(['/claims', claim.claimId]);
  }

  getStatusColor(status: ClaimStatus): string {
    const colors: Record<string, string> = {
      'Reported': 'text-blue-600',
      'UnderVerification': 'text-amber-600',
      'PendingApproval': 'text-purple-600',
      'Approved': 'text-green-600',
      'Settled': 'text-green-800',
      'Rejected': 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  }

  private loadStats(): void {
    this.statsLoading.set(true);
    this.claimsService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.statItems.set([
          { label: 'Pending Action', value: stats.pendingVerification, filterStatus: 'UnderVerification', color: 'text-amber-600' },
          { label: 'Under Contribution', value: stats.underContribution, filterStatus: 'Approved', color: 'text-blue-600' },
          { label: 'Approved', value: stats.approvedForPayout, filterStatus: 'Approved', color: 'text-green-600' },
          { label: 'Settled (YTD)', value: stats.totalBenefitsPaidYTD ? `OMR ${stats.totalBenefitsPaidYTD.toLocaleString()}` : '0', filterStatus: 'Settled', color: 'text-green-800' },
          { label: 'Total (YTD)', value: stats.totalThisYear, color: 'text-gray-900' }
        ]);
        this.statsLoading.set(false);
      },
      error: () => this.statsLoading.set(false)
    });
  }

  private loadClaims(): void {
    const request: SearchRequest = {
      page: 1,
      pageSize: 10,
      sortBy: 'reportedDate',
      sortOrder: 'desc',
      eagerLoad: ['member', 'tier', 'reporter']
    };

    const statFilter = this.activeStatFilter();
    if (statFilter) {
      request.filters = [{ field: 'claimStatus', value: statFilter, operator: 'equals' }];
    }

    this.tableLoading.set(true);
    this.claimsService.searchClaims(request).subscribe({
      next: (res) => {
        this.claimsData.set(res);
        this.tableLoading.set(false);
      },
      error: () => this.tableLoading.set(false)
    });
  }
}
