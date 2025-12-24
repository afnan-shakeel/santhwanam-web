import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ApprovalWorkflowService } from '../../../core/services/approval-workflow.service';
import { ApprovalWorkflow } from '../../../shared/models/approval-workflow.model';
import { SearchRequest, SearchResponse } from '../../../shared/models/search.model';
import { WorkflowFormComponent } from './workflow-form/workflow-form.component';

@Component({
  selector: 'app-approval-workflows',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    WorkflowFormComponent
  ],
  templateUrl: './approval-workflows.component.html',
  styleUrls: ['./approval-workflows.component.css']
})
export class ApprovalWorkflowsComponent implements OnInit {
  private workflowService = inject(ApprovalWorkflowService);

  workflows = signal<ApprovalWorkflow[]>([]);
  loading = signal(false);
  showWorkflowForm = signal(false);
  selectedWorkflowId = signal<string | undefined>(undefined);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Admin', route: '/admin' },
    { label: 'Approvals', route: '/admin/approvals' },
    { label: 'Workflows', current: true }
  ];

  ngOnInit(): void {
    this.loadWorkflows();
  }

  loadWorkflows(): void {
    this.loading.set(true);
    const request: SearchRequest = {
      page: 1,
      pageSize: 100,
      sortBy: 'workflowName',
      sortOrder: 'asc'
    };

    this.workflowService.searchWorkflows(request).subscribe({
      next: (response: SearchResponse<ApprovalWorkflow>) => {
        this.workflows.set(response.items);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load workflows:', error);
        this.loading.set(false);
      }
    });
  }

  onAddWorkflow(): void {
    this.selectedWorkflowId.set(undefined);
    this.showWorkflowForm.set(true);
  }

  onEditWorkflow(workflow: ApprovalWorkflow): void {
    this.selectedWorkflowId.set(workflow.workflowId);
    this.showWorkflowForm.set(true);
  }

  onWorkflowSaved(): void {
    this.loadWorkflows();
  }

  onFormCancelled(): void {
    this.showWorkflowForm.set(false);
    this.selectedWorkflowId.set(undefined);
  }

  getModuleBadgeClass(module: string): string {
    const classes: Record<string, string> = {
      'Membership': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Wallet': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Claims': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'Contributions': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Organization': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    return classes[module] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}
