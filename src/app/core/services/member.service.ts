import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { HttpService } from '../http/http.service';
import { SearchRequest, SearchResponse, Filter } from '../../shared/models/search.model';
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
  SubmitRegistrationResponse,
  MemberMetadata,
  MetadataOption,
  MemberProfile,
  UpdateMemberProfileRequest,
  MemberSelfProfile,
  UpdateMemberSelfProfileRequest
} from '../../shared/models/member.model';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private http = inject(HttpService);

  // ==================== METADATA ====================

  /**
   * Get all member metadata (document types, categories, collection modes)
   */
  getMetadata(): Observable<MemberMetadata> {
    return this.http.get<MemberMetadata>('/members/metadata');
  }

  /**
   * Get document types for dropdown
   */
  getDocumentTypes(): Observable<MetadataOption[]> {
    return this.getMetadata().pipe(map(metadata => metadata.documentTypes));
  }

  /**
   * Get document categories for dropdown
   */
  getDocumentCategories(): Observable<MetadataOption[]> {
    return this.getMetadata().pipe(map(metadata => metadata.documentCategories));
  }

  /**
   * Get collection modes for dropdown
   */
  getCollectionModes(): Observable<MetadataOption[]> {
    return this.getMetadata().pipe(map(metadata => metadata.collectionModes));
  }

  // ==================== MEMBER SEARCH & QUERIES ====================

  /**
   * Simple member listing with basic filters using query parameters
   */
  listMembers(params?: {
    registrationStatus?: string;
    memberStatus?: string;
    unitId?: string;
    agentId?: string;
    areaId?: string;
    forumId?: string;
    tierId?: string;
    searchQuery?: string;
    page?: number;
    limit?: number;
  }): Observable<{ data: Member[]; total: number; page: number; limit: number }> {
    return this.http.get<{ data: Member[]; total: number; page: number; limit: number }>(
      '/members',
      { params: params as any }
    );
  }

  /**
   * Advanced search with complex filters
   */
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

  // ==================== MEMBER PROFILE ====================

  /**
   * Get member profile with wallet information
   */
  getMemberProfile(memberId: string): Observable<MemberProfile> {
    return this.http.get<MemberProfile>(`/members/${memberId}/profile`);
  }

  /**
   * Update member profile (approved members only)
   */
  updateMemberProfile(
    memberId: string,
    request: UpdateMemberProfileRequest
  ): Observable<void> {
    return this.http.put<void>(`/members/${memberId}/profile`, request);
  }

  /**
   * Search members for select/autocomplete components
   */
  searchMembersForSelect(
    searchTerm: string = '',
    additionalFilters: Filter[] = []
  ): Observable<Member[]> {
    const filters: Filter[] = [
      { field: 'registrationStatus', operator: 'equals', value: 'Approved' },
      ...additionalFilters
    ];

    const request: SearchRequest = {
      searchTerm,
      searchFields: ['firstName', 'lastName', 'memberCode', 'email'],
      filters,
      page: 1,
      pageSize: 50,
      sortBy: 'firstName',
      sortOrder: 'asc',
    };

    return this.searchMembers(request).pipe(map((response) => response.items));
  }

  // ==================== MEMBER SELF PROFILE ====================

  /**
   * Get logged-in member's own profile
   */
  getMyProfile(): Observable<MemberSelfProfile> {
    return this.http.get<MemberSelfProfile>('/members/my-profile');
  }

  /**
   * Update logged-in member's own profile (limited fields)
   */
  updateMyProfile(request: UpdateMemberSelfProfileRequest): Observable<void> {
    return this.http.put<void>('/members/my-profile', request);
  }

  /**
   * Get logged-in member's nominees
   */
  getMyNominees(): Observable<Nominee[]> {
    return this.http.get<Nominee[]>('/members/my-profile/nominees');
  }

  /**
   * Add nominee for logged-in member
   */
  addMyNominee(request: AddNomineeRequest): Observable<{ nomineeId: string }> {
    return this.http.post<{ nomineeId: string }>('/members/my-profile/nominees', request);
  }

  /**
   * Update nominee for logged-in member
   */
  updateMyNominee(nomineeId: string, request: UpdateNomineeRequest): Observable<void> {
    return this.http.patch<void>(`/members/my-profile/nominees/${nomineeId}`, request);
  }

  /**
   * Delete nominee for logged-in member
   */
  deleteMyNominee(nomineeId: string): Observable<void> {
    return this.http.delete<void>(`/members/my-profile/nominees/${nomineeId}`);
  }

  /**
   * Get logged-in member's documents
   */
  getMyDocuments(): Observable<MemberDocument[]> {
    return this.http.get<MemberDocument[]>('/members/my-profile/documents');
  }

  // ==================== DOCUMENT VERIFICATION (ADMIN) ====================

  /**
   * Verify a member's document (Admin only)
   */
  verifyDocument(memberId: string, documentId: string): Observable<void> {
    return this.http.post<void>(`/members/${memberId}/documents/${documentId}/verify`, {});
  }

  /**
   * Unverify a member's document (Admin only)
   */
  unverifyDocument(memberId: string, documentId: string): Observable<void> {
    return this.http.post<void>(`/members/${memberId}/documents/${documentId}/unverify`, {});
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Send notification to a member
   */
  notifyMember(
    memberId: string,
    payload: {
      type: 'low_balance' | 'pending_contribution' | 'general';
      channel?: 'sms' | 'email' | 'push';
    }
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `/members/${memberId}/notify`,
      payload
    );
  }
}
