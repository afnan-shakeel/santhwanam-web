import { Component, input, output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

export interface PendingContribution {
  contributionId: string;
  cycleId: string;
  cycleNumber: string;
  deceasedName: string;
  deceasedMemberCode: string;
  amount: number;
  deadline: string;
  daysRemaining: number;
  status: 'PendingCash' | 'PendingWallet';
}

@Component({
  selector: 'app-pending-collection-alert',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './pending-collection-alert.component.html',
  styleUrls: ['./pending-collection-alert.component.css']
})
export class PendingCollectionAlertComponent {
  pendingContributions = input<PendingContribution[]>([]);
  loading = input<boolean>(false);

  collect = output<PendingContribution>();

  onCollect(contribution: PendingContribution): void {
    this.collect.emit(contribution);
  }
}
