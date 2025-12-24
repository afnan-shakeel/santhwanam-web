import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ListingPageHeaderComponent } from '../../shared/components/listing-page-header/listing-page-header.component';
import { DatatableComponent } from '../../shared/components/datatable/datatable.component';
import { DataTableConfig } from '../../shared/models/datatable.model';
import { MemberService } from '../../core/services/member.service';
import { Member } from '../../shared/models/member.model';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ListingPageHeaderComponent,
    DatatableComponent
  ],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent {
  private memberService = inject(MemberService);
  private router = inject(Router);

  memberData = signal<SearchResponse<Member>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  loading = signal(false);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Members', current: true }
  ];

  tableConfig: DataTableConfig<Member> = {
    columns: [
      {
        key: 'memberCode',
        label: 'Member Code',
        sortable: true
      },
      {
        key: 'firstName',
        label: 'First Name',
        sortable: true
      },
      {
        key: 'lastName',
        label: 'Last Name',
        sortable: true
      },
      {
        key: 'email',
        label: 'Email',
        sortable: true
      },
      {
        key: 'contactNumber',
        label: 'Contact',
        sortable: true
      },
      {
        key: 'tier',
        label: 'Tier',
        sortable: true,
        format: (value: any) => value?.tierName || '-'
      },
      {
        key: 'registrationStatus',
        label: 'Registration',
        sortable: true,
        type: 'badge'
      },
      {
        key: 'memberStatus',
        label: 'Status',
        sortable: true,
        type: 'badge'
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
        callback: (member: Member) => this.onViewMember(member)
      },
      {
        label: 'Edit',
        callback: (member: Member) => this.onEditMember(member)
      },
      {
        label: 'Suspend',
        callback: (member: Member) => this.onSuspendMember(member)
      },
      {
        label: 'Reactivate',
        callback: (member: Member) => this.onReactivateMember(member)
      },
      {
        label: 'Delete',
        callback: (member: Member) => this.onDeleteMember(member)
      }
    ],
    showActions: true,
    pageSize: 10
  };

  ngOnInit(): void {
    this.emitSearch();
  }

  emitSearch(): void {
    const request: SearchRequest = {
      searchTerm: this.searchTerm(),
      page: this.currentPage(),
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.onSearchChange(request);
  }

  onSearchChange(request: SearchRequest): void {
    this.loading.set(true);
    this.memberService.searchMembers(request).subscribe({
      next: (response) => {
        this.memberData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load members:', error);
        this.loading.set(false);
      }
    });
  }

  private searchTerm = signal('');
  private currentPage = signal(1);

  onAddMember(): void {
    this.router.navigate(['/members/new']);
  }

  onViewMember(member: Member): void {
    this.router.navigate(['/members', member.memberId]);
  }

  onEditMember(member: Member): void {
    this.router.navigate(['/members', member.memberId, 'edit']);
  }

  onSuspendMember(member: Member): void {
    if (member.memberStatus !== 'Active') return;
    
    if (confirm(`Are you sure you want to suspend ${member.firstName} ${member.lastName}?`)) {
      this.memberService.suspendMember(member.memberId).subscribe({
        next: () => {
          this.emitSearch();
        },
        error: (error) => {
          console.error('Failed to suspend member:', error);
          alert('Failed to suspend member. Please try again.');
        }
      });
    }
  }

  onReactivateMember(member: Member): void {
    if (member.memberStatus !== 'Suspended') return;
    
    if (confirm(`Are you sure you want to reactivate ${member.firstName} ${member.lastName}?`)) {
      this.memberService.reactivateMember(member.memberId).subscribe({
        next: () => {
          this.emitSearch();
        },
        error: (error) => {
          console.error('Failed to reactivate member:', error);
          alert('Failed to reactivate member. Please try again.');
        }
      });
    }
  }

  onDeleteMember(member: Member): void {
    if (member.registrationStatus !== 'Draft') {
      alert('Only draft members can be deleted.');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${member.firstName} ${member.lastName}? This action cannot be undone.`)) {
      this.memberService.deleteMember(member.memberId).subscribe({
        next: () => {
          this.emitSearch();
        },
        error: (error) => {
          console.error('Failed to delete member:', error);
          alert('Failed to delete member. Please try again.');
        }
      });
    }
  }
}
