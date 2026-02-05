# Access Management - Admin Level Enhancement

## Purpose

Add support for distinguishing between Forum Admin, Area Admin, and Unit Admin levels in the access management system. This is needed for **Entity Profile Pages** where we need to determine:

1. What level of admin is viewing (forum/area/unit)
2. Whether they're viewing their own assigned entity
3. Whether an entity is within their scope (can they access it)

---

## Current State

Currently, all admin roles map to a single `'admin'` viewMode:

```typescript
// auth.types.ts - Current
export type ViewMode = 'superadmin' | 'admin' | 'agent' | 'member';

// All these map to 'admin'
'forum_admin': { priority: 80, viewMode: 'admin' },
'area_admin': { priority: 75, viewMode: 'admin' },
'unit_admin': { priority: 70, viewMode: 'admin' },
```

**Problem:** We can't distinguish which admin level is viewing an entity profile.

---

## Proposed Changes

### Approach: Keep ViewMode, Add AdminLevel

We'll keep the existing `ViewMode` for general UI decisions (backward compatible) and add a new `AdminLevel` type for hierarchy-specific logic.

---

## File Changes

### 1. auth.types.ts

#### Add New Type

```typescript
/**
 * Admin level in the organizational hierarchy
 * Used for entity profile pages to determine viewing permissions
 * - null: Not an admin (super admin, agent, or member)
 */
export type AdminLevel = 'forum' | 'area' | 'unit' | null;

/**
 * Entity types that can have profiles
 */
export type ProfileEntityType = 'forum' | 'area' | 'unit';

/**
 * Hierarchy level numeric values for comparison
 * Higher number = higher in hierarchy = more access
 */
export const ADMIN_LEVEL_HIERARCHY: Record<string, number> = {
  'forum': 3,
  'area': 2,
  'unit': 1
};
```

#### Full Updated File

```typescript
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
export type ProfileEntityType = 'forum' | 'area' | 'unit';

/**
 * Hierarchy level numeric values for comparison
 * Higher number = higher in hierarchy = more access
 */
export const ADMIN_LEVEL_HIERARCHY: Record<string, number> = {
  'forum': 3,
  'area': 2,
  'unit': 1
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
```

**Note:** Also changed `super_admin` viewMode from `'admin'` to `'superadmin'` for consistency.

---

### 2. access.store.ts

#### Add New Computed Signals and Methods

Add after the existing `isMemberView` computed signal (around line 112):

```typescript
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
    'unit': 'Unit'
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
      if (scope.type === 'Forum') {
        // If hierarchy info provided, check it
        if (entityHierarchy?.forumId) {
          return entityHierarchy.forumId === scope.entityId;
        }
        // Otherwise, assume backend will validate
        return true;
      }
      return false;

    case 'unit':
      // Unit admin of this unit
      if (scope.type === 'Unit' && scope.entityId === entityId) return true;
      // Area admin - need to verify unit belongs to their area
      if (scope.type === 'Area') {
        if (entityHierarchy?.areaId) {
          return entityHierarchy.areaId === scope.entityId;
        }
        return true;
      }
      // Forum admin - need to verify unit belongs to their forum
      if (scope.type === 'Forum') {
        if (entityHierarchy?.forumId) {
          return entityHierarchy.forumId === scope.entityId;
        }
        return true;
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
      // Check if user is a parent level
      return this.canAccessLevel(entityType) && !isOwn;

    case 'reassignAdmin':
      // Only parent level or super admin can reassign
      // Unit admin cannot reassign their own admin
      // Area admin cannot reassign their own admin
      // Forum admin cannot reassign their own admin
      if (isOwn) return false;
      return this.canAccessLevel(entityType);

    case 'createSubordinate':
      // Forum admin can create areas
      // Area admin can create units
      // Unit admin cannot create anything
      if (entityType === 'forum' && isOwn && myLevel === 'forum') return true;
      if (entityType === 'area' && isOwn && myLevel === 'area') return true;
      // Parent levels can also create
      if (entityType === 'forum' && myLevel === null) return false; // Only super admin
      if (entityType === 'area') return myLevel === 'forum';
      if (entityType === 'unit') return myLevel === 'forum' || myLevel === 'area';
      return false;

    default:
      return false;
  }
}
```

#### Update Import

Update the import at the top of the file:

