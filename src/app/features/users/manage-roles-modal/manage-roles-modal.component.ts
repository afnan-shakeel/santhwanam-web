import { Component, Input, Output, EventEmitter, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';
import { SearchSelectComponent, SearchSelectOption } from '../../../shared/components/search-select/search-select.component';

import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { ForumService } from '../../../core/services/forum.service';
import { AreaService } from '../../../core/services/area.service';
import { UnitService } from '../../../core/services/unit.service';
import { AgentService } from '../../../core/services/agent.service';
import { MemberService } from '../../../core/services/member.service';
import { ToastService } from '../../../core/services/toast.service';

import { User, UserWithRoles, UserRole, AssignRoleRequest } from '../../../shared/models/user.model';
import { Role, ScopeType } from '../../../shared/models/role.model';
import { Forum } from '../../../shared/models/forum.model';
import { Area } from '../../../shared/models/area.model';
import { Unit } from '../../../shared/models/unit.model';
import { Agent } from '../../../shared/models/agent.model';
import { Member } from '../../../shared/models/member.model';

type ModalMode = 'view' | 'add';

@Component({
  selector: 'app-manage-roles-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    SelectComponent,
    SearchSelectComponent
  ],
  templateUrl: './manage-roles-modal.component.html',
  styleUrls: ['./manage-roles-modal.component.css']
})
export class ManageRolesModalComponent {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private forumService = inject(ForumService);
  private areaService = inject(AreaService);
  private unitService = inject(UnitService);
  private agentService = inject(AgentService);
  private memberService = inject(MemberService);
  private toastService = inject(ToastService);

  @Input() user: User | null = null;
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() roleAssigned = new EventEmitter<void>();
  @Output() roleRevoked = new EventEmitter<void>();

  // Modal state
  mode = signal<ModalMode>('view');
  
  // Data
  userWithRoles = signal<UserWithRoles | null>(null);
  availableRoles = signal<Role[]>([]);
  
  // Scope entity options
  forumOptions = signal<SearchSelectOption<string>[]>([]);
  areaOptions = signal<SearchSelectOption<string>[]>([]);
  unitOptions = signal<SearchSelectOption<string>[]>([]);
  agentOptions = signal<SearchSelectOption<string>[]>([]);
  memberOptions = signal<SearchSelectOption<string>[]>([]);

  // Loading states
  loading = signal(false);
  rolesLoading = signal(false);
  forumsLoading = signal(false);
  areasLoading = signal(false);
  unitsLoading = signal(false);
  agentsLoading = signal(false);
  membersLoading = signal(false);
  assigning = signal(false);
  revoking = signal(false);

  // Form state
  selectedRoleId = signal<string | null>(null);
  selectedScopeEntityId = signal<string | null>(null);
  formError = signal<string | null>(null);

  // Revoke confirmation
  showRevokeConfirm = signal(false);
  roleToRevoke = signal<UserRole | null>(null);

  // Computed
  roleOptions = computed<SelectOption<string>[]>(() => {
    return this.availableRoles().map(role => ({
      value: role.roleId,
      label: `${role.roleName} (${this.getScopeTypeLabel(role.scopeType)})`
    }));
  });

  selectedRole = computed(() => {
    const roleId = this.selectedRoleId();
    if (!roleId) return null;
    return this.availableRoles().find(r => r.roleId === roleId) || null;
  });

  requiresScope = computed(() => {
    const role = this.selectedRole();
    return role && role.scopeType !== 'None';
  });

  scopeType = computed(() => {
    const role = this.selectedRole();
    return role?.scopeType || 'None';
  });

  canAssign = computed(() => {
    const role = this.selectedRole();
    if (!role) return false;
    if (role.scopeType === 'None') return true;
    return !!this.selectedScopeEntityId();
  });

  currentRoles = computed(() => {
    return this.userWithRoles()?.roles || [];
  });

  constructor() {
    // Load scope entities when scope type changes
    effect(() => {
      const type = this.scopeType();
      if (type === 'Forum') {
        this.loadForums('');
      } else if (type === 'Area') {
        this.loadAreas('');
      } else if (type === 'Unit') {
        this.loadUnits('');
      } else if (type === 'Agent') {
        this.loadAgents('');
      } else if (type === 'Member') {
        this.loadMembers('');
      }
    });
  }

  onOpenChange(isOpen: boolean): void {
    if (isOpen && this.user) {
      this.loadUserWithRoles();
      this.loadAvailableRoles();
    } else {
      this.resetState();
    }
    this.openChange.emit(isOpen);
  }

  private loadUserWithRoles(): void {
    if (!this.user) return;
    
    this.loading.set(true);
    this.userService.getUserWithRoles(this.user.userId).subscribe({
      next: (data) => {
        this.userWithRoles.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load user roles:', error);
        this.toastService.error('Failed to load user roles');
        this.loading.set(false);
      }
    });
  }

  private loadAvailableRoles(): void {
    this.rolesLoading.set(true);
    this.roleService.searchRolesForSelect().subscribe({
      next: (roles) => {
        this.availableRoles.set(roles);
        this.rolesLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load roles:', error);
        this.rolesLoading.set(false);
      }
    });
  }

  // Scope entity loading
  loadForums(searchTerm: string): void {
    this.forumsLoading.set(true);
    this.forumService.searchForumsForSelect(searchTerm).subscribe({
      next: (forums) => {
        this.forumOptions.set(forums.map(f => ({
          value: f.forumId,
          label: `${f.forumName} (${f.forumCode})`
        })));
        this.forumsLoading.set(false);
      },
      error: () => this.forumsLoading.set(false)
    });
  }

