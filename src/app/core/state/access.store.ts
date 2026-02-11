import { Injectable, computed, signal } from '@angular/core';

import {
  AuthContext,
  AuthHierarchy,
  AuthScope,
  AuthUser,
  RoleAssignment,
  ViewMode,
  AdminLevel,
  ProfileEntityType,
  ScopeType,
  ROLE_PRIORITY,
  ADMIN_LEVEL_HIERARCHY
} from '../../shared/models/auth.types';

const ACCESS_STORAGE_KEY = 'santhwanam.access';

/**
 * Default empty values for access state
 */
const DEFAULT_SCOPE: AuthScope = { type: 'Member', entityId: null };
const DEFAULT_HIERARCHY: AuthHierarchy = {
  forumId: null,
  areaId: null,
  unitId: null,
  agentId: null,
  memberId: null
};

export interface AccessState {
  user: AuthUser | null;
  permissions: string[];
  scope: AuthScope;
  hierarchy: AuthHierarchy;
  roles: RoleAssignment[];
  isLoaded: boolean;
}

/**
 * AccessStore - Manages authorization context using Angular Signals
 *
 * Stores and provides access to:
 * - User's permissions
 * - User's scope (what level of the hierarchy they can access)
 * - User's hierarchy position (their actual position in the org)
 * - User's role assignments
 */
@Injectable({
  providedIn: 'root'
})
export class AccessStore {
  private readonly state = signal<AccessState>(this.loadFromStorage());

  // Computed signals for easy access
  readonly user = computed(() => this.state().user);
  readonly permissions = computed(() => this.state().permissions);
  readonly scope = computed(() => this.state().scope);
  readonly hierarchy = computed(() => this.state().hierarchy);
  readonly roles = computed(() => this.state().roles);
  readonly isLoaded = computed(() => this.state().isLoaded);

  // Derived computed signals
  readonly isSuperAdmin = computed(() => this.state().scope.type === 'None');
  readonly scopeType = computed(() => this.state().scope.type);
  readonly scopeEntityId = computed(() => this.state().scope.entityId);

  /**
   * View mode based on user's highest priority role
   * Determines the UI perspective (superadmin, admin, agent, member)
   */
  readonly viewMode = computed<ViewMode>(() => {
    const roles = this.state().roles;
    
    if (roles.length === 0) {
      return 'member'; // Default fallback
    }

    // Find the role with highest priority
    let highestPriority = -1;
    let selectedViewMode: ViewMode = 'member';

    for (const role of roles) {
      const config = ROLE_PRIORITY[role.roleCode];
      if (config && config.priority > highestPriority) {
        highestPriority = config.priority;
        selectedViewMode = config.viewMode;
      }
    }

    // If no matching role found in config, determine from scope type
    if (highestPriority === -1) {

      return this.getViewModeFromScope();
    }

    return selectedViewMode;
  });

  /**
   * Check if current view mode is admin or higher
   */
  readonly isAdminView = computed(() => {
    const mode = this.viewMode();
    return mode === 'superadmin' || mode === 'admin';
  });

  /**
   * Check if current view mode is agent
   */
  readonly isAgentView = computed(() => this.viewMode() === 'agent');

  /**
   * Check if current view mode is member (self-service)
   */
  readonly isMemberView = computed(() => this.viewMode() === 'member');

  // ============================================
  // Admin Level & Entity Access Methods
  // ============================================

  /**
   * Admin level based on user's scope type
   * Returns the hierarchy level for admin users, null for others
   */
  readonly adminLevel = computed<AdminLevel>(() => {
    // Super admin transcends levels
    if (this.isSuperAdmin()) return null;

    const scopeType = this.state().scope.type;

    switch (scopeType) {
      case 'Forum': return 'forum';
      case 'Area': return 'area';
      case 'Unit': return 'unit';
      default: return null;
    }
  });

  /**
   * Check if user is a forum admin
   */
  readonly isForumAdmin = computed(() => this.adminLevel() === 'forum');

