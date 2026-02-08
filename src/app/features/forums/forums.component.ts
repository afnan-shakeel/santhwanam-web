import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ListingPageHeaderComponent } from '../../shared/components/listing-page-header/listing-page-header.component';
import { DatatableComponent } from '../../shared/components/datatable/datatable.component';
import { AdminAssignmentModalComponent, EntityInfo } from '../../shared/components/organization-bodies/admin-assignment-modal/admin-assignment-modal.component';
import { DataTableConfig } from '../../shared/models/datatable.model';
import { ForumService } from '../../core/services/forum.service';
import { Forum } from '../../shared/models/forum.model';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { ForumFormComponent } from './forum-form/forum-form.component';

@Component({
  selector: 'app-forums',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ListingPageHeaderComponent,
    DatatableComponent,
    ForumFormComponent,
    AdminAssignmentModalComponent
  ],
  templateUrl: './forums.component.html',
  styleUrls: ['./forums.component.css']
})
export class ForumsComponent {
  private forumService = inject(ForumService);
  private router = inject(Router);

  forumData = signal<SearchResponse<Forum>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  loading = signal(false);
  showForumForm = signal(false);
  selectedForumId = signal<string | undefined>(undefined);

  // Admin assignment modal state
  showAssignAdminModal = signal(false);
  selectedEntityForAdmin = signal<EntityInfo | null>(null);
  selectedAdminUserId = signal<string | null>(null);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Forums', current: true }
  ];

  tableConfig: DataTableConfig<Forum> = {
    columns: [
      {
        key: 'forumName',
        label: 'Forum Name',
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
        callback: (forum: Forum) => this.onViewForum(forum),
        actionAccessEntity: "forum",
        actionAccessAction: "view"
      },
      {
        label: 'Edit',
        callback: (forum: Forum) => this.onEditForum(forum),
        actionAccessEntity: "forum",
        actionAccessAction: "edit"
      },
      {
        label: 'Assign Admin',
        callback: (forum: Forum) => this.onAssignAdminClick(forum),
        // actionAccessEntity: "forum",
        // actionAccessAction: "reassignAdmin"
      }
    ],
    showActions: true,
    pageSize: 10,
    searchFields: ['forumName', 'description'],
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
    this.loadForums();
  }

  onSearchChange(request: SearchRequest): void {
    this.loading.set(true);
    this.forumService.searchForums(request).subscribe({
      next: (response) => {
        this.forumData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load forums:', error);
        this.loading.set(false);
      }
    });
  }

  loadForums(): void {
    this.loading.set(true);
    const request: SearchRequest = {
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    this.forumService.searchForums(request).subscribe({
      next: (response) => {
        this.forumData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load forums:', error);
        this.loading.set(false);
      }
    });
  }

  onViewForum(forum: Forum): void {
    console.log('View forum:', forum);
    this.router.navigate(['/forums', forum.forumId]);
  }

  onEditForum(forum: Forum): void {
    console.log('Edit forum:', forum);
    this.selectedForumId.set(forum.forumId);
    this.showForumForm.set(true);
  }

  protected onAddForum(): void {
    console.log('Add forum clicked');
    this.selectedForumId.set(undefined);
    this.showForumForm.set(true);
  }

  onForumSaved(): void {
    this.showForumForm.set(false);
    this.selectedForumId.set(undefined);
    this.loadForums();
  }

  onForumFormCancelled(): void {
    this.showForumForm.set(false);
    this.selectedForumId.set(undefined);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════════════

  onAssignAdminClick(forum: Forum): void {
    this.selectedEntityForAdmin.set({
      entityType: 'forum',
      entityId: forum.forumId,
      entityName: forum.forumName,
      entityCode: forum.forumCode
    });
    this.selectedAdminUserId.set(forum.adminUserId || null);
    this.showAssignAdminModal.set(true);
  }

  onAdminAssigned(event: { entityId: string; newAdminUserId: string }): void {
    // Refresh the list
    this.loadForums();
  }
}
