import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { EntityType } from '../../../core/services/action-permissions.config';
import { ButtonComponent } from "../button/button.component";

@Component({
  selector: 'app-listing-page-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './listing-page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingPageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() actionLabel?: string;
  @Input() actionAccessEntity?: EntityType;
  @Input() actionAccessAction?: string;

  actionClick = output<void>();

  protected onActionClick(): void {
    this.actionClick.emit();
  }
}
