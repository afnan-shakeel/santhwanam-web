import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-outcome-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outcome-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OutcomeBannerComponent {
  @Input() status: 'Approved' | 'Rejected' = 'Approved';
  @Input() approvedBy?: string | null;
  @Input() approvedAt?: Date | null;
  @Input() rejectedBy?: string | null;
  @Input() rejectedAt?: Date | null;
  @Input() rejectionReason?: string | null;
}
