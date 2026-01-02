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
    return this.http.get<MemberTier[]>('/membership/tiers', { params: { activeOnly } })
      .pipe(map(response => response));
  }

  /**
   * Get active tiers for member registration dropdown
   */
  getActiveTiersForRegistration(): Observable<MemberTier[]> {
    return this.getAllTiers(true);
  }

  /**
   * Get a specific tier by ID
   */
  getTierById(tierId: string): Observable<MemberTier> {
    return this.http.get<MemberTier>(`/membership/tiers/${tierId}`);
  }
}
