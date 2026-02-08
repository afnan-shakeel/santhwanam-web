import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { CashManagementService } from '../../../../../core/services/cash-management.service';
import { AccessService } from '../../../../../core/services/access.service';
import { CashCustody, CashHandoverWithRelations } from '../../../../../shared/models/cash-management.model';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-area-cash-custody-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent],
  templateUrl: './area-cash-custody-tab.component.html',
  styleUrls: ['./area-cash-custody-tab.component.css']
})
export class AreaCashCustodyTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cashService = inject(CashManagementService);
  private accessService = inject(AccessService);

  areaId = signal<string>('');
  loading = signal(true);
  custody = signal<CashCustody | null>(null);
  pendingHandovers = signal<CashHandoverWithRelations[]>([]);
  recentTransactions = signal<CashHandoverWithRelations[]>([]);

  currentBalance = computed(() => this.custody()?.currentBalance ?? 0);
  
  /** Computed isOwnProfile using AccessService */
  isOwnProfile = computed(() => {
    const id = this.areaId();
    if (!id) return false;
    return this.accessService.isOwnEntity('area', id);
  });

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      if (params['areaId']) {
        this.areaId.set(params['areaId']);
        this.loadCustodyData();
      }
    });
  }

  loadCustodyData(): void {
    this.loading.set(true);
    
    if (this.isOwnProfile()) {
      this.cashService.getMyCustody().subscribe({
        next: (response) => {
          this.custody.set(response.custody);
          this.loadPendingHandovers();
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

  loadPendingHandovers(): void {
    this.cashService.getPendingHandovers().subscribe({
      next: (response) => {
        this.pendingHandovers.set(response.incoming || []);
      },
      error: (err) => {
        console.error('Error loading pending handovers:', err);
      }
    });
  }

  loadRecentTransactions(): void {
    this.cashService.getHandoverHistory({ limit: 5 }).subscribe({
      next: (response) => {
        this.recentTransactions.set(response.items || []);
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

  getTransactionParty(transaction: CashHandoverWithRelations, type: 'from' | 'to' = 'to'): string {
    if (type === 'from') {
      return transaction.fromUser?.firstName + ' ' + transaction.fromUser?.lastName;
    }
    return transaction.toUser?.firstName + ' ' + transaction.toUser?.lastName;
  }

  getStatusBadgeColor(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'Acknowledged': return 'success';
      case 'Initiated': return 'warning';
      case 'Rejected': return 'danger';
      case 'Cancelled': return 'neutral';
      default: return 'neutral';
    }
  }
}
