import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { WalletService } from '../../../../../core/services/wallet.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Wallet } from '../../../../../shared/models/wallet.model';
import { InputComponent } from "../../../../../shared/components/input/input.component";
import { ButtonComponent } from "../../../../../shared/components/button/button.component";

// Extended interface for low balance with tier info (if available from API)
interface LowBalanceWallet extends Wallet {
  shortfall?: number;
}

// Agent summary for the "Summary by Agent" section
interface AgentSummary {
  agentId: string;
  agentName: string;
  agentCode: string;
  count: number;
}

@Component({
  selector: 'app-low-balance-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbsComponent,
    PaginationComponent,
    InputComponent,
    ButtonComponent
],
  templateUrl: './low-balance-report.component.html',
  styleUrls: ['./low-balance-report.component.css']
})
export class LowBalanceReportComponent implements OnInit {
  private walletService = inject(WalletService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Data
  wallets = signal<LowBalanceWallet[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 10;

  // Balance threshold for low balance
  threshold = signal(200);

  // Filters
  filterForm: FormGroup = this.fb.group({
    threshold: [200]
  });

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Wallet Management', route: '/admin/wallets' },
    { label: 'Low Balance Report', current: true }
  ];

  // Computed
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize));

  // Agent summary - placeholder since API may not support this
  agentSummary = signal<AgentSummary[]>([]);

  ngOnInit(): void {
    this.loadLowBalanceWallets();
  }

  loadLowBalanceWallets(): void {
    this.loading.set(true);
    
    const threshold = this.filterForm.value.threshold || 200;
    this.threshold.set(threshold);

    this.walletService.getLowBalanceWallets({
      page: this.page(),
      limit: this.pageSize,
      threshold: threshold
    }).subscribe({
      next: (response) => {
        console.log('Low Balance Wallets Response:', response);
        // Map wallets to include calculated shortfall
        const mapped = response.wallets.map(w => ({
          ...w,
          shortfall: Math.max(0, threshold - w.currentBalance),
        }));
        this.wallets.set(mapped);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load low balance wallets:', err);
        this.loading.set(false);
        this.toastService.error('Failed to load low balance wallets');
      }
    });
  }

  onApplyFilters(): void {
    this.page.set(1);
    this.loadLowBalanceWallets();
  }

  onClearFilters(): void {
    this.filterForm.patchValue({ threshold: 200 });
    this.page.set(1);
    this.loadLowBalanceWallets();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadLowBalanceWallets();
  }

  viewWallet(walletId: string): void {
    this.router.navigate(['/admin/wallets', walletId]);
  }

  goBack(): void {
    this.router.navigate(['/admin/wallets']);
  }

  // Action buttons - show placeholder messages
  sendReminderToAll(): void {
    this.toastService.info('Send Reminder to All - Feature in development');
  }

  notifyAgents(): void {
    this.toastService.info('Notify Agents - Feature in development');
  }

  exportList(): void {
    this.toastService.info('Export List - Feature in development');
  }

  // Formatting
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getBalanceClass(balance: number): string {
    if (balance === 0) return 'text-red-700 dark:text-red-400';
    if (balance < 100) return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
  }

  getBalanceLabel(balance: number): string {
    if (balance === 0) return 'Empty';
    return '';
  }
}
