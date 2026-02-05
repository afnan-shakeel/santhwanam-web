import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { AreaService } from '../../../../../core/services/area.service';
import { UnitsListWithSummary, UnitListItem } from '../../../../../shared/models/area.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-area-units-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, BadgeComponent],
  templateUrl: './area-units-tab.component.html',
  styleUrls: ['./area-units-tab.component.css']
})
export class AreaUnitsTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private areaService = inject(AreaService);

  areaId = signal<string>('');
  loading = signal(true);
  unitsData = signal<UnitsListWithSummary | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);

  // Computed values for easy access
  units = computed(() => this.unitsData()?.items || []);
  summary = computed(() => this.unitsData()?.summary);
  pagination = computed(() => this.unitsData()?.pagination);
  totalPages = computed(() => this.pagination()?.totalPages || 1);
  totalItems = computed(() => this.pagination()?.totalItems || 0);

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const areaId = params['areaId'];
      if (areaId) {
        this.areaId.set(areaId);
        this.loadUnits();
      }
    });
  }

  loadUnits(): void {
    this.loading.set(true);
    this.areaService.getAreaUnits(this.areaId(), this.currentPage(), this.pageSize())
      .subscribe({
        next: (data) => {
          this.unitsData.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading units:', err);
          this.loading.set(false);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadUnits();
  }

  getAdminInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
