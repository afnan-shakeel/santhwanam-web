import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { AgentService } from '../../../core/services/agent.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AgentProfile,
  AgentStats,
  AgentPerformance,
  AgentMembersResponse,
  AgentMembersQueryParams
} from '../../../shared/models/agent-profile.model';
import { EditProfileModalComponent } from './edit-profile-modal/edit-profile-modal.component';

type TabType = 'overview' | 'members' | 'performance';

@Component({
  selector: 'app-agent-profile',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    EditProfileModalComponent
  ],
  templateUrl: './agent-profile.component.html',
  styleUrls: ['./agent-profile.component.css']
})
export class AgentProfileComponent implements OnInit {
  private agentService = inject(AgentService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Expose Math for template
  Math = Math;

  // State
  profile = signal<AgentProfile | null>(null);
  stats = signal<AgentStats | null>(null);
  performance = signal<AgentPerformance | null>(null);
  members = signal<AgentMembersResponse | null>(null);

  loading = signal(true);
  loadingStats = signal(false);
  loadingPerformance = signal(false);
  loadingMembers = signal(false);

  activeTab = signal<TabType>('overview');
  showEditModal = signal(false);

  // Members tab state
  membersSearch = signal('');
  membersStatusFilter = signal<string>('');
  membersTierFilter = signal<string>('');
  membersPage = signal(1);
  membersLimit = signal(10);

  // Performance tab state
  performancePeriod = signal<'thisMonth' | 'lastMonth' | 'thisYear'>('thisMonth');

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', route: '/' },
    { label: 'My Profile', route: '/agents/my-profile' }
  ];

  // Computed
  fullName = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
  });

  initials = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return (p.firstName.charAt(0) + p.lastName.charAt(0)).toUpperCase();
  });

  fullAddress = computed(() => {
    const p = this.profile();
    if (!p) return '';
    const parts = [p.addressLine1, p.addressLine2, p.city, p.state, p.postalCode, p.country].filter(Boolean);
    return parts.join(', ');
  });

  statusClass = computed(() => {
    const status = this.profile()?.agentStatus;
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'Suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Terminated': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  });

  // Pagination computed
  totalPages = computed(() => {
    const m = this.members();
    if (!m) return 1;
    return Math.ceil(m.total / m.limit);
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.agentService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
        // Load initial tab data
        this.loadStats();
      },
      error: (error) => {
        this.loading.set(false);
        this.toastService.error('Failed to load profile', error?.error?.message || 'Please try again');
      }
    });
  }

  loadStats(): void {
    const agentId = this.profile()?.agentId;
    if (!agentId) return;

    this.loadingStats.set(true);
    this.agentService.getAgentStats(agentId).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loadingStats.set(false);
      },
      error: () => {
        this.loadingStats.set(false);
      }
    });
  }

  loadPerformance(): void {
    const agentId = this.profile()?.agentId;
    if (!agentId) return;

    this.loadingPerformance.set(true);
    this.agentService.getAgentPerformance(agentId, this.performancePeriod()).subscribe({
      next: (performance) => {
        this.performance.set(performance);
        this.loadingPerformance.set(false);
      },
      error: () => {
        this.loadingPerformance.set(false);
      }
    });
  }

  loadMembers(): void {
    const agentId = this.profile()?.agentId;
    if (!agentId) return;

    this.loadingMembers.set(true);
    const params: AgentMembersQueryParams = {
      page: this.membersPage(),
      limit: this.membersLimit()
    };

    if (this.membersSearch()) {
      params.search = this.membersSearch();
    }
    if (this.membersStatusFilter()) {
      params.status = this.membersStatusFilter() as any;
    }
    if (this.membersTierFilter()) {
      params.tier = this.membersTierFilter();
    }

    this.agentService.getAgentMembers(agentId, params).subscribe({
      next: (response) => {
        this.members.set(response);
        this.loadingMembers.set(false);
      },
      error: () => {
        this.loadingMembers.set(false);
      }
    });
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);

    // Load data for the tab if not already loaded
    if (tab === 'members' && !this.members()) {
      this.loadMembers();
    } else if (tab === 'performance' && !this.performance()) {
      this.loadPerformance();
    }
  }

  openEditModal(): void {
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  onProfileUpdated(): void {
    this.showEditModal.set(false);
    this.loadProfile();
    this.toastService.success('Profile Updated', 'Your profile has been updated successfully');
  }

  // Members tab methods
  onMembersSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.membersSearch.set(value);
  }

  onMembersSearch(): void {
    this.membersPage.set(1);
    this.loadMembers();
  }

  onMembersStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.membersStatusFilter.set(value);
    this.membersPage.set(1);
    this.loadMembers();
  }

  onMembersTierChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.membersTierFilter.set(value);
    this.membersPage.set(1);
    this.loadMembers();
  }

  goToMembersPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.membersPage.set(page);
    this.loadMembers();
  }

  registerNewMember(): void {
    const agentId = this.profile()?.agentId;
    if (agentId) {
      this.router.navigate(['/members/add'], { queryParams: { agentId } });
    }
  }

  viewMember(memberId: string): void {
    this.router.navigate(['/members', memberId, 'edit']);
  }

  // Performance tab methods
  onPerformancePeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'thisMonth' | 'lastMonth' | 'thisYear';
    this.performancePeriod.set(value);
    this.loadPerformance();
  }

  // Utility
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getMemberStatusClass(status: string | null | undefined): string {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Frozen': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'Deceased': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getRegistrationStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'PendingApproval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  // Helper method to get bar height percentage
  getAcquisitionBarHeight(count: number): number {
    const trend = this.performance()?.memberAcquisition?.monthlyTrend;
    if (!trend || trend.length === 0) return 10;
    const maxCount = Math.max(...trend.map(t => t.count), 1);
    return Math.max((count / maxCount) * 100, 10);
  }

  getRetentionBarHeight(rate: number): number {
    return Math.max(rate, 10);
  }
}
