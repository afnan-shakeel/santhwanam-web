import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashHandoverWithRelations, REJECTION_REASONS, RejectionReasonCode } from '../../../../shared/models/cash-management.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

export interface RejectionData {
  handover: CashHandoverWithRelations;
  reasonCode: RejectionReasonCode;
  additionalDetails: string;
}

/**
 * RejectionModalComponent
 * 
 * Modal for rejecting a cash handover with reason selection.
 */
@Component({
  selector: 'app-rejection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './rejection-modal.component.html',
  styleUrl: './rejection-modal.component.css'
})
export class RejectionModalComponent {
  @Input() isOpen: boolean = false;
  @Input() handover: CashHandoverWithRelations | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<RejectionData>();

  readonly rejectionReasons = REJECTION_REASONS;
  
  selectedReason = signal<RejectionReasonCode | ''>('');
  additionalDetails = signal<string>('');

  get isValid(): boolean {
    const reason = this.selectedReason();
    const details = this.additionalDetails().trim();
    
    if (!reason) return false;
    if (reason === 'other' && details.length < 5) return false;
    if (reason !== 'other' && details.length < 5) return false;
    
    return true;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  getUserFullName(user: { firstName: string; lastName: string }): string {
    return `${user.firstName} ${user.lastName}`;
  }

  onReasonChange(value: string): void {
    this.selectedReason.set(value as RejectionReasonCode);
  }

  onDetailsChange(value: string): void {
    this.additionalDetails.set(value);
  }

  onCancel(): void {
    this.reset();
    this.close.emit();
  }

  onConfirm(): void {
    if (!this.isValid || !this.handover) return;

    const reasonLabel = this.rejectionReasons.find(r => r.value === this.selectedReason())?.label || '';
    const fullReason = this.selectedReason() === 'other' 
      ? this.additionalDetails() 
      : `${reasonLabel}. ${this.additionalDetails()}`;

    this.confirm.emit({
      handover: this.handover,
      reasonCode: this.selectedReason() as RejectionReasonCode,
      additionalDetails: fullReason
    });

    this.reset();
  }

  private reset(): void {
    this.selectedReason.set('');
    this.additionalDetails.set('');
  }
}
