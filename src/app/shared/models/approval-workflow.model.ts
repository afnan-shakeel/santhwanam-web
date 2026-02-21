import { User } from "./user.model";

export type ModuleType = 'Membership' | 'Wallet' | 'Claims' | 'Contributions' | 'Organization';
export type ApproverType = 'Role' | 'SpecificUser' | 'OrganizationAdmin';
export type OrganizationBody = 'Unit' | 'Area' | 'Forum';
export type ApprovalRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type ExecutionAction = 'Approved' | 'Rejected' | 'Skipped';

export interface ApprovalStage {
  stageId?: string;
  stageName: string;
  stageOrder: number;
  approverType: ApproverType;
  roleId?: string | null;
  userId?: string | null;
  organizationBody?: OrganizationBody | null;
  isOptional: boolean;
  autoApprove: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApprovalWorkflow {
  workflowId: string;
  workflowCode: string;
  workflowName: string;
  description?: string;
  module: ModuleType;
  entityType: string;
  isActive: boolean;
  requiresAllStages: boolean;
  stages: ApprovalStage[];
  usageCount?: number;
  createdAt: Date;
  updatedAt: Date;

  // relations
  // executions?: ApprovalExecution[]; 

}

export interface CreateWorkflowRequest {
  workflowCode: string;
  workflowName: string;
  description?: string;
  module: ModuleType;
  entityType: string;
  isActive?: boolean;
  requiresAllStages?: boolean;
  stages: Omit<ApprovalStage, 'stageId' | 'createdAt' | 'updatedAt'>[];
}

export interface UpdateWorkflowRequest {
  workflowName?: string;
  description?: string | null;
  isActive?: boolean;
  requiresAllStages?: boolean;
  stages?: UpdateWorkflowStage[];
}

export interface UpdateWorkflowStage {
  stageId?: string | null;
  stageName: string;
  stageOrder: number;
  approverType: ApproverType;
  roleId?: string | null;
  userId?: string | null;
  organizationBody?: OrganizationBody | null;
  isOptional?: boolean;
  autoApprove?: boolean;
}

export interface CreateStageRequest {
  stageName: string;
  stageOrder: number;
  approverType: ApproverType;
  roleId?: string | null;
  userId?: string | null;
  organizationBody?: OrganizationBody | null;
  isOptional?: boolean;
  autoApprove?: boolean;
}

export interface UpdateStageRequest {
  stageName?: string;
  stageOrder?: number;
  approverType?: ApproverType;
  roleId?: string | null;
  userId?: string | null;
  organizationBody?: OrganizationBody | null;
  isOptional?: boolean;
  autoApprove?: boolean;
}

// Approval Request Interfaces
export interface ApprovalExecution {
  executionId: string;
  stageId: string;
  stage?: Partial<ApprovalStage>;
  stageOrder: number;
  assignedApproverId?: string | null;
  assignedApprover?: Partial<User> | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  decision?: 'Approve' | 'Reject' | null;
  reviewedBy?: string | null;
  reviewedByUser?: Partial<User> | null;
  reviewedAt?: Date | null;
  comments?: string | null;

  // relations
  request?: Partial<ApprovalRequest>;

}

export interface ApprovalRequest {
  requestId: string;
  workflowId: string;
  workflow?: Partial<ApprovalWorkflow>
  entityType: string;
  entityId: string;
  entityLabel?: string | null;
  entityContext?: Record<string, any> | null;
  entityContextSnapshotAt?: Date | null;
  forumId?: string | null;
  areaId?: string | null;
  unitId?: string | null;
  requestedBy: string;
  requestedByUser: Partial<User>;
  requestedAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectedByUser?: Partial<User> | null;
  rejectionReason: string | null;
  status: ApprovalRequestStatus;
  currentStageOrder?: number | null;
  // Additional fields that might come from search/list endpoints
  workflowName?: string;
  workflowCode?: string;
  module?: ModuleType;
  entityDisplayName?: string;
  requestedByUserName?: string;
  currentStageId?: string | null;
  currentStageName?: string | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  // relations
  executions?: ApprovalExecution[];
}

export interface ApprovalRequestDetailsResponse {
  request: ApprovalRequest;
  executions: ApprovalExecution[];
  workflow: ApprovalWorkflow;
}

export interface ProcessApprovalRequest {
  executionId: string;
  decision: 'Approve' | 'Reject';
  comments?: string;

