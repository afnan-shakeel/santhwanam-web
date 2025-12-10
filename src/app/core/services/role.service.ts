import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../../shared/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpService);

  searchRoles(request: SearchRequest): Observable<SearchResponse<Role>> {
    return this.http.post<SearchResponse<Role>>('/iam/roles/search', request);
  }

  getRole(roleId: string): Observable<Role> {
    return this.http.get<Role>(`/iam/roles/${roleId}`);
  }

  createRole(role: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>('/iam/roles', role);
  }

  updateRole(roleId: string, role: UpdateRoleRequest): Observable<Role> {
    return this.http.patch<Role>(`/iam/roles/${roleId}`, role);
  }

  deleteRole(roleId: string): Observable<void> {
    return this.http.delete<void>(`/iam/roles/${roleId}`);
  }
}
