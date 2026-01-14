import { Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Member info data for the card display
 */
export interface MemberInfoData {
  memberId: string;
  memberCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  contactNumber?: string;
  email?: string;
  tier?: {
    tierCode?: string;
    tierName?: string;
  };
  agent?: {
    agentId?: string;
    agentCode?: string;
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
  };
  unit?: {
    unitId?: string;
    unitCode?: string;
    unitName?: string;
  };
}

/**
 * MemberInfoCardComponent
 * 
 * Shared presentational component for displaying member information.
 * Used in Agent/Admin wallet views and other contexts where member info is needed.
 */
@Component({
  selector: 'app-member-info-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './member-info-card.component.html',
  styleUrl: './member-info-card.component.css'
})
export class MemberInfoCardComponent {
  @Input() member: MemberInfoData | null = null;
  @Input({ transform: booleanAttribute }) showAgent: boolean = false;
  @Input({ transform: booleanAttribute }) showUnit: boolean = false;
  @Input({ transform: booleanAttribute }) showProfileLink: boolean = true;
  @Input() profileLink: string | null = null;

  get memberFullName(): string {
    if (!this.member) return '';
    const parts = [this.member.firstName, this.member.middleName, this.member.lastName].filter(Boolean);
    return parts.join(' ');
  }

  get agentFullName(): string {
    if (!this.member?.agent) return '';
    return [this.member.agent.firstName, this.member.agent.lastName].filter(Boolean).join(' ');
  }

  get computedProfileLink(): string {
    if (this.profileLink) return this.profileLink;
    return this.member ? `/members/${this.member.memberId}` : '';
  }
}
