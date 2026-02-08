import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CashManagementService } from '../../../../core/services/cash-management.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CustodyReportItem, UserRole } from '../../../../shared/models/cash-management.model';
import { SelectComponent } from '../../../../shared/components/select/select.component';

/**
 * CustodyReportComponent
 * 
 * Screen 7: Custody Report (Admin)
 * Route: /admin/cash/custody-report
 * Users: Forum Admin, Super Admin
 * Purpose: Detailed list of all users with cash custody
 */
@Component({
  selector: 'app-custody-report',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  templateUrl: './custody-report.component.html',
  styleUrl: './custody-report.component.css'
})
export class CustodyReportComponent implements OnInit {
  private cashService = inject(CashManagementService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  custodians = signal<CustodyReportItem[]>([]);
  isLoading = signal<boolean>(true);
  
  // Filters
  roleFilter = signal<UserRole | ''>('');
  searchQuery = signal<string>('');
  
  // Pagination
  currentPage = signal<number>(0);
  pageSize = signal<number>(20);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);

  // Role options
  roleOptions: { value: UserRole | '', label: string }[] = [
    { value: '', label: 'All Roles' },
    { value: 'AGENT', label: 'Agent' },
    { value: 'UNIT_ADMIN', label: 'Unit Admin' },
    { value: 'AREA_ADMIN', label: 'Area Admin' },
    { value: 'FORUM_ADMIN', label: 'Forum Admin' }
  ];

  // Expose Math for template
  Math = Math;

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);

    const params: any = {
      page: this.currentPage(),
      size: this.pageSize()
    };

    if (this.roleFilter()) {
      params.role = this.roleFilter();
    }

    this.cashService.getCustodyReport(params).subscribe({
      next: (response) => {
        if (response) {
          this.custodians.set(response.items);
          this.totalElements.set(response.pagination.total);
          this.totalPages.set(response.pagination.totalPages);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading custody report:', err);
        this.toastService.error('Failed to load custody report');
        this.isLoading.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return this.cashService.formatCurrency(amount);
  }

  formatDate(dateString: string | null): string {
    return dateString ? new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : '';
  }

  getDaysHeld(dateString: string | null): number {
    if (!dateString) {
      return 0;
    }
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / 86400000);
  }

  onRoleFilterChange(role: string | null): void {
    this.roleFilter.set((role ?? '') as UserRole | '');
    this.currentPage.set(0);
    this.loadReport();
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadReport();
    }
  }

  onViewDetails(custodian: CustodyReportItem): void {
    this.router.navigate(['/admin/cash/custody', custodian.custodyId]).then(
      (res)=> {},
      (err)=> {console.error('Navigation error:', err);}
    );
  }

  onSendReminder(custodian: CustodyReportItem): void {
    this.cashService.sendReminder(custodian.userId).subscribe({
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
