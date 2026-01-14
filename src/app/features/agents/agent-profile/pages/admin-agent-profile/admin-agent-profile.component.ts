import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { AgentInfoCardComponent } from '../../components/agent-info-card/agent-info-card.component';
import { AgentHierarchyCardComponent } from '../../components/agent-hierarchy-card/agent-hierarchy-card.component';
import { AgentService } from '../../../../../core/services/agent.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AgentProfile, AgentStats } from '../../../../../shared/models/agent-profile.model';
import { EditProfileModalComponent } from '../../edit-profile-modal/edit-profile-modal.component';
import { DevInProgressModalComponent } from '../../modals/dev-in-progress-modal/dev-in-progress-modal.component';

type TabType = 'overview' | 'members' | 'collections' | 'performance' | 'activity';

interface TabItem {
  key: TabType;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-agent-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    AgentInfoCardComponent,
    AgentHierarchyCardComponent,
    EditProfileModalComponent,
    DevInProgressModalComponent
  ],
  templateUrl: './admin-agent-profile.component.html',
  styleUrls: ['./admin-agent-profile.component.css']
})
export class AdminAgentProfileComponent implements OnInit {
  private agentService = inject(AgentService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Route params
  agentId = signal<string | null>(null);

  // State
  profile = signal<AgentProfile | null>(null);
  stats = signal<AgentStats | null>(null);
  loading = signal(true);
  showEditModal = signal(false);
  showDevModal = signal(false);
  devModalFeature = signal<string>('');

  // Breadcrumbs
  breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Home', route: '/' },
    { label: 'Agents', route: '/agents' },
    { label: 'Agent Profile', route: '' }
  ]);

  // Computed - full name for breadcrumb
  fullName = computed(() => {
    const p = this.profile();
    if (!p) return 'Agent Profile';
    return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
  });

  // Tabs - Admin has Activity tab
  tabs = computed<TabItem[]>(() => {
    const s = this.stats();
    return [
      { key: 'overview', label: 'Overview', route: './overview' },
      { key: 'members', label: "Agent's Members", route: './members', badge: s?.totalMembers },
      { key: 'collections', label: 'Collections', route: './collections' },
      { key: 'performance', label: 'Performance', route: './performance' },
      { key: 'activity', label: 'Activity', route: './activity' }
    ];
  });

  activeTab = signal<TabType>('overview');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('agentId');
    if (id) {
      this.agentId.set(id);
      this.loadProfile(id);
    }
    this.detectActiveTab();
  }

  private detectActiveTab(): void {
    const url = this.router.url;
    if (url.includes('/members')) {
      this.activeTab.set('members');
    } else if (url.includes('/collections')) {
      this.activeTab.set('collections');
    } else if (url.includes('/performance')) {
      this.activeTab.set('performance');
    } else if (url.includes('/activity')) {
      this.activeTab.set('activity');
    } else {
      this.activeTab.set('overview');
    }
  }

  loadProfile(agentId: string): void {
    this.loading.set(true);
    this.agentService.getAgentProfile(agentId).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
        this.loadStats(agentId);
        // Update breadcrumbs
        const fullName = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
        this.breadcrumbs.set([
          { label: 'Home', route: '/' },
          { label: 'Agents', route: '/agents' },
          { label: fullName || 'Agent Profile', route: '' }
        ]);
      },
      error: (error) => {
        this.loading.set(false);
        this.toastService.error('Failed to load profile', error?.error?.message || 'Please try again');
      }
    });
  }

  loadStats(agentId: string): void {
    this.agentService.getAgentStats(agentId).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: () => {
        // Stats failed to load silently
      }
    });
  }

  onTabClick(tab: TabItem): void {
    this.activeTab.set(tab.key);
    this.router.navigate([tab.route], { relativeTo: this.route });
  }

  isActiveTab(tabKey: TabType): boolean {
    return this.activeTab() === tabKey;
  }

  // Edit Modal
  openEditModal(): void {
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  onProfileUpdated(): void {
    this.showEditModal.set(false);
    const id = this.agentId();
    if (id) {
      this.loadProfile(id);
    }
    this.toastService.success('Profile Updated', 'Agent profile has been updated successfully');
  }

  // Future feature placeholders
  onSuspend(): void {
    this.devModalFeature.set('Suspend Agent');
    this.showDevModal.set(true);
  }

  onActivate(): void {
    this.devModalFeature.set('Activate Agent');
    this.showDevModal.set(true);
  }

  onReassignMembers(): void {
    this.devModalFeature.set('Reassign Members');
    this.showDevModal.set(true);
  }

  onChangeUnit(): void {
    this.devModalFeature.set('Change Unit');
    this.showDevModal.set(true);
  }

  closeDevModal(): void {
    this.showDevModal.set(false);
    this.devModalFeature.set('');
  }

  goBack(): void {
    this.router.navigate(['/agents']);
  }
}
