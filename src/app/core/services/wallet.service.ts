import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import {
  Wallet,
  WalletSummary,
  WalletWithMember,
  WalletTransaction,
  WalletDepositRequest,
  WalletDebitRequest,
  WalletStatistics,
  CreateDepositRequest,
  CreateDebitRequest,
  WalletAdjustmentRequest,
  TransactionListResponse,
  DepositRequestListResponse,
  DebitRequestListResponse,
  WalletListResponse,
  TransactionQueryParams,
  DepositRequestQueryParams,
  DebitRequestQueryParams,
  AdminWalletQueryParams,
  LowBalanceQueryParams,
  PendingDepositsQueryParams,
  PendingDebitsQueryParams
} from '../../shared/models/wallet.model';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpService);

  // ==================== MEMBER WALLET ====================

  /**
   * Get wallet summary for a specific member
   * GET /wallet/members/:memberId/wallet
   */
  getWalletSummary(memberId: string): Observable<WalletSummary> {
    return this.http.get<WalletSummary>(`/wallet/members/${memberId}/wallet`);
  }

  /**
   * Get wallet summary for logged-in member
   * GET /wallet/my-wallet
   */
  getMyWallet(): Observable<WalletSummary> {
    return this.http.get<WalletSummary>('/wallet/my-wallet');
  }

  /**
   * Get wallet transaction history
   * GET /wallet/members/:memberId/wallet/transactions
   */
  getTransactions(memberId: string, params?: TransactionQueryParams): Observable<TransactionListResponse> {
    return this.http.get<TransactionListResponse>(
      `/wallet/members/${memberId}/wallet/transactions`,
      { params: params as any }
    );
  }

  // ==================== DEPOSIT REQUESTS ====================

  /**
   * Request a wallet deposit
   * POST /wallet/members/:memberId/wallet/deposit-requests
   */
  createDepositRequest(memberId: string, request: CreateDepositRequest): Observable<WalletDepositRequest> {
    return this.http.post<WalletDepositRequest>(
      `/wallet/members/${memberId}/wallet/deposit-requests`,
      request
    );
  }

  /**
   * Get member's deposit requests
   * GET /wallet/members/:memberId/wallet/deposit-requests
   */
  getDepositRequests(memberId: string, params?: DepositRequestQueryParams): Observable<DepositRequestListResponse> {
    return this.http.get<DepositRequestListResponse>(
      `/wallet/members/${memberId}/wallet/deposit-requests`,
      { params: params as any }
    );
  }

  /**
   * Submit deposit request for approval
   * POST /wallet/deposit-requests/:requestId/submit
   */
  submitDepositRequest(requestId: string): Observable<WalletDepositRequest> {
    return this.http.post<WalletDepositRequest>(
      `/wallet/deposit-requests/${requestId}/submit`,
      {}
    );
  }

  // ==================== DEBIT REQUESTS ====================

  /**
   * Get member's debit requests
   * GET /wallet/members/:memberId/wallet/debit-requests
   */
  getDebitRequests(memberId: string, params?: DebitRequestQueryParams): Observable<DebitRequestListResponse> {
    return this.http.get<DebitRequestListResponse>(
      `/wallet/members/${memberId}/wallet/debit-requests`,
      { params: params as any }
    );
  }

  /**
   * Create a debit request for a member
   * POST /wallet/members/:memberId/wallet/debit-requests
   */
  createDebitRequest(memberId: string, request: CreateDebitRequest): Observable<WalletDebitRequest> {
    return this.http.post<WalletDebitRequest>(
      `/wallet/members/${memberId}/wallet/debit-requests`,
      request
    );
  }

  /**
   * Get pending acknowledgment requests
   * GET /wallet/debit-requests/pending
   */
  getPendingDebitRequests(params?: PendingDebitsQueryParams): Observable<DebitRequestListResponse> {
    return this.http.get<DebitRequestListResponse>(
      '/wallet/debit-requests/pending',
      { params: params as any }
    );
  }

  /**
   * Acknowledge a debit request
   * POST /wallet/debit-requests/:debitRequestId/acknowledge
   */
  acknowledgeDebitRequest(debitRequestId: string): Observable<WalletDebitRequest> {
    return this.http.post<WalletDebitRequest>(
      `/wallet/debit-requests/${debitRequestId}/acknowledge`,
      {}
    );
  }

  /**
   * Invalidate a debit request
   * POST /wallet/debit-requests/:debitRequestId/invalidate
   */
  invalidateDebitRequest(debitRequestId: string): Observable<WalletDebitRequest> {
    return this.http.post<WalletDebitRequest>(
      `/wallet/debit-requests/${debitRequestId}/invalidate`,
      {}
    );
  }

  // ==================== ADMIN OPERATIONS ====================

  /**
   * Get all pending deposit requests (admin)
   * GET /wallet/admin/deposits/pending
   */
  getAdminPendingDeposits(params?: PendingDepositsQueryParams): Observable<DepositRequestListResponse> {
    return this.http.get<DepositRequestListResponse>(
      '/wallet/admin/deposits/pending',
      { params: params as any }
    );
  }

  /**
   * Get all wallets (admin)
   * GET /wallet/admin/wallets
   */
  getAdminWallets(params?: AdminWalletQueryParams): Observable<WalletListResponse> {
    return this.http.get<WalletListResponse>(
      '/wallet/admin/wallets',
      { params: params as any }
    );
  }

  /**
   * Get wallet statistics
   * GET /wallet/admin/wallets/statistics
   */
  getWalletStatistics(): Observable<WalletStatistics> {
    return this.http.get<WalletStatistics>('/wallet/admin/wallets/statistics');
  }

  /**
   * Get low balance wallets
   * GET /wallet/admin/wallets/low-balance
   */
  getLowBalanceWallets(params?: LowBalanceQueryParams): Observable<WalletListResponse> {
    return this.http.get<WalletListResponse>(
      '/wallet/admin/wallets/low-balance',
      { params: params as any }
    );
  }

  /**
   * Get wallet details by ID
   * GET /wallet/admin/wallets/:walletId
   */
  getWalletById(walletId: string): Observable<WalletWithMember> {
    return this.http.get<WalletWithMember>(`/wallet/admin/wallets/${walletId}`);
  }

  /**
   * Manual wallet adjustment
   * POST /wallet/admin/wallets/:walletId/adjust
   */
  adjustWallet(walletId: string, request: WalletAdjustmentRequest): Observable<Wallet> {
    return this.http.post<Wallet>(
      `/wallet/admin/wallets/${walletId}/adjust`,
      request
    );
  }
}
