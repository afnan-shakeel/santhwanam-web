import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse, Filter } from '../../shared/models/search.model';
import { Area, CreateAreaRequest, UpdateAreaRequest } from '../../shared/models/area.model';

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private http = inject(HttpService);

  searchAreas(request: SearchRequest): Observable<SearchResponse<Area>> {
    return this.http.post<SearchResponse<Area>>('/organization-bodies/areas/search', request);
  }

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
}
