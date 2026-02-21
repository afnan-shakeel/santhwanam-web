import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cash-handover-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cash-handover-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashHandoverSummaryComponent {
  @Input() context: Record<string, any> = {};
  @Input() compact = false;
}
