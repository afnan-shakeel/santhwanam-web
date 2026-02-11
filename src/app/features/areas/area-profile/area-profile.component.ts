import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { EntityProfileHeaderComponent } from '../../../shared/components/entity-profile-header/entity-profile-header.component';
import { QuickActionsBarComponent } from '../../../shared/components/quick-actions-bar/quick-actions-bar.component';
import { TabsComponent, TabItem } from '../../../shared/components/tabs/tabs.component';

import { AreaService } from '../../../core/services/area.service';
import { CashManagementService } from '../../../core/services/cash-management.service';
import { AccessService } from '../../../core/services/access.service';
import { ToastService } from '../../../core/services/toast.service';

import { AreaWithDetails, AreaStats } from '../../../shared/models/area.model';
import { CashCustody } from '../../../shared/models/cash-management.model';

@Component({
  selector: 'app-area-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    EntityProfileHeaderComponent,
    QuickActionsBarComponent,
    TabsComponent
  ],
  templateUrl: './area-profile.component.html',
  styleUrl: './area-profile.component.css'
})
export class AreaProfileComponent implements OnInit, OnDestroy {
  private areaService = inject(AreaService);
  private cashService = inject(CashManagementService);
  private accessService = inject(AccessService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  areaId = signal<string>('');
  area = signal<AreaWithDetails | null>(null);
  stats = signal<AreaStats | null>(null);
  custody = signal<CashCustody | null>(null);
  pendingReceiveCount = signal<number>(0);

  loading = signal(true);
  statsLoading = signal(true);
  custodyLoading = signal(true);

  activeTab = signal<string>('overview');

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  /** Whether viewing own profile */
  isOwnProfile = computed(() => {
    const area = this.area();
    if (!area) return false;
    return this.accessService.isOwnEntity('area', area.areaId);
  });

  /** Whether user can edit this area */
  canEdit = computed(() => {
    const area = this.area();
    if (!area) return false;
    return this.accessService.canManageEntity('area', area.areaId, 'edit');
  });

  /** Whether user can reassign admin */
  canReassignAdmin = computed(() => {
    const area = this.area();
    if (!area) return false;
    return this.accessService.canManageEntity('area', area.areaId, 'reassignAdmin');
  });

  /** Cash balance from custody */
  cashBalance = computed(() => {
    return this.custody()?.currentBalance ?? 0;
  });

  /** Hierarchy info for header */
  hierarchy = computed(() => {
    const area = this.area();
    if (!area) return undefined;
    return {
      forumId: area.forumId,
      forumName: area.forumName
    };
  });

  /** Breadcrumbs */
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const area = this.area();
    const items: BreadcrumbItem[] = [
      { label: 'Home', route: '/' }
    ];

    if (this.isOwnProfile()) {
      items.push({ label: 'My Profile', route: '/admin/profile' });
    } else {
      items.push({ label: 'Areas', route: '/areas' });
      if (area) {
        items.push({ label: area.areaName, route: `/areas/${area.areaId}` });
      }
    }

    return items;
  });

  /** Tab configuration */
  tabs = computed<TabItem[]>(() => {
    const s = this.stats();
    return [
      { id: 'overview', label: 'Overview' },
      { id: 'units', label: 'Units', badge: s?.totalUnits },
      { id: 'cash-custody', label: 'Cash Custody' }
    ];
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const areaId = params['areaId'];
      if (areaId) {
        this.areaId.set(areaId);
        this.loadAreaData(areaId);
      }
    });

    this.detectActiveTab();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  private loadAreaData(areaId: string): void {
    this.loading.set(true);

    this.areaService.getAreaWithDetails(areaId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (area) => {
          this.area.set(area);
          this.loadStats(areaId);
          if (this.isOwnProfile()) {
            this.loadCustody();
          }
        },
        error: (error) => {
          this.toastService.error('Failed to load area', error?.error?.message || 'Please try again');
        }
      });
  }

  private loadStats(areaId: string): void {
    this.statsLoading.set(true);

    this.areaService.getAreaStats(areaId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.statsLoading.set(false))
      )
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => {
          // Stats failed but profile can still be shown
        }
      });
  }

  private loadCustody(): void {
    this.custodyLoading.set(true);

    forkJoin({
      custody: this.cashService.getMyCustody(),
      pending: this.cashService.getPendingHandovers()
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.custodyLoading.set(false))
      )
      .subscribe({
        next: ({ custody, pending }) => {
          this.custody.set(custody.custody);
          this.pendingReceiveCount.set(pending.incoming?.length ?? 0);
        },
        error: () => {
          // Custody failed but profile can still be shown
        }
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════

  private detectActiveTab(): void {
    const url = this.router.url;
    if (url.includes('/units')) {
      this.activeTab.set('units');
    } else if (url.includes('/cash-custody')) {
      this.activeTab.set('cash-custody');
    } else {
      this.activeTab.set('overview');
    }
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
    this.router.navigate([`./${tabId}`], { relativeTo: this.route });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  onEdit(): void {
    this.toastService.info('Edit Area', 'Edit functionality coming soon');
  }

  onReassignAdmin(): void {
    this.toastService.info('Reassign Admin', 'Reassign functionality coming soon');
  }

  onReceiveCash(): void {
    this.router.navigate(['/cash/pending-receipts']);
  }

  onTransferCash(): void {
    this.router.navigate(['/cash/handover/new'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  onNavigateToHierarchy(event: { type: 'forum' | 'area' | 'unit'; id: string }): void {
    if (event.type === 'forum') {
      this.router.navigate(['/forums', event.id]);
    }
  }
}
