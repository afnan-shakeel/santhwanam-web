import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { 
  ApprovalWorkflow,
  ApprovalStage,
  CreateWorkflowRequest, 
  UpdateWorkflowRequest,
  CreateStageRequest,
  UpdateStageRequest,
  ApprovalRequest,
  ApprovalRequestDetailsResponse,
  ProcessApprovalRequest
} from '../../shared/models/approval-workflow.model';

@Injectable({
  providedIn: 'root'
})
export class ApprovalWorkflowService {
  private http = inject(HttpService);

  searchWorkflows(request: SearchRequest): Observable<SearchResponse<ApprovalWorkflow>> {
    // Include stages in the response via eager loading
    const requestWithEagerLoad = {
      ...request,
      eagerLoad: ['stages']
    };
    return this.http.post<SearchResponse<ApprovalWorkflow>>('/approval-workflow/workflows/search', requestWithEagerLoad);
  }

  getWorkflow(workflowId: string): Observable<ApprovalWorkflow> {
    return this.http.get<ApprovalWorkflow>(`/approval-workflow/workflows/${workflowId}`);
  }

  createWorkflow(request: CreateWorkflowRequest): Observable<{ workflowId: string; workflowCode: string; workflowName: string }> {
    return this.http.post<{ workflowId: string; workflowCode: string; workflowName: string }>('/approval-workflow/workflows', request);
  }

  updateWorkflow(workflowId: string, request: UpdateWorkflowRequest): Observable<{ workflow: ApprovalWorkflow; stages: ApprovalStage[] }> {
    return this.http.patch<{ workflow: ApprovalWorkflow; stages: ApprovalStage[] }>(`/approval-workflow/workflows/${workflowId}`, request);
  }

  deleteWorkflow(workflowId: string): Observable<void> {
    return this.http.delete<void>(`/approval-workflow/workflows/${workflowId}`);
  }

  // Stage management
  createStage(workflowId: string, request: CreateStageRequest): Observable<{ stageId: string }> {
    return this.http.post<{ stageId: string }>(`/approval-workflow/workflows/${workflowId}/stages`, request);
  }

  updateStage(workflowId: string, stageId: string, request: UpdateStageRequest): Observable<void> {
    return this.http.patch<void>(`/approval-workflow/workflows/${workflowId}/stages/${stageId}`, request);
  }

  deleteStage(workflowId: string, stageId: string): Observable<void> {
    return this.http.delete<void>(`/approval-workflow/workflows/${workflowId}/stages/${stageId}`);
  }

  reorderStages(workflowId: string, stageIds: string[]): Observable<void> {
    return this.http.post<void>(`/approval-workflow/workflows/${workflowId}/stages/reorder`, { stageIds });
  }

  // Approval Requests - User-facing methods
  searchApprovalRequests(request: SearchRequest): Observable<SearchResponse<ApprovalRequest>> {
    return this.http.post<SearchResponse<ApprovalRequest>>('/approval-workflow/requests/search', request);
  }

  getApprovalRequestDetails(requestId: string): Observable<ApprovalRequestDetailsResponse> {
    return this.http.get<ApprovalRequestDetailsResponse>(`/approval-workflow/requests/${requestId}`);
  }

  processApproval(request: ProcessApprovalRequest): Observable<void> {
    return this.http.post<void>('/approval-workflow/requests/process', request);
  }

  getApprovalRequestByEntity(entityType: string, entityId: string): Observable<ApprovalRequest> {
    return this.http.get<ApprovalRequest>(`/approval-workflow/requests/entity/${entityType}/${entityId}`);
  }

  submitApprovalRequest(request: {
    workflowCode: string;
    entityType: string;
    entityId: string;
    forumId?: string;
    areaId?: string;
    unitId?: string;
  }): Observable<{ requestId: string; status: string }> {
    return this.http.post<{ requestId: string; status: string }>('/approval-workflow/requests', request);
  }
}
