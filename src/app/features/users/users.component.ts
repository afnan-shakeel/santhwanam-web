import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ListingPageHeaderComponent } from '../../shared/components/listing-page-header/listing-page-header.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DatatableComponent } from '../../shared/components/datatable/datatable.component';
import { DataTableConfig, DataTableColumn, DataTableAction } from '../../shared/models/datatable.model';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { User } from '../../shared/models/user.model';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ListingPageHeaderComponent, BreadcrumbsComponent, DatatableComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {
  private userService = inject(UserService);
  private router = inject(Router);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Users', current: true }
  ];

  loading = signal(false);
  userData = signal<SearchResponse<User> | null>(null);

  tableConfig: DataTableConfig<User> = {
    columns: [
      {
        key: 'firstName',
        label: 'Name',
        sortable: true,
        type: 'link',
        linkUrl: (user) => `/users/${user.userId}`,
        format: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() || '-'
      },
      {
        key: 'email',
        label: 'Email',
        sortable: true
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
        callback: (user) => this.onViewUser(user)
      },
      {
        label: 'Edit',
        callback: (user) => this.onEditUser(user)
      }
    ],
    showActions: true,
    pageSize: 10,
    searchFields: ['firstName', 'lastName', 'email'],
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
        label: 'Registration Date',
        type: 'date'
      }
    ]
  };

  onSearchChange(request: SearchRequest): void {
    this.loading.set(true);
    
    this.userService.searchUsers(request).subscribe({
      next: (response) => {
        this.userData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.loading.set(false);
      }
    });
  }

  onViewUser(user: User): void {
    console.log('View user:', user);
    this.router.navigate(['/users', user.userId]);
  }

  onEditUser(user: User): void {
    console.log('Edit user:', user);
    this.router.navigate(['/users', user.userId, 'edit']);
  }

  protected onAddUser(): void {
    console.log('Add user clicked');
    this.router.navigate(['/users', 'new']);
  }
}
