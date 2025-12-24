import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ApprovalWorkflowService } from '../../../core/services/approval-workflow.service';
import { 
  ApprovalRequest,
  ApprovalExecution,
  ApprovalRequestDetailsResponse
} from '../../../shared/models/approval-workflow.model';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-approval-details',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbsComponent],
  templateUrl: './approval-details.component.html',
  styleUrls: ['./approval-details.component.css']
})
export class ApprovalDetailsComponent implements OnInit {
  private approvalService = inject(ApprovalWorkflowService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  requestDetails = signal<ApprovalRequest | null>(null);
  executions = signal<ApprovalExecution[]>([]);
  workflow = signal<any | null>(null);
  loading = signal(false);
  processing = signal(false);
  
  comments = signal('');
  showRejectConfirm = signal(false);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Approvals', route: '/approvals' },
    { label: 'My Approvals', route: '/approvals/my-approvals' },
    { label: 'Details', current: true }
  ];

  // Computed properties
  canTakeAction = computed(() => {
    const details = this.requestDetails();
    return details?.status === 'Pending' && details.currentStageOrder;
  });

  currentStageExecution = computed(() => {
    const details = this.requestDetails();
    if (!details || !details.currentStageOrder) return null;
    return this.executions().find(e => e.stageOrder === details.currentStageOrder);
  });

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('requestId');
    if (requestId) {
      this.loadRequestDetails(requestId);
    }
  }

  loadRequestDetails(requestId: string): void {
    this.loading.set(true);
    this.approvalService.getApprovalRequestDetails(requestId).subscribe({
      next: (response) => {
        this.requestDetails.set(response.request);
        this.executions.set(response.executions);
        this.workflow.set(response.workflow);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load approval details:', error);
        this.loading.set(false);
        alert('Failed to load approval details');
        this.router.navigate(['/approvals/my-approvals']);
      }
    });
  }

  onApprove(): void {
    const details = this.requestDetails();
    const currentExecution = this.currentStageExecution();
    if (!details || !this.canTakeAction() || !currentExecution) return;

    const confirmMsg = this.comments() 
      ? `Are you sure you want to approve this ${details.entityType}?`
      : `Are you sure you want to approve this ${details.entityType}? Consider adding comments.`;

    if (confirm(confirmMsg)) {
      this.processRequest('Approve', currentExecution.executionId);
    }
  }

  onReject(): void {
    if (!this.comments().trim()) {
      alert('Please provide comments explaining the reason for rejection.');
      return;
    }
    this.showRejectConfirm.set(true);
  }

  confirmReject(): void {
    this.showRejectConfirm.set(false);
    const currentExecution = this.currentStageExecution();
    if (currentExecution) {
      this.processRequest('Reject', currentExecution.executionId);
    }
  }

  cancelReject(): void {
    this.showRejectConfirm.set(false);
  }

  private processRequest(decision: 'Approve' | 'Reject', executionId: string): void {
    const details = this.requestDetails();
    if (!details) return;

    this.processing.set(true);
    
    this.approvalService.processApproval({
      executionId,
      decision,
      comments: this.comments() || undefined
    }).subscribe({
      next: () => {
        this.processing.set(false);
        alert(`Successfully ${decision.toLowerCase()}d the request`);
        this.router.navigate(['/approvals/my-approvals']);
      },
      error: (error) => {
        console.error('Failed to process approval:', error);
        this.processing.set(false);
        alert(`Failed to ${decision.toLowerCase()} the request. Please try again.`);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/approvals/my-approvals']);
  }

  getStageStatusIcon(execution: ApprovalExecution): string {
    if (execution.status === 'Approved') {
      return '✅';
    } else if (execution.status === 'Rejected') {
      return '❌';
    } else {
      const details = this.requestDetails();
      if (details?.currentStageOrder === execution.stageOrder) {
        return '🔵';
      }
      return '⚪';
    }
  }

  getStageStatusText(execution: ApprovalExecution): string {
    if (execution.status === 'Approved') {
      return `Approved by ${execution.reviewedBy || 'User'} on ${this.formatDate(execution.reviewedAt!)}`;
    } else if (execution.status === 'Rejected') {
      return `Rejected by ${execution.reviewedBy || 'User'} on ${this.formatDate(execution.reviewedAt!)}`;
    } else {
      const details = this.requestDetails();
      if (details?.currentStageOrder === execution.stageOrder) {
        return 'Waiting for your action';
      }
      return 'Not started';
    }
  }

  getStageStatusClass(execution: ApprovalExecution): string {
    if (execution.status === 'Approved') {
      return 'text-green-600';
    } else if (execution.status === 'Rejected') {
      return 'text-red-600';
    } else {
      const details = this.requestDetails();
      if (details?.currentStageOrder === execution.stageOrder) {
        return 'text-blue-600 font-medium';
      }
      return 'text-gray-500';
    }
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getApproverInfo(execution: ApprovalExecution): string {
    if (execution.assignedApproverId) {
      return `Assigned to ${execution.assignedApproverId}`;
    }
    return 'Pending assignment';
  }

  getStageName(stageOrder: number): string {
    const workflowData = this.workflow();
    if (!workflowData?.stages) return `Stage ${stageOrder}`;
    const stage = workflowData.stages.find((s: any) => s.stageOrder === stageOrder);
    return stage?.stageName || `Stage ${stageOrder}`;
  }

  getModuleBadgeClass(module: string): string {
    const classes: Record<string, string> = {
      'Membership': 'bg-blue-100 text-blue-800',
      'Wallet': 'bg-purple-100 text-purple-800',
      'Claims': 'bg-orange-100 text-orange-800',
      'Contributions': 'bg-green-100 text-green-800',
      'Organization': 'bg-indigo-100 text-indigo-800',
      'Agents': 'bg-teal-100 text-teal-800'
    };
    return classes[module] || 'bg-gray-100 text-gray-800';
  }
}
