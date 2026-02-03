import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CashManagementService } from '../../../../core/services/cash-management.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CashHandoverWithRelations } from '../../../../shared/models/cash-management.model';
import { HandoverStatusBadgeComponent } from '../../components/handover-status-badge/handover-status-badge.component';

/**
 * HandoverHistoryComponent
 * 
 * Screen 5: Handover History
 * Route: /cash/handovers
 * Users: All authenticated users
 * Purpose: View history of all handovers (sent and received) with filters
 */
@Component({
  selector: 'app-handover-history',
  standalone: true,
  imports: [CommonModule, FormsModule, HandoverStatusBadgeComponent],
  templateUrl: './handover-history.component.html',
  styleUrl: './handover-history.component.css'
})
export class HandoverHistoryComponent implements OnInit {
  private cashService = inject(CashManagementService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Expose Math for template
  Math = Math;

  // State
  handovers = signal<CashHandoverWithRelations[]>([]);
  isLoading = signal<boolean>(true);
  
  // Filters
  activeTab = signal<'all' | 'sent' | 'received'>('all');
  statusFilter = signal<string>('');
  
  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);

  // Status options for filter
  statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'All Statuses' },
    { value: 'Initiated', label: 'Initiated' },
    { value: 'Acknowledged', label: 'Acknowledged' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  ngOnInit(): void {
    this.loadHandovers();
  }

  loadHandovers(): void {
    this.isLoading.set(true);

    const params: any = {
      page: this.currentPage(),
      size: this.pageSize()
    };

    if (this.statusFilter()) {
      params.status = this.statusFilter();
    }

    const tab = this.activeTab();
    let apiCall;

    if (tab === 'sent') {
      params.direction = 'sent';
    } else if (tab === 'received') {
      params.direction = 'received';
    } else {
      params.direction = 'all';
    }

    apiCall = this.cashService.getHandoverHistory(params);

    apiCall.subscribe({
      next: (response) => {
        if (response) {
          this.handovers.set(response.items);
          this.totalElements.set(response.pagination.total);
          this.totalPages.set(response.pagination.totalPages);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading handovers:', err);
        this.toastService.error('Failed to load handover history');
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

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onTabChange(tab: 'all' | 'sent' | 'received'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadHandovers();
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadHandovers();
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadHandovers();
    }
  }

  onViewDetails(handover: CashHandoverWithRelations): void {
    // Navigate to acknowledge page if pending, otherwise just show details
    if (handover.status === 'Initiated') {
      this.router.navigate(['/cash/handover', handover.handoverId, 'acknowledge']);
    }
  }

  getCounterparty(handover: CashHandoverWithRelations): { name: string; role: string; isFrom: boolean } {
    const tab = this.activeTab();
    
    if (tab === 'received') {
      return {
        name: `${handover.fromUser.firstName} ${handover.fromUser.lastName}`,
        role: handover.fromUserRole,
        isFrom: true
      };
    }
    
    return {
      name: `${handover.toUser.firstName} ${handover.toUser.lastName}`,
      role: handover.toUserRole,
      isFrom: false
    };
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
