import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ListingPageHeaderComponent } from '../../shared/components/listing-page-header/listing-page-header.component';
import { DatatableComponent } from '../../shared/components/datatable/datatable.component';
import { DataTableConfig } from '../../shared/models/datatable.model';
import { UnitService } from '../../core/services/unit.service';
import { Unit } from '../../shared/models/unit.model';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { UnitFormComponent } from './unit-form/unit-form.component';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ListingPageHeaderComponent,
    DatatableComponent,
    UnitFormComponent
  ],
  templateUrl: './units.component.html',
  styleUrls: ['./units.component.css']
})
export class UnitsComponent {
  private unitService = inject(UnitService);
  private router = inject(Router);

  unitData = signal<SearchResponse<Unit>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  loading = signal(false);
  showUnitForm = signal(false);
  selectedUnitId = signal<string | undefined>(undefined);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Units', current: true }
  ];

  tableConfig: DataTableConfig<Unit> = {
    columns: [
      {
        key: 'unitName',
        label: 'Unit Name',
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
        callback: (unit: Unit) => this.onViewUnit(unit),
        actionAccessEntity: "unit",
        actionAccessAction: "view"
      },
      {
        label: 'Edit',
        callback: (unit: Unit) => this.onEditUnit(unit),
        actionAccessEntity: "unit",
        actionAccessAction: "edit"
      }
    ],
    showActions: true,
    pageSize: 10,
    searchFields: ['unitName', 'description'],
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
    this.loadUnits();
  }

  onSearchChange(request: SearchRequest): void {
    this.loading.set(true);
    this.unitService.searchUnits(request).subscribe({
      next: (response) => {
        this.unitData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load units:', error);
        this.loading.set(false);
      }
    });
  }

  loadUnits(): void {
    this.loading.set(true);
    const request: SearchRequest = {
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    this.unitService.searchUnits(request).subscribe({
      next: (response) => {
        this.unitData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load units:', error);
        this.loading.set(false);
      }
    });
  }

  onViewUnit(unit: Unit): void {
    console.log('View unit:', unit);
    this.router.navigate(['/units', unit.unitId]);
  }

  onEditUnit(unit: Unit): void {
    this.selectedUnitId.set(unit.unitId);
    this.showUnitForm.set(true);
  }

  protected onAddUnit(): void {
    this.selectedUnitId.set(undefined);
    this.showUnitForm.set(true);
  }

  onUnitSaved(unit: Unit): void {
    console.log('Unit saved:', unit);
    this.loadUnits();
  }

  onFormCancelled(): void {
    this.showUnitForm.set(false);
    this.selectedUnitId.set(undefined);
  }
}
