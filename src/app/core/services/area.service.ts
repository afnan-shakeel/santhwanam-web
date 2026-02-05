import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse, Filter } from '../../shared/models/search.model';
import {
  Area,
  CreateAreaRequest,
  UpdateAreaRequest,
  AreaWithDetails,
  AreaStats,
  UnitsListWithSummary
} from '../../shared/models/area.model';
import { AssignAdminRequest } from '../../shared/models/forum.model';

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private http = inject(HttpService);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH & LIST
  // ═══════════════════════════════════════════════════════════════════════════

  searchAreas(request: SearchRequest): Observable<SearchResponse<Area>> {
    return this.http.post<SearchResponse<Area>>('/organization-bodies/areas/search', request);
  }

  /**
   * Search areas for select/autocomplete components
   */
  searchAreasForSelect(
    searchTerm: string = '',
    additionalFilters: Filter[] = []
  ): Observable<Area[]> {
    const request: SearchRequest = {
      searchTerm,
      filters: additionalFilters,
      page: 1,
      pageSize: 50,
      sortBy: 'areaName',
      sortOrder: 'asc',
    };

    return this.searchAreas(request).pipe(map((response) => response.items));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get area with full admin details and forum info (for profile page)
   */
  getAreaWithDetails(areaId: string): Observable<AreaWithDetails> {
    return this.http.get<AreaWithDetails>(`/organization-bodies/areas/${areaId}`);
  }

  /**
   * Get area statistics (for overview tab)
   */
  getAreaStats(areaId: string): Observable<AreaStats> {
    return this.http.get<AreaStats>(`/organization-bodies/areas/${areaId}/stats`);
  }

  /**
   * Get units in area with pagination and counts (for Units tab)
   */
  getAreaUnits(areaId: string, page = 1, pageSize = 20): Observable<UnitsListWithSummary> {
    return this.http.get<UnitsListWithSummary>(
      `/organization-bodies/areas/${areaId}/units`,
      { params: { page, pageSize } }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  getArea(areaId: string): Observable<Area> {
    return this.http.get<Area>(`/organization-bodies/areas/${areaId}`);
  }

  createArea(request: CreateAreaRequest): Observable<Area> {
    return this.http.post<Area>('/organization-bodies/areas', request);
  }

  updateArea(areaId: string, request: UpdateAreaRequest): Observable<Area> {
    return this.http.patch<Area>(`/organization-bodies/areas/${areaId}`, request);
  }

  deleteArea(areaId: string): Observable<void> {
    return this.http.delete<void>(`/organization-bodies/areas/${areaId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Reassign area admin to a new user
   */
  assignAdmin(areaId: string, request: AssignAdminRequest): Observable<void> {
    return this.http.post<void>(`/organization-bodies/areas/${areaId}/assign-admin`, request);
  }
}
