import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ListingPageHeaderComponent } from '../../shared/components/listing-page-header/listing-page-header.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DatatableComponent } from '../../shared/components/datatable/datatable.component';
import { DataTableConfig } from '../../shared/models/datatable.model';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { Permission } from '../../shared/models/permission.model';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ListingPageHeaderComponent, BreadcrumbsComponent, DatatableComponent],
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent {
  private permissionService = inject(PermissionService);
  private router = inject(Router);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Permissions', current: true }
  ];

  loading = signal(false);
  permissionData = signal<SearchResponse<Permission> | null>(null);

  tableConfig: DataTableConfig<Permission> = {
    columns: [
      {
        key: 'permissionName',
        label: 'Permission Name',
        sortable: true,
        type: 'link',
        linkUrl: (permission) => `/permissions/${permission.permissionId}`,
        format: (value) => value || '-'
      },
      {
        key: 'module',
        label: 'Module',
        sortable: true
      },
      {
        key: 'action',
        label: 'Action',
        sortable: true
      },
      {
        key: 'description',
        label: 'Description',
        sortable: true,
        format: (value) => value || '-'
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
        format: (value) => value ? 'Active' : 'Inactive'
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
        callback: (permission) => this.onViewPermission(permission)
      },
      {
        label: 'Edit',
        callback: (permission) => this.onEditPermission(permission)
      }
    ],
    showActions: true,
    pageSize: 10,
    searchFields: ['name', 'resource', 'action', 'description'],
    filters: [
      {
        key: 'isActive',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' }
        ],
        placeholder: 'All Statuses'
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        type: 'date'
      }
    ]
  };

  onSearchChange(request: SearchRequest): void {
    this.loading.set(true);
    
    this.permissionService.searchPermissions(request).subscribe({
      next: (response) => {
        this.permissionData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load permissions:', error);
        this.loading.set(false);
      }
    });
  }

  onViewPermission(permission: Permission): void {
    console.log('View permission:', permission);
    this.router.navigate(['/permissions', permission.permissionId]);
  }

  onEditPermission(permission: Permission): void {
    console.log('Edit permission:', permission);
    this.router.navigate(['/permissions', permission.permissionId, 'edit']);
  }

  protected onAddPermission(): void {
    console.log('Add permission clicked');
    this.router.navigate(['/permissions', 'new']);
  }
}
