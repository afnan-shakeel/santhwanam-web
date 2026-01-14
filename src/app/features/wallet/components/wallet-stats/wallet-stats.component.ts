import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Stats interface for wallet statistics display
 */
export interface WalletStatsData {
  totalDeposits: number;
  totalDebits: number;
  pendingDeposits: number;
  transactionCount: number;
}

/**
 * WalletStatsComponent
 * 
 * Shared presentational component displaying wallet quick statistics.
 * Shows 4 stat cards: Total Deposits, Total Debits, Pending Deposits, Transaction Count
 */
@Component({
  selector: 'app-wallet-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-stats.component.html',
  styleUrl: './wallet-stats.component.css'
})
export class WalletStatsComponent {
  @Input() stats: WalletStatsData | null = null;

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
