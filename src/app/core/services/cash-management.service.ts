import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import {
  CashCustody,
  CashCustodyWithRelations,
  CashCustodySummary,
  CashHandover,
  CashHandoverWithRelations,
  ValidReceiver,
  InitiateHandoverRequest,
  AcknowledgeHandoverRequest,
  RejectHandoverRequest,
  ApproveHandoverRequest,
  CustodyListResponse,
  HandoverHistoryResponse,
  CustodyActivityResponse,
  CashDashboardResponse,
  CustodyByLevelResponse,
  CustodyReportResponse,
  OverdueReportResponse,
  PendingTransfersResponse,
  ReconciliationResponse,
  CustodyListParams,
  HandoverListParams,
  HandoverHistoryParams,
  CustodyActivityParams,
  CustodyReportParams,
  OverdueReportParams,
  PendingTransfersParams,
  CustodyReportItem,
} from '../../shared/models/cash-management.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface SearchApiResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
@Injectable({
  providedIn: 'root'
})
export class CashManagementService {
  private http = inject(HttpService);
  private readonly basePath = '/cash-management';

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTODY ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current user's cash custody
   */
  getMyCustody(): Observable<{custody: CashCustody}> {
    return this.http.get<{custody: CashCustody}>(`${this.basePath}/custody/me`);
  }

  /**
   * Get custody by user ID (Admin only)
   */
  getCustodyByUserId(userId: string): Observable<ApiResponse<CashCustodyWithRelations>> {
    return this.http.get<ApiResponse<CashCustodyWithRelations>>(`${this.basePath}/custody/user/${userId}`);
  }

  /**
   * Get custody by custody ID
   */
  getCustodyById(custodyId: string): Observable<ApiResponse<CashCustodyWithRelations>> {
    return this.http.get<ApiResponse<CashCustodyWithRelations>>(`${this.basePath}/custody/${custodyId}`);
  }

  /**
   * Get custody summary by GL account code
   */
  getCustodySummary(glAccountCode: string): Observable<ApiResponse<CashCustodySummary>> {
    return this.http.get<ApiResponse<CashCustodySummary>>(`${this.basePath}/custody/summary/${glAccountCode}`);
  }

