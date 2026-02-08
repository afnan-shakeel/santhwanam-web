import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { StatsCardComponent } from '../../../../../shared/components/stats-card/stats-card.component';
import { AgentService } from '../../../../../core/services/agent.service';
import { AgentStats } from '../../../../../shared/models/agent-profile.model';

@Component({
  selector: 'app-agent-overview-tab',
  standalone: true,
  imports: [CommonModule, StatsCardComponent],
  templateUrl: './agent-overview-tab.component.html',
  styleUrl: './agent-overview-tab.component.css'
})
export class AgentOverviewTabComponent implements OnInit {
  private agentService = inject(AgentService);
  private route = inject(ActivatedRoute);

  // State
  stats = signal<AgentStats | null>(null);
  loading = signal(true);

  // Computed stats for display
  statsCards = computed(() => {
    const s = this.stats();
    if (!s) return [];

    return [
      {
        title: 'Total Members',
        value: s.totalMembers,
        icon: 'user-group',
        color: 'primary' as const
      },
      {
        title: 'Active Members',
        value: s.activeMembers,
        subtitle: `of ${s.totalMembers} total`,
        icon: 'check-circle',
        color: 'success' as const
      },
      {
        title: 'Suspended',
        value: s.suspendedMembers,
        icon: 'pause-circle',
        color: s.suspendedMembers > 0 ? 'warning' as const : 'neutral' as const
      },
      {
        title: 'Frozen',
        value: s.frozenMembers,
        icon: 'lock-closed',
        color: s.frozenMembers > 0 ? 'warning' as const : 'neutral' as const
      },
      {
        title: 'New This Month',
        value: s.newMembersThisMonth,
        icon: 'user-plus',
        color: 'secondary' as const
      },
      {
        title: 'Pending Approvals',
        value: s.pendingApprovals,
        icon: 'clock',
        color: s.pendingApprovals > 0 ? 'warning' as const : 'neutral' as const
      }
    ];
  });

  ngOnInit(): void {
    const agentId = this.route.parent?.snapshot.params['agentId'];
    if (agentId) {
      this.loadStats(agentId);
    } else {
      // Own profile - load from parent data or make API call
      this.loadOwnStats();
    }
  }

  private loadStats(agentId: string): void {
    this.loading.set(true);

    this.agentService.getAgentStats(agentId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => {
          // Handle error silently, show empty state
        }
      });
  }

  private loadOwnStats(): void {
    this.loading.set(true);

    // First get own profile to get agentId
    this.agentService.getMyProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => {
          this.loadStats(profile.agentId);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }
}
