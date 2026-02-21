import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApprovalExecution } from '../../../../shared/models/approval-workflow.model';

@Component({
  selector: 'app-approval-journey',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approval-journey.component.html',
  styleUrls: ['./approval-journey.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovalJourneyComponent {
  @Input() set executions(val: ApprovalExecution[] | undefined) { this._executions.set(val ?? []); }
  @Input() set currentUserId(val: string | undefined) { this._currentUserId.set(val ?? ''); }
  @Input() set currentStageOrder(val: number | null | undefined) { this._currentStageOrder.set(val ?? 0); }
  @Input() set requestedAt(val: Date | undefined) { this._requestedAt.set(val ?? new Date()); }

  private _executions = signal<ApprovalExecution[]>([]);
  private _currentUserId = signal<string>('');
  private _currentStageOrder = signal<number>(0);
  private _requestedAt = signal<Date>(new Date());

  readonly stages = computed(() =>
    [...this._executions()].sort((a, b) => a.stageOrder - b.stageOrder)
  );

  isCurrentUser(exec: ApprovalExecution): boolean {
    return !!this._currentUserId() && exec.assignedApprover?.userId === this._currentUserId();
  }

  getDotClass(exec: ApprovalExecution): string {
    switch (exec.status) {
      case 'Approved': return 'done';
      case 'Rejected': return 'rejected';
      default:
        return exec.stageOrder === this._currentStageOrder() ? 'current' : 'waiting';
    }
  }

  getDotIcon(exec: ApprovalExecution): string {
    switch (exec.status) {
      case 'Approved': return '✓';
      case 'Rejected': return '✕';
      default:
        return exec.stageOrder === this._currentStageOrder() ? '●' : '○';
    }
  }

  getDecisionBadge(exec: ApprovalExecution): { text: string; class: string } | null {
    switch (exec.status) {
      case 'Approved': return { text: 'Approved', class: 'bg-green-100 text-green-700' };
      case 'Rejected': return { text: 'Rejected', class: 'bg-red-100 text-red-700' };
      default:
        if (exec.stageOrder === this._currentStageOrder()) {
          return { text: 'Pending', class: 'bg-amber-100 text-amber-700' };
        }
        return { text: 'Waiting', class: 'bg-gray-50 text-gray-400 border border-gray-200' };
    }
  }

  getWaitingDuration(exec: ApprovalExecution): string | null {
    if (exec.status !== 'Pending' || exec.stageOrder !== this._currentStageOrder()) return null;
    const stages = this.stages();
    const prevStage = stages.find(s => s.stageOrder === exec.stageOrder - 1);
    const since = prevStage?.reviewedAt || this._requestedAt();
    if (!since) return null;

    const ms = Date.now() - new Date(since).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) return `${days}d ${remainingHours}h`;
    if (hours > 0) return `${hours}h`;
    return '<1h';
  }
}
