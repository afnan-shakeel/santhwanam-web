import { Component, EventEmitter, Input, Output, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

import { MemberService } from '../../../core/services/member.service';
import { Member } from '../../models/member.model';

export interface MemberSearchResult {
  memberId: string;
  memberCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  contactNumber: string;
  email?: string;
  status?: string;
  tierId?: string;
  tierName?: string;
  agentId?: string;
  agentName?: string;
  photoUrl?: string;
}

@Component({
  selector: 'app-member-search-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './member-search-select.component.html',
  styleUrls: ['./member-search-select.component.css']
})
export class MemberSearchSelectComponent {
  private memberService = inject(MemberService);

  @Input() placeholder = 'Search by member code or name...';
  @Input() required = false;
  @Input() disabled = false;
  @Output() memberSelected = new EventEmitter<MemberSearchResult>();

  searchQuery = signal('');
  searchResults = signal<MemberSearchResult[]>([]);
  selectedMember = signal<MemberSearchResult | null>(null);
  isSearching = signal(false);
  showDropdown = signal(false);
  error = signal<string | null>(null);

  private searchSubject = new Subject<string>();

  constructor() {
    // Debounce search
    this.searchSubject.pipe(debounceTime(300)).subscribe(query => {
      if (query.length >= 2) {
        this.performSearch(query);
      } else {
        this.searchResults.set([]);
        this.showDropdown.set(false);
      }
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.searchQuery.set(value);
    
    if (value.length >= 2) {
      this.isSearching.set(true);
      this.searchSubject.next(value);
    } else {
      this.searchResults.set([]);
      this.showDropdown.set(false);
      this.isSearching.set(false);
    }
  }

  private performSearch(query: string): void {
    this.memberService.searchMembers({
      searchTerm: query,
      searchFields: ['memberCode', 'firstName', 'middleName', 'lastName'],
      page: 1,
      pageSize: 10,
      sortBy: 'memberCode',
      sortOrder: 'asc'
    }).subscribe({
      next: (response) => {
        this.isSearching.set(false);
        const results = response.items.map((member: Member) => ({
          memberId: member.memberId,
          memberCode: member.memberCode,
          firstName: member.firstName,
          middleName: member.middleName,
          lastName: member.lastName,
          dateOfBirth: member.dateOfBirth,
          contactNumber: member.contactNumber,
          email: member.email,
          status: member.memberStatus,
          tierId: member.tier?.tierId,
          tierName: member.tier?.tierName,
          agentId: member.agent?.agentId,
          agentName: member.agent ? `${member.agent.firstName} ${member.agent.lastName}` : undefined,
          photoUrl: undefined // Member model doesn't have photoUrl
        }));
        this.searchResults.set(results);
        this.showDropdown.set(results.length > 0);
        this.error.set(null);
      },
      error: (err) => {
        this.isSearching.set(false);
        this.error.set('Failed to search members');
        console.error('Member search error:', err);
      }
    });
  }

  selectMember(member: MemberSearchResult): void {
    this.selectedMember.set(member);
    this.searchQuery.set(`${member.memberCode} - ${member.firstName} ${member.lastName}`);
    this.showDropdown.set(false);
    this.memberSelected.emit(member);
  }

  clearSelection(): void {
    this.selectedMember.set(null);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showDropdown.set(false);
  }

  getFullName(member: MemberSearchResult): string {
    const parts = [member.firstName, member.middleName, member.lastName].filter(Boolean);
    return parts.join(' ');
  }

  getInitials(member: MemberSearchResult): string {
    const firstInitial = member.firstName?.[0] || '';
    const lastInitial = member.lastName?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  onFocus(): void {
    if (this.searchResults().length > 0 && this.searchQuery().length >= 2) {
      this.showDropdown.set(true);
    }
  }

  onBlur(): void {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }
}
