import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { WalletService } from '../../../../core/services/wallet.service';
import { CreateDepositRequest } from '../../../../shared/models/wallet.model';

@Component({
  selector: 'app-record-deposit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent
  ],
  templateUrl: './record-deposit-modal.component.html',
  styleUrls: ['./record-deposit-modal.component.css']
})
export class RecordDepositModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private walletService = inject(WalletService);

  @Input({ required: true }) memberId!: string;
  @Input() memberName?: string | null;
  @Input() recommendedAmount?: number;
  @Output() closeModal = new EventEmitter<void>();
  @Output() depositRecorded = new EventEmitter<void>();

  submitting = signal(false);
  error = signal<string | null>(null);

  // Suggested deposit amounts
  suggestedAmounts = [500, 1000, 2000, 5000];
  selectedAmount = signal<number | null>(null);

  depositForm: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(1)]],
    collectionDate: [this.getTodayDate(), [Validators.required]],
    notes: ['']
  });

  ngOnInit(): void {
    // If we have a recommended amount from low balance warning, preselect it
    if (this.recommendedAmount && this.recommendedAmount > 0) {
      // Find the closest suggested amount that covers the recommendation
      const closestAmount = this.suggestedAmounts.find(a => a >= this.recommendedAmount!) || this.suggestedAmounts[this.suggestedAmounts.length - 1];
      this.selectAmount(closestAmount);
    }
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  selectAmount(amount: number): void {
    this.selectedAmount.set(amount);
    this.depositForm.patchValue({ amount });
  }

  onAmountInputChange(): void {
    // Clear the selected amount button if user types a custom amount
    const inputAmount = this.depositForm.get('amount')?.value;
    if (!this.suggestedAmounts.includes(inputAmount)) {
      this.selectedAmount.set(null);
    } else {
      this.selectedAmount.set(inputAmount);
    }
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
            this.depositRecorded.emit();
          },
          error: (err) => {
            console.error('Failed to submit deposit request:', err);
            // Still consider the deposit created, just not submitted
            this.submitting.set(false);
            this.depositRecorded.emit();
          }
        });
      },
      error: (err) => {
        console.error('Failed to create deposit request:', err);
        this.error.set(err?.error?.message || 'Failed to record deposit. Please try again.');
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
