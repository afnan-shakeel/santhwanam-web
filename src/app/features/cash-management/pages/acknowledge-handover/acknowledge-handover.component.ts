import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { CashManagementService } from '../../../../core/services/cash-management.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CashHandoverWithRelations } from '../../../../shared/models/cash-management.model';
import { HandoverStatusBadgeComponent } from '../../components/handover-status-badge/handover-status-badge.component';
import { RejectionModalComponent, RejectionData } from '../../components/rejection-modal/rejection-modal.component';

/**
 * AcknowledgeHandoverComponent
 * 
 * Screen 4: Acknowledge Handover
 * Route: /cash/handover/:id/acknowledge
 * Users: Unit Admin, Area Admin, Forum Admin, Super Admin
 * Purpose: View handover details and acknowledge or reject receipt
 */
@Component({
  selector: 'app-acknowledge-handover',
  standalone: true,
  imports: [CommonModule, HandoverStatusBadgeComponent, RejectionModalComponent],
  templateUrl: './acknowledge-handover.component.html',
  styleUrl: './acknowledge-handover.component.css'
})
export class AcknowledgeHandoverComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cashService = inject(CashManagementService);
  private toastService = inject(ToastService);

  // State
  handover = signal<CashHandoverWithRelations | null>(null);
  isLoading = signal<boolean>(true);
  isAcknowledging = signal<boolean>(false);
  showRejectionModal = signal<boolean>(false);

  private handoverId: string = '';

  ngOnInit(): void {
    this.handoverId = this.route.snapshot.paramMap.get('handoverId') || '';
    if (this.handoverId) {
      this.loadHandover();
    } else {
      this.router.navigate(['/cash/pending-receipts']);
    }
  }

  loadHandover(): void {
    this.isLoading.set(true);

    this.cashService.getHandoverById(this.handoverId).subscribe({
      next: (response) => {
        if (response) {
          this.handover.set(response);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading handover:', err);
        this.toastService.error('Failed to load handover details');
        this.router.navigate(['/cash/pending-receipts']);
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

  onAcknowledge(): void {
    if (!this.handover() || this.isAcknowledging()) return;

    this.isAcknowledging.set(true);

    this.cashService.acknowledgeHandover(this.handoverId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Cash received and acknowledged successfully');
          this.router.navigate(['/cash/my-custody']);
        }
        this.isAcknowledging.set(false);
      },
      error: (err) => {
        console.error('Error acknowledging handover:', err);
        const message = err.error?.message || 'Failed to acknowledge handover';
        this.toastService.error(message);
        this.isAcknowledging.set(false);
      }
    });
  }

  onReject(): void {
    this.showRejectionModal.set(true);
  }

  onRejectionConfirm(event: RejectionData): void {
    if (!this.handover()) return;

    this.showRejectionModal.set(false);

    this.cashService.rejectHandover(this.handoverId, {
      rejectionReason: event.additionalDetails
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Handover rejected');
          this.router.navigate(['/cash/pending-receipts']);
        }
      },
      error: (err) => {
        console.error('Error rejecting handover:', err);
        const message = err.error?.message || 'Failed to reject handover';
        this.toastService.error(message);
      }
    });
  }

  onRejectionCancel(): void {
    this.showRejectionModal.set(false);
  }

  onBack(): void {
    this.router.navigate(['/cash/pending-receipts']);
  }
}
