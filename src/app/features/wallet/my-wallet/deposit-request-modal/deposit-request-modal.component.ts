import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { WalletService } from '../../../../core/services/wallet.service';
import { CreateDepositRequest } from '../../../../shared/models/wallet.model';

@Component({
  selector: 'app-deposit-request-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent
  ],
  templateUrl: './deposit-request-modal.component.html',
  styleUrls: ['./deposit-request-modal.component.css']
})
export class DepositRequestModalComponent {
  private fb = inject(FormBuilder);
  private walletService = inject(WalletService);

  @Input({ required: true }) memberId!: string;
  @Output() closeModal = new EventEmitter<void>();
  @Output() depositCreated = new EventEmitter<void>();

  submitting = signal(false);
  error = signal<string | null>(null);

  depositForm: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(1)]],
    collectionDate: [this.getTodayDate(), [Validators.required]],
    notes: ['']
  });

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.depositForm.invalid) {
      this.depositForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.depositForm.value;
    const request: CreateDepositRequest = {
      amount: formValue.amount,
      collectionDate: new Date(formValue.collectionDate).toISOString(),
      notes: formValue.notes || undefined
    };

    this.walletService.createDepositRequest(this.memberId, request).subscribe({
      next: (depositRequest) => {
        // Auto-submit for approval after creating
        this.walletService.submitDepositRequest(depositRequest.depositRequestId).subscribe({
          next: () => {
            this.submitting.set(false);
            this.depositCreated.emit();
          },
          error: (err) => {
            console.error('Failed to submit deposit request:', err);
            // Still emit success since request was created
            this.submitting.set(false);
            this.depositCreated.emit();
          }
        });
      },
      error: (err) => {
        console.error('Failed to create deposit request:', err);
        this.error.set(err.error?.message || 'Failed to create deposit request. Please try again.');
        this.submitting.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
