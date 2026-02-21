import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApprovalWorkflowService } from '../../../../core/services/approval-workflow.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AppStore } from '../../../../core/state/app.store';
import {
  ApprovalExecution,
  ApprovalRequest,
  EnrichedApprovalRequestDetail,
  ExecutionDetail,
  ProcessApprovalRequest
} from '../../../../shared/models/approval-workflow.model';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { OutcomeBannerComponent } from '../../components/outcome-banner/outcome-banner.component';
import { EntitySummaryComponent } from '../../components/entity-summaries/entity-summary.component';
import { ApprovalJourneyComponent } from '../../components/approval-journey/approval-journey.component';
import { ActionCardComponent } from '../../components/action-card/action-card.component';
import { AccessStore } from '../../../../core/state/access.store';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BreadcrumbsComponent,
    OutcomeBannerComponent,
    EntitySummaryComponent,
    ApprovalJourneyComponent,
    ActionCardComponent
  ],
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.css']
})
export class RequestDetailComponent implements OnInit {
  private approvalService = inject(ApprovalWorkflowService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accessStore = inject(AccessStore);

  request = signal<ApprovalRequest | null>(null);
  loading = signal(true);
  processing = signal(false);

  currentUserId = computed(() => this.accessStore.user()?.userId ?? '');

  // Back link
  backLink = computed(() => {
    const from = this.route.snapshot.queryParamMap.get('from');
    switch (from) {
      case 'my-tasks':
        return { label: '← Back to My Approval Tasks', route: '/approvals/my-tasks' };
      case 'my-submissions':
        return { label: '← Back to My Submissions', route: '/approvals/my-submissions' };
      case 'all-requests':
        return { label: '← Back to All Requests', route: '/admin/approvals/requests' };
      default:
        return { label: '← Back to My Approval Tasks', route: '/approvals/my-tasks' };
    }
  });

  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const req = this.request();
    return [
      { label: 'Approvals' },
      { label: this.backLink().label.replace('← Back to ', ''), url: this.backLink().route },
      { label: req?.entityLabel ?? 'Request Detail', current: true }
    ];
  });

  // Whether current user is the assigned approver for the current pending stage
  showActionCard = computed(() => {
    const req = this.request();
    if (!req || req.status !== 'Pending') return false;
    const currentExec = this.getCurrentExecution();
    return !!currentExec && currentExec.assignedApprover?.userId === this.currentUserId();
  });

  // Show "waiting for X" banner when pending but user is NOT the approver
  showWaitingBanner = computed(() => {
    const req = this.request();
    if (!req || req.status !== 'Pending') return false;
    return !this.showActionCard();
  });

  waitingApproverInfo = computed(() => {
    const currentExec = this.getCurrentExecution();
    if (!currentExec?.assignedApprover) return null;
    const name = ((currentExec.assignedApprover.firstName ?? '') + ' ' + (currentExec.assignedApprover.lastName ?? '')).trim() || currentExec.assignedApprover.userId;
    const role = '-' // currentExec.assignedApprover;
    return role ? `${name} (${role})` : name;
  });

  currentExecutionId = computed(() => {
    const exec = this.getCurrentExecution();
    return exec?.executionId ?? '';
  });

  // Status helpers
  statusBadge = computed(() => {
    const req = this.request();
    if (!req) return { text: '', class: '' };
    switch (req.status) {
      case 'Pending': return { text: 'In Progress', class: 'bg-amber-100 text-amber-700' };
      case 'Approved': return { text: 'Approved', class: 'bg-green-100 text-green-700' };
      case 'Rejected': return { text: 'Rejected', class: 'bg-red-100 text-red-700' };
      case 'Cancelled': return { text: 'Cancelled', class: 'bg-gray-100 text-gray-500' };
      default: return { text: req.status, class: 'bg-gray-100 text-gray-500' };
    }
  });

  entityIcon = computed(() => {
    const type = this.request()?.entityType;
    switch (type) {
      case 'Member': return '👤';
      case 'DeathClaim': return '💀';
      case 'WalletDepositRequest': return '💳';
      case 'CashHandover': return '💰';
      default: return '📋';
    }
  });

  entityTypeLabel = computed(() => {
    const type = this.request()?.entityType;
    switch (type) {
      case 'Member': return 'Member Registration';
      case 'DeathClaim': return 'Death Claim';
      case 'WalletDepositRequest': return 'Wallet Deposit';
      case 'CashHandover': return 'Cash Handover';
      default: return type ?? 'Unknown';
    }
  });

  timeAgo = computed(() => {
    const req = this.request();
    if (!req?.requestedAt) return '';
    const ms = Date.now() - new Date(req.requestedAt).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  });

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('requestId');
    if (requestId) {
      this.fetchDetail(requestId);
    }
  }

  fetchDetail(requestId: string): void {
    this.loading.set(true);
    this.approvalService.getApprovalRequestDetails(requestId).subscribe({
      next: (data) => {
        this.request.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load request details', 'Please try again.');
        this.loading.set(false);
      }
    });
  }

  onApprove(event: { executionId: string; comments: string }): void {
    this.processing.set(true);
    const payload: ProcessApprovalRequest = {
      executionId: event.executionId,
      decision: 'Approve',
      comments: event.comments || undefined
    };

    this.approvalService.processApproval(payload).subscribe({
      next: () => {
        this.toast.success('Approved successfully');
        this.processing.set(false);
        // Re-fetch to show updated journey
        const reqId = this.request()?.requestId;
        if (reqId) this.fetchDetail(reqId);
      },
      error: () => {
        this.toast.error('Failed to approve', 'Please try again.');
        this.processing.set(false);
      }
    });
  }

  onReject(event: { executionId: string; comments: string }): void {
    if (!event.comments?.trim()) {
      this.toast.error('Comments required', 'Please provide a reason for rejection.');
      return;
    }

    this.processing.set(true);
    const payload: ProcessApprovalRequest = {
      executionId: event.executionId,
      decision: 'Reject',
      comments: event.comments
    };

    this.approvalService.processApproval(payload).subscribe({
      next: () => {
        this.toast.success('Rejected successfully');
        this.processing.set(false);
        const reqId = this.request()?.requestId;
        if (reqId) this.fetchDetail(reqId);
      },
      error: () => {
        this.toast.error('Failed to reject', 'Please try again.');
        this.processing.set(false);
      }
    });
  }

  navigateBack(): void {
    this.router.navigateByUrl(this.backLink().route);
  }

  getEntityRoute(): string | null {
    const req = this.request();
    if (!req) return null;
    switch (req.entityType) {
      case 'Member':
        return `/members/${req.entityId}`;
      case 'DeathClaim':
        return `/claims/${req.entityId}`;
      case 'WalletDepositRequest':
        return req.entityContext?.['memberId']
          ? `/members/${req.entityContext['memberId']}/wallet`
          : null;
      case 'CashHandover':
        return `/cash/handovers/${req.entityId}`;
      default:
        return null;
    }
  }

  private getCurrentExecution(): ApprovalExecution | null {
    const req = this.request();
    if (!req) return null;
    return req.executions?.find(
      e => e.stageOrder === req.currentStageOrder && e.status === 'Pending'
    ) ?? null;
  }
}
