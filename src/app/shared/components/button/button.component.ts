import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { AccessService } from '../../../core/services/access.service';
import { EntityType } from '../../../core/services/action-permissions.config';

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'danger' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

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

  // Standard button inputs (using signal inputs for reactivity)
  readonly label = input<string>();
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input<boolean>(false);

  // Permission-aware inputs (optional)
  readonly entity = input<EntityType>();
  readonly action = input<string>();
  readonly permission = input<string | string[]>();
  readonly disabledTooltip = input<string>();

  /**
   * Computed permission check - combines direct permission and entity/action config
   */
  protected readonly hasPermission = computed(() => {
    const permission = this.permission();
    const entity = this.entity();
    const action = this.action();

    // If direct permission is specified, use that
    if (permission) {
      return this.accessService.checkPermissions(permission);
    }

    // If entity and action are specified, use action config
    if (entity && action) {
      return this.accessService.canPerformAction(entity, action);
    }

    // No permission restriction
    return true;
  });

  /**
   * Whether the button should be shown (for hide mode)
   */
  protected readonly shouldShow = computed(() => {
    const entity = this.entity();
    const action = this.action();

    if (entity && action) {
      return this.accessService.shouldShowAction(entity, action);
    }
    // If only permission is set without entity/action, always show (disable mode)
    return true;
  });

  /**
   * Whether the button should be disabled (includes both permission and disabled input)
   */
  protected readonly isDisabled = computed(() => {
    const entity = this.entity();
    const action = this.action();
    const permission = this.permission();

    // First check the explicit disabled input (now reactive!)
    if (this.disabled()) return true;

    // Then check permission-based disable
    if (entity && action) {
      return this.accessService.shouldDisableAction(entity, action);
    }

    // If only permission is specified (no entity/action), disable if no permission
    if (permission && !this.hasPermission()) {
      return true;
    }

    return false;
  });

  /**
   * Get tooltip text for disabled state
   */
  protected readonly tooltip = computed(() => {
    const entity = this.entity();
    const action = this.action();
    const customTooltip = this.disabledTooltip();

    if (!this.isDisabled()) return '';

    // Custom tooltip takes priority
    if (customTooltip) return customTooltip;

    // Get tooltip from action config
    if (entity && action) {
      return this.accessService.getActionTooltip(entity, action);
    }

    return 'You do not have permission to perform this action';
  });

  protected readonly classes = computed(() => {
    const size = this.size();
    const variant = this.variant();

    const sizeMap: Record<ButtonSize, string> = {
      xs: 'h-8 px-3 text-xs',
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-5 text-base'
    };

    const sizeClass = sizeMap[size] ?? sizeMap.md;

    switch (variant) {
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
  });
}

