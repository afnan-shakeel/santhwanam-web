import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ListingPageHeaderComponent } from '../../shared/components/listing-page-header/listing-page-header.component';
import { DatatableComponent } from '../../shared/components/datatable/datatable.component';
import { DataTableConfig } from '../../shared/models/datatable.model';
import { AreaService } from '../../core/services/area.service';
import { Area } from '../../shared/models/area.model';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ListingPageHeaderComponent,
    DatatableComponent
  ],
  templateUrl: './areas.component.html',
  styleUrls: ['./areas.component.css']
})
export class AreasComponent {
  private areaService = inject(AreaService);
  private router = inject(Router);

  areaData = signal<SearchResponse<Area>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  loading = signal(false);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Areas', current: true }
  ];

  tableConfig: DataTableConfig<Area> = {
    columns: [
      {
        key: 'areaName',
        label: 'Area Name',
        sortable: true
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        format: (value: any) => value || '-'
      },
      {
        key: 'isActive',
        label: 'Status',
        sortable: true,
        type: 'badge',
        valueMapping: {
          'true': 'Active',
          'false': 'Inactive'
        },
        format: (value: any) => value ? 'Active' : 'Inactive'
      },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: true,
        type: 'date'
      }
    ],
    actions: [
      {
        label: 'View',
        callback: (area: Area) => this.onViewArea(area)
      },
      {
        label: 'Edit',
        callback: (area: Area) => this.onEditArea(area)
      }
    ],
    showActions: true,
    pageSize: 10,
    searchFields: ['areaName', 'description'],
    filters: [
      {
        key: 'isActive',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'All', value: '' },
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' }
        ]
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        type: 'date'
      }
    ]
  };

  ngOnInit(): void {
    this.loadAreas();
  }

  onSearchChange(request: SearchRequest): void {
    this.loading.set(true);
    this.areaService.searchAreas(request).subscribe({
      next: (response) => {
        this.areaData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load areas:', error);
        this.loading.set(false);
      }
    });
  }

  loadAreas(): void {
    this.loading.set(true);
    const request: SearchRequest = {
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    this.areaService.searchAreas(request).subscribe({
      next: (response) => {
        this.areaData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load areas:', error);
        this.loading.set(false);
      }
    });
  }

  onViewArea(area: Area): void {
    console.log('View area:', area);
    this.router.navigate(['/areas', area.areaId]);
  }

  onEditArea(area: Area): void {
    console.log('Edit area:', area);
    this.router.navigate(['/areas', area.areaId]);
  }

  protected onAddArea(): void {
    console.log('Add area clicked');
    this.router.navigate(['/areas', 'new']);
  }
}
