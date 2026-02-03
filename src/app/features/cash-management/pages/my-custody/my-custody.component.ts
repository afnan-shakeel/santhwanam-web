import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CashManagementService } from '../../../../core/services/cash-management.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AccessStore } from '../../../../core/services/access.index';
import { 
  CashCustody, 
  CashHandoverWithRelations, 
  CustodyActivity 
} from '../../../../shared/models/cash-management.model';

import { 
  CustodyBalanceCardComponent,
  PendingHandoverListComponent,
  ActivityListComponent
} from '../../components';

/**
 * MyCustodyComponent
 * 
 * Screen 1: My Cash Custody
 * Route: /cash/my-custody
 * Users: Agent, Unit Admin, Area Admin, Forum Admin
 * Purpose: View own cash custody balance, recent activity, and pending handovers
 */
@Component({
  selector: 'app-my-custody',
  standalone: true,
  imports: [
    CommonModule,
    CustodyBalanceCardComponent,
    PendingHandoverListComponent,
    ActivityListComponent
  ],
  templateUrl: './my-custody.component.html',
  styleUrl: './my-custody.component.css'
})
export class MyCustodyComponent implements OnInit {
  private cashService = inject(CashManagementService);
  private toastService = inject(ToastService);
  private accessStore = inject(AccessStore);
  private router = inject(Router);

  // State
  custody = signal<CashCustody | null>(null);
  pendingHandovers = signal<CashHandoverWithRelations[]>([]);
  activities = signal<CustodyActivity[]>([]);
  
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // User info
  get currentUserId(): string {
    return this.accessStore.user()?.userId || '';
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load custody data
    this.cashService.getMyCustody().subscribe({
      next: (response) => {
        if (response) {
          this.custody.set(response.custody);
        }
      },
      error: (err) => {
        console.error('Error loading custody:', err);
        // If 404, user might not have custody yet - that's OK
        if (err.status !== 404) {
          this.error.set('Failed to load custody data');
        }
      }
    });

    // Load pending outgoing handovers
    this.cashService.getMyInitiatedHandovers().subscribe({
      next: (response) => {
        if (response.items) {
          // Filter only pending (Initiated) status
          const pending = response.items.filter(h => h.status === 'Initiated');
          this.pendingHandovers.set(pending);
        }
      },
      error: (err) => {
        console.error('Error loading pending handovers:', err);
      }
    });

    // Load recent activity
    this.cashService.getMyCustodyActivity({ limit: 10 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.activities.set(response.data.activities);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading activity:', err);
        this.isLoading.set(false);
      }
    });
  }

  onInitiateTransfer(): void {
    this.router.navigate(['/cash/handover/new']);
  }

  onCancelHandover(handover: CashHandoverWithRelations): void {
    if (!confirm(`Are you sure you want to cancel this handover of ${this.cashService.formatCurrency(handover.amount)}?`)) {
      return;
    }

    this.cashService.cancelHandover(handover.handoverId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Handover cancelled successfully');
          this.loadData(); // Refresh
        }
      },
      error: (err) => {
        console.error('Error cancelling handover:', err);
        this.toastService.error('Failed to cancel handover');
      }
    });
  }

  onViewHandoverDetails(handover: CashHandoverWithRelations): void {
    this.router.navigate(['/cash/handover', handover.handoverId, 'acknowledge']);
  }

  onViewFullHistory(): void {
    this.router.navigate(['/cash/handovers']);
  }
}
