export type ScopeType = 'None' | 'Forum' | 'Area' | 'Unit' | 'Agent' | 'Member';

export interface Role {
  roleId: string;
  roleCode: string;
  roleName: string;
  description: string | null;
  scopeType: ScopeType;
  isActive: boolean;
  isSystemRole: boolean;
  permissionIds: string[];
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateRoleRequest {
  roleCode: string;
  roleName: string;
  description?: string;
  scopeType: ScopeType;
  isSystemRole?: boolean;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  roleCode?: string;
  roleName?: string;
  description?: string;
  scopeType?: ScopeType;
  isActive?: boolean;
  isSystemRole?: boolean;
  permissionIds?: string[];
}