  loadAreas(searchTerm: string): void {
    this.areasLoading.set(true);
    this.areaService.searchAreasForSelect(searchTerm).subscribe({
      next: (areas) => {
        this.areaOptions.set(areas.map(a => ({
          value: a.areaId,
          label: `${a.areaName} (${a.areaCode})`
        })));
        this.areasLoading.set(false);
      },
      error: () => this.areasLoading.set(false)
    });
  }

  loadUnits(searchTerm: string): void {
    this.unitsLoading.set(true);
    this.unitService.searchUnitsForSelect(searchTerm).subscribe({
      next: (units) => {
        this.unitOptions.set(units.map(u => ({
          value: u.unitId,
          label: `${u.unitName} (${u.unitCode})`
        })));
        this.unitsLoading.set(false);
      },
      error: () => this.unitsLoading.set(false)
    });
  }

  loadAgents(searchTerm: string): void {
    this.agentsLoading.set(true);
    this.agentService.searchAgentsForSelect(searchTerm).subscribe({
      next: (agents) => {
        this.agentOptions.set(agents.map(a => ({
          value: a.agentId,
          label: `${a.firstName} ${a.lastName} (${a.agentCode})`
        })));
        this.agentsLoading.set(false);
      },
      error: () => this.agentsLoading.set(false)
    });
  }

  loadMembers(searchTerm: string): void {
    this.membersLoading.set(true);
    this.memberService.searchMembersForSelect(searchTerm).subscribe({
      next: (members) => {
        this.memberOptions.set(members.map(m => ({
          value: m.memberId,
          label: `${m.firstName} ${m.lastName} (${m.memberCode})`
        })));
        this.membersLoading.set(false);
      },
      error: () => this.membersLoading.set(false)
    });
  }

  // Mode switching
  switchToAddMode(): void {
    this.mode.set('add');
    this.resetForm();
  }

  switchToViewMode(): void {
    this.mode.set('view');
    this.resetForm();
  }

  // Form handling
  onRoleChange(roleId: string | null): void {
    this.selectedRoleId.set(roleId);
    this.selectedScopeEntityId.set(null);
    this.formError.set(null);
  }

  onScopeEntityChange(entityId: string | string[] | null): void {
    // Handle both single and array values (search-select can return either)
    const id = Array.isArray(entityId) ? entityId[0] : entityId;
    this.selectedScopeEntityId.set(id ?? null);
    this.formError.set(null);
  }

  assignRole(): void {
    const role = this.selectedRole();
    if (!role || !this.user) return;

    // Check for duplicate
    const existingRole = this.currentRoles().find(r => 
      r.roleId === role.roleId && 
      (role.scopeType === 'None' || r.scopeEntityId === this.selectedScopeEntityId())
    );

    if (existingRole) {
      this.formError.set(`User already has "${role.roleName}" role${existingRole.scopeEntityName ? ` for ${existingRole.scopeEntityName}` : ''}`);
      return;
    }

    const request: AssignRoleRequest = {
      roleId: role.roleId,
      scopeEntityType: role.scopeType !== 'None' ? role.scopeType : undefined,
      scopeEntityId: this.selectedScopeEntityId() || undefined
    };

    this.assigning.set(true);
    this.userService.assignRole(this.user.userId, request).subscribe({
      next: () => {
        this.toastService.success(`Role "${role.roleName}" assigned successfully`);
        this.loadUserWithRoles();
        this.switchToViewMode();
        this.assigning.set(false);
        this.roleAssigned.emit();
      },
      error: (error) => {
        console.error('Failed to assign role:', error);
        this.formError.set(error.error?.message || 'Failed to assign role');
        this.assigning.set(false);
      }
    });
  }

  // Revoke handling
  confirmRevoke(role: UserRole): void {
    this.roleToRevoke.set(role);
    this.showRevokeConfirm.set(true);
  }

  cancelRevoke(): void {
    this.roleToRevoke.set(null);
    this.showRevokeConfirm.set(false);
  }

  revokeRole(): void {
    const role = this.roleToRevoke();
    if (!role || !this.user) return;

    this.revoking.set(true);
    this.userService.revokeRole(this.user.userId, role.userRoleId).subscribe({
      next: () => {
        this.toastService.success(`Role "${role.roleName}" revoked successfully`);
        this.loadUserWithRoles();
        this.cancelRevoke();
        this.revoking.set(false);
        this.roleRevoked.emit();
      },
      error: (error) => {
        console.error('Failed to revoke role:', error);
        this.toastService.error('Failed to revoke role');
        this.revoking.set(false);
      }
    });
  }

  // Helpers
  private resetState(): void {
    this.mode.set('view');
    this.userWithRoles.set(null);
    this.resetForm();
    this.showRevokeConfirm.set(false);
    this.roleToRevoke.set(null);
  }

  private resetForm(): void {
    this.selectedRoleId.set(null);
    this.selectedScopeEntityId.set(null);
    this.formError.set(null);
  }

  getScopeTypeLabel(scopeType: ScopeType): string {
    const labels: Record<ScopeType, string> = {
      'None': 'Global',
      'Forum': 'Forum-scoped',
      'Area': 'Area-scoped',
      'Unit': 'Unit-scoped',
      'Agent': 'Agent-scoped',
      'Member': 'Member-scoped'
    };
    return labels[scopeType] || scopeType;
  }

  getUserDisplayName(): string {
    const user = this.user || this.userWithRoles();
    if (!user) return '';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email;
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
