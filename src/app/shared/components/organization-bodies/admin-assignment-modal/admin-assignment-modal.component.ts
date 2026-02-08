import { Component, inject, signal, computed, input, output, model, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { ModalComponent } from '../../modal/modal.component';
import { IconComponent } from '../../icon/icon.component';
import { UserSearchSelectComponent } from '../../user-search-select/user-search-select.component';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UserService } from '../../../../core/services/user.service';
import { ForumService } from '../../../../core/services/forum.service';
import { AreaService } from '../../../../core/services/area.service';
import { UnitService } from '../../../../core/services/unit.service';
import { User } from '../../../models/user.model';
import { AdminDetails } from '../../../models/forum.model';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type EntityType = 'forum' | 'area' | 'unit';

export interface EntityInfo {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  entityCode: string;
}

export interface AdminInfo {
  userId: string;
  name: string;
  email: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

@Component({
  selector: 'app-admin-assignment-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    IconComponent,
    UserSearchSelectComponent
  ],
  templateUrl: './admin-assignment-modal.component.html',
  styleUrls: ['./admin-assignment-modal.component.css']
})
export class AdminAssignmentModalComponent {
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);
  private userService = inject(UserService);
  private forumService = inject(ForumService);
  private areaService = inject(AreaService);
  private unitService = inject(UnitService);

  // ═══════════════════════════════════════════════════════════════════════
  // INPUTS & OUTPUTS
  // ═══════════════════════════════════════════════════════════════════════

  /** Two-way binding for modal open state */
  open = model<boolean>(false);

  /** Entity information (required) */
  entity = input.required<EntityInfo>();

  /** Current admin full info (optional - if available) */
  currentAdmin = input<AdminInfo | null>(null);

  /** Current admin user ID (optional - used to fetch admin info if currentAdmin not provided) */
  currentAdminUserId = input<string | null>(null);

  /** Emitted when admin is successfully assigned */
  onAssigned = output<{ entityId: string; newAdminUserId: string }>();

  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════

  selectedUserId = signal<string | null>(null);
  selectedUser = signal<AdminInfo | null>(null);
  isSubmitting = signal(false);
  isLoadingUser = signal(false);
  isLoadingCurrentAdmin = signal(false);
  currentAdminInfo = signal<AdminInfo | null>(null);
  error = signal<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════

  /** Gets current admin info - from input or fetched */
  displayedCurrentAdmin = computed(() => {
    return this.currentAdmin() ?? this.currentAdminInfo();
  });

  entityIcon = computed(() => {
    const icons: Record<EntityType, string> = {
      forum: 'globe-alt',
      area: 'map-pin',
      unit: 'building-office'
    };
    return icons[this.entity().entityType];
  });

  entityTypeLabel = computed(() => {
    const labels: Record<EntityType, string> = {
      forum: 'Forum',
      area: 'Area',
      unit: 'Unit'
    };
    return labels[this.entity().entityType];
  });

  canSubmit = computed(() => {
    return this.selectedUser() !== null && !this.isSubmitting() && !this.error();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════════

  constructor() {
    // Reset state when modal closes, fetch admin when opens
    effect(() => {
      if (this.open()) {
        this.loadCurrentAdminIfNeeded();
      } else {
        this.resetState();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Load current admin info if only userId is provided
   */
  private async loadCurrentAdminIfNeeded(): Promise<void> {
    // If we already have full admin info, no need to fetch
    if (this.currentAdmin()) {
      return;
    }

    const adminUserId = this.currentAdminUserId();
    if (!adminUserId) {
      return;
    }

    this.isLoadingCurrentAdmin.set(true);
    try {
      const user = await firstValueFrom(this.userService.getUser(adminUserId));
      this.currentAdminInfo.set({
        userId: user.userId,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
        email: user.email
      });
    } catch (err) {
      console.error('Failed to fetch current admin details:', err);
    } finally {
      this.isLoadingCurrentAdmin.set(false);
    }
  }

  /**
   * Handle user selection from search-select component
   */
  async onUserSelected(userId: string | string[] | null): Promise<void> {
    const id = Array.isArray(userId) ? userId[0] : userId;
    this.selectedUserId.set(id);
    this.error.set(null);

    if (!id) {
      this.selectedUser.set(null);
      return;
    }

    // Fetch user details
    this.isLoadingUser.set(true);
    try {
      const user = await firstValueFrom(this.userService.getUser(id));
      this.selectedUser.set({
        userId: user.userId,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
        email: user.email
      });
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      this.selectedUser.set(null);
      this.toastService.error('Failed to load user details');
    } finally {
      this.isLoadingUser.set(false);
    }
  }

  /**
   * Clear selected user
   */
  clearSelectedUser(): void {
    this.selectedUserId.set(null);
    this.selectedUser.set(null);
    this.error.set(null);
  }

  /**
   * Handle assign button click
   */
  async onAssignClick(): Promise<void> {
    const selected = this.selectedUser();
    if (!selected) return;

    const currentAdminName = this.displayedCurrentAdmin()?.name;
    const entityName = this.entity().entityName;
    const entityType = this.entityTypeLabel().toLowerCase();

    // Build confirmation message
    let message = `Are you sure you want to assign ${selected.name} as the admin of ${entityName}?`;
    let description = currentAdminName
      ? `${currentAdminName} will be removed as admin of this ${entityType}.`
      : undefined;

    // Show confirmation
    const confirmed = await this.confirmationService.confirm({
      title: 'Confirm Assignment',
      message,
      description,
      variant: 'info',
      confirmText: 'Confirm'
    });

    if (!confirmed) return;

    // Make API call
    await this.assignAdmin(selected.userId);
  }

  /**
   * Call the appropriate service to assign admin
   */
  private async assignAdmin(newAdminUserId: string): Promise<void> {
    this.isSubmitting.set(true);
    this.error.set(null);

    const entityType = this.entity().entityType;
    const entityId = this.entity().entityId;
    const request = { newAdminUserId };

    try {
      switch (entityType) {
        case 'forum':
          await firstValueFrom(this.forumService.assignAdmin(entityId, request));
          break;
        case 'area':
          await firstValueFrom(this.areaService.assignAdmin(entityId, request));
          break;
        case 'unit':
          await firstValueFrom(this.unitService.assignAdmin(entityId, request));
          break;
      }

      const userName = this.selectedUser()?.name ?? 'User';
      this.toastService.success(`${userName} has been assigned as admin.`);
      this.onAssigned.emit({ entityId, newAdminUserId });
      this.open.set(false);
    } catch (err: any) {
      // Handle cash custody error
      if (err?.error?.code === 'CASH_CUSTODY_NOT_EMPTY') {
        this.error.set(err.error.message || 'Current admin has pending cash custody. The cash must be transferred before reassigning.');
      } else {
        this.toastService.error('Failed to assign admin', 'Please try again.');
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Handle modal close
   */
  onClose(): void {
    this.open.set(false);
  }

  /**
   * Reset component state
   */
  private resetState(): void {
    this.selectedUserId.set(null);
    this.selectedUser.set(null);
    this.isSubmitting.set(false);
    this.isLoadingUser.set(false);
    this.isLoadingCurrentAdmin.set(false);
    this.currentAdminInfo.set(null);
    this.error.set(null);
  }
}
