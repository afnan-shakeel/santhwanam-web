import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService, ApiRequestOptions } from '../http/http.service';
import { SearchRequest, SearchResponse, Filter } from '../../shared/models/search.model';
import { Agent, RegisterAgentRequest, UpdateAgentRequest, UpdateDraftRequest } from '../../shared/models/agent.model';
import {
  AgentProfile,
  AgentStats,
  AgentMembersResponse,
  AgentMembersQueryParams,
  AgentPerformance,
  AgentHierarchy,
  UpdateAgentProfileRequest,
  AgentContributionsResponse,
  AgentContributionsQueryParams,
  AgentLowBalanceMembersResponse,
  AgentLowBalanceQueryParams
} from '../../shared/models/agent-profile.model';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private http = inject(HttpService);

  // ============ Existing Agent CRUD Methods ============

  searchAgents(request: SearchRequest): Observable<SearchResponse<Agent>> {
    return this.http.post<SearchResponse<Agent>>('/agents/search', request);
  }

  getAgent(agentId: string): Observable<Agent> {
    return this.http.get<Agent>(`/agents/${agentId}`);
  }

  registerAgent(request: RegisterAgentRequest): Observable<{ agentId: string; agentCode: string; registrationStatus: string }> {
    return this.http.post<{ agentId: string; agentCode: string; registrationStatus: string }>('/agents/register', request);
  }

  updateDraft(agentId: string, request: UpdateDraftRequest): Observable<void> {
    return this.http.patch<void>(`/agents/${agentId}/draft`, request);
  }

  submitAgent(agentId: string): Observable<void> {
    return this.http.post<void>(`/agents/${agentId}/submit`, {});
  }

  updateAgent(agentId: string, request: UpdateAgentRequest): Observable<Agent> {
    return this.http.patch<Agent>(`/agents/${agentId}`, request);
  }

  deleteAgent(agentId: string): Observable<void> {
    return this.http.delete<void>(`/agents/${agentId}`);
  }

  // ============ Agent Profile Methods ============

  /**
   * Get logged-in agent's profile
   */
  getMyProfile(): Observable<AgentProfile> {
    return this.http.get<AgentProfile>('/agents/my-profile');
  }

  /**
   * Get agent profile by ID (with hierarchy)
   */
  getAgentProfile(agentId: string): Observable<AgentProfile> {
    return this.http.get<AgentProfile>(`/agents/${agentId}/profile`);
  }

  /**
   * Update agent profile
   */
  updateAgentProfile(agentId: string, request: UpdateAgentProfileRequest): Observable<AgentProfile> {
    return this.http.put<AgentProfile>(`/agents/${agentId}/profile`, request);
  }

  /**
   * Get agent dashboard stats
   */
  getAgentStats(agentId: string, period: 'thisMonth' | 'lastMonth' | 'thisYear' = 'thisMonth'): Observable<AgentStats> {
    return this.http.get<AgentStats>(`/agents/${agentId}/stats`, { params: { period: period } });
  }

  /**
   * Get agent's members (paginated)
   */
  getAgentMembers(agentId: string, params?: AgentMembersQueryParams): Observable<AgentMembersResponse> {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params) {
      if (params.page) queryParams['page'] = params.page;
      if (params.limit) queryParams['limit'] = params.limit;
      if (params.search) queryParams['search'] = params.search;
      if (params.status) queryParams['status'] = params.status;
      if (params.tier) queryParams['tier'] = params.tier;
    }
    return this.http.get<AgentMembersResponse>(`/agents/${agentId}/members`, { params: queryParams });
  }

  /**
   * Export agent's members
   */
  exportAgentMembers(agentId: string, format: 'csv' | 'excel' = 'csv'): Observable<{ members: any[] }> {
    return this.http.get<{ members: any[] }>(`/agents/${agentId}/members/export`, { params: { format } });
  }

  /**
   * Get agent performance metrics
   */
  getAgentPerformance(
    agentId: string,
    period: 'thisMonth' | 'lastMonth' | 'thisYear' = 'thisMonth',
    startDate?: string,
    endDate?: string
  ): Observable<AgentPerformance> {
    const queryParams: Record<string, string> = { period };
    if (startDate) queryParams['startDate'] = startDate;
    if (endDate) queryParams['endDate'] = endDate;
    return this.http.get<AgentPerformance>(`/agents/${agentId}/performance`, { params: queryParams });
  }

  /**
   * Get agent's organization hierarchy
   */
  getAgentHierarchy(agentId: string): Observable<AgentHierarchy> {
    return this.http.get<AgentHierarchy>(`/agents/${agentId}/hierarchy`);
  }

  /**
   * Search agents for select/autocomplete components
   */
  searchAgentsForSelect(
    searchTerm: string = '',
    additionalFilters: Filter[] = []
  ): Observable<Agent[]> {
    const filters: Filter[] = [
      // { field: 'isActive', operator: 'equals', value: true },
      ...additionalFilters
    ];

    const request: SearchRequest = {
      searchTerm,
      searchFields: ['firstName', 'lastName', 'agentCode', 'email'],
      filters,
      page: 1,
      pageSize: 50,
      sortBy: 'firstName',
      sortOrder: 'asc',
    };

    return this.searchAgents(request).pipe(map((response) => response.items));
  }

  // ============ Agent Contributions Methods ============

  /**
   * Get agent's contributions (with optional filtering)
   */
  getAgentContributions(agentId: string, params?: AgentContributionsQueryParams): Observable<AgentContributionsResponse> {
    const queryParams: Record<string, string | number> = {};
    if (params) {
      if (params.page) queryParams['page'] = params.page;
      if (params.limit) queryParams['limit'] = params.limit;
      if (params.status) queryParams['status'] = params.status;
      if (params.cycleId) queryParams['cycleId'] = params.cycleId;
      if (params.search) queryParams['search'] = params.search;
    }
    return this.http.get<AgentContributionsResponse>(`/agents/${agentId}/contributions`, { params: queryParams });
  }

  /**
   * Get agent's pending contributions (convenience method)
   */
  getPendingContributions(agentId: string, params?: Omit<AgentContributionsQueryParams, 'status'>): Observable<AgentContributionsResponse> {
    return this.getAgentContributions(agentId, { ...params, status: 'Pending' });
  }

  /**
   * Get agent's members with low wallet balance
   */
  getLowBalanceMembers(agentId: string, params?: AgentLowBalanceQueryParams): Observable<AgentLowBalanceMembersResponse> {
    const queryParams: Record<string, string | number> = {};
    if (params) {
      if (params.page) queryParams['page'] = params.page;
      if (params.limit) queryParams['limit'] = params.limit;
      if (params.search) queryParams['search'] = params.search;
    }
    return this.http.get<AgentLowBalanceMembersResponse>(`/agents/${agentId}/members/low-balance`, { params: queryParams });
  }
}