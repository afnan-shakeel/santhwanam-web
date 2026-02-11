import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DeathClaimsService } from '../../../../core/services/death-claims.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DeathClaim } from '../../../../shared/models/death-claim.model';

@Component({
  selector: 'app-submit-approval-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './submit-approval-modal.component.html',
  styleUrls: ['./submit-approval-modal.component.css']
})
export class SubmitApprovalModalComponent {
  private claimsService = inject(DeathClaimsService);
  private toastService = inject(ToastService);

  @Input({ required: true }) claim!: DeathClaim;
  @Output() closeModal = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<DeathClaim>();

  submitting = signal(false);

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    this.submitting.set(true);

    this.claimsService.submitClaim(this.claim.claimId).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.toastService.success('Success', 'Claim submitted for approval successfully');
        this.submitted.emit(response.data);
      },
      error: (error) => {
        this.submitting.set(false);
        console.error('Failed to submit claim:', error);
        this.toastService.error('Error', error?.error?.message || 'Failed to submit claim for approval');
      }
    });
  }

  get memberName(): string {
    if (this.claim.member) {
      return `${this.claim.member.firstName} ${this.claim.member.lastName}`;
    }
    return this.claim.memberName;
  }

  get benefitAmount(): string {
    const amount = this.claim.benefitAmount || this.claim.member?.tier?.deathBenefitAmount || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }
}
