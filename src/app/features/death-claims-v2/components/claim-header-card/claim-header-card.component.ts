import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DeathClaim } from '../../../../shared/models/death-claim.model';
import { ClaimStatusBadgeComponent } from '../claim-status-badge/claim-status-badge.component';

@Component({
  selector: 'app-claim-header-card',
  standalone: true,
  imports: [CommonModule, DatePipe, ClaimStatusBadgeComponent],
  templateUrl: './claim-header-card.component.html'
})
export class ClaimHeaderCardComponent {
  claim = input.required<DeathClaim>();
}
