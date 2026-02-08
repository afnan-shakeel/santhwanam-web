import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContributionCycle } from '../../../../shared/models/death-claim.model';

@Component({
  selector: 'app-contribution-progress-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contribution-progress-card.component.html'
})
export class ContributionProgressCardComponent {
  cycle = input.required<ContributionCycle>();

  percentage = computed(() => {
    const c = this.cycle();
    if (!c.totalExpectedAmount || c.totalExpectedAmount === 0) return 0;
    return Math.round((c.totalCollectedAmount / c.totalExpectedAmount) * 100);
  });

  daysLeft = computed(() => {
    const c = this.cycle();
    if (c.cycleStatus === 'Closed') return null;
    if (!c.collectionDeadline) return null;
    const deadline = new Date(c.collectionDeadline);
    const now = new Date();
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  });

  deadlineLabel = computed(() => {
    const c = this.cycle();
    if (c.cycleStatus === 'Closed') return '(Closed)';
    const days = this.daysLeft();
    if (days === null) return '';
    if (days < 0) return '(Overdue)';
    if (days === 0) return '(Due today)';
    if (days === 1) return '(1 day left)';
    return `(${days} days left)`;
  });

  deadlineLabelClass = computed(() => {
    const c = this.cycle();
    if (c.cycleStatus === 'Closed') return 'text-green-600';
    const days = this.daysLeft();
    if (days === null) return 'text-gray-400';
    if (days < 3) return 'text-red-600';
    if (days < 7) return 'text-amber-600';
    return 'text-gray-500';
  });
}
