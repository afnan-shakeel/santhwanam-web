import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { StatsCardComponent } from '../../../../../shared/components/stats-card/stats-card.component';
import { UnitService } from '../../../../../core/services/unit.service';
import { UnitStats } from '../../../../../shared/models/unit.model';

@Component({
  selector: 'app-unit-overview-tab',
  standalone: true,
  imports: [CommonModule, StatsCardComponent],
  templateUrl: './unit-overview-tab.component.html',
  styleUrl: './unit-overview-tab.component.css'
})
export class UnitOverviewTabComponent implements OnInit {
  private unitService = inject(UnitService);
  private route = inject(ActivatedRoute);

  // State
  stats = signal<UnitStats | null>(null);
  loading = signal(true);

  // Computed stats for display
  statsCards = computed(() => {
    const s = this.stats();
    if (!s) return [];

    return [
      {
        title: 'Total Agents',
        value: s.totalAgents,
        icon: 'users',
        color: 'primary' as const
      },
      {
        title: 'Active Agents',
        value: s.activeAgents,
        icon: 'check-circle',
        color: 'success' as const
      },
      {
        title: 'Total Members',
        value: s.totalMembers,
        icon: 'user-group',
        color: 'secondary' as const
      },
      {
        title: 'Active Members',
        value: s.activeMembers,
        icon: 'user-check',
        color: 'primary' as const
      },
      {
        title: 'Pending Approvals',
        value: s.pendingApprovals,
        icon: 'clock',
        color: 'warning' as const
      }
    ];
  });

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const unitId = params['unitId'];
      if (unitId) {
        this.loadStats(unitId);
      }
    });
  }

  private loadStats(unitId: string): void {
    this.loading.set(true);
    
    this.unitService.getUnitStats(unitId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: (err) => console.error('Error loading stats:', err)
      });
  }
}
