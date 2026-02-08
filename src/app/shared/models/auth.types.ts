/**
 * Access Management Types
 * Shared types for authentication and authorization
 */

/**
 * Scope type hierarchy - from highest (None = Super Admin) to lowest (Member)
 */
export type ScopeType = 'None' | 'Forum' | 'Area' | 'Unit' | 'Agent' | 'Member';

/**
 * View mode determines the UI perspective based on user's highest priority role
 * - superadmin: Full system access, all admin features
 * - admin: Administrative access (forum, area, unit level)
 * - agent: Agent-specific view for managing members
 * - member: Member self-service view
 */
export type ViewMode = 'superadmin' | 'admin' | 'agent' | 'member';

/**
 * Admin level in the organizational hierarchy
 * Used for entity profile pages to determine viewing permissions
 * - null: Not an admin (super admin transcends levels, or non-admin user)
 */
export type AdminLevel = 'forum' | 'area' | 'unit' | null;

/**
 * Entity types that can have profiles
 */
export type ProfileEntityType = 'forum' | 'area' | 'unit' | 'agent';

/**
 * Hierarchy level numeric values for comparison
 * Higher number = higher in hierarchy = more access
 */
export const ADMIN_LEVEL_HIERARCHY: Record<string, number> = {
  'forum': 3,
  'area': 2,
  'unit': 1,
  'agent': 0
};

/**
 * Role priority configuration for determining view mode
 * Higher number = higher priority
 */
export const ROLE_PRIORITY: Record<string, { priority: number; viewMode: ViewMode }> = {
  // Super Admin roles
  'super_admin': { priority: 100, viewMode: 'superadmin' },
  'system_admin': { priority: 95, viewMode: 'superadmin' },

  // Forum/Area/Unit Admin roles
  'forum_admin': { priority: 80, viewMode: 'admin' },
  'area_admin': { priority: 75, viewMode: 'admin' },
  'unit_admin': { priority: 70, viewMode: 'admin' },
  'admin': { priority: 65, viewMode: 'admin' },

  // Agent roles
  'agent': { priority: 50, viewMode: 'agent' },
  'senior_agent': { priority: 55, viewMode: 'agent' },

  // Member roles
  'member': { priority: 10, viewMode: 'member' },
};

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