```typescript
import {
  AuthContext,
  AuthHierarchy,
  AuthScope,
  AuthUser,
  RoleAssignment,
  ViewMode,
  AdminLevel,
  ProfileEntityType,
  ROLE_PRIORITY,
  ADMIN_LEVEL_HIERARCHY
} from '../../shared/models/auth.types';
```

---

### 3. access.service.ts

#### Add New Methods

Add after the existing `simplifiedViewMode` method (around line 203):

```typescript
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
```

#### Update Import

```typescript
import { 
  AccessLogic, 
  AccessMode, 
  ViewMode, 
  AdminLevel, 
  ProfileEntityType 
} from '../../shared/models/auth.types';
```

---

## Usage Examples

### In Entity Profile Component

```typescript
@Component({
  selector: 'app-unit-profile',
  template: `
    <div class="profile-header">
      <h1>{{ unit().unitName }}</h1>
      
      @if (canEdit()) {
        <button (click)="editUnit()">Edit</button>
      }
      
      @if (canReassignAdmin()) {
        <button (click)="reassignAdmin()">Reassign Admin</button>
      }
    </div>
    
    <div class="admin-section">
      <h2>Unit Admin</h2>
      <p>{{ unit().adminName }}</p>
      @if (isOwnProfile()) {
        <span class="badge">You</span>
      }
    </div>
  `
})
export class UnitProfileComponent {
  private accessService = inject(AccessService);
  
  unitId = input.required<string>();
  unit = input.required<Unit>();
  
  // Computed access checks
  isOwnProfile = computed(() => 
    this.accessService.isOwnEntity('unit', this.unitId())
  );
  
  canEdit = computed(() => 
    this.accessService.canManageEntity('unit', this.unitId(), 'edit')
  );
  
  canReassignAdmin = computed(() => 
    this.accessService.canManageEntity('unit', this.unitId(), 'reassignAdmin')
  );
  
  canCreateAgent = computed(() => 
    this.accessService.isOwnEntity('unit', this.unitId()) || 
    this.accessService.isSuperAdmin()
  );
}
```

### In Route Guard

```typescript
export const unitProfileGuard: CanActivateFn = (route) => {
  const accessService = inject(AccessService);
  const unitId = route.params['unitId'];
  
  // Check if user can access this unit
  if (!accessService.canAccessLevel('unit')) {
    return false;
  }
  
  // For detailed scope check, you might need to fetch unit hierarchy first
  // or let the component handle the 403
  return true;
};
```

### Checking Admin Level in Templates

```typescript
// In component
adminLevel = this.accessService.adminLevel;
isSuperAdmin = this.accessService.isSuperAdmin;

// In template
@if (adminLevel() === 'forum') {
  <p>You are a Forum Admin</p>
}

@if (isSuperAdmin()) {
  <p>You have full access</p>
}
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `auth.types.ts` | Add `AdminLevel`, `ProfileEntityType`, `ADMIN_LEVEL_HIERARCHY` |
| `access.store.ts` | Add `adminLevel` computed, `isForumAdmin`, `isAreaAdmin`, `isUnitAdmin`, `canAccessLevel()`, `isOwnEntity()`, `isEntityInScope()`, `canManageEntity()` |
| `access.service.ts` | Expose all new store methods |

---

## Backward Compatibility

All existing code continues to work:
- `viewMode` still returns `'superadmin' | 'admin' | 'agent' | 'member'`
- `isAdminView()` still works for general admin checks
- No changes to existing permission checking logic

New code can use the additional `adminLevel` for finer-grained control.

---

## Testing Scenarios

| User Role | `viewMode` | `adminLevel` | Can Access Unit | Can Access Area | Can Access Forum |
|-----------|------------|--------------|-----------------|-----------------|------------------|
| Super Admin | `superadmin` | `null` | ✅ | ✅ | ✅ |
| Forum Admin | `admin` | `'forum'` | ✅ (in scope) | ✅ (in scope) | ✅ (own only) |
| Area Admin | `admin` | `'area'` | ✅ (in scope) | ✅ (own only) | ❌ |
| Unit Admin | `admin` | `'unit'` | ✅ (own only) | ❌ | ❌ |
| Agent | `agent` | `null` | ❌ | ❌ | ❌ |
| Member | `member` | `null` | ❌ | ❌ | ❌ |