import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { ListingPageHeaderComponent } from '../../shared/components/listing-page-header/listing-page-header.component';
import { DatatableComponent } from '../../shared/components/datatable/datatable.component';
import { DataTableConfig } from '../../shared/models/datatable.model';
import { AgentService } from '../../core/services/agent.service';
import { Agent } from '../../shared/models/agent.model';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { AgentFormComponent } from './agent-form/agent-form.component';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ListingPageHeaderComponent,
    DatatableComponent,
    AgentFormComponent
  ],
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.css']
})
export class AgentsComponent {
  private agentService = inject(AgentService);
  private router = inject(Router);

  agentData = signal<SearchResponse<Agent>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  loading = signal(false);
  showAgentForm = signal(false);
  selectedAgentId = signal<string | undefined>(undefined);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Agents', current: true }
  ];

  tableConfig: DataTableConfig<Agent> = {
    columns: [
      {
        key: 'agentCode',
        label: 'Agent Code',
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
        key: 'registrationStatus',
        label: 'Registration',
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
        callback: (agent: Agent) => this.onViewAgent(agent),
        actionAccessEntity: "agent",
        actionAccessAction: "view"
      },
      {
        label: 'Edit',
        callback: (agent: Agent) => this.onEditAgent(agent),
        actionAccessEntity: "agent",
        actionAccessAction: "edit"
      }
    ],
    showActions: true,
    pageSize: 10,
    searchFields: ['agentName', 'agentCode'],
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
      }
    ]
  };

  ngOnInit(): void {
    this.loadAgents();
  }

  onSearchChange(request: SearchRequest): void {
    this.loading.set(true);
    this.agentService.searchAgents(request).subscribe({
      next: (response) => {
        this.agentData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load agents:', error);
        this.loading.set(false);
      }
    });
  }

  loadAgents(): void {
    this.loading.set(true);
    const request: SearchRequest = {
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    this.agentService.searchAgents(request).subscribe({
      next: (response) => {
        this.agentData.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load agents:', error);
        this.loading.set(false);
      }
    });
  }

  onViewAgent(agent: Agent): void {
    this.router.navigate(['/agents', agent.agentId]);
  }

  onEditAgent(agent: Agent): void {
    this.selectedAgentId.set(agent.agentId);
    this.showAgentForm.set(true);
  }

  protected onAddAgent(): void {
    this.selectedAgentId.set(undefined);
    this.showAgentForm.set(true);
  }

  onAgentSaved(agent: Agent): void {
    console.log('Agent saved:', agent);
    this.loadAgents();
  }

  onFormCancelled(): void {
    this.showAgentForm.set(false);
    this.selectedAgentId.set(undefined);
  }
}
