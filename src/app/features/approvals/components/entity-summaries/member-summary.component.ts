import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-member-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberSummaryComponent {
  @Input() context: Record<string, any> = {};
  @Input() compact = false;
}
