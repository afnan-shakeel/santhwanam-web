import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-death-claim-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './death-claim-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeathClaimSummaryComponent {
  @Input() context: Record<string, any> = {};
  @Input() compact = false;
}
