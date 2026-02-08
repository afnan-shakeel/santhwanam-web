import { Component, input, output, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContributionsService } from '../../../../core/services/contributions.service';
import { MemberContribution, ContributionStatus } from '../../../../shared/models/death-claim.model';
import { ContributionStatusBadgeComponent } from '../contribution-status-badge/contribution-status-badge.component';
import { SearchRequest, SearchResponse } from '../../../../shared/models/search.model';

interface FilterChip {
  label: string;
  status: ContributionStatus | 'All';
  count: number;
}

@Component({
  selector: 'app-contribution-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ContributionStatusBadgeComponent],
  templateUrl: './contribution-table.component.html'
})
export class ContributionTableComponent implements OnInit {
  private contributionsService = inject(ContributionsService);

  cycleId = input.required<string>();
  membersCollected = input(0);
  membersPending = input(0);
  membersMissed = input(0);
  totalMembers = input(0);
  canRecordPayment = input(false);

  recordPayment = output<MemberContribution>();
  markMissed = output<MemberContribution>();

  // State
  contributions = signal<SearchResponse<MemberContribution>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });
  loading = signal(false);
  activeFilter = signal<ContributionStatus | 'All'>('All');
  searchTerm = signal('');
  currentPage = signal(1);

  filterChips = computed<FilterChip[]>(() => [
    { label: 'All', status: 'All', count: this.totalMembers() },
    { label: 'Collected', status: 'Collected', count: this.membersCollected() },
    { label: 'Pending', status: 'Pending', count: this.membersPending() },
    { label: 'Missed', status: 'Missed', count: this.membersMissed() }
  ]);

  ngOnInit(): void {
    this.loadContributions();
  }

  onFilterChange(status: ContributionStatus | 'All'): void {
    this.activeFilter.set(status);
    this.currentPage.set(1);
    this.loadContributions();
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadContributions();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadContributions();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  private loadContributions(): void {
    this.loading.set(true);

    const request: SearchRequest = {
      page: this.currentPage(),
      pageSize: 20,
      filters: [
        { field: 'cycleId', value: this.cycleId(), operator: 'equals' }
      ],
      eagerLoad: ['member', 'agent'],
      sortBy: 'memberName',
      sortOrder: 'asc'
    };

    const filter = this.activeFilter();
    if (filter !== 'All') {
      request.filters!.push({ field: 'contributionStatus', value: filter, operator: 'equals' });
    }

    const term = this.searchTerm();
    if (term) {
      request.searchTerm = term;
      request.searchFields = ['memberName', 'memberCode'];
    }

    this.contributionsService.searchContributions(request).subscribe({
      next: (res) => {
        this.contributions.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
