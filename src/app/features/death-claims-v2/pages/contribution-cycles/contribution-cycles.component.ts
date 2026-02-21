import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ListingPageHeaderComponent } from '../../../../shared/components/listing-page-header/listing-page-header.component';
import { DatatableComponent } from '../../../../shared/components/datatable/datatable.component';
import { ContributionsService } from '../../../../core/services/contributions.service';
import { ContributionCycle, CycleStatus } from '../../../../shared/models/death-claim.model';
import { DataTableConfig } from '../../../../shared/models/datatable.model';
import { SearchRequest, SearchResponse } from '../../../../shared/models/search.model';

interface CycleSummaryStats {
  activeCyclesCount: number;
  totalCollecting: number;
  avgCompletionPercentage: number;
}

@Component({
  selector: 'app-contribution-cycles',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ListingPageHeaderComponent,
    DatatableComponent
  ],
  templateUrl: './contribution-cycles.component.html',
  styleUrls: ['./contribution-cycles.component.css']
})
export class ContributionCyclesComponent implements OnInit {
  private contributionsService = inject(ContributionsService);
  private router = inject(Router);

  // State
  stats = signal<CycleSummaryStats | null>(null);
  statsLoading = signal(true);
  cyclesData = signal<SearchResponse<ContributionCycle>>({
    items: [],
    pagination: {
      totalItems: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0
    }
  });
  tableLoading = signal(false);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Death Claims', route: '/claims' },
    { label: 'Contribution Cycles', current: true }
  ];

  tableConfig: DataTableConfig<ContributionCycle> = {
    columns: [
      {
        key: 'cycleNumber',
        label: 'Cycle',
        sortable: true
      },
      {
        key: 'deathClaim.claimNumber',
        label: 'Claim',
        sortable: false
      },
      {
        key: 'deathClaim.memberName',
        label: 'Deceased',
        sortable: false
      },
      {
        key: 'totalCollectedAmount',
        label: 'Progress',
        sortable: false,
        format: (value: number, row: any) => {
          const total = row?.totalExpectedAmount || 0;
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return `${pct}% (${row?.membersCollected || 0}/${(row?.membersCollected || 0) + (row?.membersPending || 0) + (row?.membersMissed || 0)})`;
        }
      },
      {
        key: 'collectionDeadline',
        label: 'Deadline',
        sortable: true,
        type: 'date'
      },
      {
        key: 'cycleStatus',
        label: 'Status',
        sortable: true,
        type: 'badge'
      }
    ],
    actions: [
      {
        label: 'View Claim',
        callback: (cycle: ContributionCycle) => this.onViewClaim(cycle)
      }
    ],
    searchFields: ['cycleNumber', 'claimNumber', 'deceasedMemberName'],
    filters: [
      {
        key: 'cycleStatus',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Closed', value: 'Closed' },
          { label: 'All', value: '' }
        ],
        defaultValue: 'Active'
      }
    ],
    eagerLoad: ['deathClaim', 'tier']
  };

  ngOnInit(): void {
    this.loadStats();
    this.loadCycles();
  }

  onSearch(request: SearchRequest): void {
    this.tableLoading.set(true);
    request.sortBy = request.sortBy || 'collectionDeadline';
    request.sortOrder = request.sortOrder || 'desc';
    request.eagerLoad = ['deathClaim', 'tier'];

    this.contributionsService.searchCycles(request).subscribe({
      next: (res) => {
        this.cyclesData.set(res);
        this.tableLoading.set(false);
      },
      error: () => this.tableLoading.set(false)
    });
  }

  onViewClaim(cycle: ContributionCycle): void {
    // Navigate to claim details → contributions tab
    const claimId = cycle.deathClaimId || cycle.deathClaim?.claimId;
    if (claimId) {
      this.router.navigate(['/claims', claimId], { queryParams: { tab: 'contributions' } });
    }
  }

  private loadStats(): void {
    this.statsLoading.set(true);
    this.contributionsService.getActiveCyclesSummary().subscribe({
      next: (summary: any) => {
        this.stats.set({
          activeCyclesCount: summary.activeCyclesCount || summary.count || 0,
          totalCollecting: summary.totalCollecting || summary.totalExpectedAmount || 0,
          avgCompletionPercentage: summary.avgCompletionPercentage || summary.avgCompletion || 0
        });
        this.statsLoading.set(false);
      },
      error: () => this.statsLoading.set(false)
    });
  }

  private loadCycles(): void {
    this.tableLoading.set(true);
    const request: SearchRequest = {
      page: 1,
      pageSize: 10,
      sortBy: 'collectionDeadline',
      sortOrder: 'desc',
      filters: [
        { field: 'cycleStatus', value: 'Active', operator: 'equals' }
      ],
      eagerLoad: ['deathClaim', 'tier']
    };

    this.contributionsService.searchCycles(request).subscribe({
      next: (res) => {
        this.cyclesData.set(res);
        this.tableLoading.set(false);
      },
      error: () => this.tableLoading.set(false)
    });
  }
}
