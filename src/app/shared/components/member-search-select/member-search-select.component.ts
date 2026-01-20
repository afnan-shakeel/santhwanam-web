import { Component, EventEmitter, Input, Output, inject, signal, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

import { MemberService } from '../../../core/services/member.service';
import { Member } from '../../models/member.model';
import { SearchSelectComponent, SearchSelectOption } from '../search-select/search-select.component';

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
  imports: [CommonModule, FormsModule, SearchSelectComponent],
  templateUrl: './member-search-select.component.html',
  styleUrls: ['./member-search-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MemberSearchSelectComponent),
      multi: true
    }
  ]
})
export class MemberSearchSelectComponent implements ControlValueAccessor {
  private memberService = inject(MemberService);

  @Input() label = '';
  @Input() placeholder = 'Search by member code or name...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() hint = '';
  @Input() error = '';

  @Output() memberSelected = new EventEmitter<MemberSearchResult>();

  // Options for the search select
  memberOptions = signal<SearchSelectOption<string>[]>([]);
  initialOptions = signal<SearchSelectOption<string>[]>([]);
  loading = signal(false);

  // Store full member data for lookup
  private membersMap = signal<Map<string, MemberSearchResult>>(new Map());

  // Current selected value (memberId)
  selectedMemberId = signal<string | null>(null);

  // Currently selected member (full object)
  selectedMember = signal<MemberSearchResult | null>(null);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  // ControlValueAccessor implementation
  writeValue(value: string | null): void {
    this.selectedMemberId.set(value);
    if (value) {
      // Try to find the member in the map
      const member = this.membersMap().get(value);
      if (member) {
        this.selectedMember.set(member);
        this.initialOptions.set([{
          value: member.memberId,
          label: `${member.memberCode} - ${member.firstName} ${member.lastName}`
        }]);
      }
    } else {
      this.selectedMember.set(null);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSearch(term: string): void {
    if (term.length < 2) {
      this.memberOptions.set([]);
      return;
    }

    this.loading.set(true);
    this.memberService.searchMembers({
      searchTerm: term,
      searchFields: ['memberCode', 'firstName', 'middleName', 'lastName'],
      page: 1,
      pageSize: 10,
      sortBy: 'memberCode',
      sortOrder: 'asc'
    }).subscribe({
      next: (response) => {
        this.loading.set(false);
        const results = response.items.map((member: Member) => this.mapMemberToResult(member));
        
        // Store in map for later lookup
        const newMap = new Map(this.membersMap());
        results.forEach(member => newMap.set(member.memberId, member));
        this.membersMap.set(newMap);

        // Convert to search select options
        this.memberOptions.set(results.map(member => ({
          value: member.memberId,
          label: `${member.memberCode} - ${member.firstName} ${member.lastName} (${member.status || 'Unknown'})`
        })));
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Member search error:', err);
      }
    });
  }

  onSelectionChange(memberId: string | null): void {
    this.selectedMemberId.set(memberId);
    this.onChange(memberId);
    this.onTouched();

    if (memberId) {
      const member = this.membersMap().get(memberId);
      if (member) {
        this.selectedMember.set(member);
        this.memberSelected.emit(member);
      }
    } else {
      this.selectedMember.set(null);
    }
  }

  private mapMemberToResult(member: Member): MemberSearchResult {
    return {
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
      photoUrl: undefined
    };
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
}
