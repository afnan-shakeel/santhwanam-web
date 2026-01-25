/**
 * Wallet Module - TypeScript Models
 * Based on OpenAPI specification
 */

import { Member } from "./member.model";

// ==================== ENUMS ====================

export type WalletTransactionType = 'Deposit' | 'Debit' | 'Refund' | 'Adjustment';

export type WalletTransactionStatus = 'Pending' | 'Completed' | 'Failed' | 'Reversed';

export type DepositRequestStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';

export type DebitRequestStatus = 'PendingAcknowledgment' | 'Acknowledged' | 'Completed' | 'Invalidated' | 'Failed';

export type AdjustmentType = 'credit' | 'debit';

// ==================== CORE WALLET ====================

export interface Wallet {
  walletId: string;
  memberId: string;
  currentBalance: number;
  member?: Member;
  createdAt: string;
  updatedAt: string | null;
}


// ==================== TRANSACTIONS ====================

export interface WalletTransaction {
  transactionId: string;
  walletId: string;
  transactionType: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  sourceModule: string;
  sourceEntityId: string | null;
  description: string;
  journalEntryId: string | null;
  status: WalletTransactionStatus;
  createdBy: string;
  createdAt: string;
}

export interface WalletSummary {
  walletId: string;
  memberId: string;
  memberCode?: string;
  memberName?: string;
  currentBalance: number;
  stats?: WalletQuickStats;
  alerts?: WalletAlerts;
  agent?: WalletAgentInfo;
  recentTransactions: WalletTransaction[];
  pendingDepositsCount?: number; // Count of pending deposit requests
}

export interface WalletAgentInfo {
  agentId: string;
  agentCode: string;
  firstName: string;
  lastName: string;
  contactNumber?: string;
}

export interface WalletQuickStats {
  totalDeposits: number;
  totalDebits: number;
  pendingDeposits: number;
  transactionCount: number;
}

export interface WalletAlerts {
  isLowBalance: boolean;
  minimumRequired: number;
  recommendedTopUp: number;
}

// ==================== DEPOSIT REQUESTS ====================

export interface WalletDepositRequest {
  depositRequestId: string;
  memberId: string;
  walletId: string;
  amount: number;
  collectionDate: string;
  collectedBy: string;
  collectedByName?: string;
  notes: string | null;
  requestStatus: DepositRequestStatus;
  approvalRequestId: string | null;
  journalEntryId: string | null;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  member?: Member;
}

export interface CreateDepositRequest {
  amount: number;
  collectionDate: string;
  notes?: string;
}

// ==================== DEBIT REQUESTS ====================

export interface WalletDebitRequest {
  debitRequestId: string;
  memberId: string;
  walletId: string;
  amount: number;
  purpose: string;
  contributionCycleId: string | null;
  contributionId: string | null;
  status: DebitRequestStatus;
  createdAt: string;
  acknowledgedAt: string | null;
  completedAt: string | null;
  member?: {
    memberId: string;
    memberCode: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateDebitRequest {
  amount: number;
  purpose: string;
  contributionCycleId?: string;
  contributionId?: string;
}

// ==================== ADMIN ====================

export interface WalletStatistics {
  totalWallets: number;
  totalBalance: number;
  averageBalance: number;
  lowBalanceCount: number;
}

export interface WalletAdjustmentRequest {
  amount: number;
  adjustmentType: AdjustmentType;
  reason: string;
}

// ==================== PAGINATED RESPONSES ====================

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
}

export interface TransactionListResponse extends PaginatedResponse<WalletTransaction> {
  transactions: WalletTransaction[];
}

export interface DepositRequestListResponse extends PaginatedResponse<WalletDepositRequest> {
  requests: WalletDepositRequest[];
}

export interface DebitRequestListResponse extends PaginatedResponse<WalletDebitRequest> {
  requests: WalletDebitRequest[];
}

export interface WalletListResponse extends PaginatedResponse<Wallet> {
  wallets: Wallet[];
}

// ==================== QUERY PARAMS ====================

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  type?: WalletTransactionType;
  status?: WalletTransactionStatus;
  startDate?: string;
  endDate?: string;
}

export interface DepositRequestQueryParams {
  page?: number;
  limit?: number;
  status?: DepositRequestStatus;
}

export interface DebitRequestQueryParams {
  page?: number;
  limit?: number;
  status?: DebitRequestStatus;
}

export interface AdminWalletQueryParams {
  page?: number;
  limit?: number;
  minBalance?: number;
  maxBalance?: number;
  search?: string;
}

export interface LowBalanceQueryParams {
  threshold?: number;
  page?: number;
  limit?: number;
}

export interface PendingDepositsQueryParams {
  page?: number;
  limit?: number;
  collectedBy?: string;
}

export interface PendingDebitsQueryParams {
  page?: number;
  limit?: number;
  agentId?: string;
}
