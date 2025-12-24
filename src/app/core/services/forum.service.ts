import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse, Filter } from '../../shared/models/search.model';
import { Forum, CreateForumRequest, UpdateForumRequest } from '../../shared/models/forum.model';

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  private http = inject(HttpService);

  searchForums(request: SearchRequest): Observable<SearchResponse<Forum>> {
    return this.http.post<SearchResponse<Forum>>('/organization-bodies/forums/search', request);
  }

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
}
