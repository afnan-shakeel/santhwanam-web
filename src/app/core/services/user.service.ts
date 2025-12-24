import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse, Filter } from '../../shared/models/search.model';
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

  /**
   * Search users for select/autocomplete components
   * @param searchTerm - The search term to filter users
   * @param additionalFilters - Optional additional filters to apply
   * @returns Observable of User array
   */
  searchUsersForSelect(searchTerm: string, additionalFilters?: Filter[]): Observable<User[]> {
    const request: SearchRequest = {
      searchTerm,
      searchFields: ['firstName', 'lastName', 'email'],
      page: 1,
      pageSize: 50,
      sortBy: 'firstName',
      sortOrder: 'asc',
      filters: additionalFilters || []
    };

    return this.searchUsers(request).pipe(
      map(response => response.items)
    );
  }
}
