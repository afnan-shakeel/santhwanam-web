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
  stageOrder: number;
  assignedApproverId?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  decision?: 'Approve' | 'Reject' | null;
  reviewedBy?: string | null;
  reviewedByUser?: Partial<User> | null;
  reviewedAt?: Date | null;
  comments?: string | null;
}

export interface ApprovalRequest {
  requestId: string;
  workflowId: string;
  workflow?: ApprovalWorkflow
  entityType: string;
  entityId: string;
  forumId?: string | null;
  areaId?: string | null;
  unitId?: string | null;
  requestedBy: string;
  requestedByUser: Partial<User>;
  requestedAt: Date;
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
