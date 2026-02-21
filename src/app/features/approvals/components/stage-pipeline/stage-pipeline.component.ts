import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApprovalExecution } from '../../../../shared/models/approval-workflow.model';

@Component({
  selector: 'app-stage-pipeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stage-pipeline.component.html',
  styleUrls: ['./stage-pipeline.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StagePipelineComponent {
  @Input() set executions(val: ApprovalExecution[] | undefined) { this._executions.set(val ?? []); }
  @Input() set currentStageOrder(val: number | null | undefined) { this._currentStageOrder.set(val ?? 0); }
  @Input() set currentUserId(val: string | undefined) { this._currentUserId.set(val ?? ''); }
  @Input() set mode(val: 'horizontal' | 'vertical' | 'auto') { this._mode.set(val); }

  private _executions = signal<ApprovalExecution[]>([]);
  private _currentStageOrder = signal<number>(0);
  private _currentUserId = signal<string>('');
  private _mode = signal<'horizontal' | 'vertical' | 'auto'>('auto');

  readonly stages = computed(() =>
    [...this._executions()].sort((a, b) => a.stageOrder - b.stageOrder)
  );

  readonly displayMode = computed(() => {
    const m = this._mode();
    if (m !== 'auto') return m;
    return this.stages().length <= 3 ? 'horizontal' : 'vertical';
  });

  isCurrentStage(stage: ApprovalExecution): boolean {
    return stage.stageOrder === this._currentStageOrder();
  }

  isCurrentUser(stage: ApprovalExecution): boolean {
    return !!this._currentUserId() && stage.assignedApproverId === this._currentUserId();
  }

  getStatusIcon(stage: ApprovalExecution): string {
    switch (stage.status) {
      case 'Approved': return '✓';
      case 'Rejected': return '✕';
      default:
        return this.isCurrentStage(stage) ? '●' : '○';
    }
  }

  getStatusClass(stage: ApprovalExecution): string {
    switch (stage.status) {
      case 'Approved': return 'done';
      case 'Rejected': return 'rejected';
      default:
        return this.isCurrentStage(stage) ? 'current' : 'waiting';
    }
  }

  isConnectorDone(index: number): boolean {
    const stages = this.stages();
    return index < stages.length - 1 && stages[index].status === 'Approved';
  }
}
