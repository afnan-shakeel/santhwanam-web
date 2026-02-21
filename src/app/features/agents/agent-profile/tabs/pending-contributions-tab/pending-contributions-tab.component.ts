import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AgentService } from '../../../../../core/services/agent.service';
import {
  AgentContributionItem,
  AgentContributionsResponse,
  ActiveCycle
} from '../../../../../shared/models/agent-profile.model';
import { StatsCardComponent } from '../../../../../shared/components/stats-card/stats-card.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { MemberContribution } from '../../../../../shared/models/death-claim.model';
import { MemberContributionWithRelations } from '../../../../../shared/models/contribution.model';
import { RecordCashModalV2Component } from '../../../../death-claims-v2/components/record-cash-modal/record-cash-modal.component';
import { SearchResponse } from '../../../../../shared/models/search.model';

@Component({
  selector: 'app-pending-contributions-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, StatsCardComponent, PaginationComponent, SelectComponent, ButtonComponent, InputComponent, RecordCashModalV2Component],
  templateUrl: './pending-contributions-tab.component.html',
  styleUrl: './pending-contributions-tab.component.css'
})
export class PendingContributionsTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private agentService = inject(AgentService);

  // State
  agentId = signal<string>('');
  loading = signal(true);
  contributionsData = signal<SearchResponse<MemberContributionWithRelations> | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);

  // Filters
  selectedCycleId = signal<string>('');
  searchQuery = signal('');

  // Record Cash Modal
  showRecordCashModal = signal(false);
  selectedContribution = signal<MemberContributionWithRelations | null>(null);

  // Computed values
  contributions = computed(() => this.contributionsData()?.items || []);
  summary = computed(() => this.contributionsData()?.summary || { totalPending: 0, totalAmount: 0, activeCycles: [] });
  activeCycles = computed(() => this.summary().activeCycles || []);
  cycleOptions = computed<SelectOption<string>[]>(() =>
    this.activeCycles().map((cycle: any) => ({ value: cycle.cycleId, label: cycle.cycleCode }))
  );
  totalItems = computed(() => this.contributionsData()?.pagination?.totalItems || 0);
  totalPages = computed(() => this.contributionsData()?.pagination?.totalPages || 0);

  ngOnInit(): void {
    // Get agentId from parent route params
    const agentId = this.route.parent?.snapshot.params['agentId'];
    if (agentId) {
      this.agentId.set(agentId);
      this.loadData();
    } else {
      // Own profile - get agentId first
      this.loadOwnProfile();
    }
  }

  private loadOwnProfile(): void {
    this.loading.set(true);
    this.agentService.getMyProfile().subscribe({
      next: (profile) => {
        this.agentId.set(profile.agentId);
        this.loadData();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.agentService.getPendingContributions(this.agentId(), {
      page: this.currentPage(),
      limit: this.pageSize(),
      cycleId: this.selectedCycleId() || undefined,
      search: this.searchQuery() || undefined
    }).subscribe({
      next: (data) => {
        this.contributionsData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading pending contributions:', err);
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadData();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadData();
  }

  onCycleFilterChange(cycleId: string): void {
    this.selectedCycleId.set(cycleId);
    this.currentPage.set(1);
    this.loadData();
  }

  onCollect(contribution: MemberContributionWithRelations): void {
    this.selectedContribution.set(contribution);
    this.showRecordCashModal.set(true);
  }

  closeRecordCashModal(): void {
    this.showRecordCashModal.set(false);
    this.selectedContribution.set(null);
  }

  onCashRecorded(): void {
    this.closeRecordCashModal();
    this.loadData();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDueDate(collectionDeadline: string): string {
    const date = new Date(collectionDeadline);
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const daysRemaining = this.calcDaysRemaining(collectionDeadline);

    if (daysRemaining < 0) {
      return `${formatted} (${Math.abs(daysRemaining)} days overdue)`;
    } else if (daysRemaining === 0) {
      return `${formatted} (Today)`;
    } else {
      return `${formatted} (${daysRemaining} days)`;
    }
  }

  getDueDateClass(collectionDeadline: string): string {
    const daysRemaining = this.calcDaysRemaining(collectionDeadline);
    if (daysRemaining < 0) {
      return 'text-red-600';
    } else if (daysRemaining <= 3) {
      return 'text-amber-600';
    }
    return 'text-gray-500';
  }

  private calcDaysRemaining(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  getMemberInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }
}