  /**
   * List all custodies with filters (Admin only)
   */
  listCustodies(params?: CustodyListParams): Observable<ApiResponse<CustodyListResponse>> {
    return this.http.get<ApiResponse<CustodyListResponse>>(
      `${this.basePath}/custodies`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * Get current user's custody activity
   */
  getMyCustodyActivity(params?: CustodyActivityParams): Observable<ApiResponse<CustodyActivityResponse>> {
    return this.http.get<ApiResponse<CustodyActivityResponse>>(
      `${this.basePath}/custody/me/activity`,
      { params: this.buildParams(params) }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDOVER ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get valid receivers for current user
   */
  getValidReceivers(): Observable<{recipients: ValidReceiver[]}> {
    return this.http.get<{recipients: ValidReceiver[]}>(`${this.basePath}/handovers/receivers`);
  }

  /**
   * Initiate a new cash handover
   */
  initiateHandover(request: InitiateHandoverRequest): Observable<ApiResponse<CashHandover>> {
    return this.http.post<ApiResponse<CashHandover>>(`${this.basePath}/handovers`, request);
  }

  /**
   * Get handover by ID
   */
  getHandoverById(handoverId: string): Observable<ApiResponse<CashHandoverWithRelations>> {
    return this.http.get<ApiResponse<CashHandoverWithRelations>>(`${this.basePath}/handovers/${handoverId}`);
  }

  /**
   * Get pending handovers for current user (to acknowledge)
   */
  getPendingHandovers(): Observable<ApiResponse<CashHandoverWithRelations[]>> {
    return this.http.get<ApiResponse<CashHandoverWithRelations[]>>(`${this.basePath}/handovers/pending/me`);
  }

  /**
   * Get handovers initiated by current user
   */
  getMyInitiatedHandovers(): Observable<SearchApiResponse<CashHandoverWithRelations>> {
    return this.http.get<SearchApiResponse<CashHandoverWithRelations>>(`${this.basePath}/handovers/my-initiated`);
  }

  /**
   * Get pending bank deposits (Super Admin only)
   */
  getPendingBankDeposits(): Observable<ApiResponse<CashHandoverWithRelations[]>> {
    return this.http.get<ApiResponse<CashHandoverWithRelations[]>>(`${this.basePath}/handovers/pending/super-admin`);
  }

  /**
   * Acknowledge a cash handover
   */
  acknowledgeHandover(handoverId: string, request?: AcknowledgeHandoverRequest): Observable<ApiResponse<CashHandover>> {
    return this.http.post<ApiResponse<CashHandover>>(
      `${this.basePath}/handovers/${handoverId}/acknowledge`,
      request || {}
    );
  }

  /**
   * Reject a cash handover
   */
  rejectHandover(handoverId: string, request: RejectHandoverRequest): Observable<ApiResponse<CashHandover>> {
    return this.http.post<ApiResponse<CashHandover>>(
      `${this.basePath}/handovers/${handoverId}/reject`,
      request
    );
  }

  /**
   * Cancel a cash handover (initiator only)
   */
  cancelHandover(handoverId: string): Observable<ApiResponse<CashHandover>> {
    return this.http.post<ApiResponse<CashHandover>>(
      `${this.basePath}/handovers/${handoverId}/cancel`,
      {}
    );
  }

  /**
   * Get handover history for current user
   */
  getHandoverHistory(params?: HandoverHistoryParams): Observable<SearchApiResponse<CashHandoverWithRelations>> {
    return this.http.get<SearchApiResponse<CashHandoverWithRelations>>(
      `${this.basePath}/handovers/history`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * List all handovers with filters (Admin only)
   */
  listHandovers(params?: HandoverListParams): Observable<ApiResponse<{ handovers: CashHandoverWithRelations[]; total: number; page: number; limit: number }>> {
    return this.http.get<ApiResponse<{ handovers: CashHandoverWithRelations[]; total: number; page: number; limit: number }>>(
      `${this.basePath}/handovers`,
      { params: this.buildParams(params) }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get admin dashboard statistics
   */
  getDashboard(forumId?: string, areaId?: string): Observable<ApiResponse<CashDashboardResponse>> {
    const params: Record<string, string> = {};
    if (forumId) params['forumId'] = forumId;
    if (areaId) params['areaId'] = areaId;
    return this.http.get<ApiResponse<CashDashboardResponse>>(`${this.basePath}/admin/dashboard`, { params });
  }

  /**
   * Get custody aggregated by hierarchy level
   */
  getCustodyByLevel(forumId?: string, areaId?: string): Observable<ApiResponse<CustodyByLevelResponse>> {
    const params: Record<string, string> = {};
    if (forumId) params['forumId'] = forumId;
    if (areaId) params['areaId'] = areaId;
    return this.http.get<ApiResponse<CustodyByLevelResponse>>(`${this.basePath}/admin/custody-by-level`, { params });
  }

  /**
   * Get detailed custody report by user
   */
  getCustodyReport(params?: CustodyReportParams): Observable<SearchApiResponse<CustodyReportItem>> {
    return this.http.get<SearchApiResponse<CustodyReportItem>>(
      `${this.basePath}/admin/custody-report`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * Get overdue holdings report
   */
  getOverdueReport(params?: OverdueReportParams): Observable<ApiResponse<OverdueReportResponse>> {
    return this.http.get<ApiResponse<OverdueReportResponse>>(
      `${this.basePath}/admin/overdue`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * Get GL reconciliation report
   */
  getReconciliation(forumId?: string): Observable<ApiResponse<ReconciliationResponse>> {
    const params: Record<string, string> = {};
    if (forumId) params['forumId'] = forumId;
    return this.http.get<ApiResponse<ReconciliationResponse>>(`${this.basePath}/admin/reconciliation`, { params });
  }

  /**
   * Get all pending transfers across organization
   */
  getPendingTransfers(params?: PendingTransfersParams): Observable<ApiResponse<PendingTransfersResponse>> {
    return this.http.get<ApiResponse<PendingTransfersResponse>>(
      `${this.basePath}/admin/pending-transfers`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * Approve bank deposit (Super Admin only)
   */
  approveBankDeposit(handoverId: string, request?: ApproveHandoverRequest): Observable<ApiResponse<{ handoverId: string; handoverNumber: string; status: string; approvalStatus: string; approvedAt: string; approvedBy: string }>> {
    return this.http.post<ApiResponse<{ handoverId: string; handoverNumber: string; status: string; approvalStatus: string; approvedAt: string; approvedBy: string }>>(
      `${this.basePath}/admin/handovers/${handoverId}/approve`,
      request || {}
    );
  }

  /**
   * Reject bank deposit (Super Admin only)
   */
  rejectBankDeposit(depositId: string, request: { reason: string }): Observable<ApiResponse<{ success: boolean }>> {
    return this.http.post<ApiResponse<{ success: boolean }>>(
      `${this.basePath}/admin/deposits/${depositId}/reject`,
      request
    );
  }

  /**
   * Get cash dashboard for admin
   */
  getCashDashboard(): Observable<CashDashboardResponse> {
    return this.http.get<CashDashboardResponse>(`${this.basePath}/admin/dashboard`);
  }

  /**
   * Get user's activity (my activity)
   */
  getMyActivity(params?: { size?: number }): Observable<ApiResponse<{ content: any[] }>> {
    return this.http.get<ApiResponse<{ content: any[] }>>(
      `${this.basePath}/custody/me/activity`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * Get handovers initiated by current user with filters
   */
  getInitiatedHandovers(params?: { page?: number; size?: number; status?: string }): Observable<ApiResponse<{ content: any[]; totalElements: number; totalPages: number }>> {
    return this.http.get<ApiResponse<{ content: any[]; totalElements: number; totalPages: number }>>(
      `${this.basePath}/handovers/history`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * Get handovers received by current user with filters
   */
  getReceivedHandovers(params?: { page?: number; size?: number; status?: string }): Observable<ApiResponse<{ content: any[]; totalElements: number; totalPages: number }>> {
    return this.http.get<ApiResponse<{ content: any[]; totalElements: number; totalPages: number }>>(
      `${this.basePath}/handovers/history/received`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * Send reminder to a custodian
   */
  sendReminder(userId: string): Observable<ApiResponse<{ success: boolean }>> {
    return this.http.post<ApiResponse<{ success: boolean }>>(
      `${this.basePath}/admin/custodians/${userId}/remind`,
      {}
    );
  }

  /**
   * Get custodian details (for admin)
   */
  getCustodianDetails(custodyId: string): Observable<any> {
    return this.http.get<any>(`${this.basePath}/admin/custodians/${custodyId}`);
  }

  /**
   * Get custodian activity (for admin)
   */
  getCustodianActivity(custodyId: string, params?: { size?: number }): Observable<{ content: any[] }> {
    return this.http.get<{ content: any[] }>(
      `${this.basePath}/admin/custodians/${custodyId}/activity`,
      { params: this.buildParams(params) }
    );
  }

  /**
   * Get custodian pending handovers (for admin)
   */
  getCustodianPendingHandovers(custodyId: string): Observable<SearchApiResponse<any>> {
    return this.http.get<SearchApiResponse<any>>(`${this.basePath}/admin/custodians/${custodyId}/pending-handovers`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Build query params object from params
   */
  private buildParams(params?: unknown): Record<string, string> {
    if (!params || typeof params !== 'object') return {};
    
    const queryParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = String(value);
      }
    }
    return queryParams;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Format currency in INR
   */
  formatCurrency(amount: number | string): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount));
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /**
   * Get user full name from user object
   */
  getUserFullName(user: { firstName: string; lastName: string }): string {
    return `${user.firstName} ${user.lastName}`;
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(roleCode: string): string {
    const roleMap: Record<string, string> = {
      'Agent': 'Agent',
      'UnitAdmin': 'Unit Admin',
      'AreaAdmin': 'Area Admin',
      'ForumAdmin': 'Forum Admin',
      'SuperAdmin': 'Super Admin',
      'super_admin': 'Super Admin',
      'forum_admin': 'Forum Admin',
      'area_admin': 'Area Admin',
      'unit_admin': 'Unit Admin',
      'agent': 'Agent',
    };
    return roleMap[roleCode] || roleCode;
  }

  /**
   * Get handover status display info
   */
  getHandoverStatusInfo(status: string): { label: string; color: string; bgColor: string } {
    const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
      'Initiated': { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-100' },
      'Acknowledged': { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
      'Rejected': { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
      'Cancelled': { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    };
    return statusMap[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
  }
}
