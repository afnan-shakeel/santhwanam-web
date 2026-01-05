import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import {
  ContributionCycle,
  MemberContribution,
  RecordCashRequest,
  AcknowledgeContributionRequest
} from '../../shared/models/death-claim.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ContributionHistoryResponse {
  success: boolean;
  data: {
    contributions: MemberContribution[];
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContributionsService {
  private http = inject(HttpService);
  private readonly basePath = '/contributions';

  /**
   * Get contribution cycle by ID
   */
  getCycleById(cycleId: string): Observable<ApiResponse<ContributionCycle>> {
    return this.http.get<ApiResponse<ContributionCycle>>(`${this.basePath}/cycles/${cycleId}`);
  }

  /**
   * Search contribution cycles
   */
  searchCycles(request: SearchRequest): Observable<SearchResponse<ContributionCycle>> {
    return this.http.post<SearchResponse<ContributionCycle>>(`${this.basePath}/cycles/search`, request);
  }

  /**
   * Close a contribution cycle
   */
  closeCycle(cycleId: string): Observable<ApiResponse<ContributionCycle>> {
    return this.http.post<ApiResponse<ContributionCycle>>(`${this.basePath}/cycles/${cycleId}/close`, {});
  }

  /**
   * Get contribution by ID
   */
  getContributionById(contributionId: string): Observable<ApiResponse<MemberContribution>> {
    return this.http.get<ApiResponse<MemberContribution>>(`${this.basePath}/${contributionId}`);
  }

  /**
   * Acknowledge wallet debit for contribution
   */
  acknowledgeContribution(
    contributionId: string,
    request?: AcknowledgeContributionRequest
  ): Observable<ApiResponse<MemberContribution>> {
    return this.http.post<ApiResponse<MemberContribution>>(
      `${this.basePath}/${contributionId}/acknowledge`,
      request || {}
    );
  }

  /**
   * Record direct cash contribution
   */
  recordCashContribution(
    contributionId: string,
    request?: RecordCashRequest
  ): Observable<ApiResponse<MemberContribution>> {
    return this.http.post<ApiResponse<MemberContribution>>(
      `${this.basePath}/${contributionId}/record-cash`,
      request || {}
    );
  }

  /**
   * Mark contribution as missed
   */
  markContributionMissed(contributionId: string): Observable<ApiResponse<MemberContribution>> {
    return this.http.post<ApiResponse<MemberContribution>>(
      `${this.basePath}/${contributionId}/mark-missed`,
      {}
    );
  }

  /**
   * Search member contributions
   */
  searchContributions(request: SearchRequest): Observable<SearchResponse<MemberContribution>> {
    return this.http.post<SearchResponse<MemberContribution>>(`${this.basePath}/search`, request);
  }

  /**
   * Get member's contribution history
   */
  getMemberContributionHistory(
    memberId: string,
    params?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Observable<ContributionHistoryResponse> {
    const queryParams: Record<string, string> = {};
    
    if (params?.status) queryParams['status'] = params.status;
    if (params?.page) queryParams['page'] = params.page.toString();
    if (params?.limit) queryParams['limit'] = params.limit.toString();

    return this.http.get<ContributionHistoryResponse>(
      `${this.basePath}/member/${memberId}/history`,
      { params: queryParams }
    );
  }
}
