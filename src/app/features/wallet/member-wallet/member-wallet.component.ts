import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { WalletService } from '../../../core/services/wallet.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  WalletSummary,
  WalletTransaction,
  WalletTransactionType
} from '../../../shared/models/wallet.model';
import { DepositRequestModalComponent } from '../my-wallet/deposit-request-modal/deposit-request-modal.component';

@Component({
  selector: 'app-member-wallet',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    DepositRequestModalComponent
  ],
  templateUrl: './member-wallet.component.html',
  styleUrls: ['./member-wallet.component.css']
})
export class MemberWalletComponent implements OnInit {
  private walletService = inject(WalletService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  memberId = signal<string>('');
  wallet = signal<WalletSummary | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showDepositModal = signal(false);

  // Breadcrumbs (will be updated after loading wallet)
  breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Members', route: '/members' },
    { label: 'Wallet', current: true }
  ]);

  // Computed values
  isLowBalance = computed(() => {
    const w = this.wallet();
    return w ? w.alerts?.isLowBalance ?? w.currentBalance < 200 : false;
  });

  recommendedTopUp = computed(() => {
    const w = this.wallet();
    return w?.alerts?.recommendedTopUp ?? 500;
  });

  memberName = computed(() => {
    const w = this.wallet();
    return w?.memberName || 'Member';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('memberId');
    if (id) {
      this.memberId.set(id);
      this.loadWallet();
    } else {
      this.error.set('Member ID not found');
      this.loading.set(false);
    }
  }

  loadWallet(): void {
    this.loading.set(true);
    this.error.set(null);

    this.walletService.getWalletSummary(this.memberId()).subscribe({
      next: (data) => {
        this.wallet.set(data);
        this.loading.set(false);

        // Update breadcrumbs with member info
        this.breadcrumbs.set([
          { label: 'Members', route: '/members' },
          { label: data.memberName || data.memberCode || 'Member', route: `/members/${this.memberId()}/edit` },
          { label: 'Wallet', current: true }
        ]);
      },
      error: (err) => {
        console.error('Failed to load wallet:', err);
        this.error.set('Failed to load wallet. Please try again.');
        this.loading.set(false);
      }
    });
  }

  openDepositModal(): void {
    this.showDepositModal.set(true);
  }

  closeDepositModal(): void {
    this.showDepositModal.set(false);
  }

  onDepositRequestCreated(): void {
    this.closeDepositModal();
    this.loadWallet();
    this.toastService.success('Deposit request submitted successfully');
  }

  viewAllTransactions(): void {
    this.router.navigate(['/members', this.memberId(), 'wallet', 'transactions']);
  }

  goBack(): void {
    this.router.navigate(['/members', this.memberId(), 'profile']);
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
      case 'Debit': return 'Contribution Deducted';
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
      day: 'numeric',
      year: 'numeric'
    });
  }
}
