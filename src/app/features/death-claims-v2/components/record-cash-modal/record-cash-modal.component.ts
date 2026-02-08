import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ContributionsService } from '../../../../core/services/contributions.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MemberContribution } from '../../../../shared/models/death-claim.model';

@Component({
  selector: 'app-record-cash-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal
      [id]="'record-cash-modal'"
      [title]="'Record Cash Collection'"
      [open]="open()"
      size="sm"
      (closed)="onClose()"
    >
      @if (contribution()) {
        <div class="space-y-4">
          <!-- Info -->
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Member</span>
              <span class="font-medium text-gray-900">
                {{ contribution()!.member ? (contribution()!.member!.firstName + ' ' + contribution()!.member!.lastName) : '—' }}
                ({{ contribution()!.member?.memberCode || '—' }})
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Cycle</span>
              <span class="font-medium text-gray-900">{{ contribution()!.cycleId || '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Amount</span>
              <span class="font-semibold text-gray-900">OMR {{ contribution()!.expectedAmount | number:'1.3-3' }}</span>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Payment Reference -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Payment Reference (optional)</label>
            <input
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter receipt or reference number"
              [(ngModel)]="paymentReference"
            />
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 pt-2">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
              (click)="onClose()"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              [disabled]="submitting()"
              (click)="onConfirm()"
            >
              {{ submitting() ? 'Recording...' : 'Confirm Collection' }}
            </button>
          </div>
        </div>
      }
    </app-modal>
  `
})
export class RecordCashModalV2Component {
  private contributionsService = inject(ContributionsService);
  private toastService = inject(ToastService);

  open = input.required<boolean>();
  contribution = input.required<MemberContribution | null>();

  closed = output<void>();
  recorded = output<void>();

  paymentReference = '';
  submitting = signal(false);

  onClose(): void {
    this.paymentReference = '';
    this.closed.emit();
  }

  onConfirm(): void {
    const contrib = this.contribution();
    if (!contrib) return;

    this.submitting.set(true);
    this.contributionsService.recordCashContribution(
      contrib.contributionId,
      { cashReceiptReference: this.paymentReference || undefined }
    ).subscribe({
      next: () => {
        this.toastService.success('Cash collection recorded successfully');
        this.submitting.set(false);
        this.paymentReference = '';
        this.recorded.emit();
      },
      error: () => {
        this.toastService.error('Failed to record cash collection');
        this.submitting.set(false);
      }
    });
  }
}
