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

type TabType = 'overview' | 'members' | 'collections' | 'performance';

interface TabItem {
  key: TabType;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-my-agent-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    AgentInfoCardComponent,
    AgentHierarchyCardComponent,
    EditProfileModalComponent
  ],
  templateUrl: './my-agent-profile.component.html',
  styleUrls: ['./my-agent-profile.component.css']
})
export class MyAgentProfileComponent implements OnInit {
  private agentService = inject(AgentService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  profile = signal<AgentProfile | null>(null);
  stats = signal<AgentStats | null>(null);
  loading = signal(true);
  showEditModal = signal(false);

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', route: '/' },
    { label: 'My Profile', route: '/agent/profile' }
  ];

  // Tabs
  tabs = computed<TabItem[]>(() => {
    const s = this.stats();
    return [
      { key: 'overview', label: 'Overview', route: './overview' },
      { key: 'members', label: 'My Members', route: './members', badge: s?.totalMembers },
      { key: 'collections', label: 'Collections', route: './collections' },
      { key: 'performance', label: 'Performance', route: './performance' }
    ];
  });

  activeTab = signal<TabType>('overview');

  ngOnInit(): void {
    this.loadProfile();
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
    } else {
      this.activeTab.set('overview');
    }
  }

  loadProfile(): void {
    this.loading.set(true);
    this.agentService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
        this.loadStats(profile.agentId);
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
        // Stats failed to load, but we can still show the profile
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

  openEditModal(): void {
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  onProfileUpdated(): void {
    this.showEditModal.set(false);
    this.loadProfile();
    this.toastService.success('Profile Updated', 'Your profile has been updated successfully');
  }
}
