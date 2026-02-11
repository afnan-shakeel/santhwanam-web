import { Component, inject, signal, computed, OnInit, OnDestroy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { EntityProfileHeaderComponent } from '../../../shared/components/entity-profile-header/entity-profile-header.component';
import { QuickActionsBarComponent } from '../../../shared/components/quick-actions-bar/quick-actions-bar.component';
import { TabsComponent, TabItem } from '../../../shared/components/tabs/tabs.component';

import { AgentService } from '../../../core/services/agent.service';
import { CashManagementService } from '../../../core/services/cash-management.service';
import { AccessService } from '../../../core/services/access.service';
import { ToastService } from '../../../core/services/toast.service';

import { AgentProfile, AgentStats } from '../../../shared/models/agent-profile.model';
import { CashCustody } from '../../../shared/models/cash-management.model';

@Component({
  selector: 'app-agent-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    EntityProfileHeaderComponent,
    QuickActionsBarComponent,
    TabsComponent
  ],
  templateUrl: './agent-profile.component.html',
  styleUrl: './agent-profile.component.css'
})
export class AgentProfileComponent implements OnInit, OnDestroy {
  private agentService = inject(AgentService);
  private cashService = inject(CashManagementService);
  private accessService = inject(AccessService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  agentId = signal<string>('');
  agent = signal<AgentProfile | null>(null);
  stats = signal<AgentStats | null>(null);
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
    const agent = this.agent();
    if (!agent) return false;
    return this.accessService.isOwnEntity('agent', agent.agentId);
  });

  /** Whether user can edit this agent */
  canEdit = computed(() => {
    const agent = this.agent();
    if (!agent) return false;
    // Agents can edit their own profile, or admin can edit
    return this.isOwnProfile() || this.accessService.canManageEntity('agent', agent.agentId, 'edit');
  });

  /** Agent full name */
  fullName = computed(() => {
    const agent = this.agent();
    if (!agent) return '';
    return [agent.firstName, agent.middleName, agent.lastName].filter(Boolean).join(' ');
  });

  /** Cash balance from custody */
  cashBalance = computed(() => {
    return this.custody()?.currentBalance ?? 0;
  });

  /** Breadcrumbs */
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const agent = this.agent();
    const items: BreadcrumbItem[] = [
      { label: 'Home', route: '/' }
    ];

    if (this.isOwnProfile()) {
      items.push({ label: 'My Profile', route: '/agent/profile' });
    } else {
      items.push({ label: 'Agents', route: '/agents' });
      if (agent) {
        items.push({ label: this.fullName(), route: `/agents/${agent.agentId}` });
      }
    }

    return items;
  });

  /** Tab configuration */
  tabs = computed<TabItem[]>(() => {
    const s = this.stats();
    const baseTabs: TabItem[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'members', label: 'Members', badge: s?.totalMembers },
      { id: 'pending-contributions', label: 'Pending Contributions' },
      { id: 'low-balance', label: 'Low Balance' },
      { id: 'cash-custody', label: 'Cash Custody' }
    ];

    // Add Activity tab for admin viewing other agents
    if (!this.isOwnProfile()) {
      baseTabs.push({ id: 'activity', label: 'Activity' });
    }

    return baseTabs;
  });

  /** Hierarchy for header component */
  hierarchy = computed(() => {
    const agent = this.agent();
    if (!agent) return undefined;

    return {
      forum: agent.forum ? { id: agent.forum.forumId, name: agent.forum.forumName } : undefined,
      area: agent.area ? { id: agent.area.areaId, name: agent.area.areaName } : undefined,
      unit: agent.unit ? { id: agent.unit.unitId, name: agent.unit.unitName } : undefined
    };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const agentId = params['agentId'];
      if (agentId) {
        // Viewing specific agent (admin view)
        this.agentId.set(agentId);
        this.loadAgentData(agentId);
      } else {
        // Viewing own profile
        this.loadOwnProfile();
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

  private loadOwnProfile(): void {
    this.loading.set(true);

    this.agentService.getMyProfile()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (agent) => {
          this.agent.set(agent);
          this.agentId.set(agent.agentId);
          this.loadStats(agent.agentId);
          this.loadCustody();
        },
        error: (error) => {
          this.toastService.error('Failed to load profile', error?.error?.message || 'Please try again');
        }
      });
  }

  private loadAgentData(agentId: string): void {
    this.loading.set(true);

    this.agentService.getAgentProfile(agentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (agent) => {
          this.agent.set(agent);
          this.loadStats(agentId);
          // Don't load custody for non-own profiles
        },
        error: (error) => {
          this.toastService.error('Failed to load agent', error?.error?.message || 'Please try again');
        }
      });
  }

  private loadStats(agentId: string): void {
    this.statsLoading.set(true);

    this.agentService.getAgentStats(agentId)
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
    if (url.includes('/members')) {
      this.activeTab.set('members');
    } else if (url.includes('/cash-custody')) {
      this.activeTab.set('cash-custody');
    } else if (url.includes('/activity')) {
      this.activeTab.set('activity');
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
    this.toastService.info('Edit Profile', 'Edit functionality coming soon');
  }

  onReassignAdmin(): void {
    // Agents don't have this action
  }

  onReceiveCash(): void {
    this.router.navigate(['/cash/pending-receipts']);
  }

  onTransferCash(): void {
    this.router.navigate(['/cash/handover/new'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  onTransferToBank(): void {
    this.router.navigate(['/cash/handover/new'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  onViewApprovals(): void {
    this.router.navigate(['/approvals/my-approvals']);
  }

  onNavigateToHierarchy(event: { type: 'forum' | 'area' | 'unit'; id: string }): void {
    switch (event.type) {
      case 'forum':
        this.router.navigate(['/forums', event.id]);
        break;
      case 'area':
        this.router.navigate(['/areas', event.id]);
        break;
      case 'unit':
        this.router.navigate(['/units', event.id]);
        break;
    }
  }
}
