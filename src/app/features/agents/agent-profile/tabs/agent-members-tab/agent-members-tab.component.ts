import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AgentService } from '../../../../../core/services/agent.service';
import { AgentMember, AgentMembersResponse } from '../../../../../shared/models/agent-profile.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { AccessService } from '../../../../../core/services/access.service';

type MemberStatusFilter = 'Active' | 'Suspended' | 'Frozen' | 'Closed' | 'Deceased' | '';

@Component({
  selector: 'app-agent-members-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent, BadgeComponent, SelectComponent, InputComponent],
  templateUrl: './agent-members-tab.component.html',
  styleUrl: './agent-members-tab.component.css'
})
export class AgentMembersTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private agentService = inject(AgentService);
  private accessService = inject(AccessService);

  agentId = signal<string>('');
  loading = signal(true);
  membersData = signal<AgentMembersResponse | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);
  searchQuery = signal('');
  statusFilter = signal<MemberStatusFilter>('');

  // Select options
  statusOptions: SelectOption<string>[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Suspended', label: 'Suspended' },
    { value: 'Frozen', label: 'Frozen' },
    { value: 'Closed', label: 'Closed' },
  ];

  // Computed values
  members = computed(() => this.membersData()?.items || []);
  totalItems = computed(() => this.membersData()?.pagination.total || 0);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  // Summary stats
  summary = computed(() => {
    const data = this.membersData();
    if (!data) return null;
    return {
      total: data.pagination.total,
      active: data.items.filter(m => m.memberStatus === 'Active').length,
      suspended: data.items.filter(m => m.memberStatus === 'Suspended').length
    };
  });

  ngOnInit(): void {
    // Get agentId from parent route params
    const agentId = this.route.parent?.snapshot.params['agentId'];
    if (agentId) {
      this.agentId.set(agentId);
      this.loadMembers();
    } else {
      // Own profile - get agentId first
      this.loadOwnMembers();
    }
  }

  private loadOwnMembers(): void {
    this.loading.set(true);
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
    this.loading.set(true);
    const status = this.statusFilter();
    this.agentService.getAgentMembers(this.agentId(), {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchQuery() || undefined,
      status: status || undefined
    }).subscribe({
      next: (data) => {
        this.membersData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading members:', err);
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadMembers();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadMembers();
  }

  onStatusChange(status: string): void {
    this.statusFilter.set(status as MemberStatusFilter);
    this.currentPage.set(1);
    this.loadMembers();
  }

  getMemberInitials(member: AgentMember): string {
    const first = member.firstName?.[0] || '';
    const last = member.lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  }

  getStatusBadgeColor(status: string | null | undefined): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'Active': return 'success';
      case 'Suspended': return 'warning';
      case 'Frozen': return 'warning';
      case 'Closed': return 'neutral';
      case 'Deceased': return 'neutral';
      default: return 'neutral';
    }
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  onViewMember(member: AgentMember): void {
    // for agent view mode: /agents/members/2b4c5ed3-7766-43b6-aaa4-3f44bb6bc66b
    if (this.accessService.isAgentView()) {
      this.router.navigate(['/agents/members', member.memberId]);
      return;
    }
    
    // for admin view mode: /members/2b4c5ed3-7766-43b6-aaa4-3f44bb6bc66b/profile/overview
    this.router.navigate(['/members', member.memberId, 'profile', 'overview']);
  }
}