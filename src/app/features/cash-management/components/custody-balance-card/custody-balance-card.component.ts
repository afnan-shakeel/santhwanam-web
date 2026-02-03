import { Component, EventEmitter, Input, Output, booleanAttribute, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashManagementService } from '../../../../core/services/cash-management.service';

/**
 * CustodyBalanceCardComponent
 * 
 * Displays cash custody balance with optional action buttons.
 * Used in:
 * - My Cash Custody (personal view with transfer action)
 * - Custodian Details (admin view with send reminder action)
 */
@Component({
  selector: 'app-custody-balance-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custody-balance-card.component.html',
  styleUrl: './custody-balance-card.component.css'
})
export class CustodyBalanceCardComponent {
  private cashService = inject(CashManagementService);

  // Balance data
  @Input() balance: number = 0;
  @Input() totalReceived: number = 0;
  @Input() totalTransferred: number = 0;
  @Input() lastActivityDate: string | null = null;
  @Input({ transform: booleanAttribute }) isOverdue: boolean = false;

  // Action button visibility
  @Input({ transform: booleanAttribute }) showTransferButton: boolean = false;
  @Input({ transform: booleanAttribute }) showReminderButton: boolean = false;

  // Events
  @Output() initiateTransfer = new EventEmitter<void>();
  @Output() sendReminder = new EventEmitter<void>();

  formatCurrency(amount: number | string): string {
    return this.cashService.formatCurrency(amount);
  }

  getRelativeTime(dateString: string | null): string {
    if (!dateString) return 'No activity yet';
    return this.cashService.getRelativeTime(dateString);
  }
}
