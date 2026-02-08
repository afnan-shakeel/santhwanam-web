import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashHandoverWithRelations } from '../../../../shared/models/cash-management.model';
import { CashManagementService } from '../../../../core/services/cash-management.service';
import { HandoverStatusBadgeComponent } from '../handover-status-badge/handover-status-badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

export type PendingHandoverDirection = 'outgoing' | 'incoming' | 'both';

/**
 * PendingHandoverListComponent
 * 
 * Displays a list of pending handovers.
 * Used in:
 * - My Cash Custody (outgoing only, with cancel action)
 * - Custodian Details (both incoming and outgoing, no actions)
 * - Pending Receipts (incoming only, with acknowledge action)
 */
@Component({
  selector: 'app-pending-handover-list',
  standalone: true,
  imports: [CommonModule, HandoverStatusBadgeComponent, ButtonComponent],
  templateUrl: './pending-handover-list.component.html',
  styleUrl: './pending-handover-list.component.css'
})
export class PendingHandoverListComponent {
  private cashService = inject(CashManagementService);

  @Input() title: string = 'Pending Handovers';
  @Input() handovers: CashHandoverWithRelations[] = [];
  @Input() direction: PendingHandoverDirection = 'outgoing';
  @Input() showCancelAction: boolean = false;
  @Input() showAcknowledgeAction: boolean = false;
  @Input() emptyMessage: string = 'No pending handovers';
  @Input() currentUserId: string = '';

  @Output() cancel = new EventEmitter<CashHandoverWithRelations>();
  @Output() acknowledge = new EventEmitter<CashHandoverWithRelations>();
  @Output() viewDetails = new EventEmitter<CashHandoverWithRelations>();

  formatCurrency(amount: number): string {
    return this.cashService.formatCurrency(amount);
  }

  getRelativeTime(dateString: string): string {
    return this.cashService.getRelativeTime(dateString);
  }

  getUserFullName(user: { firstName: string; lastName: string }): string {
    return this.cashService.getUserFullName(user);
  }

  getRoleDisplayName(roleCode: string): string {
    return this.cashService.getRoleDisplayName(roleCode);
  }

  isOutgoing(handover: CashHandoverWithRelations): boolean {
    return handover.fromUserId === this.currentUserId;
  }

  getFilteredHandovers(): CashHandoverWithRelations[] {
    if (this.direction === 'both') return this.handovers;
    if (this.direction === 'outgoing') {
      return this.handovers.filter(h => this.isOutgoing(h));
    }
    return this.handovers.filter(h => !this.isOutgoing(h));
  }
}
