import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashManagementService } from '../../../../core/services/cash-management.service';
import { HandoverStatus } from '../../../../shared/models/cash-management.model';

/**
 * HandoverStatusBadgeComponent
 * 
 * Displays a status badge for handover status.
 */
@Component({
  selector: 'app-handover-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          [ngClass]="[statusInfo.color, statusInfo.bgColor]">
      {{ statusInfo.label }}
    </span>
  `
})
export class HandoverStatusBadgeComponent {
  private cashService = inject(CashManagementService);

  @Input() status: HandoverStatus | string = 'Initiated';

  get statusInfo(): { label: string; color: string; bgColor: string } {
    return this.cashService.getHandoverStatusInfo(this.status);
  }
}
