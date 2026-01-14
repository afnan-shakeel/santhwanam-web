import { Component, input, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

export type CollectionsViewMode = 'self' | 'admin';

interface PendingCollection {
  cycleId: string;
  cycleNumber: string;
  deceasedName: string;
  deceasedCode: string;
  deadline: string;
  daysRemaining: number;
  pendingMembers: {
    memberId: string;
    memberCode: string;
    memberName: string;
    amount: number;
  }[];
  totalPending: number;
}

interface WalletDeposit {
  depositId: string;
  memberName: string;
  memberCode: string;
  amount: number;
  collectedDate: string;
  status: 'Draft' | 'PendingApproval';
}

interface CollectionHistoryItem {
  date: string;
  type: 'Contribution' | 'WalletDeposit';
  memberCode: string;
  memberName: string;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-agent-collections-tab',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './agent-collections-tab.component.html',
  styleUrls: ['./agent-collections-tab.component.css']
})
export class AgentCollectionsTabComponent {
  private router = Router;

  // Inputs
  viewMode = input<CollectionsViewMode>('self');

  // Static placeholder data
  summary = signal({
    pendingCollections: 300,
    pendingMemberCount: 3,
    collectedThisMonth: 15000,
    collectedTxnCount: 150,
    walletDepositsPending: 1500,
    walletDepositsCount: 2
  });

  pendingCollections = signal<PendingCollection[]>([
    {
      cycleId: 'cc-001',
      cycleNumber: 'CC-2025-00016',
      deceasedName: 'Alice White',
      deceasedCode: 'MEM-2025-00800',
      deadline: '2025-01-30',
      daysRemaining: 5,
      pendingMembers: [
        { memberId: 'm1', memberCode: 'MEM-457', memberName: 'Jane Doe', amount: 100 },
        { memberId: 'm2', memberCode: 'MEM-459', memberName: 'Carol Davis', amount: 100 },
        { memberId: 'm3', memberCode: 'MEM-461', memberName: 'Eve Foster', amount: 100 }
      ],
      totalPending: 300
    }
  ]);

  draftDeposits = signal<WalletDeposit[]>([
    {
      depositId: 'dep-001',
      memberName: 'John Smith',
      memberCode: 'MEM-456',
      amount: 1000,
      collectedDate: '2025-01-20',
      status: 'Draft'
    },
    {
      depositId: 'dep-002',
      memberName: 'Jane Doe',
      memberCode: 'MEM-457',
      amount: 500,
      collectedDate: '2025-01-21',
      status: 'Draft'
    }
  ]);

  pendingApprovalDeposits = signal<WalletDeposit[]>([
    {
      depositId: 'dep-003',
      memberName: 'Bob Wilson',
      memberCode: 'MEM-458',
      amount: 2000,
      collectedDate: '2025-01-19',
      status: 'PendingApproval'
    }
  ]);

  collectionHistory = signal<CollectionHistoryItem[]>([
    { date: 'Jan 20', type: 'Contribution', memberCode: 'MEM-456', memberName: 'John Smith', amount: 100, status: 'Collected' },
    { date: 'Jan 20', type: 'WalletDeposit', memberCode: 'MEM-456', memberName: 'John Smith', amount: 1000, status: 'Approved' },
    { date: 'Jan 19', type: 'Contribution', memberCode: 'MEM-458', memberName: 'Alice Brown', amount: 100, status: 'Collected' },
    { date: 'Jan 18', type: 'Contribution', memberCode: 'MEM-460', memberName: 'David Lee', amount: 100, status: 'Collected' }
  ]);

  onCollect(cycleId: string, memberId: string): void {
    // Navigate to collect contribution page
    console.log('Collect contribution', cycleId, memberId);
  }

  onSubmitDeposit(depositId: string): void {
    // Submit deposit for approval
    console.log('Submit deposit', depositId);
  }

  onViewAllHistory(): void {
    // Navigate to full history
    console.log('View all history');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
