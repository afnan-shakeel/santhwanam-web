// Contribution Summary for authenticated member
export interface MyContributionsSummary {
  memberId: string;
  memberCode: string;
  totalContributed: number;
  thisYear: number;
  pendingCount: number;
  averagePerMonth: number;
  walletBalance: number;
}

// Pending contribution with full details for member view
export interface MyPendingContribution {
  contributionId: string;
  cycleCode: string;
  claimId: string;
  deceasedMember: {
    memberId: string;
    memberCode: string;
    fullName: string;
  };
  tierName: string;
  contributionAmount: number;
  dueDate: string;
  daysLeft: number;
  contributionStatus: string;
  agent: {
    agentId: string;
    agentCode: string;
    fullName: string;
    contactNumber: string;
  } | null;
  cycle: {
    cycleId: string;
    cycleNumber: string;
    claimNumber: string;
    deceasedMemberName: string;
    benefitAmount: number;
    startDate: string;
    collectionDeadline: string;
    cycleStatus: string;
  };
}

// Member contribution with cycle, member, and agent relations (for history)
export interface MemberContributionWithRelations {
  contributionId: string;
  cycleId: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  tierId: string;
  agentId: string;
  expectedAmount: number;
  contributionStatus: ContributionHistoryStatus;
  paymentMethod: ContributionPaymentMethod | null;
  collectionDate: string | null;
  collectedBy: string | null;
  walletDebitRequestId: string | null;
  debitAcknowledgedAt: string | null;
  cashReceiptReference: string | null;
  journalEntryId: string | null;
  isConsecutiveMiss: boolean;
  createdAt: string;
  updatedAt: string | null;
  cycle: ContributionCycleRelation;
  member: MemberRelation;
  agent: AgentRelation;
}

// Contribution history status
export type ContributionHistoryStatus = 
  | 'Pending' 
  | 'WalletDebitRequested' 
  | 'Acknowledged' 
  | 'Collected' 
  | 'Missed' 
  | 'Exempted';

// Contribution payment method
export type ContributionPaymentMethod = 'WalletDebit' | 'DirectCash';

// Cycle relation for contribution history
export interface ContributionCycleRelation {
  cycleId: string;
  cycleNumber: string;
  deathClaimId: string;
  claimNumber: string;
  deceasedMemberId: string;
  deceasedMemberName: string;
  benefitAmount: number;
  forumId: string;
  startDate: string;
  collectionDeadline: string;
  cycleStatus: string;
  totalMembers: number;
  totalExpectedAmount: number;
  totalCollectedAmount: number;
  totalPendingAmount: number;
  membersCollected: number;
  membersPending: number;
  membersMissed: number;
}

// Member relation for contribution history
export interface MemberRelation {
  memberId: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  agentId: string;
  isLowBalance: boolean;
}

// Agent relation for contribution history
export interface AgentRelation {
  agentId: string;
  agentCode: string;
  firstName: string;
  lastName: string;
}

// Active Cycles Summary for admin dashboard
export interface ActiveCyclesSummary {
  activeCyclesCount: number;
  totalCollecting: number;
  totalExpected: number;
  avgCompletionPercentage: number;
}

// API Response types
export interface MyContributionsSummaryResponse {
  success: boolean;
  data: MyContributionsSummary;
}

export interface MyPendingContributionsResponse {
  pendingContributions: MyPendingContribution[];
}

export interface MyContributionsHistoryResponse {
    contributions: MemberContributionWithRelations[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
  };
}

export interface ActiveCyclesSummaryResponse {
  success: boolean;
  data: ActiveCyclesSummary;
}
