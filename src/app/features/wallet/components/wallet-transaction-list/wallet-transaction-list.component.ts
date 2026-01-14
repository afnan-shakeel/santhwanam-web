import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletTransaction, WalletTransactionType } from '../../../../shared/models/wallet.model';

/**
 * WalletTransactionListComponent
 * 
 * Shared presentational component for displaying wallet transactions.
 * Supports two display modes:
 * - compact: List view with minimal details (for overview/dashboard)
 * - full (default): Table view with all transaction details
 */
@Component({
  selector: 'app-wallet-transaction-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-transaction-list.component.html',
  styleUrl: './wallet-transaction-list.component.css'
})
export class WalletTransactionListComponent {
  @Input() transactions: WalletTransaction[] = [];
  @Input({ transform: booleanAttribute }) loading: boolean = false;
  @Input({ transform: booleanAttribute }) compact: boolean = false;

  // Transaction type icons
  getTransactionIcon(type: WalletTransactionType, status: string): string {
    if (status === 'Pending') return '⏳';
    if (status === 'Failed') return '❌';
    switch (type) {
      case 'Deposit': return '↑';
      case 'Debit': return '↓';
      case 'Refund': return '↩';
      case 'Adjustment': return '⚙';
      default: return '•';
    }
  }

  getTransactionLabel(type: WalletTransactionType): string {
    switch (type) {
      case 'Deposit': return 'Deposit';
      case 'Debit': return 'Contribution Debit';
      case 'Refund': return 'Refund';
      case 'Adjustment': return 'Manual Adjustment';
      default: return type;
    }
  }

  isCredit(type: WalletTransactionType): boolean {
    return type === 'Deposit' || type === 'Refund';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDateTime(dateString: string): string {
    return `${this.formatDate(dateString)} ${this.formatTime(dateString)}`;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Reversed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  }
}
