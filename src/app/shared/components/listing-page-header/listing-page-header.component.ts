import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';

@Component({
  selector: 'app-listing-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './listing-page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingPageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() actionLabel?: string;

  actionClick = output<void>();

  protected onActionClick(): void {
    this.actionClick.emit();
  }
}
