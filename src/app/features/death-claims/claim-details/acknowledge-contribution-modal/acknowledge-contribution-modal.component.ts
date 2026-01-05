import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ContributionsService } from '../../../../core/services/contributions.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MemberContribution } from '../../../../shared/models/death-claim.model';

@Component({
  selector: 'app-acknowledge-contribution-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent
  ],
  templateUrl: './acknowledge-contribution-modal.component.html',
  styleUrls: ['./acknowledge-contribution-modal.component.css']
})
export class AcknowledgeContributionModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contributionsService = inject(ContributionsService);
  private toastService = inject(ToastService);

  @Input({ required: true }) contribution!: MemberContribution;
  @Output() closeModal = new EventEmitter<void>();
  @Output() contributionAcknowledged = new EventEmitter<MemberContribution>();

  submitting = signal(false);
  error = signal<string | null>(null);

  acknowledgeForm: FormGroup = this.fb.group({
    transactionReference: ['', [Validators.required, Validators.minLength(3)]],
    notes: ['']
  });

  get memberName(): string {
    const member = this.contribution.member;
    return member ? `${member.firstName} ${member.lastName}` : 'Member';
  }

  ngOnInit(): void {
    // Pre-fill transaction reference if available from wallet debit request
    if (this.contribution.walletDebitRequestId) {
      this.acknowledgeForm.patchValue({
        transactionReference: this.contribution.walletDebitRequestId
      });
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.acknowledgeForm.invalid) {
      this.acknowledgeForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.acknowledgeForm.value;

    this.contributionsService.acknowledgeContribution(
      this.contribution.contributionId,
      {
        transactionReference: formValue.transactionReference,
        notes: formValue.notes || undefined
      }
    ).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.toastService.show({
          type: 'success',
          title: 'Contribution Acknowledged',
          message: `Payment acknowledged for ${this.memberName}.`
        });
        this.contributionAcknowledged.emit(response.data);
        this.onClose();
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.message || 'Failed to acknowledge contribution');
        this.toastService.show({
          type: 'error',
          title: 'Action Failed',
          message: err.message || 'Failed to acknowledge contribution'
        });
      }
    });
  }
}