  /**
   * Check if user is an area admin
   */
  readonly isAreaAdmin = computed(() => this.adminLevel() === 'area');

  /**
   * Check if user is a unit admin
   */
  readonly isUnitAdmin = computed(() => this.adminLevel() === 'unit');

  /**
   * Check if user can access entities at a given level
   * Forum admin can access areas and units
   * Area admin can access units
   * Unit admin can only access their own unit
   */
  canAccessLevel(targetLevel: ProfileEntityType): boolean {
    // Super admin can access everything
    if (this.isSuperAdmin()) return true;

    const myLevel = this.adminLevel();

    // Non-admin users cannot access admin entity profiles
    if (!myLevel) return false;

    const levelHierarchy = ADMIN_LEVEL_HIERARCHY;
    return levelHierarchy[myLevel] >= levelHierarchy[targetLevel];
  }

  /**
   * Check if user is viewing their own assigned entity
   * @param entityType - Type of entity being viewed
   * @param entityId - ID of the entity being viewed
   */
  isOwnEntity(entityType: ProfileEntityType, entityId: string): boolean {
    const scope = this.state().scope;
    // Map entity type to scope type
    const scopeTypeMap: Record<ProfileEntityType, ScopeType> = {
      'forum': 'Forum',
      'area': 'Area',
      'unit': 'Unit',
      'agent': 'Agent' // prev: Agents are scoped at Unit level, now: Agents are scoped at Agent level
    };

    const expectedScopeType = scopeTypeMap[entityType];
    // Must match both type and ID
    return scope.type === expectedScopeType && scope.entityId === entityId;
  }

