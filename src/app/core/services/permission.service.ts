import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { Permission } from '../../shared/models/permission.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private http = inject(HttpService);

  searchPermissions(request: SearchRequest): Observable<SearchResponse<Permission>> {
    return this.http.post<SearchResponse<Permission>>('/iam/permissions/search', request);
  }

  getAllPermissions(): Observable<Permission[]> {
    const searchRequest: SearchRequest = {
      page: 1,
      pageSize: 100,
    //   sortBy: 'roleName',
    //   sortOrder: 'asc'
    };
    return this.http.post<SearchResponse<Permission>>('/iam/permissions/search', searchRequest)
      .pipe(map(response => response.items));
  }

  getPermission(permissionId: string): Observable<Permission> {
    return this.http.get<Permission>(`/iam/permissions/${permissionId}`);
  }

  createPermission(permission: Partial<Permission>): Observable<Permission> {
    return this.http.post<Permission>('/iam/permissions', permission);
  }

  updatePermission(permissionId: string, permission: Partial<Permission>): Observable<Permission> {
    return this.http.patch<Permission>(`/iam/permissions/${permissionId}`, permission);
  }

  deletePermission(permissionId: string): Observable<void> {
    return this.http.delete<void>(`/iam/permissions/${permissionId}`);
  }
}
