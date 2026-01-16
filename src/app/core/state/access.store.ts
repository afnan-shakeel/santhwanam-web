import { Injectable, computed, signal } from '@angular/core';

import {
  AuthContext,
  AuthHierarchy,
  AuthScope,
  AuthUser,
  RoleAssignment
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
      const stored = localStorage.getItem(ACCESS_STORAGE_KEY);
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
      localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save access state to storage:', error);
    }
  }

  private removeFromStorage(): void {
    try {
      localStorage.removeItem(ACCESS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove access state from storage:', error);
    }
  }
}
