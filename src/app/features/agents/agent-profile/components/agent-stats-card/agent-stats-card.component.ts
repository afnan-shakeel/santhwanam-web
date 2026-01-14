import { Component, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { AgentStats } from '../../../../../shared/models/agent-profile.model';

export interface AgentCollectionStats {
  collectionsThisMonth: number;
  walletDepositsThisMonth: number;
  outstandingCollections: number;
}

@Component({
  selector: 'app-agent-stats-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './agent-stats-card.component.html',
  styleUrls: ['./agent-stats-card.component.css']
})
export class AgentStatsCardComponent {
  // Inputs
  stats = input<AgentStats | null>(null);
  collectionStats = input<AgentCollectionStats | null>(null);
  loading = input<boolean>(false);
}
