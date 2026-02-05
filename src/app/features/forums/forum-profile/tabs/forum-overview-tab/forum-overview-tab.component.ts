import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { StatsCardComponent } from '../../../../../shared/components/stats-card/stats-card.component';
import { ForumService } from '../../../../../core/services/forum.service';
import { ForumStats } from '../../../../../shared/models/forum.model';

@Component({
  selector: 'app-forum-overview-tab',
  standalone: true,
  imports: [CommonModule, StatsCardComponent],
  templateUrl: './forum-overview-tab.component.html',
  styleUrl: './forum-overview-tab.component.css'
})
export class ForumOverviewTabComponent implements OnInit {
  private forumService = inject(ForumService);
  private route = inject(ActivatedRoute);

  // State
  stats = signal<ForumStats | null>(null);
  loading = signal(true);

  // Computed stats for display
  statsCards = computed(() => {
    const s = this.stats();
    if (!s) return [];

    return [
      {
        title: 'Total Areas',
        value: s.totalAreas,
        icon: '📍',
        color: 'primary' as const
      },
      {
        title: 'Total Units',
        value: s.totalUnits,
        icon: '🏢',
        color: 'secondary' as const
      },
      {
        title: 'Active Agents',
        value: s.activeAgents,
        subtitle: `of ${s.totalAgents} total`,
        icon: '👤',
        color: 'success' as const
      },
      {
        title: 'Active Members',
        value: s.activeMembers,
        subtitle: `of ${s.totalMembers} total`,
        icon: '👥',
        color: 'success' as const
      },
      {
        title: 'Pending Approvals',
        value: s.pendingApprovals,
        icon: '⏳',
        color: s.pendingApprovals > 0 ? 'warning' as const : 'neutral' as const
      }
    ];
  });

  ngOnInit(): void {
    const forumId = this.route.parent?.snapshot.params['forumId'];
    if (forumId) {
      this.loadStats(forumId);
    }
  }

  private loadStats(forumId: string): void {
    this.loading.set(true);

    this.forumService.getForumStats(forumId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => {
          // Handle error silently, show empty state
        }
      });
  }
}
