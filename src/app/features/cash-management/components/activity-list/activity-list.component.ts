import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustodyActivity } from '../../../../shared/models/cash-management.model';
import { CashManagementService } from '../../../../core/services/cash-management.service';

/**
 * ActivityListComponent
 * 
 * Displays a list of custody activity (contributions, deposits, handovers).
 * Used in:
 * - My Cash Custody
 * - Custodian Details
 */
@Component({
  selector: 'app-custody-activity-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-list.component.html',
  styleUrl: './activity-list.component.css'
})
export class ActivityListComponent {
  private cashService = inject(CashManagementService);

  @Input() title: string = 'Recent Activity';
  @Input() activities: CustodyActivity[] = [];
  @Input() showViewAll: boolean = true;
  @Input() emptyMessage: string = 'No recent activity';

  @Output() viewAll = new EventEmitter<void>();

  formatCurrency(amount: number): string {
    return this.cashService.formatCurrency(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  getActivityIcon(type: string): { icon: string; bgColor: string; iconColor: string } {
    const iconMap: Record<string, { icon: string; bgColor: string; iconColor: string }> = {
      'contribution_received': { 
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 
        bgColor: 'bg-green-100', 
        iconColor: 'text-green-600' 
      },
      'wallet_deposit_received': { 
        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', 
        bgColor: 'bg-blue-100', 
        iconColor: 'text-blue-600' 
      },
      'handover_received': { 
        icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1', 
        bgColor: 'bg-purple-100', 
        iconColor: 'text-purple-600' 
      },
      'handover_sent': { 
        icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', 
        bgColor: 'bg-orange-100', 
        iconColor: 'text-orange-600' 
      },
      'adjustment': { 
        icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', 
        bgColor: 'bg-gray-100', 
        iconColor: 'text-gray-600' 
      },
    };
    return iconMap[type] || iconMap['adjustment'];
  }
}
