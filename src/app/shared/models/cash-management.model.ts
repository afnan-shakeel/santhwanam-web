/**
 * Cash Management Module - Type Definitions
 * Based on OpenAPI spec: Cash Management - Custody, Handovers, Admin
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export type CustodyUserRole = 'Agent' | 'UnitAdmin' | 'AreaAdmin' | 'ForumAdmin';
export type ReceiverRole = 'UnitAdmin' | 'AreaAdmin' | 'ForumAdmin' | 'SuperAdmin';
export type CustodyStatus = 'Active' | 'Inactive' | 'Suspended';
export type HandoverStatus = 'Initiated' | 'Acknowledged' | 'Rejected' | 'Cancelled';
export type HandoverType = 'Normal' | 'AdminTransition';
export type HandoverHistoryRole = 'initiator' | 'receiver' | 'all';

// GL Account Codes for custody levels
export const GL_CUSTODY_ACCOUNTS = {
  AGENT: '1001',
  UNIT_ADMIN: '1002',
  AREA_ADMIN: '1003',
  FORUM_ADMIN: '1004',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BASE MODELS
// ═══════════════════════════════════════════════════════════════════════════

export interface CashCustody {
  custodyId: string;
  userId: string;
  userRole: CustodyUserRole;
  glAccountCode: string;
  currentBalance: number;
  status: CustodyStatus;
  forumId: string | null;
  areaId: string | null;
  unitId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashCustodyWithRelations extends CashCustody {
  user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  forum: {
    forumId: string;
    forumName: string;
  } | null;
  area: {
    areaId: string;
    areaName: string;
  } | null;
  unit: {
    unitId: string;
    unitName: string;
  } | null;
}

export interface CashCustodySummary {
  glAccountCode: string;
  totalBalance: number;
  activeCustodies: number;
  custodies: CashCustodyWithRelations[];
}

export interface CashHandover {
  handoverId: string;
  handoverNumber: string;
  fromUserId: string;
  fromUserRole: CustodyUserRole;
  toUserId: string;
  toUserRole: ReceiverRole;
  amount: number;
  status: HandoverStatus;
  handoverType: HandoverType;
  requiresApproval: boolean;
  forumId: string | null;
  areaId: string | null;
  unitId: string | null;
  initiatorNotes: string | null;
  receiverNotes: string | null;
  rejectionReason: string | null;
  journalEntryId: string | null;
  approvalRequestId: string | null;
  initiatedAt: string;
  acknowledgedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
}

export interface CashHandoverWithRelations extends CashHandover {
  fromUser: {
    userId: string;
    email: string;
    fullName?: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  handoverNumber: string;
  counterpartyName: string;
  counterpartyRole: string;
  amount: number;
  status: HandoverStatus;
  toUser: {
    userId: string;
    email: string;
    fullName?: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  forum: {
    forumId: string;
    forumName: string;
  } | null;
  area: {
    areaId: string;
    areaName: string;
  } | null;
  unit: {
    unitId: string;
    unitName: string;
  } | null;
  journalEntry: {
    entryId: string;
    entryNumber: string;
  } | null;
  approvalRequest: {
    requestId: string;
    requestNumber: string;
    status: string;
  } | null;
}

export interface ValidReceiver {
  userId: string;
  email: string;
  fullName: string;
  lastName: string;
  role: string;
  roleDisplayName: string;
  scopeEntityId: string | null;
  scopeEntityName: string | null;
  hierarchyLevel?: string | null;
  hierarchyName?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface InitiateHandoverRequest {
  toUserId: string;
  toUserRole: ReceiverRole;
  amount: number;
  initiatorNotes?: string;
  handoverType?: HandoverType;
  sourceHandoverId?: string;
}

export interface AcknowledgeHandoverRequest {
  receiverNotes?: string;
}

export interface RejectHandoverRequest {
  rejectionReason: string;
}

export interface ApproveHandoverRequest {
  approverNotes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CustodyListResponse {
  custodies: CashCustodyWithRelations[];
  total: number;
  page: number;
  limit: number;
}

export interface HandoverListResponse {
  handovers: CashHandoverWithRelations[];
  total: number;
  page: number;
  limit: number;
}

export interface HandoverHistoryResponse {
  handovers: CashHandoverWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CustodyActivityType = 
  | 'contribution_received'
  | 'wallet_deposit_received'
  | 'handover_received'
  | 'handover_sent'
  | 'adjustment';

export interface CustodyActivity {
  activityId: string;
  type: CustodyActivityType;
  amount: number;
  direction: 'in' | 'out';
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  description: string;
  createdAt: string;
}

export interface CustodyActivityResponse {
  activities: CustodyActivity[];
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CashDashboardSummary {
  totalCash: number;
  bankBalance: number;
  totalInCustody: number;
  pendingHandovers: number;
  pendingHandoverAmount: number;
}

export interface CashDashboardByLevel {
  [level: string]: {
    count: number;
    totalBalance: number;
    glAccountCode: string;
  };
}

export interface CashDashboardAlerts {
  overdueCount: number;
  overdueAmount: number;
  overdueThresholdDays: number;
  pendingOverdue: number;
  pendingOverdueHours: number;
  reconciled: boolean;
  lastReconciliationAt: string;
}

export interface CashDashboardResponse {
  summary: CashDashboardSummary;
  byLevel: CashDashboardByLevel;
  alerts: CashDashboardAlerts;
  recentActivity: CustodyActivity[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTODY BY LEVEL TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CustodyLevelItem {
  level: string;
  glAccountCode: string;
  glAccountName: string;
  userCount: number;
  totalBalance: number;
  glBalance: number;
  reconciled: boolean;
}

export interface CustodyByLevelResponse {
  levels: CustodyLevelItem[];
  totalInCustody: number;
  bankBalance: number;
  totalCash: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTODY REPORT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CustodyReportItem {
  custodyId: string;
  userId: string;
  userName: string;
  userRole: string;
  unitName: string | null;
  areaName: string | null;
  glAccountCode: string;
  status: string;
  currentBalance: number;
  totalReceived: number;
  totalTransferred: number;
  lastTransactionAt: string | null;
  daysSinceLastTransaction: number | null;
  isOverdue: boolean;
}

export interface CustodyReportSummary {
  totalUsers: number;
  totalBalance: number;
  activeUsers: number;
  inactiveUsers: number;
}

export interface CustodyReportResponse {
  custodies: CustodyReportItem[];
  summary: CustodyReportSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERDUE REPORT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface OverdueUser {
  custodyId: string;
  userId: string;
  userName: string;
  userRole: string;
  unitName: string | null;
  areaName: string | null;
  currentBalance: number;
  lastTransactionAt: string | null;
  daysSinceLastTransaction: number;
}

export interface OverdueReportSummary {
  totalOverdueUsers: number;
  totalOverdueAmount: number;
}

export interface OverdueReportResponse {
  thresholdDays: number;
  overdueUsers: OverdueUser[];
  summary: OverdueReportSummary;
}

// ═══════════════════════════════════════════════════════════════════════════
// PENDING TRANSFERS TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PendingTransfer {
  handoverId: string;
  handoverNumber: string;
  fromUserName: string;
  fromUserRole: string;
  fromUnit: string | null;
  toUserName: string;
  toUserRole: string;
  amount: number;
  status: string;
  requiresApproval: boolean;
  approvalStatus: string | null;
  initiatedAt: string;
  ageHours: number;
}

export interface PendingTransfersSummary {
  total: number;
  totalAmount: number;
  requiresApproval: number;
  overdue: number;
}

export interface PendingTransfersResponse {
  transfers: PendingTransfer[];
  summary: PendingTransfersSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RECONCILIATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ReconciliationAccount {
  accountCode: string;
  accountName: string;
  glBalance: number;
  custodyTotal: number;
  difference: number;
  isReconciled: boolean;
  userCount: number;
}

export interface ReconciliationSummary {
  totalGlBalance: number;
  totalCustodyBalance: number;
  totalDifference: number;
  allReconciled: boolean;
}

export interface ReconciliationResponse {
  accounts: ReconciliationAccount[];
  summary: ReconciliationSummary;
  bankAccount: {
    accountCode: string;
    accountName: string;
    balance: number;
  };
  lastCheckedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY PARAMS
// ═══════════════════════════════════════════════════════════════════════════

export interface CustodyListParams {
  userId?: string;
  userRole?: CustodyUserRole;
  status?: CustodyStatus;
  forumId?: string;
  areaId?: string;
  unitId?: string;
  page?: number;
  limit?: number;
}

export interface HandoverListParams {
  fromUserId?: string;
  toUserId?: string;
  status?: HandoverStatus;
  forumId?: string;
  requiresApproval?: boolean;
  page?: number;
  limit?: number;
}

export interface HandoverHistoryParams {
  role?: HandoverHistoryRole;
  status?: HandoverStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CustodyActivityParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CustodyReportParams {
  forumId?: string;
  areaId?: string;
  unitId?: string;
  level?: CustodyUserRole;
  minBalance?: number;
  status?: 'Active' | 'Inactive';
  page?: number;
  limit?: number;
}

export interface OverdueReportParams {
  thresholdDays?: number;
  forumId?: string;
  areaId?: string;
  level?: CustodyUserRole;
}

export interface PendingTransfersParams {
  forumId?: string;
  areaId?: string;
  fromRole?: CustodyUserRole;
  toRole?: ReceiverRole;
  minAge?: number;
  page?: number;
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UI SPECIFIC TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Rejection reason options for UI dropdown */
export const REJECTION_REASONS = [
  { value: 'amount_mismatch', label: 'Amount mismatch (received different amount)' },
  { value: 'cash_not_received', label: 'Cash not received' },
  { value: 'other', label: 'Other (please specify)' },
] as const;

