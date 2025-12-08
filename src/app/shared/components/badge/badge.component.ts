import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type BadgeColor = 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeComponent {
  @Input() color: BadgeColor = 'primary';
  @Input() size: BadgeSize = 'md';

  get classes(): string {
    const colorClasses: Record<BadgeColor, string> = {
      primary: 'bg-primary-50 text-primary-700 ring-primary-100',
      secondary: 'bg-secondary-50 text-secondary-700 ring-secondary-100',
      neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
      success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      warning: 'bg-amber-50 text-amber-700 ring-amber-100',
      danger: 'bg-red-50 text-red-700 ring-red-100'
    };

    const sizeClasses: Record<BadgeSize, string> = {
      sm: 'px-2 py-1 text-[11px]',
      md: 'px-2.5 py-1.5 text-xs'
    };

    return [
      'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1',
      colorClasses[this.color] ?? colorClasses.primary,
      sizeClasses[this.size] ?? sizeClasses.md
    ].join(' ');
  }
}

