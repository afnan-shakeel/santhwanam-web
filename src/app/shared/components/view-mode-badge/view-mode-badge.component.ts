import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AccessService } from '../../../core/services/access.service';
import { ViewMode, AdminLevel } from '../../models/auth.types';

/**
 * Detailed view mode label combining ViewMode + AdminLevel
 */
export type DetailedViewMode = 'superadmin' | 'forum_admin' | 'area_admin' | 'unit_admin' | 'agent' | 'member';

interface ViewModeConfig {
  label: string;
  icon: string;
  colorClasses: string;
}

/**
 * Shared ViewModeBadge component
 *
 * Displays the current user's role as a badge using the AccessService.
 * Shows granular admin levels (Forum Admin, Area Admin, Unit Admin)
 * instead of a generic "Admin" label.
 *
 * Usage:
 *   <app-view-mode-badge />
 */
@Component({
  selector: 'app-view-mode-badge',
  standalone: true,
  templateUrl: './view-mode-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewModeBadgeComponent {
  private accessService = inject(AccessService);

  /** Resolved detailed view mode combining viewMode + adminLevel */
  detailedViewMode = computed<DetailedViewMode>(() => {
    const viewMode: ViewMode = this.accessService.getViewMode();
    const adminLevel: AdminLevel = this.accessService.getAdminLevel();

    if (viewMode === 'superadmin') return 'superadmin';
    if (viewMode === 'admin') {
      if (adminLevel === 'forum') return 'forum_admin';
      if (adminLevel === 'area') return 'area_admin';
      if (adminLevel === 'unit') return 'unit_admin';
      // Fallback for admin with no specific level (shouldn't happen normally)
      return 'unit_admin';
    }
    if (viewMode === 'agent') return 'agent';
    return 'member';
  });

  /** Configuration map for each detailed view mode */
  private readonly configMap: Record<DetailedViewMode, ViewModeConfig> = {
    superadmin: {
      label: 'Super Admin',
      icon: 'shield-star',
      colorClasses: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    },
    forum_admin: {
      label: 'Forum Admin',
      icon: 'shield',
      colorClasses: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
    },
    area_admin: {
      label: 'Area Admin',
      icon: 'shield',
      colorClasses: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    },
    unit_admin: {
      label: 'Unit Admin',
      icon: 'shield',
      colorClasses: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400'
    },
    agent: {
      label: 'Agent',
      icon: 'user',
      colorClasses: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    },
    member: {
      label: 'Member',
      icon: 'user-circle',
      colorClasses: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    }
  };

  /** Current config for the template */
  config = computed<ViewModeConfig>(() => this.configMap[this.detailedViewMode()]);
}
