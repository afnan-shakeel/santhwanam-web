/**
 * Access Management Types
 * Shared types for authentication and authorization
 */

/**
 * Scope type hierarchy - from highest (None = Super Admin) to lowest (Member)
 */
export type ScopeType = 'None' | 'Forum' | 'Area' | 'Unit' | 'Agent' | 'Member';

/**
 * User's access scope - defines the boundary of their access
 */
export interface AuthScope {
  type: ScopeType;
  entityId: string | null;
}

/**
 * User's position in the organizational hierarchy
 */
export interface AuthHierarchy {
  forumId: string | null;
  areaId: string | null;
  unitId: string | null;
  agentId: string | null;
  memberId: string | null;
}

/**
 * Basic user information from auth context
 */
export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Role assignment with scope information
 */
export interface RoleAssignment {
  roleCode: string;
  roleName: string;
  scopeType: ScopeType;
  scopeEntityId: string | null;
  scopeEntityName: string | null;
}

/**
 * Complete authentication context returned from /auth/me
 */
export interface AuthContext {
  user: AuthUser;
  permissions: string[];
  scope: AuthScope;
  hierarchy: AuthHierarchy;
  roles: RoleAssignment[];
}

/**
 * Result of an access check (for resource ownership verification)
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Access mode for UI controls
 * - hide: Element is not rendered if no permission
 * - disable: Element is rendered but disabled if no permission
 */
export type AccessMode = 'hide' | 'disable';

/**
 * Logic for multiple permission checks
 * - or: User needs at least one of the permissions
 * - and: User needs all of the permissions
 */
export type AccessLogic = 'or' | 'and';
