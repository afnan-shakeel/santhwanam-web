import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CashManagementService } from '../../../../core/services/cash-management.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CashDashboardResponse, CashDashboardByLevel } from '../../../../shared/models/cash-management.model';

/**
 * CashDashboardComponent
 * 
 * Screen 6: Cash Dashboard (Admin)
 * Route: /admin/cash/dashboard
 * Users: Forum Admin, Super Admin
 * Purpose: Overview of cash management statistics
 */
@Component({
  selector: 'app-cash-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cash-dashboard.component.html',
  styleUrl: './cash-dashboard.component.css'
})
export class CashDashboardComponent implements OnInit {
  private cashService = inject(CashManagementService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  dashboard = signal<CashDashboardResponse | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);

    this.cashService.getCashDashboard().subscribe({
      next: (response) => {
        if (response) {
          this.dashboard.set(response);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.toastService.error('Failed to load dashboard');
        this.isLoading.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return this.cashService.formatCurrency(amount);
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelativeTime(dateString: string): string {
    return this.cashService.getRelativeTime(dateString);
  }

  hasLevelData(): boolean {
    const d = this.dashboard();
    return d !== null && d.byLevel !== null && Object.keys(d.byLevel).length > 0;
  }

  getLevelEntries(): Array<{ key: string; value: { count: number; totalBalance: number; glAccountCode: string } }> {
    const d = this.dashboard();
    if (!d || !d.byLevel) return [];
    return Object.entries(d.byLevel).map(([key, value]) => ({ key, value }));
  }

  formatLevelName(level: string): string {
    const nameMap: Record<string, string> = {
      'Agent': 'Agents',
      'UnitAdmin': 'Unit Admins',
      'AreaAdmin': 'Area Admins',
      'ForumAdmin': 'Forum Admins',
      'agent': 'Agents',
      'unit_admin': 'Unit Admins',
      'area_admin': 'Area Admins',
      'forum_admin': 'Forum Admins',
    };
    return nameMap[level] || level;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  onRefresh(): void {
    this.loadDashboard();
  }
}
