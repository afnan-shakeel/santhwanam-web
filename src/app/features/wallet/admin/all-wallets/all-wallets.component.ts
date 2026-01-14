import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { WalletService } from '../../../../core/services/wallet.service';
import { ToastService } from '../../../../core/services/toast.service';
import { WalletWithMember } from '../../../../shared/models/wallet.model';

@Component({
  selector: 'app-all-wallets',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbsComponent,
    PaginationComponent
  ],
  templateUrl: './all-wallets.component.html',
  styleUrls: ['./all-wallets.component.css']
})
export class AllWalletsComponent implements OnInit {
  private walletService = inject(WalletService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Data
  wallets = signal<WalletWithMember[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 10;

  // Computed total balance
  totalBalance = signal(0);

  // Search and Filters
  searchForm: FormGroup = this.fb.group({
    search: ['']
  });

  filterForm: FormGroup = this.fb.group({
    minBalance: [''],
    maxBalance: ['']
  });

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Wallet Management', route: '/admin/wallets' },
    { label: 'All Wallets', current: true }
  ];

  // Computed
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize));

  ngOnInit(): void {
    this.loadWallets();
  }

  loadWallets(): void {
    this.loading.set(true);
    
    const params: any = {
      page: this.page(),
      limit: this.pageSize
    };

    // Add search
    const search = this.searchForm.value.search;
    if (search) {
      params.search = search;
    }

    // Add balance filters
    const minBalance = this.filterForm.value.minBalance;
    const maxBalance = this.filterForm.value.maxBalance;
    if (minBalance) {
      params.minBalance = Number(minBalance);
    }
    if (maxBalance) {
      params.maxBalance = Number(maxBalance);
    }

    this.walletService.getAdminWallets(params).subscribe({
      next: (response) => {
        this.wallets.set(response.wallets);
        this.total.set(response.total);
        // Calculate total balance from loaded wallets
        const sumBalance = response.wallets.reduce((sum, w) => sum + w.currentBalance, 0);
        this.totalBalance.set(sumBalance);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load wallets:', err);
        this.loading.set(false);
        this.toastService.error('Failed to load wallets');
      }
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadWallets();
  }

  onApplyFilters(): void {
    this.page.set(1);
    this.loadWallets();
  }

  onClearFilters(): void {
    this.filterForm.reset();
    this.searchForm.reset();
    this.page.set(1);
    this.loadWallets();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadWallets();
  }

  viewWallet(walletId: string): void {
    this.router.navigate(['/admin/wallets', walletId]);
  }

  goBack(): void {
    this.router.navigate(['/admin/wallets']);
  }

  exportToExcel(): void {
    this.toastService.info('Export to Excel feature coming soon');
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

  isLowBalance(balance: number): boolean {
    return balance < 200;
  }

  getBalanceLabel(balance: number): string {
    if (balance === 0) return 'Empty';
    if (balance < 200) return 'Low';
    return '';
  }
}
