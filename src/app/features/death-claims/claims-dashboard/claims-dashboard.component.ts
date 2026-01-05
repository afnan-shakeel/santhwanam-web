import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ListingPageHeaderComponent } from '../../../shared/components/listing-page-header/listing-page-header.component';
import { DatatableComponent } from '../../../shared/components/datatable/datatable.component';
import { DataTableConfig } from '../../../shared/models/datatable.model';
import { DeathClaimsService } from '../../../core/services/death-claims.service';
import { DeathClaim, DeathClaimDashboardStats, ClaimStatus } from '../../../shared/models/death-claim.model';
import { SearchRequest, SearchResponse } from '../../../shared/models/search.model';

@Component({
  selector: 'app-claims-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ListingPageHeaderComponent,
    DatatableComponent
  ],
  templateUrl: './claims-dashboard.component.html',
  styleUrls: ['./claims-dashboard.component.css']
})
export class ClaimsDashboardComponent implements OnInit {
  private claimsService = inject(DeathClaimsService);
  private router = inject(Router);

  // Dashboard stats
  stats = signal<DeathClaimDashboardStats | null>(null);
  statsLoading = signal(true);

  // Claims requiring action
  claimsRequiringAction = signal<DeathClaim[]>([]);
  actionClaimsLoading = signal(true);

  // All claims datatable
  claimsData = signal<SearchResponse<DeathClaim>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  tableLoading = signal(false);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Death Claims', current: true }
  ];

  tableConfig: DataTableConfig<DeathClaim> = {
    columns: [
      {
        key: 'claimNumber',
        label: 'Claim Code',
        sortable: true
      },
      {
        key: 'memberName',
        label: 'Deceased Member',
        sortable: true
      },
      {
        key: 'memberCode',
        label: 'Member Code',
        sortable: true
      },
      {
        key: 'deathDate',
        label: 'Death Date',
        sortable: true,
        type: 'date'
      },
      {
        key: 'benefitAmount',
        label: 'Amount',
        sortable: true,
        format: (value: number) => value ? `₹${value.toLocaleString()}` : '-'
      },
      {
        key: 'claimStatus',
        label: 'Status',
        sortable: true,
        type: 'badge'
      },
      {
        key: 'reportedDate',
        label: 'Reported',
        sortable: true,
        type: 'date'
      }
    ],
    actions: [
      {
        label: 'View Details',
        callback: (claim: DeathClaim) => this.onViewClaim(claim)
      },
      {
        label: 'Review',
        callback: (claim: DeathClaim) => this.onReviewClaim(claim),
        visible: (claim: DeathClaim) => 
          claim.claimStatus === 'Reported' || claim.claimStatus === 'UnderVerification'
      }
    ],
    showActions: true,
    pageSize: 10,
    searchFields: ['claimNumber', 'memberName', 'memberCode'],
    filters: [
      {
        key: 'claimStatus',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'All', value: '' },
          { label: 'Reported', value: 'Reported' },
          { label: 'Under Verification', value: 'UnderVerification' },
          { label: 'Verified', value: 'Verified' },
          { label: 'Pending Approval', value: 'PendingApproval' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Settled', value: 'Settled' },
          { label: 'Rejected', value: 'Rejected' }
        ]
      }
    ]
  };

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadClaimsRequiringAction();
    this.loadAllClaims();
  }

  loadDashboardStats(): void {
    this.statsLoading.set(true);
    this.claimsService.getDashboardStats().subscribe({
      next: (response) => {
        this.stats.set(response);
        this.statsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load dashboard stats:', error);
        this.statsLoading.set(false);
      }
    });
  }

  loadClaimsRequiringAction(): void {
    this.actionClaimsLoading.set(true);
    this.claimsService.getClaimsRequiringAction(1, 5).subscribe({
      next: (response) => {
        this.claimsRequiringAction.set(response.items);
        this.actionClaimsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load claims requiring action:', error);
        this.actionClaimsLoading.set(false);
      }
    });
  }

  loadAllClaims(): void {
    const request: SearchRequest = {
      page: 1,
      pageSize: 10,
      sortBy: 'reportedDate',
      sortOrder: 'desc'
    };
    this.onSearchChange(request);
    console.log('Loading all claims with request:', request);
  }

  onSearchChange(request: SearchRequest): void {
    this.tableLoading.set(true);
    this.claimsService.searchClaims(request).subscribe({
      next: (response) => {
        this.claimsData.set(response);
        this.tableLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load claims:', error);
        this.tableLoading.set(false);
      }
    });
  }

  onAddClaim(): void {
    this.router.navigate(['/death-claims/new']);
  }

  onViewClaim(claim: DeathClaim): void {
    this.router.navigate(['/death-claims', claim.claimId]);
  }

  onReviewClaim(claim: DeathClaim): void {
    // Navigate to claim details on documents tab for review
    this.router.navigate(['/death-claims', claim.claimId], { 
      queryParams: { tab: 'documents' } 
    });
  }

  getStatusIcon(status: ClaimStatus): string {
    switch (status) {
      case 'Reported':
      case 'UnderVerification':
        return '🔴';
      case 'Verified':
      case 'PendingApproval':
        return '🟡';
      case 'Approved':
        return '🟢';
      case 'Settled':
        return '✅';
      case 'Rejected':
        return '❌';
      default:
        return '⚪';
    }
  }

  getStatusLabel(status: ClaimStatus): string {
    switch (status) {
      case 'Reported':
        return 'Reported';
      case 'UnderVerification':
        return 'Under Verification';
      case 'Verified':
        return 'Verified';
      case 'PendingApproval':
        return 'Pending Approval';
      case 'Approved':
        return 'Approved';
      case 'Settled':
        return 'Settled';
      case 'Rejected':
        return 'Rejected';
      default:
        return status;
    }
  }

  getTimeSince(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}
