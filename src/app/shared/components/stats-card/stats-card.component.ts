import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';

export type StatsCardColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsCardComponent {
  // ═══════════════════════════════════════════════════════════════════════════
  // INPUTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Title/label for the stat */
  readonly title = input.required<string>();

  /** Main value to display */
  readonly value = input.required<number | string>();

  /** Optional subtitle or secondary info */
  readonly subtitle = input<string>();

  /** Icon name or emoji */
  readonly icon = input<string>();

  /** Color theme for the card */
  readonly color = input<StatsCardColor>('neutral');

  /** Whether the card is in loading state */
  readonly isLoading = input<boolean>(false);

  /** Whether the card is clickable */
  readonly clickable = input<boolean>(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED CLASSES
  // ═══════════════════════════════════════════════════════════════════════════

  get colorClasses(): string {
    const colorMap: Record<StatsCardColor, string> = {
      primary: 'bg-primary-50 text-primary-700 border-primary-100',
      secondary: 'bg-secondary-50 text-secondary-700 border-secondary-100',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      warning: 'bg-amber-50 text-amber-700 border-amber-100',
      danger: 'bg-red-50 text-red-700 border-red-100',
      neutral: 'bg-slate-50 text-slate-700 border-slate-100'
    };
    return colorMap[this.color()] || colorMap.neutral;
  }

  get iconColorClasses(): string {
    const colorMap: Record<StatsCardColor, string> = {
      primary: 'text-primary-500',
      secondary: 'text-secondary-500',
      success: 'text-emerald-500',
      warning: 'text-amber-500',
      danger: 'text-red-500',
      neutral: 'text-slate-400'
    };
    return colorMap[this.color()] || colorMap.neutral;
  }
}
