import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { CashManagementService } from '../../../../../core/services/cash-management.service';
import { AgentService } from '../../../../../core/services/agent.service';
import { CashCustody, CashHandoverWithRelations } from '../../../../../shared/models/cash-management.model';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-agent-cash-custody-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent, IconComponent],
  templateUrl: './agent-cash-custody-tab.component.html',
  styleUrl: './agent-cash-custody-tab.component.css'
})
export class AgentCashCustodyTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cashService = inject(CashManagementService);
  private agentService = inject(AgentService);

  agentId = signal<string>('');
  isOwnProfile = signal<boolean>(false);
  loading = signal(true);
  custody = signal<CashCustody | null>(null);
  recentHandovers = signal<CashHandoverWithRelations[]>([]);
  pendingHandovers = signal<CashHandoverWithRelations[]>([]);

  // Computed values
  currentBalance = computed(() => this.custody()?.currentBalance ?? 0);

  ngOnInit(): void {
    // Get agentId from parent route params
    const agentId = this.route.parent?.snapshot.params['agentId'];
    if (agentId) {
      this.agentId.set(agentId);
      this.isOwnProfile.set(false);
      // For non-own profile, we can only show limited view
      this.loading.set(false);
    } else {
      // Own profile
      this.isOwnProfile.set(true);
      this.loadOwnCustody();
    }
  }

  private loadOwnCustody(): void {
    this.loading.set(true);
    
    this.cashService.getMyCustody().subscribe({
      next: (response) => {
        this.custody.set(response.custody);
        this.loadRecentHandovers();
        this.loadPendingHandovers();
      },
      error: (err) => {
        console.error('Error loading custody:', err);
        this.loading.set(false);
      }
    });
  }

  private loadRecentHandovers(): void {
    this.cashService.getHandoverHistory({ limit: 5 }).subscribe({
      next: (response) => {
        this.recentHandovers.set(response.items || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading handovers:', err);
        this.loading.set(false);
      }
    });
  }

  private loadPendingHandovers(): void {
    this.cashService.getPendingHandovers().subscribe({
      next: (response) => {
        this.pendingHandovers.set(response.incoming || []);
      },
      error: (err) => {
        console.error('Error loading pending handovers:', err);
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

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(date: string | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTransactionType(transaction: CashHandoverWithRelations): 'received' | 'sent' {
    // If fromUserId matches current user, it's a sent transaction
    // Otherwise it's received
    const userId = this.custody()?.userId;
    return transaction.fromUserId === userId ? 'sent' : 'received';
  }

  getTransactionParty(transaction: CashHandoverWithRelations): string {
    if (this.getTransactionType(transaction) === 'received') {
      return 'From: ' + transaction.fromUser?.firstName + ' ' + transaction.fromUser?.lastName;
    } else {
      return 'To: ' + transaction.toUser?.firstName + ' ' + transaction.toUser?.lastName;
    }
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
