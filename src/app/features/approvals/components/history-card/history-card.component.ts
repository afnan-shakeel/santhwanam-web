import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApprovalExecution, ApprovalTaskItem } from '../../../../shared/models/approval-workflow.model';

@Component({
  selector: 'app-history-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-card.component.html',
  styleUrls: ['./history-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryCardComponent {
  @Input() task!: ApprovalExecution;

  constructor(private router: Router) {}

  get statusLabel(): string {
    return this.task.decision === 'Approve' ? '✅ You Approved' : '🔴 You Rejected';
  }

  get statusHeaderClass(): string {
    return this.task.decision === 'Approve'
      ? 'bg-green-50 text-green-700'
      : 'bg-red-50 text-red-700';
  }

  get entityTypeLabel(): string {
    switch (this.task.request?.entityType) {
      case 'Member': return 'Member Registration';
      case 'DeathClaim': return 'Death Claim';
      case 'WalletDepositRequest': return 'Wallet Deposit';
      case 'CashHandover': return 'Cash Handover';
      default: return this.task.request?.entityType ?? '';
    }
  }

  get entityTypeIcon(): string {
    switch (this.task.request?.entityType) {
      case 'Member': return '👤';
      case 'DeathClaim': return '💀';
      case 'WalletDepositRequest': return '💳';
      case 'CashHandover': return '💰';
      default: return '📄';
    }
  }

  get requestStatusBadge(): { text: string; class: string } {
    switch (this.task.request?.status) {
      case 'Approved': return { text: 'Request Approved', class: 'text-green-600' };
      case 'Rejected': return { text: 'Request Rejected', class: 'text-red-600' };
      case 'Pending': return { text: 'Request Pending', class: 'text-amber-600' };
      default: return { text: this.task.request?.status ?? '', class: 'text-gray-500' };
    }
  }

  viewDetails(): void {
    this.router.navigate(['/approvals/requests', this.task.request?.requestId], {
      queryParams: { from: 'my-tasks' }
    });
  }
}
