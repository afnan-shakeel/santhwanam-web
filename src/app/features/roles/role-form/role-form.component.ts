import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { CheckboxComponent } from '../../../shared/components/checkbox/checkbox.component';
import { RoleService } from '../../../core/services/role.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Role, ScopeType, CreateRoleRequest, UpdateRoleRequest } from '../../../shared/models/role.model';
import { Permission } from '../../../shared/models/permission.model';
import { ButtonComponent } from "../../../shared/components/button/button.component";

interface PermissionGroup {
  module: string;
  permissions: Permission[];
  allSelected: boolean;
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbsComponent,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    ButtonComponent
],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.css']
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private roleService = inject(RoleService);
  private permissionService = inject(PermissionService);

  roleId = signal<string | null>(null);
  isEditMode = computed(() => !!this.roleId());
  loading = signal(false);
  saving = signal(false);
  permissions = signal<Permission[]>([]);
  permissionGroups = signal<PermissionGroup[]>([]);
  
  selectedPermissionsCount = computed(() => {
    return this.roleForm.get('permissionIds')?.value?.length || 0;
  });

  breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Roles', route: '/roles' },
    { label: this.isEditMode() ? 'Edit Role' : 'New Role', current: true }
  ]);

  scopeTypeOptions = [
    { label: 'None', value: 'None' },
    { label: 'Forum', value: 'Forum' },
    { label: 'Area', value: 'Area' },
    { label: 'Unit', value: 'Unit' },
    { label: 'Agent', value: 'Agent' }
  ];

  roleForm: FormGroup = this.fb.group({
    roleCode: ['', [Validators.required, Validators.maxLength(50)]],
    roleName: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    scopeType: ['None' as ScopeType, [Validators.required]],
    isSystemRole: [false],
    permissionIds: [[]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.roleId.set(id);
      this.loadRole(id);
    }
    this.loadPermissions();
  }

  loadRole(roleId: string): void {
    this.loading.set(true);
    this.roleService.getRole(roleId).subscribe({
      next: (role) => {
        this.roleForm.patchValue({
          roleCode: role.roleCode,
          roleName: role.roleName,
          description: role.description,
          scopeType: role.scopeType,
          isSystemRole: role.isSystemRole,
          permissionIds: role.permissionIds || []
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load role:', error);
        this.loading.set(false);
      }
    });
  }

  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (permissions) => {
        this.permissions.set(permissions);
        this.groupPermissionsByModule(permissions);
      },
      error: (error) => {
        console.error('Failed to load permissions:', error);
      }
    });
  }

  groupPermissionsByModule(permissions: Permission[]): void {
    const grouped = new Map<string, Permission[]>();
    
    permissions.forEach(permission => {
      const module = permission.module || 'Other';
      if (!grouped.has(module)) {
        grouped.set(module, []);
      }
      grouped.get(module)!.push(permission);
    });

    const groups: PermissionGroup[] = Array.from(grouped.entries()).map(([module, perms]) => ({
      module,
      permissions: perms,
      allSelected: this.areAllPermissionsSelected(perms.map(p => p.permissionId))
    }));

    this.permissionGroups.set(groups);
  }

  areAllPermissionsSelected(permissionIds: string[]): boolean {
    const selectedIds = this.roleForm.get('permissionIds')?.value || [];
    return permissionIds.every(id => selectedIds.includes(id));
  }

  onModuleCheckboxChange(group: PermissionGroup, checked: boolean): void {
    const currentPermissionIds = this.roleForm.get('permissionIds')?.value || [];
    const groupPermissionIds = group.permissions.map(p => p.permissionId);

    let updatedPermissionIds: string[];
    if (checked) {
      // Add all permissions from this module
      updatedPermissionIds = [...new Set([...currentPermissionIds, ...groupPermissionIds])];
    } else {
      // Remove all permissions from this module
      updatedPermissionIds = currentPermissionIds.filter((id: string) => !groupPermissionIds.includes(id));
    }

    this.roleForm.patchValue({ permissionIds: updatedPermissionIds });
    this.updateGroupStates();
  }

  onPermissionCheckboxChange(permissionId: string, checked: boolean): void {
    const currentPermissionIds = this.roleForm.get('permissionIds')?.value || [];
    
    let updatedPermissionIds: string[];
    if (checked) {
      updatedPermissionIds = [...currentPermissionIds, permissionId];
    } else {
      updatedPermissionIds = currentPermissionIds.filter((id: string) => id !== permissionId);
    }

    this.roleForm.patchValue({ permissionIds: updatedPermissionIds });
    this.updateGroupStates();
  }

  updateGroupStates(): void {
    const groups = this.permissionGroups().map(group => ({
      ...group,
      allSelected: this.areAllPermissionsSelected(group.permissions.map(p => p.permissionId))
    }));
    this.permissionGroups.set(groups);
  }

  isPermissionSelected(permissionId: string): boolean {
    const selectedIds = this.roleForm.get('permissionIds')?.value || [];
    return selectedIds.includes(permissionId);
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.roleForm.value;

    if (this.isEditMode()) {
      const updateRequest: UpdateRoleRequest = {
        roleCode: formValue.roleCode,
        roleName: formValue.roleName,
        description: formValue.description,
        scopeType: formValue.scopeType,
        isSystemRole: formValue.isSystemRole,
        permissionIds: formValue.permissionIds
      };

      this.roleService.updateRole(this.roleId()!, updateRequest).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/roles']);
        },
        error: (error) => {
          console.error('Failed to update role:', error);
          this.saving.set(false);
        }
      });
    } else {
      const createRequest: CreateRoleRequest = {
        roleCode: formValue.roleCode,
        roleName: formValue.roleName,
        description: formValue.description,
        scopeType: formValue.scopeType,
        isSystemRole: formValue.isSystemRole,
        permissionIds: formValue.permissionIds
      };

      this.roleService.createRole(createRequest).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/roles']);
        },
        error: (error) => {
          console.error('Failed to create role:', error);
          this.saving.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/roles']);
  }
}
