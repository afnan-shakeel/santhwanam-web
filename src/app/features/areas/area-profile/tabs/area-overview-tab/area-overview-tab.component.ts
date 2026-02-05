import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { StatsCardComponent, StatsCardColor } from '../../../../../shared/components/stats-card/stats-card.component';
import { AreaService } from '../../../../../core/services/area.service';
import { AreaStats } from '../../../../../shared/models/area.model';

@Component({
  selector: 'app-area-overview-tab',
  standalone: true,
  imports: [CommonModule, StatsCardComponent],
  templateUrl: './area-overview-tab.component.html',
  styleUrl: './area-overview-tab.component.css'
})
export class AreaOverviewTabComponent implements OnInit {
  private areaService = inject(AreaService);
  private route = inject(ActivatedRoute);

  // State
  stats = signal<AreaStats | null>(null);
  loading = signal(true);

  // Computed stats for display
  statsCards = computed(() => {
    const s = this.stats();
    if (!s) return [];

    return [
      {
        title: 'Total Units',
        value: s.totalUnits,
        icon: 'location',
        color: 'primary' as StatsCardColor
      },
      {
        title: 'Total Agents',
        value: s.totalAgents,
        icon: 'users',
        color: 'success' as StatsCardColor
      },
      {
        title: 'Active Agents',
        value: s.activeAgents,
        icon: 'check-circle',
        color: 'success' as StatsCardColor
      },
      {
        title: 'Total Members',
        value: s.totalMembers,
        icon: 'user-group',
        color: 'secondary' as StatsCardColor
      },
      {
        title: 'Active Members',
        value: s.activeMembers,
        icon: 'user-check',
        color: 'neutral' as StatsCardColor
      }
    ];
  });

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const areaId = params['areaId'];
      if (areaId) {
        this.loadStats(areaId);
      }
    });
  }

  private loadStats(areaId: string): void {
    this.loading.set(true);
    
    this.areaService.getAreaStats(areaId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: (err) => console.error('Error loading stats:', err)
      });
  }
}
