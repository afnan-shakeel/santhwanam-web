import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentProfile } from '../../../../../shared/models/agent-profile.model';

export type AgentViewMode = 'self' | 'admin';

@Component({
  selector: 'app-agent-info-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-info-card.component.html',
  styleUrls: ['./agent-info-card.component.css']
})
export class AgentInfoCardComponent {
  // Inputs
  agent = input<AgentProfile | null>(null);
  viewMode = input<AgentViewMode>('self');
  loading = input<boolean>(false);

  // Outputs
  editProfile = output<void>();
  edit = output<void>();
  suspend = output<void>();
  activate = output<void>();
  reassignMembers = output<void>();

  // Computed values
  fullName = computed(() => {
    const a = this.agent();
    if (!a) return '';
    return [a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ');
  });

  initials = computed(() => {
    const a = this.agent();
    if (!a) return '';
    return (a.firstName.charAt(0) + a.lastName.charAt(0)).toUpperCase();
  });

  fullAddress = computed(() => {
    const a = this.agent();
    if (!a) return '';
    const parts = [a.city, a.state].filter(Boolean);
    return parts.join(', ');
  });

  statusClass = computed(() => {
    const status = this.agent()?.agentStatus;
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'Suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Terminated': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  });

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  }

  onEditProfile(): void {
    this.editProfile.emit();
  }

  onEdit(): void {
    this.edit.emit();
  }

  onSuspend(): void {
    this.suspend.emit();
  }

  onActivate(): void {
    this.activate.emit();
  }

  onReassignMembers(): void {
    this.reassignMembers.emit();
  }
}
