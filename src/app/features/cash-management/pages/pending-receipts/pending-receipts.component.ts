import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CashManagementService } from '../../../../core/services/cash-management.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CashHandoverWithRelations } from '../../../../shared/models/cash-management.model';
import { HandoverStatusBadgeComponent } from '../../components/handover-status-badge/handover-status-badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

/**
 * PendingReceiptsComponent
 * 
 * Screen 3: Pending Receipts
 * Route: /cash/pending-receipts
 * Users: Unit Admin, Area Admin, Forum Admin, Super Admin
 * Purpose: View incoming handovers that require acknowledgment
 */
@Component({
  selector: 'app-pending-receipts',
  standalone: true,
  imports: [CommonModule, HandoverStatusBadgeComponent, ButtonComponent],
  templateUrl: './pending-receipts.component.html',
  styleUrl: './pending-receipts.component.css'
})
export class PendingReceiptsComponent implements OnInit {
  private cashService = inject(CashManagementService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  pendingHandovers = signal<CashHandoverWithRelations[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadPendingReceipts();
  }

  loadPendingReceipts(): void {
    this.isLoading.set(true);

    this.cashService.getReceivedHandovers({ status: 'Initiated' }).subscribe({
      next: (response) => {
        if (response.items) {
          this.pendingHandovers.set(response.items);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading pending receipts:', err);
        this.toastService.error('Failed to load pending receipts');
        this.isLoading.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return this.cashService.formatCurrency(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }

  onAcknowledge(handover: CashHandoverWithRelations): void {
    console.log('Acknowledging handover:', handover.handoverId);
    this.router.navigate(['/cash/handover', handover.handoverId, 'acknowledge']).then(
      (x) => {
        // Navigation successful
        console.log('Navigation to acknowledge page successful', x);
      }, (err) => {
        console.error('Navigation error:', err);
      }
    )
  }

  onRefresh(): void {
    this.loadPendingReceipts();
  }

  getTotalAmount(): number {
    return this.pendingHandovers().reduce((sum, h) => sum + h.amount, 0);
  }
}