  userId?: string | null;
  organizationBody?: OrganizationBody | null;
  isOptional?: boolean;
  autoApprove?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// User-Scoped Approval Views (Part 2)
// ═══════════════════════════════════════════════════════════════════════════

export type ExecutionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Skipped';

/** Lightweight user reference returned in enriched responses */
export interface UserSummary {
  userId: string;
  name: string;
  role?: string;
  scopeEntityName?: string | null;
}

/** Lightweight workflow reference */
export interface WorkflowSummary {
  workflowId?: string;
  workflowCode: string;
  workflowName: string;
  module?: string;
  totalStages?: number;
}

/** A single stage execution summary (used in pipeline rendering) */
export interface StageExecutionSummary {
  executionId: string;
  stageOrder: number;
  stageName: string;
  status: ExecutionStatus;
  assignedApproverName?: string | null;
  assignedApproverId?: string | null;
  reviewedAt?: string | null;
  decision?: 'Approve' | 'Reject' | null;
}

/** Full execution detail (used in detail page journey) */
export interface ExecutionDetail {
  executionId: string;
  stageId: string;
  stageOrder: number;
  stageName: string;
  status: ExecutionStatus;
  assignedApprover?: UserSummary | null;
  reviewedBy?: UserSummary | null;
  reviewedAt?: string | null;
  decision?: 'Approve' | 'Reject' | null;
  comments?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Enriched approval request detail (GET /requests/:requestId) */
export interface EnrichedApprovalRequestDetail {
  requestId: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  status: ApprovalRequestStatus;
  currentStageOrder?: number | null;

  entityLabel?: string | null;
  entityContext?: Record<string, any> | null;
  entityContextSnapshotAt?: string | null;

  forumId?: string | null;
  areaId?: string | null;
  unitId?: string | null;

  requestedBy: UserSummary;
  requestedAt: string;

  workflow: WorkflowSummary;
  executions: ExecutionDetail[];

  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

/** My Tasks search item (approver perspective) */
export interface ApprovalTaskItem {
  executionId: string;
  requestId: string;
  stageId: string;
  stageOrder: number;
  status: ExecutionStatus;
  assignedApproverId: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  decision?: 'Approve' | 'Reject' | null;
  comments?: string | null;
  createdAt?: string;
  updatedAt?: string;

  stage: {
    stageId: string;
    stageName: string;
    stageOrder: number;
  };

  request: {
    requestId: string;
    entityType: string;
    entityId: string;
    status: ApprovalRequestStatus;
    currentStageOrder?: number | null;
    entityLabel?: string | null;
    entityContext?: Record<string, any> | null;
    entityContextSnapshotAt?: string | null;
    requestedBy: string;
    requestedAt: string;
    forumId?: string | null;
    areaId?: string | null;
    unitId?: string | null;

    workflow: WorkflowSummary;
    requestedByUser?: UserSummary;
    executions: StageExecutionSummary[];
  };
}

/** Status summary for tab badge counts */
export interface StatusSummary {
  [key: string]: number;
}

/** My Tasks search response */
export interface MyTasksSearchResponse {
  items: ApprovalTaskItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: StatusSummary;
}

/** My Submissions search item (submitter perspective) */
export interface ApprovalSubmissionItem {
  requestId: string;
  entityType: string;
  entityId: string;
  entityLabel?: string | null;
  status: ApprovalRequestStatus;
  currentStageOrder?: number | null;
  requestedAt: string;

  workflow: WorkflowSummary;
  executions: StageExecutionSummary[];

  rejectionReason?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
}

/** My Submissions search response */
export interface MySubmissionsSearchResponse {
  items: ApprovalSubmissionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: StatusSummary;
}

/** Configurable waiting time thresholds (in hours) */
export interface WaitingTimeThresholds {
  normal: number;   // below this → green
  warning: number;  // between normal and warning → amber
  // above warning → red
}

export const DEFAULT_WAITING_THRESHOLDS: WaitingTimeThresholds = {
  normal: 12,
  warning: 48,
};
