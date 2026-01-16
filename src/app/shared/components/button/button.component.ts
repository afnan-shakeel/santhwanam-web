import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input } from '@angular/core';

import { AccessService } from '../../../core/services/access.service';
import { EntityType } from '../../../core/services/action-permissions.config';

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  private accessService = inject(AccessService);

  // Standard button inputs
  @Input({ required: true }) label!: string;
  @Input() variant: ButtonVariant = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;

  // Permission-aware inputs (optional)
  @Input() entity?: EntityType;
  @Input() action?: string;
  @Input() permission?: string | string[];
  @Input() disabledTooltip?: string;

  /**
   * Computed permission check - combines direct permission and entity/action config
   */
  protected readonly hasPermission = computed(() => {
    // If direct permission is specified, use that
    if (this.permission) {
      return this.accessService.checkPermissions(this.permission);
    }

    // If entity and action are specified, use action config
    if (this.entity && this.action) {
      return this.accessService.canPerformAction(this.entity, this.action);
    }

    // No permission restriction
    return true;
  });

  /**
   * Whether the button should be shown (for hide mode)
   */
  protected readonly shouldShow = computed(() => {
    if (this.entity && this.action) {
      return this.accessService.shouldShowAction(this.entity, this.action);
    }
    // If only permission is set without entity/action, always show (disable mode)
    return true;
  });

  /**
   * Whether the button should be disabled (includes both permission and disabled input)
   */
  protected readonly isDisabled = computed(() => {
    // First check the explicit disabled input
    if (this.disabled) return true;

    // Then check permission-based disable
    if (this.entity && this.action) {
      return this.accessService.shouldDisableAction(this.entity, this.action);
    }

    // If only permission is specified (no entity/action), disable if no permission
    if (this.permission && !this.hasPermission()) {
      return true;
    }

    return false;
  });

  /**
   * Get tooltip text for disabled state
   */
  protected readonly tooltip = computed(() => {
    if (!this.isDisabled()) return '';

    // Custom tooltip takes priority
    if (this.disabledTooltip) return this.disabledTooltip;

    // Get tooltip from action config
    if (this.entity && this.action) {
      return this.accessService.getActionTooltip(this.entity, this.action);
    }

    return 'You do not have permission to perform this action';
  });

  protected get classes(): string {
    const sizeMap: Record<ButtonSize, string> = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-5 text-base'
    };

    const sizeClass = sizeMap[this.size] ?? sizeMap.md;

    switch (this.variant) {
      case 'secondary':
        return `${sizeClass} bg-secondary-600 text-white hover:bg-secondary-700`;
      case 'soft':
        return `${sizeClass} bg-primary-50 text-primary-700 ring-1 ring-primary-100 hover:bg-primary-100`;
      case 'danger':
        return `${sizeClass} bg-red-600 text-white hover:bg-red-700`;
      case 'ghost':
        return `${sizeClass} bg-transparent text-gray-700 hover:bg-gray-100`;
      default:
        return `${sizeClass} bg-primary-600 text-white hover:bg-primary-700`;
    }
  }
}

