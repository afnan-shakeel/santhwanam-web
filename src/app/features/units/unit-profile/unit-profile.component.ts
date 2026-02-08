import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { EntityProfileHeaderComponent } from '../../../shared/components/entity-profile-header/entity-profile-header.component';
import { QuickActionsBarComponent } from '../../../shared/components/quick-actions-bar/quick-actions-bar.component';
import { TabsComponent, TabItem } from '../../../shared/components/tabs/tabs.component';

import { UnitService } from '../../../core/services/unit.service';
import { CashManagementService } from '../../../core/services/cash-management.service';
import { AccessService } from '../../../core/services/access.service';
import { ToastService } from '../../../core/services/toast.service';

import { UnitWithDetails, UnitStats } from '../../../shared/models/unit.model';
import { CashCustody } from '../../../shared/models/cash-management.model';

@Component({
  selector: 'app-unit-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    EntityProfileHeaderComponent,
    QuickActionsBarComponent,
    TabsComponent
  ],
  templateUrl: './unit-profile.component.html',
  styleUrl: './unit-profile.component.css'
})
export class UnitProfileComponent implements OnInit, OnDestroy {
  private unitService = inject(UnitService);
  private cashService = inject(CashManagementService);
  private accessService = inject(AccessService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  unitId = signal<string>('');
  unit = signal<UnitWithDetails | null>(null);
  stats = signal<UnitStats | null>(null);
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
    const unit = this.unit();
    if (!unit) return false;
    return this.accessService.isOwnEntity('unit', unit.unitId);
  });

  /** Whether user can edit this unit */
  canEdit = computed(() => {
    const unit = this.unit();
    if (!unit) return false;
    return this.accessService.canManageEntity('unit', unit.unitId, 'edit');
  });

  /** Whether user can reassign admin */
  canReassignAdmin = computed(() => {
    const unit = this.unit();
    if (!unit) return false;
    return this.accessService.canManageEntity('unit', unit.unitId, 'reassignAdmin');
  });

  /** Cash balance from custody */
  cashBalance = computed(() => {
    return this.custody()?.currentBalance ?? 0;
  });

  /** Hierarchy info for header */
  hierarchy = computed(() => {
    const unit = this.unit();
    if (!unit) return undefined;
    return {
      areaId: unit.areaId,
      areaName: unit.areaName,
      forumId: unit.forumId,
      forumName: unit.forumName
    };
  });

  /** Breadcrumbs */
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const unit = this.unit();
    const items: BreadcrumbItem[] = [
      { label: 'Home', route: '/' }
    ];

    if (this.isOwnProfile()) {
      items.push({ label: 'My Profile', route: '/admin/profile' });
    } else {
      items.push({ label: 'Units', route: '/units' });
      if (unit) {
        items.push({ label: unit.unitName, route: `/units/${unit.unitId}` });
      }
    }

    return items;
  });

  /** Tab configuration */
  tabs = computed<TabItem[]>(() => {
    const s = this.stats();
    return [
      { id: 'overview', label: 'Overview' },
      { id: 'agents', label: 'Agents', badge: s?.totalAgents },
      { id: 'cash-custody', label: 'Cash Custody' }
    ];
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const unitId = params['unitId'];
      if (unitId) {
        this.unitId.set(unitId);
        this.loadUnitData(unitId);
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

  private loadUnitData(unitId: string): void {
    this.loading.set(true);

    this.unitService.getUnitWithDetails(unitId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (unit) => {
          this.unit.set(unit);
          this.loadStats(unitId);
          if (this.isOwnProfile()) {
            this.loadCustody();
          }
        },
        error: (error) => {
          this.toastService.error('Failed to load unit', error?.error?.message || 'Please try again');
        }
      });
  }

  private loadStats(unitId: string): void {
    this.statsLoading.set(true);

    this.unitService.getUnitStats(unitId)
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
    if (url.includes('/agents')) {
      this.activeTab.set('agents');
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
    this.toastService.info('Edit Unit', 'Edit functionality coming soon');
  }

  onReassignAdmin(): void {
    this.toastService.info('Reassign Admin', 'Reassign functionality coming soon');
  }

  onReceiveCash(): void {
    this.router.navigate(['/cash/pending-receipts']);
  }

  onTransferCash(): void {
    this.router.navigate(['/cash/handover/new']);
  }

  onNavigateToHierarchy(event: { type: 'forum' | 'area' | 'unit'; id: string }): void {
    if (event.type === 'forum') {
      this.router.navigate(['/forums', event.id]);
    } else if (event.type === 'area') {
      this.router.navigate(['/areas', event.id]);
    }
  }
}
