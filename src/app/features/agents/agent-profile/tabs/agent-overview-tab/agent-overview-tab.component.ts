import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { AgentStatsCardComponent, AgentCollectionStats } from '../../components/agent-stats-card/agent-stats-card.component';
import { AgentService } from '../../../../../core/services/agent.service';
import { AgentStats } from '../../../../../shared/models/agent-profile.model';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
}

interface ActivityItem {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  timestamp: string;
}

@Component({
  selector: 'app-agent-overview-tab',
  standalone: true,
  imports: [CommonModule, AgentStatsCardComponent],
  templateUrl: './agent-overview-tab.component.html',
  styleUrls: ['./agent-overview-tab.component.css']
})
export class AgentOverviewTabComponent implements OnInit {
  private agentService = inject(AgentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  stats = signal<AgentStats | null>(null);
  loading = signal(true);
  agentId = signal<string | null>(null);

  // Static placeholder data for alerts
  alerts = signal<Alert[]>([
    {
      id: '1',
      type: 'error',
      icon: '🔴',
      title: '3 pending cash collections',
      description: 'CC-2025-00016 • 3 members • ₹300 • Deadline: Jan 30 (5 days)',
      actionLabel: 'View',
      actionRoute: './collections'
    },
    {
      id: '2',
      type: 'warning',
      icon: '🟡',
      title: '2 deposit requests pending submission',
      description: '₹1,500 total',
      actionLabel: 'View',
      actionRoute: './collections'
    },
    {
      id: '3',
      type: 'warning',
      icon: '🟡',
      title: '5 members with low wallet balance',
      description: 'May miss next contribution',
      actionLabel: 'View',
      actionRoute: './members'
    }
  ]);

  // Static placeholder data for recent activity
  recentActivity = signal<ActivityItem[]>([
    {
      id: '1',
      icon: '✅',
      iconColor: 'text-green-500',
      title: 'Collected contribution from John Smith',
      description: 'CC-2025-00015 • ₹100 • Cash',
      timestamp: 'Today, 10:30 AM'
    },
    {
      id: '2',
      icon: '💰',
      iconColor: 'text-blue-500',
      title: 'Submitted wallet deposit for approval',
      description: 'Jane Doe • ₹500',
      timestamp: 'Today, 09:15 AM'
    },
    {
      id: '3',
      icon: '👤',
      iconColor: 'text-purple-500',
      title: 'Registered new member',
      description: 'Alice Brown (MEM-2025-00789)',
      timestamp: 'Yesterday, 04:30 PM'
    },
    {
      id: '4',
      icon: '✅',
      iconColor: 'text-green-500',
      title: 'Member registration approved',
      description: 'Bob Wilson (MEM-2025-00788)',
      timestamp: 'Yesterday, 02:00 PM'
    }
  ]);

  // Static collection stats (placeholder)
  collectionStats = signal<AgentCollectionStats>({
    collectionsThisMonth: 15000,
    walletDepositsThisMonth: 8000,
    outstandingCollections: 2000
  });

  ngOnInit(): void {
    this.loadAgentId();
  }

  private loadAgentId(): void {
    // Try to get agentId from parent route or from profile
    const parentRoute = this.route.parent;
    if (parentRoute) {
      const agentId = parentRoute.snapshot.paramMap.get('agentId');
      if (agentId) {
        this.agentId.set(agentId);
        this.loadStats(agentId);
      } else {
        // For self-view, load from my-profile
        this.loadMyStats();
      }
    }
  }

  private loadMyStats(): void {
    this.loading.set(true);
    this.agentService.getMyProfile().subscribe({
      next: (profile) => {
        this.agentId.set(profile.agentId);
        this.loadStats(profile.agentId);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadStats(agentId: string): void {
    this.loading.set(true);
    this.agentService.getAgentStats(agentId).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onAlertAction(alert: Alert): void {
    if (alert.actionRoute) {
      this.router.navigate([alert.actionRoute], { relativeTo: this.route.parent });
    }
  }

  onViewAllActivity(): void {
    // Navigate to activity tab (if available) or show more
  }

  getAlertClass(type: string): string {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'info': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  }
}
