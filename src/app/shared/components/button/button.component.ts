import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'soft';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input({ required: true }) label!: string;
  @Input() variant: ButtonVariant = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() size: ButtonSize = 'md';

  protected get classes(): string {
    const sizeMap: Record<ButtonSize, string> = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-5 text-base'
    };

    const sizeClass = sizeMap[this.size] ?? sizeMap.md;

    switch (this.variant) {
      case 'secondary':
        return `${sizeClass} bg-secondary-600 text-white hover:bg-secondary-700`;
      case 'soft':
        return `${sizeClass} bg-primary-50 text-primary-700 ring-1 ring-primary-100 hover:bg-primary-100`;
      default:
        return `${sizeClass} bg-primary-600 text-white hover:bg-primary-700`;
    }
  }
}

