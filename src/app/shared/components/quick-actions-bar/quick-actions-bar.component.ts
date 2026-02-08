import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output
} from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import { BadgeComponent } from '../badge/badge.component';

export type QuickActionEntityType = 'forum' | 'area' | 'unit' | 'agent';

@Component({
  selector: 'app-quick-actions-bar',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ButtonComponent, BadgeComponent],
  templateUrl: './quick-actions-bar.component.html',
  styleUrl: './quick-actions-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionsBarComponent {
  // ═══════════════════════════════════════════════════════════════════════════
  // INPUTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Type of entity for context-specific actions */
  readonly entityType = input.required<QuickActionEntityType>();

  /** Current cash balance in custody */
  readonly cashBalance = input<number>(0);

  /** Number of pending cash receipts */
  readonly pendingReceiveCount = input<number>(0);

  /** Number of pending approvals (Forum only) */
  readonly pendingApprovalsCount = input<number>(0);

  /** Currency symbol for display */
  readonly currencyCode = input<string>('INR');

  /** Loading state */
  readonly isLoading = input<boolean>(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTPUTS
  // ═══════════════════════════════════════════════════════════════════════════

  readonly onReceiveCash = output<void>();
  readonly onTransferCash = output<void>();
  readonly onTransferToBank = output<void>();
  readonly onViewApprovals = output<void>();

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  /** Whether to show forum-specific actions */
  readonly showForumActions = computed(() => this.entityType() === 'forum');

  /** Whether there are pending receives */
  readonly hasPendingReceives = computed(() => this.pendingReceiveCount() > 0);

  /** Whether there are pending approvals */
  readonly hasPendingApprovals = computed(() => this.pendingApprovalsCount() > 0);

  /** Formatted balance for display */
  readonly formattedBalance = computed(() => {
    const balance = this.cashBalance();
    return balance ?? 0;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  handleReceiveCash(): void {
    this.onReceiveCash.emit();
  }

  handleTransferCash(): void {
    this.onTransferCash.emit();
  }

  handleTransferToBank(): void {
    this.onTransferToBank.emit();
  }

  handleViewApprovals(): void {
    this.onViewApprovals.emit();
  }
}
