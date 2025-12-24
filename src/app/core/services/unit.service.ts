import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import { Unit, CreateUnitRequest, UpdateUnitRequest } from '../../shared/models/unit.model';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private http = inject(HttpService);

  searchUnits(request: SearchRequest): Observable<SearchResponse<Unit>> {
    return this.http.post<SearchResponse<Unit>>('/organization-bodies/units/search', request);
  }

  getUnit(unitId: string): Observable<Unit> {
    return this.http.get<Unit>(`/organization-bodies/units/${unitId}`);
  }

  createUnit(unit: CreateUnitRequest): Observable<Unit> {
    return this.http.post<Unit>('/organization-bodies/units', unit);
  }

  updateUnit(unitId: string, unit: UpdateUnitRequest): Observable<Unit> {
    return this.http.patch<Unit>(`/organization-bodies/units/${unitId}`, unit);
  }

  deleteUnit(unitId: string): Observable<void> {
    return this.http.delete<void>(`/organization-bodies/units/${unitId}`);
  }
}
