import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { CashManagementService } from '../../../../../core/services/cash-management.service';
import { CashCustody, CashHandoverWithRelations } from '../../../../../shared/models/cash-management.model';
@Component({
  selector: 'app-forum-cash-custody-tab',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './forum-cash-custody-tab.component.html',
  styleUrls: ['./forum-cash-custody-tab.component.css']
})
export class ForumCashCustodyTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cashService = inject(CashManagementService);

  forumId = signal<string>('');
  isOwnProfile = signal<boolean>(false);
  loading = signal(true);
  custody = signal<CashCustody | null>(null);
  recentTransactions = signal<CashHandoverWithRelations[]>([]);

  // Computed values
  currentBalance = computed(() => this.custody()?.currentBalance ?? 0);

  ngOnInit(): void {
    // Get forumId and isOwnProfile from parent route data
    this.route.parent?.data.subscribe(data => {
      if (data['forumId']) {
        this.forumId.set(data['forumId']);
      }
      if (data['isOwnProfile'] !== undefined) {
        this.isOwnProfile.set(data['isOwnProfile']);
      }
      this.loadCustodyData();
    });
  }

  loadCustodyData(): void {
    this.loading.set(true);
    
    // Load custody for this user/entity
    // If own profile, use getMyCustody, otherwise we'd need the admin's userId
    if (this.isOwnProfile()) {
      this.cashService.getMyCustody().subscribe({
        next: (response) => {
          this.custody.set(response.custody);
          this.loadRecentTransactions();
        },
        error: (err) => {
          console.error('Error loading custody:', err);
          this.loading.set(false);
        }
      });
    } else {
      // For viewing another admin's profile, we would need their userId
      // This would be available from the profile data
      this.loading.set(false);
    }
  }

  loadRecentTransactions(): void {
    // Load recent transactions (handover history)
    this.cashService.getMyInitiatedHandovers().subscribe({
      next: (response) => {
        // Get last 5 transactions
        this.recentTransactions.set(response.items.slice(0, 5));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.loading.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTransactionType(transaction: CashHandoverWithRelations): 'received' | 'transfer' {
    // If the current admin is the receiver, it's a received transaction
    // Otherwise it's a transfer
    // For now, since we load initiated handovers, they are all transfers
    return 'transfer';
  }

  getTransactionParty(transaction: CashHandoverWithRelations): string {
    if (this.getTransactionType(transaction) === 'received') {
      return transaction.fromUser?.firstName + ' ' + transaction.fromUser?.lastName;
    } else {
      return '→ ' + (transaction.toUser?.firstName + ' ' + transaction.toUser?.lastName);
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Acknowledged':
        return '✓';
      case 'Initiated':
        return '⏳';
      case 'Rejected':
        return '✗';
      case 'Cancelled':
        return '⊘';
      default:
        return '?';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Acknowledged':
        return 'text-green-600';
      case 'Initiated':
        return 'text-yellow-600';
      case 'Rejected':
        return 'text-red-600';
      case 'Cancelled':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  }
}
