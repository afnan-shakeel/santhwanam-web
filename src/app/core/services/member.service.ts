import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse } from '../../shared/models/search.model';
import {
  Member,
  RegisterMemberRequest,
  RegisterMemberResponse,
  UpdateDraftPersonalDetailsRequest,
  Nominee,
  AddNomineeRequest,
  UpdateNomineeRequest,
  MemberDocument,
  UploadDocumentRequest,
  MemberPayment,
  RecordPaymentRequest,
  SubmitRegistrationResponse
} from '../../shared/models/member.model';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private http = inject(HttpService);

  // ==================== MEMBER SEARCH & QUERIES ====================

  searchMembers(request: SearchRequest): Observable<SearchResponse<Member>> {
    return this.http.post<SearchResponse<Member>>('/members/search', request);
  }

  getMember(memberId: string): Observable<Member> {
    return this.http.get<Member>(`/members/${memberId}`);
  }

  // ==================== STEP 1: PERSONAL DETAILS ====================

  registerMember(request: RegisterMemberRequest): Observable<RegisterMemberResponse> {
    return this.http.post<RegisterMemberResponse>('/members/register', request);
  }

  updateDraftPersonalDetails(
    memberId: string,
    request: UpdateDraftPersonalDetailsRequest
  ): Observable<void> {
    return this.http.patch<void>(`/members/${memberId}/draft/personal-details`, request);
  }

  completePersonalDetailsStep(memberId: string): Observable<void> {
    return this.http.post<void>(`/members/${memberId}/complete/personal-details`, {});
  }

  // ==================== STEP 2: NOMINEES ====================

  getNominees(memberId: string): Observable<Nominee[]> {
    return this.http.get<Nominee[]>(`/members/${memberId}/nominees`);
  }

  addNominee(memberId: string, request: AddNomineeRequest): Observable<{ nomineeId: string }> {
    return this.http.post<{ nomineeId: string }>(`/members/${memberId}/nominees`, request);
  }

  updateNominee(
    memberId: string,
    nomineeId: string,
    request: UpdateNomineeRequest
  ): Observable<void> {
    return this.http.patch<void>(`/members/${memberId}/nominees/${nomineeId}`, request);
  }

  deleteNominee(memberId: string, nomineeId: string): Observable<void> {
    return this.http.delete<void>(`/members/${memberId}/nominees/${nomineeId}`);
  }

  completeNomineesStep(memberId: string): Observable<void> {
    return this.http.post<void>(`/members/${memberId}/complete/nominees`, {});
  }

  // ==================== STEP 3: DOCUMENTS & PAYMENT ====================

  getDocuments(memberId: string): Observable<MemberDocument[]> {
    return this.http.get<MemberDocument[]>(`/members/${memberId}/documents`);
  }

  uploadDocument(
    memberId: string,
    request: UploadDocumentRequest
  ): Observable<{ documentId: string }> {
    return this.http.post<{ documentId: string }>(`/members/${memberId}/documents`, request);
  }

  deleteDocument(memberId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(`/members/${memberId}/documents/${documentId}`);
  }

  getPayment(memberId: string): Observable<MemberPayment> {
    return this.http.get<MemberPayment>(`/members/${memberId}/payment`);
  }

  recordPayment(memberId: string, request: RecordPaymentRequest): Observable<void> {
    return this.http.post<void>(`/members/${memberId}/payment`, request);
  }

  submitRegistration(memberId: string): Observable<SubmitRegistrationResponse> {
    return this.http.post<SubmitRegistrationResponse>(`/members/${memberId}/submit`, {});
  }

  // ==================== MEMBER MANAGEMENT ====================

  suspendMember(memberId: string, reason: string = '', suspendedBy?: string): Observable<void> {
    return this.http.post<void>(`/members/${memberId}/suspend`, { reason, suspendedBy });
  }

  reactivateMember(memberId: string, reactivatedBy?: string): Observable<void> {
    return this.http.post<void>(`/members/${memberId}/reactivate`, { reactivatedBy });
  }

  closeMember(memberId: string, closureReason: string): Observable<void> {
    return this.http.post<void>(`/members/${memberId}/close`, { closureReason });
  }

  deleteMember(memberId: string): Observable<void> {
    return this.http.delete<void>(`/members/${memberId}`);
  }
}
