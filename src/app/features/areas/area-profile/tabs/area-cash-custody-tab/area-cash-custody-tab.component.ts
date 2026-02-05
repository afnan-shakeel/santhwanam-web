import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { CashManagementService } from '../../../../../core/services/cash-management.service';
import { CashCustody, CashHandoverWithRelations } from '../../../../../shared/models/cash-management.model';
@Component({
  selector: 'app-area-cash-custody-tab',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './area-cash-custody-tab.component.html',
  styleUrls: ['./area-cash-custody-tab.component.css']
})
export class AreaCashCustodyTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cashService = inject(CashManagementService);

  areaId = signal<string>('');
  isOwnProfile = signal<boolean>(false);
  loading = signal(true);
  custody = signal<CashCustody | null>(null);
  recentTransactions = signal<CashHandoverWithRelations[]>([]);

  currentBalance = computed(() => this.custody()?.currentBalance ?? 0);

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      if (params['areaId']) {
        this.areaId.set(params['areaId']);
      }
    });
    
    this.route.parent?.data.subscribe(data => {
      if (data['isOwnProfile'] !== undefined) {
        this.isOwnProfile.set(data['isOwnProfile']);
      }
      this.loadCustodyData();
    });
  }

  loadCustodyData(): void {
    this.loading.set(true);
    
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
      this.loading.set(false);
    }
  }

  loadRecentTransactions(): void {
    this.cashService.getMyInitiatedHandovers().subscribe({
      next: (response) => {
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
    return 'transfer';
  }

  getTransactionParty(transaction: CashHandoverWithRelations): string {
    return '→ ' + (transaction.toUser?.firstName + ' ' + transaction.toUser?.lastName);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Acknowledged': return '✓';
      case 'Initiated': return '⏳';
      case 'Rejected': return '✗';
      case 'Cancelled': return '⊘';
      default: return '?';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Acknowledged': return 'text-green-600';
      case 'Initiated': return 'text-yellow-600';
      case 'Rejected': return 'text-red-600';
      case 'Cancelled': return 'text-gray-400';
      default: return 'text-gray-500';
    }
  }
}
