import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ContributionsService } from '../../../../core/services/contributions.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MemberContribution } from '../../../../shared/models/death-claim.model';
import { InputComponent } from "../../../../shared/components/input/input.component";
import { MemberContributionWithRelations } from '../../../../shared/models/contribution.model';

@Component({
  selector: 'app-record-cash-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent
],
  templateUrl: './record-cash-modal.component.html',
  styleUrls: ['./record-cash-modal.component.css']
})
export class RecordCashModalComponent {
  private fb = inject(FormBuilder);
  private contributionsService = inject(ContributionsService);
  private toastService = inject(ToastService);

  @Input({ required: true }) contribution!: MemberContribution | MemberContributionWithRelations;
  @Output() closeModal = new EventEmitter<void>();
  @Output() cashRecorded = new EventEmitter<MemberContribution>();

  submitting = signal(false);
  error = signal<string | null>(null);

  recordForm: FormGroup = this.fb.group({
    receiptNumber: [''],
    // notes: ['']
  });

  get memberName(): string {
    const member = this.contribution.member;
    return member ? `${member.firstName} ${member.lastName}` : 'Member';
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.recordForm.value;

    this.contributionsService.recordCashContribution(
      this.contribution.contributionId,
      {
        cashReceiptReference: formValue.receiptNumber || undefined,
        // notes: formValue.notes || undefined
      }
    ).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.toastService.show({
          type: 'success',
          title: 'Cash Recorded',
          message: `Cash collection recorded for ${this.memberName}.`
        });
        this.cashRecorded.emit(response.data);
        this.onClose();
      },
      error: (response) => {
        console.log("ERR",response.error)
        this.submitting.set(false);
        this.error.set(response.error?.error?.message || 'Failed to record cash collection');
        // this.toastService.show({
        //   type: 'error',
        //   title: 'Action Failed',
        //   message: err.message || 'Failed to record cash collection'
        // });
      }
    });
  }
}
