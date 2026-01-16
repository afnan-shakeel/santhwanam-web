import { Injectable, inject } from '@angular/core';

import { AccessStore } from '../state/access.store';
import { AccessLogic, AccessMode } from '../../shared/models/auth.types';
import { ACTION_PERMISSIONS, ActionConfig, EntityType } from './action-permissions.config';

/**
 * AccessService - Provides permission checking utilities
 *
 * Use this service for:
 * - Checking if user has specific permissions
 * - Getting action configurations for entity operations
 * - Determining UI behavior (hide/disable) based on permissions
 */
@Injectable({
  providedIn: 'root'
})
export class AccessService {
  private accessStore = inject(AccessStore);

  // ============================================
  // Permission Checking Methods
  // ============================================

  /**
   * Check if user has a specific permission
   */
  can(permission: string): boolean {
    return this.accessStore.hasPermission(permission);
  }

  /**
   * Check if user has any of the given permissions
   */
  canAny(permissions: string[]): boolean {
    return this.accessStore.hasAnyPermission(permissions);
  }

  /**
   * Check if user has all of the given permissions
   */
  canAll(permissions: string[]): boolean {
    return this.accessStore.hasAllPermissions(permissions);
  }

  /**
   * Check permissions with specified logic (or/and)
   */
  checkPermissions(permissions: string | string[], logic: AccessLogic = 'or'): boolean {
    if (typeof permissions === 'string') {
      return this.can(permissions);
    }
    return logic === 'and' ? this.canAll(permissions) : this.canAny(permissions);
  }

  // ============================================
  // Role Checking Methods
  // ============================================

  /**
   * Check if user has a specific role
   */
  hasRole(roleCode: string): boolean {
    return this.accessStore.hasRole(roleCode);
  }

  /**
   * Check if user has any of the given roles
   */
  hasAnyRole(roleCodes: string[]): boolean {
    return this.accessStore.hasAnyRole(roleCodes);
  }

  /**
   * Check if user is a super admin (scope type = 'None')
   */
  isSuperAdmin(): boolean {
    return this.accessStore.isSuperAdmin();
  }

  // ============================================
  // Action Configuration Methods
  // ============================================

  /**
   * Get action configuration for an entity action
   */
  getActionConfig(entity: EntityType, action: string): ActionConfig | null {
    const entityConfig = ACTION_PERMISSIONS[entity];
    if (!entityConfig) return null;
    return (entityConfig as Record<string, ActionConfig>)[action] ?? null;
  }

  /**
   * Check if user can perform a specific action on an entity
   */
  canPerformAction(entity: EntityType, action: string): boolean {
    const config = this.getActionConfig(entity, action);
    if (!config) return false;

    return Array.isArray(config.permission)
      ? this.canAny(config.permission)
      : this.can(config.permission);
  }

  /**
   * Get the access mode for an action (hide or disable)
   */
  getActionMode(entity: EntityType, action: string): AccessMode {
    const config = this.getActionConfig(entity, action);
    return config?.mode ?? 'hide';
  }

  /**
   * Get the tooltip text for a disabled action
   */
  getActionTooltip(entity: EntityType, action: string): string {
    const config = this.getActionConfig(entity, action);
    return config?.disabledTooltip ?? 'You do not have permission to perform this action';
  }

  /**
   * Check if an action should be shown (based on mode and permission)
   */
  shouldShowAction(entity: EntityType, action: string): boolean {
    const config = this.getActionConfig(entity, action);
    if (!config) return false;

    // If mode is 'disable', always show (but may be disabled)
    if (config.mode === 'disable') return true;

    // If mode is 'hide', only show if user has permission
    return this.canPerformAction(entity, action);
  }

  /**
   * Check if an action should be disabled (based on mode and permission)
   */
  shouldDisableAction(entity: EntityType, action: string): boolean {
    const config = this.getActionConfig(entity, action);
    if (!config) return true;

    // If mode is 'disable' and user lacks permission, disable it
    if (config.mode === 'disable' && !this.canPerformAction(entity, action)) {
      return true;
    }

    return false;
  }
}
