import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberSummaryComponent } from './member-summary.component';
import { DeathClaimSummaryComponent } from './death-claim-summary.component';
import { WalletDepositSummaryComponent } from './wallet-deposit-summary.component';
import { CashHandoverSummaryComponent } from './cash-handover-summary.component';
import { GenericSummaryComponent } from './generic-summary.component';

@Component({
  selector: 'app-entity-summary',
  standalone: true,
  imports: [
    CommonModule,
    MemberSummaryComponent,
    DeathClaimSummaryComponent,
    WalletDepositSummaryComponent,
    CashHandoverSummaryComponent,
    GenericSummaryComponent
  ],
  template: `
    @switch (entityType) {
      @case ('Member') {
        <app-member-summary [context]="context" [compact]="compact" />
      }
      @case ('DeathClaim') {
        <app-death-claim-summary [context]="context" [compact]="compact" />
      }
      @case ('WalletDepositRequest') {
        <app-wallet-deposit-summary [context]="context" [compact]="compact" />
      }
      @case ('CashHandover') {
        <app-cash-handover-summary [context]="context" [compact]="compact" />
      }
      @default {
        <app-generic-summary [context]="context" [entityLabel]="entityLabel" [compact]="compact" />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntitySummaryComponent {
  @Input() entityType = '';
  @Input() context: Record<string, any> = {};
  @Input() entityLabel?: string | null;
  @Input() compact = false;
}
