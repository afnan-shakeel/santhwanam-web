import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContributionStatus } from '../../../../shared/models/death-claim.model';

interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

@Component({
  selector: 'app-contribution-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold"
      [ngClass]="config().bgColor + ' ' + config().textColor"
    >
      {{ config().label }}
    </span>
  `
})
export class ContributionStatusBadgeComponent {
  status = input.required<ContributionStatus>();

  private readonly statusMap: Record<ContributionStatus, StatusConfig> = {
    'Pending': {
      label: 'Pending',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    },
    'WalletDebitRequested': {
      label: 'Wallet Debit',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    'Acknowledged': {
      label: 'Acknowledged',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    'Collected': {
      label: 'Collected',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    'Missed': {
      label: 'Missed',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    'Exempted': {
      label: 'Exempted',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-500'
    }
  };

  config = computed(() => this.statusMap[this.status()] ?? this.statusMap['Pending']);
}
