import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { UnitService } from '../../../../../core/services/unit.service';
import { AgentsListWithSummary, AgentListItem } from '../../../../../shared/models/unit.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-unit-agents-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, BadgeComponent],
  templateUrl: './unit-agents-tab.component.html',
  styleUrls: ['./unit-agents-tab.component.css']
})
export class UnitAgentsTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private unitService = inject(UnitService);

  unitId = signal<string>('');
  loading = signal(true);
  agentsData = signal<AgentsListWithSummary | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);

  // Computed values for easy access
  agents = computed(() => this.agentsData()?.items || []);
  summary = computed(() => this.agentsData()?.summary);
  pagination = computed(() => this.agentsData()?.pagination);
  totalPages = computed(() => this.pagination()?.totalPages || 1);
  totalItems = computed(() => this.pagination()?.totalItems || 0);

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const unitId = params['unitId'];
      if (unitId) {
        this.unitId.set(unitId);
        this.loadAgents();
      }
    });
  }

  loadAgents(): void {
    this.loading.set(true);
    this.unitService.getUnitAgents(this.unitId(), this.currentPage(), this.pageSize())
      .subscribe({
        next: (data) => {
          this.agentsData.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading agents:', err);
          this.loading.set(false);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAgents();
  }

  getAgentInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'neutral';
      case 'Suspended': return 'danger';
      default: return 'neutral';
    }
  }
}
