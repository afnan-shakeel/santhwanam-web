import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { WalletService } from '../../../../core/services/wallet.service';
import {
  WalletWithMember,
  WalletTransaction,
  WalletTransactionType
} from '../../../../shared/models/wallet.model';

@Component({
  selector: 'app-wallet-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent
  ],
  templateUrl: './wallet-details-modal.component.html',
  styleUrls: ['./wallet-details-modal.component.css']
})
export class WalletDetailsModalComponent implements OnInit {
  private walletService = inject(WalletService);
  private router = inject(Router);

  @Input({ required: true }) wallet!: WalletWithMember;
  @Output() closeModal = new EventEmitter<void>();

  transactions = signal<WalletTransaction[]>([]);
  loading = signal(true);
  stats = signal<{ totalDeposits: number; totalDebits: number; pendingDeposits: number } | null>(null);

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.walletService.getTransactions(this.wallet.memberId, { limit: 10 }).subscribe({
      next: (response) => {
        this.transactions.set(response.transactions);

        // Calculate simple stats from transactions
        let totalDeposits = 0;
        let totalDebits = 0;
        let pendingDeposits = 0;

        response.transactions.forEach(txn => {
          if (txn.transactionType === 'Deposit') {
            if (txn.status === 'Completed') totalDeposits += txn.amount;
            if (txn.status === 'Pending') pendingDeposits += txn.amount;
          } else if (txn.transactionType === 'Debit') {
            totalDebits += txn.amount;
          }
        });

        this.stats.set({ totalDeposits, totalDebits, pendingDeposits });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load transactions:', err);
        this.loading.set(false);
      }
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  viewFullWallet(): void {
    this.onClose();
    this.router.navigate(['/members', this.wallet.memberId, 'wallet']);
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  }
}