  /**
   * Check if a specific entity is within user's hierarchical scope
   * Note: This performs a basic check. For cross-branch access,
   * the backend should validate that the entity belongs to user's hierarchy.
   *
   * @param entityType - Type of entity being accessed
   * @param entityId - ID of the entity
   * @param entityHierarchy - Optional hierarchy info of the entity (forumId, areaId)
   */
  isEntityInScope(
    entityType: ProfileEntityType,
    entityId: string,
    entityHierarchy?: { forumId?: string; areaId?: string }
  ): boolean {
    // Super admin can access everything
    if (this.isSuperAdmin()) return true;

    const scope = this.state().scope;
    const hierarchy = this.state().hierarchy;

    switch (entityType) {
      case 'forum':
        // Only forum admin of this forum or super admin
        return scope.type === 'Forum' && scope.entityId === entityId;

      case 'area':
        // Area admin of this area
        if (scope.type === 'Area' && scope.entityId === entityId) return true;
        // Forum admin - need to verify area belongs to their forum
        if (scope.type === 'Forum' && entityHierarchy?.forumId) {
          return scope.entityId === entityHierarchy.forumId;
        }
        // Forum admin without hierarchy info - check user's own hierarchy
        if (scope.type === 'Forum' && hierarchy.forumId) {
          return scope.entityId === hierarchy.forumId;
        }
        return false;

      case 'unit':
        // Unit admin of this unit
        if (scope.type === 'Unit' && scope.entityId === entityId) return true;
        // Area admin - need to verify unit belongs to their area
        if (scope.type === 'Area' && entityHierarchy?.areaId) {
          return scope.entityId === entityHierarchy.areaId;
        }
        // Forum admin - need to verify unit belongs to their forum
        if (scope.type === 'Forum' && entityHierarchy?.forumId) {
          return scope.entityId === entityHierarchy.forumId;
        }
        // Fallback checks using user's hierarchy
        if (scope.type === 'Area' && hierarchy.areaId) {
          return scope.entityId === hierarchy.areaId;
        }
        if (scope.type === 'Forum' && hierarchy.forumId) {
          return scope.entityId === hierarchy.forumId;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Determine if user can perform management actions on an entity
   * (edit, reassign admin, create subordinates)
   *
   * @param entityType - Type of entity
   * @param entityId - ID of the entity
   * @param action - The action to check
   */
  canManageEntity(
    entityType: ProfileEntityType,
    entityId: string,
    action: 'edit' | 'reassignAdmin' | 'createSubordinate'
  ): boolean {
    // Super admin can do everything
    if (this.isSuperAdmin()) return true;

    const isOwn = this.isOwnEntity(entityType, entityId);
    const myLevel = this.adminLevel();

    switch (action) {
      case 'edit':
        // Can edit own entity, or parent can edit child
        if (isOwn) return true;
        // Parent level admin can edit child entities
        return this.canAccessLevel(entityType) && !isOwn;

      case 'reassignAdmin':
        // Only parent level or super admin can reassign
        // Unit admin cannot reassign their own unit's admin
        // Area admin can reassign unit admins
        // Forum admin can reassign area and unit admins
        if (isOwn) return false; // Cannot reassign own admin role
        return this.canAccessLevel(entityType);

      case 'createSubordinate':
        // Forum admin can create areas
        // Area admin can create units
        // Unit admin can create agents (handled separately)
        if (entityType === 'forum' && myLevel === 'forum' && isOwn) return true;
        if (entityType === 'area' && myLevel === 'area' && isOwn) return true;
        if (entityType === 'area' && myLevel === 'forum') {
          return this.isEntityInScope('area', entityId);
        }
        if (entityType === 'unit' && myLevel === 'area') {
          return this.isEntityInScope('unit', entityId);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Fallback: Determine view mode from scope type
   */
  private getViewModeFromScope(): ViewMode {
    const scopeType = this.state().scope.type;
    
    switch (scopeType) {
      case 'None':
        return 'superadmin';
      case 'Forum':
      case 'Area':
      case 'Unit':
        return 'admin';
      case 'Agent':
        return 'agent';
      case 'Member':
      default:
        return 'member';
    }
  }

  /**
   * Set the full auth context from /auth/me response
   */
  setContext(context: AuthContext): void {
    const newState: AccessState = {
      user: context.user,
      permissions: context.permissions,
      scope: context.scope,
      hierarchy: context.hierarchy,
      roles: context.roles,
      isLoaded: true
    };
    this.state.set(newState);
    this.saveToStorage(newState);
  }

  /**
   * Clear all access data (on logout)
   */
  clearContext(): void {
    const emptyState: AccessState = {
      user: null,
      permissions: [],
      scope: DEFAULT_SCOPE,
      hierarchy: DEFAULT_HIERARCHY,
      roles: [],
      isLoaded: false
    };
    this.state.set(emptyState);
    this.removeFromStorage();
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    return this.state().permissions.includes(permission);
  }

  /**
   * Check if user has any of the given permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.state().permissions;
    return permissions.some(p => userPermissions.includes(p));
  }

  /**
   * Check if user has all of the given permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.state().permissions;
    return permissions.every(p => userPermissions.includes(p));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(roleCode: string): boolean {
    return this.state().roles.some(r => r.roleCode === roleCode);
  }

  /**
   * Check if user has any of the given roles
   */
  hasAnyRole(roleCodes: string[]): boolean {
    const userRoles = this.state().roles;
    return roleCodes.some(code => userRoles.some(r => r.roleCode === code));
  }

  /**
   * Get user's primary role (first in list, typically highest priority)
   */
  getPrimaryRole(): RoleAssignment | null {
    const roles = this.state().roles;
    return roles.length > 0 ? roles[0] : null;
  }

  private loadFromStorage(): AccessState {
    try {
      const stored = sessionStorage.getItem(ACCESS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...parsed, isLoaded: true };
      }
    } catch (error) {
      console.error('Failed to load access state from storage:', error);
    }
    return {
      user: null,
      permissions: [],
      scope: DEFAULT_SCOPE,
      hierarchy: DEFAULT_HIERARCHY,
      roles: [],
      isLoaded: false
    };
  }

  private saveToStorage(state: AccessState): void {
    try {
      sessionStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save access state to storage:', error);
    }
  }

  private removeFromStorage(): void {
    try {
      sessionStorage.removeItem(ACCESS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove access state from storage:', error);
    }
  }
}
