import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '../http/http.service';
import { MemberTier } from '../../shared/models/member.model';

interface MembershipTierResponse {
  success: boolean;
  message: string;
  data: MemberTier[];
}

@Injectable({
  providedIn: 'root'
})
export class MembershipTierService {
  private http = inject(HttpService);

  /**
   * Get all membership tiers
   */
  getAllTiers(activeOnly: boolean = false): Observable<MemberTier[]> {
    return this.http.get<MembershipTierResponse>('/membership/tiers', { params: { activeOnly } })
      .pipe(map(response => response.data));
  }

  /**
   * Get active tiers for member registration dropdown
   */
  getActiveTiersForRegistration(): Observable<MemberTier[]> {
    return this.getAllTiers(true);
  }
}
