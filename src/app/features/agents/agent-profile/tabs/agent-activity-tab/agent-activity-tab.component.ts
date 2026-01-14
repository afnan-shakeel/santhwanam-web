import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  category: 'member' | 'collection' | 'profile' | 'login' | 'other';
  details?: string;
  user?: string;
}

@Component({
  selector: 'app-agent-activity-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-activity-tab.component.html',
  styleUrls: ['./agent-activity-tab.component.css']
})
export class AgentActivityTabComponent implements OnInit {
  private route = inject(ActivatedRoute);

  // State
  loading = signal(true);
  agentId = signal<string | null>(null);
  categoryFilter = signal<string>('all');
  dateFilter = signal<string>('last7days');

  // Static placeholder activity logs
  activityLogs = signal<ActivityLog[]>([
    {
      id: '1',
      timestamp: '2025-01-15T10:30:00',
      action: 'Member Registered',
      description: 'Registered new member: Rahul Sharma',
      category: 'member',
      details: 'Member ID: MEM-2025-0150'
    },
    {
      id: '2',
      timestamp: '2025-01-15T09:15:00',
      action: 'Collection Recorded',
      description: 'Collected ₹500 from Priya Nair',
      category: 'collection',
      details: 'Contribution for January 2025'
    },
    {
      id: '3',
      timestamp: '2025-01-14T16:45:00',
      action: 'Profile Updated',
      description: 'Updated phone number',
      category: 'profile',
      details: 'Changed from 9876543210 to 9876543211'
    },
    {
      id: '4',
      timestamp: '2025-01-14T08:00:00',
      action: 'Login',
      description: 'Agent logged in from mobile app',
      category: 'login',
      details: 'IP: 192.168.1.100, Device: Android'
    },
    {
      id: '5',
      timestamp: '2025-01-13T14:30:00',
      action: 'Member Status Changed',
      description: 'Suspended member: Kumar S',
      category: 'member',
      details: 'Reason: Non-payment for 3 months'
    },
    {
      id: '6',
      timestamp: '2025-01-13T11:20:00',
      action: 'Collection Recorded',
      description: 'Collected ₹1,000 from Meera K',
      category: 'collection',
      details: 'Arrears payment'
    },
    {
      id: '7',
      timestamp: '2025-01-12T15:00:00',
      action: 'Wallet Deposit',
      description: 'Deposited ₹5,000 to member wallet',
      category: 'collection',
      details: 'Member: Arun P, Reference: WD-2025-0089'
    },
    {
      id: '8',
      timestamp: '2025-01-11T09:30:00',
      action: 'Login',
      description: 'Agent logged in from web portal',
      category: 'login',
      details: 'IP: 203.45.67.89, Browser: Chrome'
    }
  ]);

  filteredLogs = signal<ActivityLog[]>([]);

  ngOnInit(): void {
    this.loadAgentId();
    this.applyFilters();
  }

  private loadAgentId(): void {
    const parentRoute = this.route.parent;
    if (parentRoute) {
      const agentId = parentRoute.snapshot.paramMap.get('agentId');
      if (agentId) {
        this.agentId.set(agentId);
      }
    }
    // Simulate loading
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.categoryFilter.set(value);
    this.applyFilters();
  }

  onDateFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.dateFilter.set(value);
    this.applyFilters();
  }

  private applyFilters(): void {
    let logs = this.activityLogs();

    // Filter by category
    const category = this.categoryFilter();
    if (category !== 'all') {
      logs = logs.filter(log => log.category === category);
    }

    this.filteredLogs.set(logs);
  }

  getCategoryBadgeClass(category: string): string {
    const classes: Record<string, string> = {
      member: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      collection: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      profile: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      login: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      other: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return classes[category] || classes['other'];
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      member: '👤',
      collection: '💰',
      profile: '✏️',
      login: '🔐',
      other: '📋'
    };
    return icons[category] || '📋';
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  exportActivityLog(): void {
    // Placeholder - would export to CSV/PDF
    console.log('Exporting activity log...');
  }
}
