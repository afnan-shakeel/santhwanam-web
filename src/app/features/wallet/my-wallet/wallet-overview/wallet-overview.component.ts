import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { WalletStore } from '../../../../core/state/wallet.store';
import { WalletTransactionType } from '../../../../shared/models/wallet.model';
import { WalletStatsComponent } from '../../components/wallet-stats/wallet-stats.component';
import { WalletTransactionListComponent } from '../../components/wallet-transaction-list/wallet-transaction-list.component';

@Component({
  selector: 'app-wallet-overview',
  standalone: true,
  imports: [CommonModule, WalletStatsComponent, WalletTransactionListComponent],
  templateUrl: './wallet-overview.component.html',
  styleUrls: ['./wallet-overview.component.css']
})
export class WalletOverviewComponent implements OnInit {
  private walletStore = inject(WalletStore);
  private router = inject(Router);

  // Get data from store
  wallet = this.walletStore.wallet;
  stats = this.walletStore.stats;
  recentTransactions = this.walletStore.recentTransactions;

  ngOnInit(): void {
    // Data is loaded by parent component
  }

  viewAllTransactions(): void {
    this.router.navigate(['/my-wallet/transactions']);
  }

  // Helper methods for template
  getTransactionIcon(type: WalletTransactionType, status: string): string {
    if (status === 'Pending') return '🕐';
    switch (type) {
      case 'Deposit': return '✅';
      case 'Debit': return '↓';
      case 'Refund': return '↩️';
      case 'Adjustment': return '⚙️';
      default: return '•';
    }
  }

  getTransactionLabel(type: WalletTransactionType): string {
    switch (type) {
      case 'Deposit': return 'Deposit';
      case 'Debit': return 'Contribution';
      case 'Refund': return 'Refund';
      case 'Adjustment': return 'Adjustment';
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
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  }
}
