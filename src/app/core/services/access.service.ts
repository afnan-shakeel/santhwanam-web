import { Injectable, inject } from '@angular/core';

import { AccessStore } from '../state/access.store';
import {
  AccessLogic,
  AccessMode,
  ViewMode,
  AdminLevel,
  ProfileEntityType
} from '../../shared/models/auth.types';
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

  // ============================================
  // View Mode Methods
  // ============================================

  /**
   * Get the current view mode based on user's roles
   * Returns: 'superadmin' | 'admin' | 'agent' | 'member'
   */
  getViewMode(): ViewMode {
    return this.accessStore.viewMode();
  }

  /**
   * Get the view mode as a signal for reactive use in templates
   */
  get viewMode() {
    return this.accessStore.viewMode;
  }

  /**
   * Check if current view is admin or superadmin
   */
  isAdminView(): boolean {
    return this.accessStore.isAdminView();
  }

  /**
   * Check if current view is agent
   */
  isAgentView(): boolean {
    return this.accessStore.isAgentView();
  }

  /**
   * Check if current view is member (self-service)
   */
  isMemberView(): boolean {
    return this.accessStore.isMemberView();
  }

  /**
   * Get a simplified view mode for components that use 'self' | 'admin'
   * Maps: superadmin/admin -> 'admin', agent/member -> 'self'
   */
  getSimplifiedViewMode(): 'self' | 'admin' {
    const mode = this.getViewMode();
    return mode === 'superadmin' || mode === 'admin' ? 'admin' : 'self';
  }

  /**
   * Get simplified view mode as a signal
   */
  readonly simplifiedViewMode = () => this.getSimplifiedViewMode();

  // ============================================
  // Admin Level & Entity Access Methods
  // ============================================

  /**
   * Get the current admin level
   * Returns: 'forum' | 'area' | 'unit' | null
   */
  getAdminLevel(): AdminLevel {
    return this.accessStore.adminLevel();
  }

  /**
   * Get admin level as a signal for reactive use
   */
  get adminLevel() {
    return this.accessStore.adminLevel;
  }

  /**
   * Check if user is a forum admin
   */
  isForumAdmin(): boolean {
    return this.accessStore.isForumAdmin();
  }

  /**
   * Check if user is an area admin
   */
  isAreaAdmin(): boolean {
    return this.accessStore.isAreaAdmin();
  }

  /**
   * Check if user is a unit admin
   */
  isUnitAdmin(): boolean {
    return this.accessStore.isUnitAdmin();
  }

  /**
   * Check if user can access entities at a given level
   */
  canAccessLevel(targetLevel: ProfileEntityType): boolean {
    return this.accessStore.canAccessLevel(targetLevel);
  }

  /**
   * Check if user is viewing their own assigned entity
   */
  isOwnEntity(entityType: ProfileEntityType, entityId: string): boolean {
    return this.accessStore.isOwnEntity(entityType, entityId);
  }

  /**
   * Check if a specific entity is within user's scope
   */
  isEntityInScope(
    entityType: ProfileEntityType,
    entityId: string,
    entityHierarchy?: { forumId?: string; areaId?: string }
  ): boolean {
    return this.accessStore.isEntityInScope(entityType, entityId, entityHierarchy);
  }

  /**
   * Check if user can perform management actions on an entity
   */
  canManageEntity(
    entityType: ProfileEntityType,
    entityId: string,
    action: 'edit' | 'reassignAdmin' | 'createSubordinate'
  ): boolean {
    return this.accessStore.canManageEntity(entityType, entityId, action);
  }
}
