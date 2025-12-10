import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { Forum } from '../../shared/models/forum.model';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private http = inject(HttpService);

  searchForums(request: SearchRequest): Observable<SearchResponse<Forum>> {
    return this.http.post<SearchResponse<Forum>>('/organization-bodies/forums/search', request);
  }

  getForum(forumId: string): Observable<Forum> {
    return this.http.get<Forum>(`/organization-bodies/forums/${forumId}`);
  }

  createForum(forum: Partial<Forum>): Observable<Forum> {
    return this.http.post<Forum>('/organization-bodies/forums', forum);
  }

  updateForum(forumId: string, forum: Partial<Forum>): Observable<Forum> {
    return this.http.patch<Forum>(`/organization-bodies/forums/${forumId}`, forum);
  }

  deleteForum(forumId: string): Observable<void> {
    return this.http.delete<void>(`/organization-bodies/forums/${forumId}`);
  }
}
