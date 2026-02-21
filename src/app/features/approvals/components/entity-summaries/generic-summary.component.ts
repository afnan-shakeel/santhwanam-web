import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-generic-summary',
  standalone: true,
  imports: [CommonModule, KeyValuePipe],
  templateUrl: './generic-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericSummaryComponent {
  @Input() context: Record<string, any> = {};
  @Input() entityLabel?: string | null;
  @Input() compact = false;

  isSimpleValue(val: any): boolean {
    return val !== null && val !== undefined && typeof val !== 'object';
  }
}
