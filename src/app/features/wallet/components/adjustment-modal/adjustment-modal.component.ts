import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { WalletService } from '../../../../core/services/wallet.service';
import { WalletAdjustmentRequest, AdjustmentType } from '../../../../shared/models/wallet.model';

@Component({
  selector: 'app-adjustment-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent
  ],
  templateUrl: './adjustment-modal.component.html',
  styleUrls: ['./adjustment-modal.component.css']
})
export class AdjustmentModalComponent {
  private fb = inject(FormBuilder);
  private walletService = inject(WalletService);

  @Input({ required: true }) walletId!: string;
  @Input() memberName?: string | null;
  @Input() currentBalance?: number;
  @Output() closeModal = new EventEmitter<void>();
  @Output() adjustmentCompleted = new EventEmitter<void>();

  submitting = signal(false);
  error = signal<string | null>(null);

  // Adjustment type options
  adjustmentTypes: { value: AdjustmentType; label: string; icon: string }[] = [
    { value: 'credit', label: 'Credit (Add funds)', icon: 'plus' },
    { value: 'debit', label: 'Debit (Deduct funds)', icon: 'minus' }
  ];

  adjustmentForm: FormGroup = this.fb.group({
    adjustmentType: ['credit', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
  });

  // Common adjustment reasons for quick selection
  commonReasons = [
    'Correction for duplicate transaction',
    'Refund for failed contribution',
    'Administrative adjustment',
    'System error correction'
  ];

  onClose(): void {
    this.closeModal.emit();
  }

  selectReason(reason: string): void {
    this.adjustmentForm.patchValue({ reason });
  }

  onSubmit(): void {
    if (this.adjustmentForm.invalid) {
      this.adjustmentForm.markAllAsTouched();
      return;
    }

    const formValue = this.adjustmentForm.value;

    // For debit, check if balance is sufficient
    if (formValue.adjustmentType === 'debit' && this.currentBalance !== undefined) {
      if (formValue.amount > this.currentBalance) {
        this.error.set('Insufficient balance for this debit amount.');
        return;
      }
    }

    this.submitting.set(true);
    this.error.set(null);

    const request: WalletAdjustmentRequest = {
      amount: formValue.amount,
      adjustmentType: formValue.adjustmentType,
      reason: formValue.reason
    };

    this.walletService.adjustWallet(this.walletId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.adjustmentCompleted.emit();
      },
      error: (err) => {
        console.error('Failed to adjust wallet:', err);
        this.error.set(err?.error?.message || 'Failed to adjust wallet. Please try again.');
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

  // Computed new balance preview
  get newBalancePreview(): number | null {
    if (this.currentBalance === undefined) return null;
    const amount = this.adjustmentForm.get('amount')?.value;
    if (!amount) return this.currentBalance;
    
    const type = this.adjustmentForm.get('adjustmentType')?.value;
    return type === 'credit' 
      ? this.currentBalance + amount 
      : this.currentBalance - amount;
  }
}
