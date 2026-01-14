import { Component, inject, signal, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { AgentService } from '../../../../../core/services/agent.service';
import { AgentPerformance } from '../../../../../shared/models/agent-profile.model';

export type PerformanceViewMode = 'self' | 'admin';

@Component({
  selector: 'app-agent-performance-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-performance-tab.component.html',
  styleUrls: ['./agent-performance-tab.component.css']
})
export class AgentPerformanceTabComponent implements OnInit {
  private agentService = inject(AgentService);
  private route = inject(ActivatedRoute);

  // Expose Math
  Math = Math;

  // Inputs
  viewMode = input<PerformanceViewMode>('self');

  // State
  performance = signal<AgentPerformance | null>(null);
  loading = signal(true);
  agentId = signal<string | null>(null);
  period = signal<'thisMonth' | 'lastMonth' | 'thisYear'>('thisMonth');
  compareWith = signal<string>('unitAverage');

  // Static ranking data (placeholder)
  ranking = signal({
    unitRank: 3,
    unitTotal: 15,
    areaRank: 12,
    areaTotal: 45
  });

  // Static achievements (placeholder)
  achievements = signal([
    { icon: '🏆', title: 'Top Collector', date: 'December 2024' },
    { icon: '🏆', title: '100% Collection Rate', date: 'November 2024' },
    { icon: '⭐', title: '10 New Members', date: 'October 2024' }
  ]);

  ngOnInit(): void {
    this.loadAgentId();
  }

  private loadAgentId(): void {
    const parentRoute = this.route.parent;
    if (parentRoute) {
      const agentId = parentRoute.snapshot.paramMap.get('agentId');
      if (agentId) {
        this.agentId.set(agentId);
        this.loadPerformance(agentId);
      } else {
        this.loadMyAgentId();
      }
    }
  }

  private loadMyAgentId(): void {
    this.agentService.getMyProfile().subscribe({
      next: (profile) => {
        this.agentId.set(profile.agentId);
        this.loadPerformance(profile.agentId);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadPerformance(agentId: string): void {
    this.loading.set(true);
    this.agentService.getAgentPerformance(agentId, this.period()).subscribe({
      next: (performance) => {
        this.performance.set(performance);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onPeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'thisMonth' | 'lastMonth' | 'thisYear';
    this.period.set(value);
    const agentId = this.agentId();
    if (agentId) {
      this.loadPerformance(agentId);
    }
  }

  onCompareWithChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.compareWith.set(value);
    // Would trigger comparison data load
  }

  getProgressPercentage(): number {
    const perf = this.performance();
    if (!perf) return 0;
    const target = 10; // Placeholder monthly target
    return Math.min((perf.memberAcquisition.newMembersThisMonth / target) * 100, 100);
  }

  getBarHeight(count: number): number {
    const trend = this.performance()?.memberAcquisition?.monthlyTrend;
    if (!trend || trend.length === 0) return 10;
    const maxCount = Math.max(...trend.map(t => t.count), 1);
    return Math.max((count / maxCount) * 100, 10);
  }

  getRetentionBarHeight(rate: number): number {
    return Math.max(rate, 10);
  }
}
