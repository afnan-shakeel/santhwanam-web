// Agent Profile Models based on OpenAPI spec

import { MemberContributionWithRelations } from "./contribution.model";

export interface AgentProfile {
  agentId: string;
  agentCode: string;
  registrationStatus: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
  agentStatus: 'Active' | 'Inactive' | 'Suspended' | 'Terminated';
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  contactNumber: string;
  alternateContactNumber?: string | null;
  email: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  totalActiveMembers: number;
  totalRegistrations: number;
  joinedDate?: string | null;
  terminatedDate?: string | null;
  terminationReason?: string | null;
  createdAt: string;
  unit?: {
    unitId: string;
    unitCode: string;
    unitName: string;
  } | null;
  area?: {
    areaId: string;
    areaCode: string;
    areaName: string;
  } | null;
  forum?: {
    forumId: string;
    forumCode: string;
    forumName: string;
  } | null;
}

export interface AgentStats {
  totalMembers: number;
  activeMembers: number;
  suspendedMembers: number;
  frozenMembers: number;
  closedMembers: number;
  pendingApprovals: number;
  newMembersThisMonth: number;
}

export interface AgentMember {
  memberId: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email?: string | null;
  memberStatus?: 'Active' | 'Suspended' | 'Frozen' | 'Closed' | 'Deceased' | null;
  registrationStatus: string;
  tier?: {
    tierId: string;
    tierCode: string;
    tierName: string;
  };
  contributions?: {
    count?: { pending: number }
  };
  wallet?: {
    balance: number;
    isLowBalance: boolean;
  };
  createdAt: string;
  registeredAt?: string | null;
}

export interface AgentMembersResponse {
  items: AgentMember[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

export interface AgentMembersQueryParams {
  page?: number;
  limit?: number;
  status?: 'Active' | 'Suspended' | 'Frozen' | 'Closed' | 'Deceased';
  tier?: string;
  search?: string;
}

export interface MonthlyTrendItem {
  month: string;
  count: number;
}

export interface RetentionTrendItem {
  month: string;
  rate: number;
}

export interface AgentPerformance {
  period: string;
  memberAcquisition: {
    newMembersThisMonth: number;
    monthlyTrend: MonthlyTrendItem[];
  };
  retention: {
    retentionRate: number;
    totalMembers: number;
    activeMembers: number;
    suspendedMembers: number;
    frozenMembers: number;
    closedMembers: number;
    retentionTrend: RetentionTrendItem[];
  };
}

export interface AgentHierarchy {
  unit?: {
    unitId: string;
    unitCode: string;
    unitName: string;
  } | null;
  area?: {
    areaId: string;
    areaCode: string;
    areaName: string;
  } | null;
  forum?: {
    forumId: string;
    forumCode: string;
    forumName: string;
  } | null;
}

export interface UpdateAgentProfileRequest {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  contactNumber?: string;
  alternateContactNumber?: string | null;
  email?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

// ============ Agent Contributions (Pending) ============

export interface AgentContributionMember {
  memberId: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  walletBalance: number;
  isLowBalance: boolean;
}

export interface AgentContributionCycle {
  cycleId: string;
  cycleCode: string;
  dueDate: string;
  daysRemaining: number;
}

export interface AgentContributionItem {
  contributionId: string;
  member: AgentContributionMember;
  cycle: AgentContributionCycle;
  amount: number;
  status: 'Pending' | 'Collected' | 'Missed' | 'Exempted' | 'WalletDebitRequested' | 'Acknowledged';
}

export interface ActiveCycle {
  cycleId: string;
  cycleCode: string;
  dueDate: string;
}

export interface AgentContributionsSummary {
  totalPending: number;
  totalAmount: number;
  activeCycles: ActiveCycle[];
}

export interface AgentContributionsResponse {
  items: MemberContributionWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  summary: AgentContributionsSummary;
}

export interface AgentContributionsQueryParams {
  page?: number;
  limit?: number;
  status?: 'Pending' | 'Collected' | 'Missed' | 'Exempted' | 'WalletDebitRequested' | 'Acknowledged';
  cycleId?: string;
  search?: string;
}

// ============ Agent Low Balance Members ============

export interface LowBalanceMemberItem {
  memberId: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string | null;
  memberStatus: string | null;
  walletBalance: number;
  balanceIndicator: 'empty' | 'low';
}

export interface AgentLowBalanceSummary {
  threshold: number;
  totalCount: number;
}

export interface AgentLowBalanceMembersResponse {
  items: LowBalanceMemberItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  summary: AgentLowBalanceSummary;
}

export interface AgentLowBalanceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}
