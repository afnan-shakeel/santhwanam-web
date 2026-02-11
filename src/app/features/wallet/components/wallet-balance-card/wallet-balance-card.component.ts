import { Component, EventEmitter, Input, Output, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletStatsData } from '../wallet-stats/wallet-stats.component';

/**
 * WalletBalanceCardComponent
 * 
 * Shared presentational component displaying wallet balance with contextual actions.
 * Redesigned: white card with gradient top border, inline stats row.
 */
@Component({
  selector: 'app-wallet-balance-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-balance-card.component.html',
  styleUrl: './wallet-balance-card.component.css'
})
export class WalletBalanceCardComponent {
  // Balance data
  @Input() balance: number = 0;
  @Input({ transform: booleanAttribute }) isLowBalance: boolean = false;
  @Input() recommendedTopUp: number = 0;
  @Input() stats: WalletStatsData | null = null;

  // Action button visibility
  @Input({ transform: booleanAttribute }) showRequestDeposit: boolean = false;
  @Input({ transform: booleanAttribute }) showRecordDeposit: boolean = false;
  @Input({ transform: booleanAttribute }) showAdjustment: boolean = false;

  // Events
  @Output() requestDeposit = new EventEmitter<void>();
  @Output() recordDeposit = new EventEmitter<void>();
  @Output() adjust = new EventEmitter<void>();

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
