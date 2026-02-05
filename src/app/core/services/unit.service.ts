import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse, Filter } from '../../shared/models/search.model';
import {
  Unit,
  CreateUnitRequest,
  UpdateUnitRequest,
  UnitWithDetails,
  UnitStats,
  AgentsListWithSummary
} from '../../shared/models/unit.model';
import { AssignAdminRequest } from '../../shared/models/forum.model';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private http = inject(HttpService);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH & LIST
  // ═══════════════════════════════════════════════════════════════════════════

  searchUnits(request: SearchRequest): Observable<SearchResponse<Unit>> {
    return this.http.post<SearchResponse<Unit>>('/organization-bodies/units/search', request);
  }

  /**
   * Search units for select/autocomplete components
   */
  searchUnitsForSelect(
    searchTerm: string = '',
    additionalFilters: Filter[] = []
  ): Observable<Unit[]> {
    const request: SearchRequest = {
      searchTerm,
      filters: additionalFilters,
      page: 1,
      pageSize: 50,
      sortBy: 'unitName',
      sortOrder: 'asc',
    };

    return this.searchUnits(request).pipe(map((response) => response.items));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get unit with full admin details and hierarchy info (for profile page)
   */
  getUnitWithDetails(unitId: string): Observable<UnitWithDetails> {
    return this.http.get<UnitWithDetails>(`/organization-bodies/units/${unitId}`);
  }

  /**
   * Get unit statistics (for overview tab)
   */
  getUnitStats(unitId: string): Observable<UnitStats> {
    return this.http.get<UnitStats>(`/organization-bodies/units/${unitId}/stats`);
  }

  /**
   * Get agents in unit with pagination and member counts (for Agents tab)
   */
  getUnitAgents(unitId: string, page = 1, pageSize = 10): Observable<AgentsListWithSummary> {
    return this.http.get<AgentsListWithSummary>(
      `/agents/unit/${unitId}`,
      { params: { page, pageSize } }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  getUnit(unitId: string): Observable<Unit> {
    return this.http.get<Unit>(`/organization-bodies/units/${unitId}`);
  }

  createUnit(unit: CreateUnitRequest): Observable<Unit> {
    return this.http.post<Unit>('/organization-bodies/units', unit);
  }

  updateUnit(unitId: string, unit: UpdateUnitRequest): Observable<Unit> {
    return this.http.patch<Unit>(`/organization-bodies/units/${unitId}`, unit);
  }

  deleteUnit(unitId: string): Observable<void> {
    return this.http.delete<void>(`/organization-bodies/units/${unitId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Reassign unit admin to a new user
   */
  assignAdmin(unitId: string, request: AssignAdminRequest): Observable<void> {
    return this.http.post<void>(`/organization-bodies/units/${unitId}/assign-admin`, request);
  }
}
