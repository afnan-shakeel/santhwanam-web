import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse, Filter } from '../../shared/models/search.model';
import {
  Forum,
  CreateForumRequest,
  UpdateForumRequest,
  ForumWithDetails,
  ForumStats,
  AreasListWithSummary,
  AssignAdminRequest
} from '../../shared/models/forum.model';

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  private http = inject(HttpService);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH & LIST
  // ═══════════════════════════════════════════════════════════════════════════

  searchForums(request: SearchRequest): Observable<SearchResponse<Forum>> {
    return this.http.post<SearchResponse<Forum>>('/organization-bodies/forums/search', request);
  }

  searchForumsForSelect(
    searchTerm: string = '',
    additionalFilters: Filter[] = []
  ): Observable<Forum[]> {
    const filters: Filter[] = [...additionalFilters];

    const request: SearchRequest = {
      searchTerm,
      filters,
      page: 1,
      pageSize: 50,
      sortBy: 'forumName',
      sortOrder: 'asc',
    };

    return this.searchForums(request).pipe(map((response) => response.items));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get forum with full admin details (for profile page)
   */
  getForumWithDetails(forumId: string): Observable<ForumWithDetails> {
    return this.http.get<ForumWithDetails>(`/organization-bodies/forums/${forumId}`);
  }

  /**
   * Get forum statistics (for overview tab)
   */
  getForumStats(forumId: string): Observable<ForumStats> {
    return this.http.get<ForumStats>(`/organization-bodies/forums/${forumId}/stats`);
  }

  /**
   * Get areas in forum with pagination and counts (for Areas tab)
   */
  getForumAreas(forumId: string, page = 1, pageSize = 20): Observable<AreasListWithSummary> {
    return this.http.get<AreasListWithSummary>(
      `/organization-bodies/forums/${forumId}/areas`,
      { params: { page, pageSize } }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  getForum(forumId: string): Observable<Forum> {
    return this.http.get<Forum>(`/organization-bodies/forums/${forumId}`);
  }

  createForum(request: CreateForumRequest): Observable<Forum> {
    return this.http.post<Forum>('/organization-bodies/forums', request);
  }

  updateForum(forumId: string, request: UpdateForumRequest): Observable<Forum> {
    return this.http.patch<Forum>(`/organization-bodies/forums/${forumId}`, request);
  }

  deleteForum(forumId: string): Observable<void> {
    return this.http.delete<void>(`/organization-bodies/forums/${forumId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Reassign forum admin to a new user
   */
  assignAdmin(forumId: string, request: AssignAdminRequest): Observable<void> {
    return this.http.post<void>(`/organization-bodies/forums/${forumId}/assign-admin`, request);
  }
}
