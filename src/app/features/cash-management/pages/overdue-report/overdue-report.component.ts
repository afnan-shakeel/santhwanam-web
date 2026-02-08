import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CashManagementService } from '../../../../core/services/cash-management.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ToastService } from '../../../../core/services/toast.service';
import { OverdueReportItem } from '../../../../shared/models/cash-management.model';

/**
 * OverdueReportComponent
 * 
 * Screen 8: Overdue Report (Admin)
 * Route: /admin/cash/overdue
 * Users: Forum Admin, Super Admin
 * Purpose: Users holding cash beyond the threshold period
 */
@Component({
  selector: 'app-overdue-report',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './overdue-report.component.html',
  styleUrl: './overdue-report.component.css'
})
export class OverdueReportComponent implements OnInit {
  private cashService = inject(CashManagementService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  overdueItems = signal<OverdueReportItem[]>([]);
  isLoading = signal<boolean>(true);
  
  // Pagination
  currentPage = signal<number>(0);
  pageSize = signal<number>(20);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);

  // Expose Math for template
  Math = Math;

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);

    this.cashService.getOverdueReport({}).subscribe({
      next: (response) => {
        if (response.success) {
          // Map overdueUsers to OverdueReportItem format
          const items = response.data.overdueUsers.map((user: any) => ({
            userId: user.userId,
            firstName: user.userName.split(' ')[0] || user.userName,
            lastName: user.userName.split(' ').slice(1).join(' ') || '',
            role: user.userRole,
            currentBalance: user.currentBalance,
            daysOverdue: user.daysSinceLastTransaction,
            dueDate: user.lastTransactionAt || new Date().toISOString(),
            lastActivityDate: user.lastTransactionAt || new Date().toISOString(),
            scopeEntityName: user.unitName || user.areaName || undefined
          }));
          this.overdueItems.set(items);
          this.totalElements.set(response.data.summary.totalOverdueUsers);
          this.totalPages.set(1); // API doesn't support pagination
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading overdue report:', err);
        this.toastService.error('Failed to load overdue report');
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
      year: 'numeric'
    });
  }

  getSeverity(daysOverdue: number): 'low' | 'medium' | 'high' | 'critical' {
    if (daysOverdue <= 3) return 'low';
    if (daysOverdue <= 7) return 'medium';
    if (daysOverdue <= 14) return 'high';
    return 'critical';
  }

  getSeverityBadgeClass(daysOverdue: number): string {
    const severity = this.getSeverity(daysOverdue);
    switch (severity) {
      case 'low':
        return 'bg-yellow-100 text-yellow-700';
      case 'medium':
        return 'bg-orange-100 text-orange-700';
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'critical':
        return 'bg-red-600 text-white';
    }
  }

  onViewDetails(item: OverdueReportItem): void {
    this.router.navigate(['/admin/cash/custody', item.userId]);
  }

  onSendReminder(item: OverdueReportItem): void {
    this.cashService.sendReminder(item.userId).subscribe({
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

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadReport();
    }
  }

  onRefresh(): void {
    this.loadReport();
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

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'AGENT':
        return 'bg-blue-100 text-blue-700';
      case 'UNIT_ADMIN':
        return 'bg-green-100 text-green-700';
      case 'AREA_ADMIN':
        return 'bg-purple-100 text-purple-700';
      case 'FORUM_ADMIN':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
