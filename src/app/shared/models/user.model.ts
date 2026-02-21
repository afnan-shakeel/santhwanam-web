import { ScopeType } from './role.model';

export interface User {
  userId: string;
  externalAuthId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName?: string | null;
  isActive: boolean;
  userMetadata: any | null;
  createdAt: Date;
  lastSyncedAt: Date | null;
  userRoles: Partial<UserRole>[];
}

// User role assignment types
export interface AssignedBy {
  userId: string;
  name: string;
}

export interface UserRole {
  userRoleId: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  scopeType: ScopeType;
  scopeEntityId: string | null;
  scopeEntityName: string | null;
  isSystemRole: boolean;
  assignedAt: Date;
  assignedBy: AssignedBy;
}

export interface UserWithRoles extends User {
  roles: UserRole[];
}

export interface AssignRoleRequest {
  roleId: string;
  scopeEntityType?: ScopeType;
  scopeEntityId?: string;
}
