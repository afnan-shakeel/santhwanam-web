import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpService);

  searchUsers(request: SearchRequest): Observable<SearchResponse<User>> {
    return this.http.post<SearchResponse<User>>('/iam/users/search', request);
  }

  getUser(userId: string): Observable<User> {
    return this.http.get<User>(`/iam/users/${userId}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>('/iam/users', user);
  }

  updateUser(userId: string, user: Partial<User>): Observable<User> {
    return this.http.patch<User>(`/iam/users/${userId}`, user);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`/iam/users/${userId}`);
  }
}
