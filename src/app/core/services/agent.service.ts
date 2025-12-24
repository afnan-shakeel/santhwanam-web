import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { Agent, RegisterAgentRequest, UpdateAgentRequest, UpdateDraftRequest } from '../../shared/models/agent.model';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private http = inject(HttpService);

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
}