import { MembershipTier } from "../constants/permissions";
import { Agent } from "./agent.model";
import { ApprovalRequest } from "./approval-workflow.model";
import { Area } from "./area.model";
import { Forum } from "./forum.model";
import { Member, Nominee } from "./member.model";
import { Unit } from "./unit.model";
import { User } from "./user.model";

// Death Claim Status
export type ClaimStatus =
  | 'Reported'
  | 'UnderVerification'
  | 'Verified'
  | 'PendingApproval'
  | 'Approved'
  | 'Settled'
  | 'Rejected';

// Document Verification Status
export type DocumentVerificationStatus = 'Pending' | 'Verified' | 'Rejected';

// Claim Verification Status
export type ClaimVerificationStatus = 'Pending' | 'InProgress' | 'Completed' | 'Rejected';

// Settlement Status
export type SettlementStatus = 'Pending' | 'Completed';

// Payment Method
export type PaymentMethod = 'Cash' | 'BankTransfer' | 'Cheque';

// Document Type
export type ClaimDocumentType =
  | 'DeathCertificate'
  | 'NewspaperClipping'
  | 'PoliceReport'
  | 'MedicalReport'
  | 'PostMortemReport'
  | 'IdProof'
  | 'BankStatement'
  | 'MembershipCard'
  | 'NomineeIdProof'
  | 'Other';

// Nominee Address
export interface NomineeAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Death Claim
export interface DeathClaim {
  claimId: string;
  claimNumber: string; // Format: DC-YYYY-NNNNN
  claimStatus: ClaimStatus;
  approvalRequestId?: string;
  approvalRequest?: Partial<ApprovalRequest>;

  // Member Info
  memberId: string;
  memberCode: string;
  memberName: string;
  tierId: string;
  agentId: string;
  unitId: string;

  // Death Info
  deathDate: string;
  deathPlace?: string;
  causeOfDeath?: string;

  // Reporter Info
  reportedBy: string;
  reportedByUser?: Partial<User>;
  reportedByRole: string;
  reportedDate: string;
  initialNotes?: string;

  // Nominee Info
  nomineeId: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeContactNumber: string;
  nomineeAddress?: NomineeAddress;

  // Benefit
  benefitAmount?: number;

  // Verification
  verificationStatus: ClaimVerificationStatus;
  verifiedBy?: string;
  verifiedByUser?: Partial<User>;
  verifiedDate?: string;
  verificationNotes?: string;

  // Settlement
  settlementStatus: SettlementStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paymentDate?: string;
  paidBy?: string;
  nomineeAcknowledgment?: string;
  journalEntryId?: string;

  // Timestamps
  createdAt: string;
  approvedAt?: string;
  settledAt?: string;
  updatedAt?: string;

  // Approval/Rejection
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;

  // Related data (from eagerLoad)
  member?: Partial<Member>;
  agent?: Partial<Agent>;
  unit?: Partial<Unit>;
  area?: Partial<Area>;
  forum?: Partial<Forum>;
  documents?: DeathClaimDocument[];
  contributionCycle?: ContributionCycle;
}

// Death Claim Document
export interface DeathClaimDocument {
  documentId: string;
  claimId: string;
  documentType: ClaimDocumentType;
  documentName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  verificationStatus: DocumentVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

// Dashboard Stats
export interface DeathClaimDashboardStats {
  pendingVerification: number;
  underContribution: number;
  approvedForPayout: number;
  totalThisYear: number;
  totalBenefitsPaidYTD: number;
  pendingCollections: number;
  successRate: number;
}

// Report Claim Request
export interface ReportClaimRequest {
  memberId: string;
  deathDate: string;
  deathPlace?: string;
  causeOfDeath?: string;
  initialNotes?: string;
}

// Upload Document Request
export interface UploadClaimDocumentRequest {
  documentType: ClaimDocumentType;
  documentName: string;
  file: File;
}

// Verify Document Request
export interface VerifyDocumentRequest {
  verificationStatus: 'Verified' | 'Rejected';
  notes?: string;
  rejectionReason?: string;
}

// Verify Claim Request
export interface VerifyClaimRequest {
  verificationNotes?: string;
}

// Settle Claim Request
export interface SettleClaimRequest {
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentDate: string;
  nomineeAcknowledgment?: string;
}

// Contribution Cycle Status
export type CycleStatus = 'Active' | 'Closed';

// Contribution Cycle
export interface ContributionCycle {
  cycleId: string;
  cycleNumber: string; // Format: CC-YYYY-NNNNN
  cycleStatus: CycleStatus;
  deathClaimId: string;
  membershipTierId: string;
  forumId: string;
  benefitAmount: number;
  totalMembers: number;
  totalCollectedAmount: number;
  totalExpectedAmount: number;
  totalMissed?: number;
  membersCollected: number;
  membersPending: number;
  membersMissed: number;
  startDate: string;
  endDate?: string;
  collectionDeadline: Date;
  createdAt: string;
  updatedAt: string;

  // Related data
  deathClaim?: Partial<DeathClaim>;
  contributions?: Partial<MemberContribution>[];
  tier?: {
    tierId: string;
    tierCode: string;
    tierName: string;
  };
}

// Member Contribution Status
export type ContributionStatus =
  | 'Pending'
  | 'WalletDebitRequested'
  | 'Acknowledged'
  | 'Collected'
  | 'Missed'
  | 'Exempted';

// Contribution Payment Method
export type ContributionPaymentMethod = 'WalletDebit' | 'DirectCash';

// Member Contribution
export interface MemberContribution {
  contributionId: string;
  cycleId: string;
  memberId: string;
  agentId: string;
  expectedAmount: number;
  contributionStatus: ContributionStatus;
  paymentMethod?: ContributionPaymentMethod;
  walletDebitRequestId?: string;
  cashReceiptReference?: string;
  journalEntryId?: string;
  collectionDate?: string;
  missedAt?: string;
  exemptionReason?: string;
  createdAt: string;
  updatedAt: string;

  // Related data
  member?: Partial<Member>;
  agent?: Partial<Agent>;
  cycle?: Partial<ContributionCycle>;
}

// Record Cash Request
export interface RecordCashRequest {
  cashReceiptReference?: string;
  // notes?: string;
}

// Acknowledge Contribution Request
export interface AcknowledgeContributionRequest {
  transactionReference: string;
  notes?: string;
}
