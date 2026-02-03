import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CashManagementService } from '../../../../core/services/cash-management.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CashHandoverWithRelations, PendingBankDeposit } from '../../../../shared/models/cash-management.model';

/**
 * PendingBankDepositsComponent
 * 
 * Screen 10: Pending Bank Deposits (Super Admin)
 * Route: /admin/cash/pending-bank-deposits
 * Users: Super Admin
 * Purpose: View and approve bank deposit requests
 */
@Component({
  selector: 'app-pending-bank-deposits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-bank-deposits.component.html',
  styleUrl: './pending-bank-deposits.component.css'
})
export class PendingBankDepositsComponent implements OnInit {
  private cashService = inject(CashManagementService);
  private toastService = inject(ToastService);

  // State
  deposits = signal<PendingBankDeposit[]>([]);
  isLoading = signal<boolean>(true);
  processingId = signal<string | null>(null);
  
  // Pagination
  currentPage = signal<number>(0);
  pageSize = signal<number>(20);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);

  // Expose Math for template
  Math = Math;

  ngOnInit(): void {
    this.loadDeposits();
  }

  loadDeposits(): void {
    this.isLoading.set(true);

    this.cashService.getPendingBankDeposits().subscribe({
      next: (response) => {
        if (response.success) {
          // Map handovers to PendingBankDeposit format for display
          const deposits: PendingBankDeposit[] = response.data.map((handover: CashHandoverWithRelations) => ({
            depositId: handover.handoverId,
            depositorName: `${handover.fromUser.firstName} ${handover.fromUser.lastName}`,
            depositorRole: handover.fromUserRole,
            amount: handover.amount,
            bankName: 'N/A', // These would come from extended handover data
            accountNumber: 'N/A',
            referenceNumber: handover.handoverNumber,
            depositDate: handover.initiatedAt,
            notes: handover.initiatorNotes || undefined,
            createdAt: handover.initiatedAt
          }));
          this.deposits.set(deposits);
          this.totalElements.set(deposits.length);
          this.totalPages.set(1);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading pending deposits:', err);
        this.toastService.error('Failed to load pending deposits');
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

  onApprove(deposit: PendingBankDeposit): void {
    if (this.processingId()) return;

    this.processingId.set(deposit.depositId);

    this.cashService.approveBankDeposit(deposit.depositId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Bank deposit approved');
          this.loadDeposits(); // Refresh list
        }
        this.processingId.set(null);
      },
      error: (err) => {
        console.error('Error approving deposit:', err);
        const message = err.error?.message || 'Failed to approve deposit';
        this.toastService.error(message);
        this.processingId.set(null);
      }
    });
  }

  onReject(deposit: PendingBankDeposit): void {
    if (this.processingId()) return;

    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    this.processingId.set(deposit.depositId);

    this.cashService.rejectBankDeposit(deposit.depositId, { reason }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Bank deposit rejected');
          this.loadDeposits(); // Refresh list
        }
        this.processingId.set(null);
      },
      error: (err) => {
        console.error('Error rejecting deposit:', err);
        const message = err.error?.message || 'Failed to reject deposit';
        this.toastService.error(message);
        this.processingId.set(null);
      }
    });
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadDeposits();
    }
  }

  onRefresh(): void {
    this.loadDeposits();
  }

  getPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    let start = Math.max(0, current - 2);
    let end = Math.min(total - 1, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
