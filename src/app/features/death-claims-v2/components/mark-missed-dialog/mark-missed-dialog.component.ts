import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ContributionsService } from '../../../../core/services/contributions.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MemberContribution } from '../../../../shared/models/death-claim.model';

@Component({
  selector: 'app-mark-missed-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal
      [id]="'mark-missed-dialog'"
      [title]="'Mark as Missed?'"
      [open]="open()"
      size="sm"
      (closed)="onClose()"
    >
      @if (contribution()) {
        <div class="space-y-4">
          <p class="text-sm text-gray-600 leading-relaxed">
            This will mark the contribution for
            <strong class="text-gray-900">
              {{ contribution()!.member ? (contribution()!.member!.firstName + ' ' + contribution()!.member!.lastName) : '—' }}
              ({{ contribution()!.member?.memberCode || '—' }})
            </strong>
            as missed for this cycle.
          </p>
          <p class="text-sm text-gray-500">
            This may affect the member's standing if consecutive misses occur.
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
              (click)="onClose()"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              [disabled]="submitting()"
              (click)="onConfirm()"
            >
              {{ submitting() ? 'Marking...' : 'Mark as Missed' }}
            </button>
          </div>
        </div>
      }
    </app-modal>
  `
})
export class MarkMissedDialogComponent {
  private contributionsService = inject(ContributionsService);
  private toastService = inject(ToastService);

  open = input.required<boolean>();
  contribution = input.required<MemberContribution | null>();

  closed = output<void>();
  marked = output<void>();

  submitting = signal(false);

  onClose(): void {
    this.closed.emit();
  }

  onConfirm(): void {
    const contrib = this.contribution();
    if (!contrib) return;

    this.submitting.set(true);
    this.contributionsService.markContributionMissed(contrib.contributionId).subscribe({
      next: () => {
        this.toastService.success('Contribution marked as missed');
        this.submitting.set(false);
        this.marked.emit();
      },
      error: () => {
        this.toastService.error('Failed to mark contribution as missed');
        this.submitting.set(false);
      }
    });
  }
}
