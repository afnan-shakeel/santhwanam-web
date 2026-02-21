import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApprovalExecution } from '../../../../shared/models/approval-workflow.model';
import { StagePipelineComponent } from '../stage-pipeline/stage-pipeline.component';
import { EntitySummaryComponent } from '../entity-summaries/entity-summary.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, FormsModule, StagePipelineComponent, EntitySummaryComponent, ButtonComponent],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskCardComponent {
  @Input() task!: ApprovalExecution;
  @Input() currentUserId = '';
  @Input() processing = false;

  @Output() approve = new EventEmitter<{ executionId: string; comments: string }>();
  @Output() reject = new EventEmitter<{ executionId: string; comments: string }>();

  comments = signal('');

  constructor(private router: Router) {}

  get entityType(): string {
    return this.task?.request?.entityType ?? '';
  }

  get entityLabel(): string | null {
    return this.task?.request?.entityLabel ?? null;
  }

  get entityContext(): Record<string, any> {
    return this.task?.request?.entityContext ?? {};
  }

  get hasEntityContext(): boolean {
    return Object.keys(this.entityContext).length > 0;
  }

  get entityTypeBadgeClass(): string {
    switch (this.entityType) {
      case 'Member': return 'bg-primary-100 text-primary-700';
      case 'DeathClaim': return 'bg-red-100 text-red-700';
      case 'WalletDepositRequest': return 'bg-green-100 text-green-700';
      case 'CashHandover': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  get entityTypeLabel(): string {
    switch (this.entityType) {
      case 'Member': return 'Member Registration';
      case 'DeathClaim': return 'Death Claim';
      case 'WalletDepositRequest': return 'Wallet Deposit';
      case 'CashHandover': return 'Cash Handover';
      default: return this.entityType;
    }
  }

  viewDetails(): void {
    this.router.navigate(['/approvals/requests', this.task.request?.requestId], {
      queryParams: { from: 'my-tasks' }
    });
  }

  onApprove(): void {
    this.approve.emit({ executionId: this.task.executionId, comments: this.comments() });
  }

  onReject(): void {
    this.reject.emit({ executionId: this.task.executionId, comments: this.comments() });
  }

  updateComments(event: Event): void {
    this.comments.set((event.target as HTMLTextAreaElement).value);
  }
}
