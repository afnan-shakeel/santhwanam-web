import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { CashManagementService } from '../../../../core/services/cash-management.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CashCustodyWithRelations, CustodyActivity, CashHandoverWithRelations } from '../../../../shared/models/cash-management.model';
import { ActivityListComponent } from '../../components/activity-list/activity-list.component';
import { HandoverStatusBadgeComponent } from '../../components/handover-status-badge/handover-status-badge.component';

/**
 * CustodianDetailsComponent
 * 
 * Screen 9: Custodian Details (Admin)
 * Route: /admin/cash/custody/:custodyId
 * Users: Forum Admin, Super Admin
 * Purpose: View another user's cash custody details (third-person view)
 */
@Component({
  selector: 'app-custodian-details',
  standalone: true,
  imports: [
    CommonModule, 
    ActivityListComponent,
    HandoverStatusBadgeComponent
  ],
  templateUrl: './custodian-details.component.html',
  styleUrl: './custodian-details.component.css'
})
export class CustodianDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cashService = inject(CashManagementService);
  private toastService = inject(ToastService);

  // State
  custody = signal<CashCustodyWithRelations | null>(null);
  activities = signal<CustodyActivity[]>([]);
  pendingHandovers = signal<CashHandoverWithRelations[]>([]);
  isLoading = signal<boolean>(true);

  private custodyId: string = '';

  ngOnInit(): void {
    this.custodyId = this.route.snapshot.paramMap.get('custodyId') || '';
    if (this.custodyId) {
      this.loadData();
    } else {
      this.router.navigate(['/admin/cash/custody-report']);
    }
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load custody details
    this.cashService.getCustodianDetails(this.custodyId).subscribe({
      next: (response) => {
        if (response) {
          this.custody.set(response);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading custodian details:', err);
        this.toastService.error('Failed to load custodian details');
        this.router.navigate(['/admin/cash/custody-report']);
      }
    });

    // Load activity
    this.cashService.getCustodianActivity(this.custodyId, { size: 10 }).subscribe({
      next: (response) => {
        if (response) {
          this.activities.set(response.content);
        }
      },
      error: (err) => {
        console.error('Error loading activity:', err);
      }
    });

    // Load pending handovers
    this.cashService.getCustodianPendingHandovers(this.custodyId).subscribe({
      next: (response) => {
        if (response) {
          this.pendingHandovers.set(response.items);
          console.log('Pending handovers:', response.items);
        }
      },
      error: (err) => {
        console.error('Error loading pending handovers:', err);
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

  onSendReminder(): void {
    if (!this.custody()) return;

    this.cashService.sendReminder(this.custodyId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Reminder sent successfully');
        }
      },
      error: (err) => {
        console.error('Error sending reminder:', err);
        this.toastService.error('Failed to send reminder');
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/cash/custody-report']);
  }

  getScopeEntityName(): string | null {
    const c = this.custody();
    if (!c) return null;
    
    // Return the most specific scope entity name
    if (c.unit?.unitName) return c.unit.unitName;
    if (c.area?.areaName) return c.area.areaName;
    if (c.forum?.forumName) return c.forum.forumName;
    return null;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Agent':
        return 'bg-blue-100 text-blue-700';
      case 'UnitAdmin':
        return 'bg-green-100 text-green-700';
      case 'AreaAdmin':
        return 'bg-purple-100 text-purple-700';
      case 'ForumAdmin':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
