import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ListingPageHeaderComponent } from '../../shared/components/listing-page-header/listing-page-header.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DatatableComponent } from '../../shared/components/datatable/datatable.component';
import { DataTableConfig } from '../../shared/models/datatable.model';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { Role } from '../../shared/models/role.model';
import { RoleService } from '../../core/services/role.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ListingPageHeaderComponent, BreadcrumbsComponent, DatatableComponent],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent {
  private roleService = inject(RoleService);
  private router = inject(Router);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Roles', current: true }
  ];

  loading = signal(false);
  roleData = signal<SearchResponse<Role> | null>(null);

  tableConfig: DataTableConfig<Role> = {
    columns: [
      {
        key: 'roleName',
        label: 'Role Name',
        sortable: true,
        type: 'link',
        linkUrl: (role) => `/admin/roles/${role.roleId}`,
        format: (value) => value || '-'
      },
      {
        key: 'description',
        label: 'Description',
        sortable: true,
        format: (value) => value || '-'
      },
      {
        key: 'scopeType',
        label: 'Scope',
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
        callback: (role) => this.onViewRole(role),
        actionAccessEntity: "role",
        actionAccessAction: "view"
      },
      {
        label: 'Edit',
        callback: (role) => this.onEditRole(role),
        actionAccessEntity: "role",
        actionAccessAction: "edit"
      }
    ],
    showActions: true,
    pageSize: 10,
    searchFields: ['roleName', 'roleCode', 'description'],
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
    
    this.roleService.searchRoles(request).subscribe({
      next: (response) => {
        this.roleData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load roles:', error);
        this.loading.set(false);
      }
    });
  }

  onViewRole(role: Role): void {
    console.log('View role:', role);
    this.router.navigate(['/admin/roles', role.roleId]);
  }

  onEditRole(role: Role): void {
    console.log('Edit role:', role);
    this.router.navigate(['/admin/roles', role.roleId]);
  }

  protected onAddRole(): void {
    console.log('Add role clicked');
    this.router.navigate(['/admin/roles', 'new']);
  }
}
