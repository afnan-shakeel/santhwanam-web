import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClaimStatus } from '../../../../shared/models/death-claim.model';

interface StatusConfig {
  label: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
}

@Component({
  selector: 'app-claim-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
      [ngClass]="config().bgColor + ' ' + config().textColor"
    >
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="config().dotColor"></span>
      {{ config().label }}
    </span>
  `
})
export class ClaimStatusBadgeComponent {
  status = input.required<ClaimStatus>();

  private readonly statusMap: Record<ClaimStatus, StatusConfig> = {
    'Reported': {
      label: 'Reported',
      dotColor: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    'UnderVerification': {
      label: 'Under Verification',
      dotColor: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    },
    'Verified': {
      label: 'Verified',
      dotColor: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700'
    },
    'PendingApproval': {
      label: 'Pending Approval',
      dotColor: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    'Approved': {
      label: 'Approved',
      dotColor: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    'Settled': {
      label: 'Settled',
      dotColor: 'bg-green-800',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800'
    },
    'Rejected': {
      label: 'Rejected',
      dotColor: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    }
  };

  config = computed(() => this.statusMap[this.status()] ?? this.statusMap['Reported']);
}
