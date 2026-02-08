import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { EntityProfileHeaderComponent } from '../../../shared/components/entity-profile-header/entity-profile-header.component';
import { QuickActionsBarComponent } from '../../../shared/components/quick-actions-bar/quick-actions-bar.component';
import { TabsComponent, TabItem } from '../../../shared/components/tabs/tabs.component';

import { ForumService } from '../../../core/services/forum.service';
import { CashManagementService } from '../../../core/services/cash-management.service';
import { AccessService } from '../../../core/services/access.service';
import { ToastService } from '../../../core/services/toast.service';

import { ForumWithDetails, ForumStats } from '../../../shared/models/forum.model';
import { CashCustody } from '../../../shared/models/cash-management.model';

@Component({
  selector: 'app-forum-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    EntityProfileHeaderComponent,
    QuickActionsBarComponent,
    TabsComponent
  ],
  templateUrl: './forum-profile.component.html',
  styleUrl: './forum-profile.component.css'
})
export class ForumProfileComponent implements OnInit, OnDestroy {
  private forumService = inject(ForumService);
  private cashService = inject(CashManagementService);
  private accessService = inject(AccessService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  forumId = signal<string>('');
  forum = signal<ForumWithDetails | null>(null);
  stats = signal<ForumStats | null>(null);
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
    const forum = this.forum();
    if (!forum) return false;
    return this.accessService.isOwnEntity('forum', forum.forumId);
  });

  /** Whether user can edit this forum */
  canEdit = computed(() => {
    const forum = this.forum();
    if (!forum) return false;
    return this.accessService.canManageEntity('forum', forum.forumId, 'edit');
  });

  /** Whether user can reassign admin */
  canReassignAdmin = computed(() => {
    const forum = this.forum();
    if (!forum) return false;
    return this.accessService.canManageEntity('forum', forum.forumId, 'reassignAdmin');
  });

  /** Cash balance from custody */
  cashBalance = computed(() => {
    return this.custody()?.currentBalance ?? 0;
  });

  /** Breadcrumbs */
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const forum = this.forum();
    const items: BreadcrumbItem[] = [
      { label: 'Home', route: '/' }
    ];

    if (this.isOwnProfile()) {
      items.push({ label: 'My Profile', route: '/admin/profile' });
    } else {
      items.push({ label: 'Forums', route: '/forums' });
      if (forum) {
        items.push({ label: forum.forumName, route: `/forums/${forum.forumId}` });
      }
    }

    return items;
  });

  /** Tab configuration */
  tabs = computed<TabItem[]>(() => {
    const s = this.stats();
    return [
      { id: 'overview', label: 'Overview' },
      { id: 'areas', label: 'Areas', badge: s?.totalAreas },
      { id: 'cash-custody', label: 'Cash Custody' }
    ];
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const forumId = params['forumId'];
      if (forumId) {
        this.forumId.set(forumId);
        this.loadForumData(forumId);
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

  private loadForumData(forumId: string): void {
    this.loading.set(true);

    this.forumService.getForumWithDetails(forumId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (forum) => {
          this.forum.set(forum);
          this.loadStats(forumId);
          if (this.isOwnProfile()) {
            this.loadCustody();
          }
        },
        error: (error) => {
          this.toastService.error('Failed to load forum', error?.error?.message || 'Please try again');
        }
      });
  }

  private loadStats(forumId: string): void {
    this.statsLoading.set(true);

    this.forumService.getForumStats(forumId)
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
    if (url.includes('/areas')) {
      this.activeTab.set('areas');
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
    // TODO: Open edit modal or navigate to edit page
    this.toastService.info('Edit Forum', 'Edit functionality coming soon');
  }

  onReassignAdmin(): void {
    // TODO: Open reassign admin modal
    this.toastService.info('Reassign Admin', 'Reassign functionality coming soon');
  }

  onReceiveCash(): void {
    this.router.navigate(['/cash/pending-receipts']);
  }

  onTransferToBank(): void {
    this.router.navigate(['/cash/handover/new'], {
      queryParams: { recipient: 'bank' }
    });
  }

  onViewApprovals(): void {
    this.router.navigate(['/approvals/my-approvals']);
  }

  onNavigateToHierarchy(event: { type: 'forum' | 'area' | 'unit'; id: string }): void {
    // Forum is top level, so this shouldn't be called
  }
}
