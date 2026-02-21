import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AgentService } from '../../../../../core/services/agent.service';
import { MemberService } from '../../../../../core/services/member.service';
import { SystemConfigService } from '../../../../../core/services/system-config.service';
import { ConfirmationService } from '../../../../../core/services/confirmation.service';
import { ToastService } from '../../../../../core/services/toast.service';
import {
  LowBalanceMemberItem,
  AgentLowBalanceMembersResponse
} from '../../../../../shared/models/agent-profile.model';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SearchResponse } from '../../../../../shared/models/search.model';

@Component({
  selector: 'app-low-balance-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BadgeComponent, PaginationComponent, ButtonComponent, InputComponent],
  templateUrl: './low-balance-tab.component.html',
  styleUrl: './low-balance-tab.component.css'
})
export class LowBalanceTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private agentService = inject(AgentService);
  private memberService = inject(MemberService);
  private systemConfigService = inject(SystemConfigService);
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);

  // State
  agentId = signal<string>('');
  loading = signal(true);
  membersData = signal<SearchResponse<LowBalanceMemberItem> | null>(null);
  threshold = signal(200); // Default value

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);

  // Filters
  searchQuery = signal('');

  // Alert state
  alertingMemberId = signal<string | null>(null);

  // Computed values
  members = computed(() => this.membersData()?.items || []);
  summary = computed(() => this.membersData()?.summary || { threshold: 200, totalCount: 0 });
  totalItems = computed(() => this.membersData()?.pagination?.totalItems || 0);
  totalPages = computed(() => this.membersData()?.pagination?.totalPages || 0);

  async ngOnInit(): Promise<void> {
    // Load threshold from system config
    const thresholdValue = await this.systemConfigService.getNumber('min_wallet_balance', 200);
    this.threshold.set(thresholdValue);

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
    this.agentService.getLowBalanceMembers(this.agentId(), {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchQuery() || undefined
    }).subscribe({
      next: (data) => {
        this.membersData.set(data);
        // Update threshold from response if available
        if (data.summary?.threshold) {
          this.threshold.set(data.summary.threshold);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading low balance members:', err);
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

  async onAlert(member: LowBalanceMemberItem): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Send Low Balance Alert',
      message: 'Send a low balance notification to this member?',
      description: `Member: ${member.firstName} ${member.lastName} (${member.memberCode})\nCurrent Balance: ${this.formatCurrency(member.walletBalance)}\nMinimum Required: ${this.formatCurrency(this.threshold())}\n\nThe member will be notified via SMS/Email to top up their wallet.`,
      variant: 'info',
      confirmText: 'Send Alert',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      this.alertingMemberId.set(member.memberId);
      this.memberService.notifyMember(member.memberId, {
        type: 'low_balance',
        channel: 'sms'
      }).subscribe({
        next: () => {
          this.toastService.success(`Alert sent to ${member.firstName} ${member.lastName}`);
          this.alertingMemberId.set(null);
        },
        error: (err) => {
          console.error('Error sending alert:', err);
          this.toastService.error('Failed to send alert. Please try again.');
          this.alertingMemberId.set(null);
        }
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getMemberInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getBalanceIndicatorClass(indicator: 'empty' | 'low'): string {
    return indicator === 'empty' ? 'text-red-600' : 'text-amber-600';
  }

  getBalanceIndicatorIcon(indicator: 'empty' | 'low'): string {
    return indicator === 'empty' ? '🔴' : '⚠️';
  }

  getBalanceIndicatorText(indicator: 'empty' | 'low'): string {
    return indicator === 'empty' ? 'Empty' : 'Low';
  }

  getStatusBadgeColor(status: string | null): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'Active': return 'success';
      case 'Suspended': return 'warning';
      case 'Frozen': return 'neutral';
      case 'Closed': return 'danger';
      case 'Deceased': return 'neutral';
      default: return 'neutral';
    }
  }
}
