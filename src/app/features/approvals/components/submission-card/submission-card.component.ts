import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  DEFAULT_WAITING_THRESHOLDS,
  WaitingTimeThresholds,
  ApprovalRequest,
  ApprovalExecution
} from '../../../../shared/models/approval-workflow.model';
import { StagePipelineComponent } from '../stage-pipeline/stage-pipeline.component';

@Component({
  selector: 'app-submission-card',
  standalone: true,
  imports: [CommonModule, StagePipelineComponent],
  templateUrl: './submission-card.component.html',
  styleUrls: ['./submission-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmissionCardComponent {
  @Input() submission!: ApprovalRequest;
  @Input() thresholds: WaitingTimeThresholds = DEFAULT_WAITING_THRESHOLDS;

  private router = inject(Router);

  get entityTypeIcon(): string {
    switch (this.submission?.entityType) {
      case 'Member': return '👤';
      case 'DeathClaim': return '💀';
      case 'WalletDepositRequest': return '💳';
      case 'CashHandover': return '💰';
      case 'Agent': return '🧑‍💼';
      default: return '📄';
    }
  }

  get entityTypeLabel(): string {
    switch (this.submission?.entityType) {
      case 'Agent': return 'Agent Registration';
      case 'Member': return 'Member Registration';
      case 'DeathClaim': return 'Death Claim';
      case 'WalletDepositRequest': return 'Wallet Deposit';
      case 'CashHandover': return 'Cash Handover';
      default: return this.submission?.entityType ?? '';
    }
  }

  get statusBadge(): { text: string; bgClass: string; textClass: string } {
    switch (this.submission?.status) {
      case 'Pending': return { text: '⏳ In Progress', bgClass: 'bg-amber-50', textClass: 'text-amber-700' };
      case 'Approved': return { text: '✅ Approved', bgClass: 'bg-green-50', textClass: 'text-green-700' };
      case 'Rejected': return { text: '❌ Rejected', bgClass: 'bg-red-50', textClass: 'text-red-700' };
      case 'Cancelled': return { text: '🚫 Cancelled', bgClass: 'bg-gray-50', textClass: 'text-gray-500' };
      default: return { text: this.submission?.status ?? '', bgClass: 'bg-gray-50', textClass: 'text-gray-500' };
    }
  }

  get headerBgClass(): string {
    switch (this.submission?.status) {
      case 'Pending': return 'bg-amber-50';
      case 'Approved': return 'bg-green-50';
      case 'Rejected': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  }

  get currentPendingExecution(): ApprovalExecution | undefined {
    return this.submission?.executions?.find(
      e => e.status === 'Pending' && e.stageOrder === this.submission.currentStageOrder
    );
  }

  get waitingInfo(): { name: string; duration: string; colorClass: string } | null {
    if (this.submission?.status !== 'Pending') return null;
    const pending = this.currentPendingExecution;
    if (!pending) return null;

    const executions = this.submission.executions ?? [];
    const prevExec = executions
      .filter(e => e.stageOrder < pending.stageOrder && e.reviewedAt)
      .sort((a, b) => b.stageOrder - a.stageOrder)[0];

    const since = prevExec?.reviewedAt || this.submission.requestedAt;
    if (!since) return null;

    const ms = Date.now() - new Date(since).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    let duration: string;
    if (days > 0) duration = `${days}d ${remainingHours}h`;
    else if (hours > 0) duration = `${hours}h`;
    else duration = '<1h';

    let colorClass = 'text-green-600';
    if (hours >= this.thresholds.warning) colorClass = 'text-red-600';
    else if (hours >= this.thresholds.normal) colorClass = 'text-amber-600';

    return { name: pending.reviewedByUser ? `${pending.reviewedByUser.firstName} ${pending.reviewedByUser.lastName}` : 'Approver', duration, colorClass };
  }

  get lastApprover(): string | null {
    if (this.submission?.status !== 'Approved') return null;
    const execs = this.submission.executions ?? [];
    const lastApproved = execs
      .filter(e => e.status === 'Approved')
      .sort((a, b) => b.stageOrder - a.stageOrder)[0];
    return ((lastApproved?.reviewedByUser?.firstName || '') + ' ' + (lastApproved?.reviewedByUser?.lastName || '')).trim() || null;
  }

  viewDetails(): void {
    this.router.navigate(['/approvals/requests', this.submission.requestId], {
      queryParams: { from: 'my-submissions' }
    });
  }
}
