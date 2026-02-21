import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wallet-deposit-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-deposit-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletDepositSummaryComponent {
  @Input() context: Record<string, any> = {};
  @Input() compact = false;
}
