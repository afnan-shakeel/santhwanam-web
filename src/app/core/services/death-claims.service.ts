import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import { environment } from '../../../environments/environment';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import {
  DeathClaim,
  DeathClaimDocument,
  DeathClaimDashboardStats,
  ReportClaimRequest,
  VerifyDocumentRequest,
  VerifyClaimRequest,
  SettleClaimRequest,
  ClaimDocumentType
} from '../../shared/models/death-claim.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DeathClaimsService {
  private http = inject(HttpService);
  private httpClient = inject(HttpClient);
  private readonly basePath = '/death-claims';
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  /**
   * Search death claims with advanced filtering
   */
  searchClaims(request: SearchRequest): Observable<SearchResponse<DeathClaim>> {
    request.eagerLoad = ['agent', 'unit', 'contributionCycles', 'approvalRequest', 'reportedByUser']
    return this.http.post<SearchResponse<DeathClaim>>(`${this.basePath}/search`, request);
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<DeathClaimDashboardStats> {
    return this.http.get<DeathClaimDashboardStats>(`${this.basePath}/dashboard/stats`);
  }

  /**
   * Get claims requiring immediate action (UnderVerification status)
   */
  getClaimsRequiringAction(page = 1, limit = 50): Observable<SearchResponse<DeathClaim>> {
    return this.http.get<SearchResponse<DeathClaim>>(
      `${this.basePath}/requiring-action`,
      { params: { page: page.toString(), limit: limit.toString() } }
    );
  }

  /**
   * Get claim details by ID
   */
  getClaimById(claimId: string): Observable<DeathClaim> {
    return this.http.get<DeathClaim>(`${this.basePath}/${claimId}`);
  }

  /**
   * Report a new death claim
   */
  reportClaim(request: ReportClaimRequest): Observable<DeathClaim> {
    return this.http.post<DeathClaim>(`${this.basePath}/report`, request);
  }

  /**
   * Get claim documents
   */
  getClaimDocuments(claimId: string): Observable<DeathClaimDocument[]> {
    return this.http.get<DeathClaimDocument[]>(`${this.basePath}/${claimId}/documents`);
  }

  /**
   * Upload a claim document
   */
  uploadDocument(
    claimId: string,
    documentType: ClaimDocumentType,
    documentName: string,
    file: File,
    mimeType: string
  ): Observable<ApiResponse<DeathClaimDocument>> {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('documentName', documentName);
    formData.append('mimeType', mimeType);
    formData.append('file', file);

    return this.http.post<ApiResponse<DeathClaimDocument>>(
      `${this.basePath}/${claimId}/documents`,
      formData
    );
  }

  /**
   * Download a claim document
   */
  downloadDocument(claimId: string, documentId: string): Observable<Blob> {
    return this.httpClient.get(
      `${this.baseUrl}${this.basePath}/${claimId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
  }

  /**
   * Verify or reject a document
   */
  verifyDocument(
    claimId: string,
    documentId: string,
    request: VerifyDocumentRequest
  ): Observable<ApiResponse<DeathClaimDocument>> {
    return this.http.post<ApiResponse<DeathClaimDocument>>(
      `${this.basePath}/${claimId}/documents/${documentId}/verify`,
      request
    );
  }

  /**
   * Verify claim (complete verification process)
   */
  verifyClaim(claimId: string, request: VerifyClaimRequest): Observable<ApiResponse<DeathClaim>> {
    return this.http.post<ApiResponse<DeathClaim>>(
      `${this.basePath}/${claimId}/verify`,
      request
    );
  }

  /**
   * Submit claim for approval
   */
  submitClaim(claimId: string): Observable<ApiResponse<DeathClaim>> {
    return this.http.post<ApiResponse<DeathClaim>>(
      `${this.basePath}/${claimId}/submit`,
      {}
    );
  }

  /**
   * Settle claim (process payout)
   */
  settleClaim(claimId: string, request: SettleClaimRequest): Observable<ApiResponse<DeathClaim>> {
    return this.http.post<ApiResponse<DeathClaim>>(
      `${this.basePath}/${claimId}/settle`,
      request
    );
  }

  /**
   * List death claims with filters
   */
  listClaims(params: {
    claimStatus?: string;
    forumId?: string;
    areaId?: string;
    unitId?: string;
    agentId?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<DeathClaim>> {
    const queryParams: Record<string, string> = {};
    
    if (params.claimStatus) queryParams['claimStatus'] = params.claimStatus;
    if (params.forumId) queryParams['forumId'] = params.forumId;
    if (params.areaId) queryParams['areaId'] = params.areaId;
    if (params.unitId) queryParams['unitId'] = params.unitId;
    if (params.agentId) queryParams['agentId'] = params.agentId;
    if (params.page) queryParams['page'] = params.page.toString();
    if (params.limit) queryParams['limit'] = params.limit.toString();

    return this.http.get<PaginatedResponse<DeathClaim>>(this.basePath, { params: queryParams });
  }

  /**
   * Get member's death benefit amount
   */
  getMemberBenefit(memberId: string): Observable<ApiResponse<{
    memberId: string;
    memberCode: string;
    memberName: string;
    tierId: string;
    tierName: string;
    deathBenefit: number;
  }>> {
    return this.http.get<ApiResponse<{
      memberId: string;
      memberCode: string;
      memberName: string;
      tierId: string;
      tierName: string;
      deathBenefit: number;
    }>>(`/members/${memberId}/benefit`);
  }
}
