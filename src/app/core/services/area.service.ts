import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { Area } from '../../shared/models/area.model';

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

  createArea(area: Partial<Area>): Observable<Area> {
    return this.http.post<Area>('/organization-bodies/areas', area);
  }

  updateArea(areaId: string, area: Partial<Area>): Observable<Area> {
    return this.http.patch<Area>(`/organization-bodies/areas/${areaId}`, area);
  }

  deleteArea(areaId: string): Observable<void> {
    return this.http.delete<void>(`/organization-bodies/areas/${areaId}`);
  }
}