export type RejectionReasonCode = typeof REJECTION_REASONS[number]['value'];

// ═══════════════════════════════════════════════════════════════════════════
// ADDITIONAL UI TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Cash handover status for UI */
export type CashHandoverStatus = 'INITIATED' | 'ACKNOWLEDGED' | 'REJECTED' | 'CANCELLED';

/** Cash custody status for UI */
export type CashCustodyStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/** User role for UI */
export type UserRole = 'AGENT' | 'UNIT_ADMIN' | 'AREA_ADMIN' | 'FORUM_ADMIN' | 'SUPER_ADMIN';

/** Cash dashboard data */
export interface CashDashboard {
  totalInCustody: number;
  activeCustodians: number;
  pendingHandovers: number;
  overdueCustodians: number;
  custodyByRole: Array<{
    role: string;
    count: number;
    totalAmount: number;
  }>;
}

/** Custody report item */
export interface CustodyReportItem {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  currentBalance: number;
  lastUpdatedAt: string;
  scopeEntityName?: string;
}

/** Overdue report item */
export interface OverdueReportItem {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  currentBalance: number;
  daysOverdue: number;
  dueDate: string;
  lastActivityDate: string;
  scopeEntityName?: string;
}

/** Pending bank deposit */
export interface PendingBankDeposit {
  depositId: string;
  depositorName: string;
  depositorRole: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  referenceNumber: string;
  depositDate: string;
  notes?: string;
  createdAt: string;
}

/** Cash activity item */
export interface CashActivity {
  activityId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  relatedHandoverId?: string;
  createdAt: string;
  counterpartyName?: string;
}
