import { Component, input, output, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MemberSelfProfile, MemberProfile } from '../../../../../shared/models/member.model';

export type MemberViewMode = 'self' | 'agent' | 'admin';

@Component({
  selector: 'app-member-quick-info-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './member-quick-info-card.component.html',
  styleUrls: ['./member-quick-info-card.component.css']
})
export class MemberQuickInfoCardComponent {
  // Inputs
  member = input<MemberSelfProfile | MemberProfile | null>(null);
  viewMode = input<MemberViewMode>('self');
  loading = input<boolean>(false);
  showReassign = input<boolean>(true);

  // Outputs
  viewWallet = output<void>();
  recordDeposit = output<void>();
  reassignAgent = output<void>();

  // Computed
  title = computed(() => {
    return this.viewMode() === 'self' ? 'Quick Info' : 'Assignment';
  });

  agentFullName = computed(() => {
    const m = this.member();
    if (!m?.agent) return '';
    return [m.agent.firstName, m.agent.lastName].filter(Boolean).join(' ');
  });

  walletBalance = computed(() => {
    const m = this.member();
    return m?.wallet?.currentBalance ?? 0;
  });

  onViewWallet(): void {
    this.viewWallet.emit();
  }

  onRecordDeposit(): void {
    this.recordDeposit.emit();
  }

  onReassignAgent(): void {
    this.reassignAgent.emit();
  }
}
