# Access Management Specification

## Overview

The access management system controls what users can see and do based on their roles and position in the organizational hierarchy. It uses **ViewMode** to determine the UI perspective and **AdminLevel** to control entity-specific access.

---

## Concepts

### ViewMode (UI Perspective)
Determines which interface the user sees based on their highest priority role:

| ViewMode | Scope Type | Roles | Purpose |
|----------|-----------|-------|---------|
| `superadmin` | None | super_admin, system_admin | Full system access, all admin features |
| `admin` | Forum/Area/Unit | forum_admin, area_admin, unit_admin, admin | Entity-level admin functions |
| `agent` | Agent | agent, senior_agent | Agent member management |
| `member` | Member | member | Self-service member view |

**Logic:** ViewMode is determined by the user's **highest priority role** from `ROLE_PRIORITY` config.

### AdminLevel (Hierarchy Level)
For admin users, specifies their level in the organizational hierarchy:

| AdminLevel | Scope Type | Can Access | Can Manage |
|-----------|-----------|------------|-----------|
| `'forum'` | Forum | Forums, Areas, Units | Areas, Units, their own Forum |
| `'area'` | Area | Areas, Units | Units, their own Area |
| `'unit'` | Unit | Units only | Their own Unit only |
| `null` | Non-admin | N/A | N/A |

**Logic:** Derived from user's `scope.type`. Super admins have `adminLevel = null` (transcend levels).

---

## Data Structures

### Auth Context (from backend)
```typescript
interface AuthContext {
  user: AuthUser;                    // userId, email, name
  permissions: string[];             // [admin.create, member.view, ...]
  scope: AuthScope;                  // { type: 'Area', entityId: '123' }
  hierarchy: AuthHierarchy;          // { forumId, areaId, unitId, ... }
  roles: RoleAssignment[];           // User's role assignments with scopes
}

type ScopeType = 'None' | 'Forum' | 'Area' | 'Unit' | 'Agent' | 'Member';

type AdminLevel = 'forum' | 'area' | 'unit' | null;
type ProfileEntityType = 'forum' | 'area' | 'unit';
```

---

## Usage

### Basic Permission Checks
```typescript
// In component
constructor(private access: AccessService) {}

can(permission: string): boolean;        // Single permission
canAny(permissions: string[]): boolean;  // At least one
canAll(permissions: string[]): boolean;  // All permissions
```

### Role Checks
```typescript
hasRole(roleCode: string): boolean;
isSuperAdmin(): boolean;
```

### View Mode Checks
```typescript
getViewMode(): ViewMode;                 // 'superadmin' | 'admin' | 'agent' | 'member'
isAdminView(): boolean;                  // true if admin or superadmin
isAgentView(): boolean;
isMemberView(): boolean;
getSimplifiedViewMode(): 'admin' | 'self';
```

### Admin Level Checks (NEW)
```typescript
getAdminLevel(): AdminLevel;             // 'forum' | 'area' | 'unit' | null
isForumAdmin(): boolean;
isAreaAdmin(): boolean;
isUnitAdmin(): boolean;
```

### Entity Access Checks (NEW)
```typescript
// Can user access entities at this level?
canAccessLevel(targetLevel: ProfileEntityType): boolean;
// Forum admin → can access area/unit ✓
// Area admin → can access unit ✓
// Unit admin → can only access unit ✓

// Is user viewing their own entity?
isOwnEntity(entityType: ProfileEntityType, entityId: string): boolean;

// Is entity within user's scope?
isEntityInScope(
  entityType: ProfileEntityType,
  entityId: string,
  entityHierarchy?: { forumId?: string; areaId?: string }
): boolean;

// Can user perform action on entity?
canManageEntity(
  entityType: ProfileEntityType,
  entityId: string,
  action: 'edit' | 'reassignAdmin' | 'createSubordinate'
): boolean;
```

---

## Use Cases

### Case 1: Entity Profile Page
```typescript
// Check if user can view this unit profile
if (!accessService.canAccessLevel('unit')) {
  router.navigate(['/forbidden']);
}

// Show edit button only if they can manage it
@if (accessService.canManageEntity('unit', unitId, 'edit')) {
  <button (click)="editUnit()">Edit</button>
}

// Show reassign button only for parent admins
@if (accessService.canManageEntity('unit', unitId, 'reassignAdmin')) {
  <button (click)="reassignAdmin()">Reassign Admin</button>
}
```

### Case 2: Admin Dashboard
```typescript
// Show admin features based on level
@if (accessService.isAdminView()) {
  @if (accessService.isForumAdmin()) {
    <section>Forum Admin Panel</section>
  } @else if (accessService.isAreaAdmin()) {
    <section>Area Admin Panel</section>
  } @else if (accessService.isUnitAdmin()) {
    <section>Unit Admin Panel</section>
  }
}
```

### Case 3: Member Listing
```typescript
// Show action buttons based on permissions
@if (accessService.canPerformAction('member', 'approve')) {
  <button>Approve</button>
}

@if (accessService.canPerformAction('member', 'delete')) {
  <button>Delete</button>
}
```

---

## Hierarchy Rules

### Access Hierarchy
```
Super Admin (scope: None)
  ↓ can access everything
Forum Admin (scope: Forum)
  ↓ can access their Forum, Areas, Units
Area Admin (scope: Area)
  ↓ can access their Area, Units
Unit Admin (scope: Unit)
  ↓ can access their Unit only
```

### Management Rules
- **Edit**: Can edit own entity or child entities
- **Reassign Admin**: Parent admins can reassign subordinate admins (e.g., Forum → Area, Area → Unit)
- **Create Subordinate**: Forum creates Areas, Area creates Units

---

## Key Changes (Latest Update)

| Item | Before | After | Purpose |
|------|--------|-------|---------|
| `super_admin` viewMode | `'admin'` | `'superadmin'` | Distinguish super admins from entity admins |
| ViewMode + AdminLevel | ViewMode only | ViewMode + AdminLevel | Support entity profile access control |
| Entity access methods | None | `canAccessLevel()`, `isOwnEntity()`, `isEntityInScope()`, `canManageEntity()` | Enable granular entity permission checks |

---

## Implementation Files

- `src/app/shared/models/auth.types.ts` - Types and constants
- `src/app/core/state/access.store.ts` - State management (Signals)
- `src/app/core/services/access.service.ts` - Public API
