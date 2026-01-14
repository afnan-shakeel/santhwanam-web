import { Component, inject, signal, computed, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AgentService } from '../../../../../core/services/agent.service';
import { AgentMember, AgentMembersResponse, AgentMembersQueryParams } from '../../../../../shared/models/agent-profile.model';

export type MembersViewMode = 'self' | 'admin';

@Component({
  selector: 'app-agent-members-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-members-tab.component.html',
  styleUrls: ['./agent-members-tab.component.css']
})
export class AgentMembersTabComponent implements OnInit {
  private agentService = inject(AgentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Expose Math for template
  Math = Math;

  // Inputs
  viewMode = input<MembersViewMode>('self');

  // State
  members = signal<AgentMembersResponse | null>(null);
  loading = signal(true);
  agentId = signal<string | null>(null);

  // Filters
  search = signal('');
  statusFilter = signal<string>('');
  tierFilter = signal<string>('');
  page = signal(1);
  limit = signal(10);

  // Selected for bulk actions (admin only)
  selectedMemberIds = signal<Set<string>>(new Set());
  selectAll = signal(false);

  // Computed
  totalPages = computed(() => {
    const m = this.members();
    if (!m) return 1;
    return Math.ceil(m.total / m.limit);
  });

  title = computed(() => {
    return this.viewMode() === 'self' ? 'My Members' : "Agent's Members";
  });

  hasSelection = computed(() => {
    return this.selectedMemberIds().size > 0;
  });

  ngOnInit(): void {
    this.loadAgentId();
  }

  private loadAgentId(): void {
    const parentRoute = this.route.parent;
    if (parentRoute) {
      const agentId = parentRoute.snapshot.paramMap.get('agentId');
      if (agentId) {
        this.agentId.set(agentId);
        this.loadMembers();
      } else {
        // For self-view, load from my-profile
        this.loadMyAgentId();
      }
    }
  }

  private loadMyAgentId(): void {
    this.agentService.getMyProfile().subscribe({
      next: (profile) => {
        this.agentId.set(profile.agentId);
        this.loadMembers();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadMembers(): void {
    const agentId = this.agentId();
    if (!agentId) return;

    this.loading.set(true);
    const params: AgentMembersQueryParams = {
      page: this.page(),
      limit: this.limit()
    };

    if (this.search()) {
      params.search = this.search();
    }
    if (this.statusFilter()) {
      params.status = this.statusFilter() as any;
    }
    if (this.tierFilter()) {
      params.tier = this.tierFilter();
    }

    this.agentService.getAgentMembers(agentId, params).subscribe({
      next: (response) => {
        this.members.set(response);
        this.loading.set(false);
        this.selectedMemberIds.set(new Set());
        this.selectAll.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  // Search
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
  }

  onSearch(): void {
    this.page.set(1);
    this.loadMembers();
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  // Filters
  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadMembers();
  }

  onTierChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.tierFilter.set(value);
    this.page.set(1);
    this.loadMembers();
  }

  // Pagination
  goToPage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages()) return;
    this.page.set(newPage);
    this.loadMembers();
  }

  // Selection (admin only)
  onSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectAll.set(checked);
    if (checked) {
      const allIds = new Set(this.members()?.members.map(m => m.memberId) || []);
      this.selectedMemberIds.set(allIds);
    } else {
      this.selectedMemberIds.set(new Set());
    }
  }

  onSelectMember(memberId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = new Set(this.selectedMemberIds());
    if (checked) {
      current.add(memberId);
    } else {
      current.delete(memberId);
    }
    this.selectedMemberIds.set(current);
    this.selectAll.set(current.size === (this.members()?.members.length || 0));
  }

  isMemberSelected(memberId: string): boolean {
    return this.selectedMemberIds().has(memberId);
  }

  // Actions
  viewMember(member: AgentMember): void {
    if (this.viewMode() === 'self') {
      this.router.navigate(['/agents/members', member.memberId, 'wallet']);
    } else {
      this.router.navigate(['/members', member.memberId, 'profile']);
    }
  }

  registerNewMember(): void {
    const agentId = this.agentId();
    if (agentId) {
      this.router.navigate(['/members/add'], { queryParams: { agentId } });
    }
  }

  exportList(): void {
    // TODO: Implement export
    console.log('Export list');
  }

  sendSMS(): void {
    // TODO: Implement SMS
    console.log('Send SMS');
  }

  bulkReassign(): void {
    // TODO: Implement bulk reassign
    console.log('Bulk reassign', Array.from(this.selectedMemberIds()));
  }

  // Utility
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

  getFullName(member: AgentMember): string {
    return `${member.firstName} ${member.lastName}`;
  }
}
