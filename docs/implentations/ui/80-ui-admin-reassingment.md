# Admin Assignment & Confirmation Modal - UI Design

## Overview

This document covers:
1. **Admin Assignment Modal** - For assigning/reassigning Forum, Area, Unit admins
2. **Shared Confirmation Modal** - Reusable confirmation component for the application

---

# Part 1: Admin Assignment Modal

## Purpose

Allow Super Admin to assign or reassign admin users to organizational entities (Forum, Area, Unit).

## Trigger Points

| Location | Action |
|----------|--------|
| Forum Listing Page | Row action: "Assign Admin" |
| Area Listing Page | Row action: "Assign Admin" |
| Unit Listing Page | Row action: "Assign Admin" |

**Note:** Profile page [Reassign] button may be removed in future.

---

## User Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Click "Assign  │     │  Assignment     │     │  Confirmation   │
│  Admin" action  │ ──► │  Modal          │ ──► │  Modal          │
└─────────────────┘     │  (Select user)  │     │  (Confirm)      │
                        └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌─────────────────┐              │
                        │  Success Toast  │ ◄────────────┘
                        │  or Error       │      API Call
                        └─────────────────┘
```

---

## Modal Design

### Admin Assignment Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Assign Admin                                            ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Entity                                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🏢 Ruwi Central Unit                                  │  │
│  │    UNIT-001                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Current Admin                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👤 Sarah Ahmed                                        │  │
│  │    sarah@email.com                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                             │
│  New Admin *                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔍 Search users...                                ▾  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                [Cancel]    [Assign Admin]   │
└─────────────────────────────────────────────────────────────┘
```

### With User Selected

```
┌─────────────────────────────────────────────────────────────┐
│ Assign Admin                                            ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Entity                                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🏢 Ruwi Central Unit                                  │  │
│  │    UNIT-001                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Current Admin                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👤 Sarah Ahmed                                        │  │
│  │    sarah@email.com                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                             │
│  New Admin *                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 👤 John Doe                                       ✕  │  │
│  │    john.doe@email.com                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                [Cancel]    [Assign Admin]   │
└─────────────────────────────────────────────────────────────┘
```

### No Current Admin (New Assignment)

```
┌─────────────────────────────────────────────────────────────┐
│ Assign Admin                                            ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Entity                                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📍 Salalah Area                                       │  │
│  │    AREA-003                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Current Admin                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ No admin assigned                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                             │
│  New Admin *                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔍 Search users...                                ▾  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                [Cancel]    [Assign Admin]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Confirmation Modal (After Selection)

```
┌─────────────────────────────────────────────────────────────┐
│ Confirm Assignment                                      ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ℹ️  Are you sure you want to assign John Doe as the       │
│      admin of Ruwi Central Unit?                            │
│                                                             │
│      Sarah Ahmed will be removed as admin of this unit.    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                   [Cancel]    [Confirm]     │
└─────────────────────────────────────────────────────────────┘
```

### Confirmation for New Assignment (No Previous Admin)

```
┌─────────────────────────────────────────────────────────────┐
│ Confirm Assignment                                      ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ℹ️  Are you sure you want to assign John Doe as the       │
│      admin of Salalah Area?                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                   [Cancel]    [Confirm]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### API Error: Cash Custody Balance

If the API returns an error due to cash custody balance:

```
┌─────────────────────────────────────────────────────────────┐
│ Assign Admin                                            ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⚠️ Cannot reassign admin                              │  │
│  │                                                       │  │
│  │ Sarah Ahmed has ₹15,000 in cash custody. The cash    │  │
│  │ must be transferred before reassigning the admin.     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Entity                                                     │
│  ...                                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                              [Close]        │
└─────────────────────────────────────────────────────────────┘
```

Alternatively, show as a toast notification and close the modal.

---

## Component Architecture

### File Structure

```
src/app/shared/components/organization-bodies/
├── admin-assignment-modal/
│       ├── admin-assignment-modal.component.ts
│       ├── admin-assignment-modal.component.html
│       └── admin-assignment-modal.component.css
```

### Component Interface

```typescript
// admin-assignment-modal.component.ts

import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

interface EntityInfo {
  entityType: 'forum' | 'area' | 'unit';
  entityId: string;
  entityName: string;
  entityCode: string;
}

interface AdminInfo {
  userId: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-admin-assignment-modal',
  templateUrl: './admin-assignment-modal.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, UserSearchSelectComponent, ConfirmationModalComponent]
})
export class AdminAssignmentModalComponent {
  private organizationService = inject(OrganizationBodiesService);
  private confirmationService = inject(ConfirmationService);
  private toastService = inject(ToastService);

  // Inputs
  open = model<boolean>(false);
  entity = input.required<EntityInfo>();
  currentAdmin = input<AdminInfo | null>(null);

  // Outputs
  onAssigned = output<{ entityId: string; newAdminUserId: string }>();

  // State
  selectedUser = signal<AdminInfo | null>(null);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Computed
  entityIcon = computed(() => {
    const icons = { forum: '🌐', area: '📍', unit: '🏢' };
    return icons[this.entity().entityType];
  });

  canSubmit = computed(() => {
    return this.selectedUser() !== null && !this.isSubmitting();
  });

  // Methods
  onUserSelected(user: AdminInfo | null): void {
    this.selectedUser.set(user);
    this.error.set(null);
  }

  async onAssignClick(): Promise<void> {
    const selected = this.selectedUser();
    if (!selected) return;

    const currentAdminName = this.currentAdmin()?.name;
    const entityName = this.entity().entityName;

    // Build confirmation message
    let message = `Are you sure you want to assign ${selected.name} as the admin of ${entityName}?`;
    let description = currentAdminName 
      ? `${currentAdminName} will be removed as admin of this ${this.entity().entityType}.`
      : undefined;

    // Show confirmation
    const confirmed = await this.confirmationService.confirm({
      title: 'Confirm Assignment',
      message,
      description,
      variant: 'info',
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    // Make API call
    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      await this.organizationService.assignAdmin(
        this.entity().entityType,
        this.entity().entityId,
        selected.userId
      );

      this.toastService.success(`${selected.name} has been assigned as admin.`);
      this.onAssigned.emit({ 
        entityId: this.entity().entityId, 
        newAdminUserId: selected.userId 
      });
      this.open.set(false);
    } catch (err: any) {
      // Handle cash custody error
      if (err.code === 'CASH_CUSTODY_NOT_EMPTY') {
        this.error.set(err.message);
      } else {
        this.toastService.error('Failed to assign admin. Please try again.');
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onClose(): void {
    this.open.set(false);
    this.selectedUser.set(null);
    this.error.set(null);
  }
}
```

### Template

```html
<!-- admin-assignment-modal.component.html -->

<app-modal [open]="open()" (onClose)="onClose()" title="Assign Admin" size="md">
  <div class="space-y-6">
    
    <!-- Error Alert -->
    @if (error()) {
      <div class="alert alert-warning">
        <span class="alert-icon">⚠️</span>
        <div>
          <strong>Cannot reassign admin</strong>
          <p>{{ error() }}</p>
        </div>
      </div>
    }

    <!-- Entity Info -->
    <div>
      <label class="form-label">Entity</label>
      <div class="info-card">
        <span class="text-xl">{{ entityIcon() }}</span>
        <div>
          <p class="font-medium text-gray-900">{{ entity().entityName }}</p>
          <p class="text-sm text-gray-500">{{ entity().entityCode }}</p>
        </div>
      </div>
    </div>

    <!-- Current Admin -->
    <div>
      <label class="form-label">Current Admin</label>
      <div class="info-card">
        @if (currentAdmin()) {
          <span>👤</span>
          <div>
            <p class="font-medium text-gray-900">{{ currentAdmin()!.name }}</p>
            <p class="text-sm text-gray-500">{{ currentAdmin()!.email }}</p>
          </div>
        } @else {
          <p class="text-gray-500">No admin assigned</p>
        }
      </div>
    </div>

    <hr class="border-dashed" />

    <!-- New Admin Selection -->
    <div>
      <label class="form-label">New Admin *</label>
      <app-user-search-select
        [value]="selectedUser()"
        (valueChange)="onUserSelected($event)"
        placeholder="Search users..."
      />
    </div>

  </div>

  <!-- Footer -->
  <ng-container slot="footer">
    <button class="btn btn-secondary" (click)="onClose()">Cancel</button>
    <button 
      class="btn btn-primary" 
      [disabled]="!canSubmit()"
      [loading]="isSubmitting()"
      (click)="onAssignClick()">
      Assign Admin
    </button>
  </ng-container>
</app-modal>
```

---

## Usage in Listing Page

```typescript
// unit-listing.component.ts

@Component({...})
export class UnitListingComponent {
  // State for modal
  showAssignModal = signal(false);
  selectedEntity = signal<EntityInfo | null>(null);
  selectedCurrentAdmin = signal<AdminInfo | null>(null);

  // Open modal from row action
  onAssignAdminClick(unit: UnitListItem): void {
    this.selectedEntity.set({
      entityType: 'unit',
      entityId: unit.unitId,
      entityName: unit.unitName,
      entityCode: unit.unitCode
    });
    this.selectedCurrentAdmin.set(unit.admin ? {
      userId: unit.admin.userId,
      name: unit.admin.name,
      email: unit.admin.email
    } : null);
    this.showAssignModal.set(true);
  }

  // Handle successful assignment
  onAdminAssigned(event: { entityId: string; newAdminUserId: string }): void {
    // Refresh the list
    this.loadUnits();
  }
}
```

```html
<!-- unit-listing.component.html -->

<!-- In table row actions -->
<button (click)="onAssignAdminClick(unit)">Assign Admin</button>

<!-- Modal -->
@if (selectedEntity()) {
  <app-admin-assignment-modal
    [(open)]="showAssignModal"
    [entity]="selectedEntity()!"
    [currentAdmin]="selectedCurrentAdmin()"
    (onAssigned)="onAdminAssigned($event)"
  />
}
```

---

## API Integration

### Service Method

```typescript
// organization-bodies.service.ts

@Injectable({ providedIn: 'root' })
export class OrganizationBodiesService {
  private http = inject(HttpClient);

  assignAdmin(
    entityType: 'forum' | 'area' | 'unit',
    entityId: string,
    newAdminUserId: string
  ): Observable<void> {
    const endpoints = {
      forum: `/api/organization-bodies/forums/${entityId}/assign-admin`,
      area: `/api/organization-bodies/areas/${entityId}/assign-admin`,
      unit: `/api/organization-bodies/units/${entityId}/assign-admin`
    };

    return this.http.post<void>(endpoints[entityType], { newAdminUserId });
  }
}
```

---

# Part 2: Shared Confirmation Modal

## Purpose

A reusable confirmation modal component for use throughout the application.

---

## Design Variants

### Info (Default)

```
┌─────────────────────────────────────────────────────────────┐
│ Confirm Action                                          ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ℹ️  Are you sure you want to proceed?                     │
│                                                             │
│      Additional context or description here.                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                   [Cancel]    [Confirm]     │
└─────────────────────────────────────────────────────────────┘
```

### Warning

```
┌─────────────────────────────────────────────────────────────┐
│ Warning                                                 ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️  This action may have consequences.                    │
│                                                             │
│      Please review before continuing.                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                   [Cancel]    [Continue]    │
└─────────────────────────────────────────────────────────────┘
```

### Danger

```
┌─────────────────────────────────────────────────────────────┐
│ Delete Item                                             ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🗑️  Are you sure you want to delete this item?            │
│                                                             │
│      This action cannot be undone.                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                    [Cancel]    [Delete]     │
└─────────────────────────────────────────────────────────────┘
```

### Success

```
┌─────────────────────────────────────────────────────────────┐
│ Confirm Approval                                        ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅  Approve this request?                                  │
│                                                             │
│      The member will be notified of the approval.          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                   [Cancel]    [Approve]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### File Structure

```
src/app/shared/components/
└── confirmation-modal/
    ├── confirmation-modal.component.ts
    ├── confirmation-modal.component.html
    └── confirmation-modal.component.css

src/app/shared/services/
└── confirmation.service.ts
```

### Types

```typescript
// confirmation.types.ts

export type ConfirmationVariant = 'info' | 'warning' | 'danger' | 'success';

export interface ConfirmationConfig {
  /** Modal title */
  title: string;
  
  /** Main message (required) */
  message: string;
  
  /** Additional description (optional) */
  description?: string;
  
  /** Visual variant - affects icon and button styling */
  variant?: ConfirmationVariant;  // Default: 'info'
  
  /** Custom icon override */
  icon?: string;
  
  /** Confirm button text */
  confirmText?: string;  // Default: based on variant
  
  /** Cancel button text */
  cancelText?: string;  // Default: 'Cancel'
  
  /** Confirm button variant */
  confirmButtonVariant?: 'primary' | 'danger';  // Default: based on variant
}
```

### Default Values by Variant

```typescript
const VARIANT_DEFAULTS: Record<ConfirmationVariant, {
  icon: string;
  confirmText: string;
  confirmButtonVariant: 'primary' | 'danger';
}> = {
  info: {
    icon: 'ℹ️',
    confirmText: 'Confirm',
    confirmButtonVariant: 'primary'
  },
  warning: {
    icon: '⚠️',
    confirmText: 'Continue',
    confirmButtonVariant: 'primary'
  },
  danger: {
    icon: '🗑️',
    confirmText: 'Delete',
    confirmButtonVariant: 'danger'
  },
  success: {
    icon: '✅',
    confirmText: 'Confirm',
    confirmButtonVariant: 'primary'
  }
};
```

---

### Confirmation Service

Provides a promise-based API for showing confirmation dialogs.

```typescript
// confirmation.service.ts

import { Injectable, signal } from '@angular/core';
import { ConfirmationConfig } from './confirmation.types';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  
  // State - used by the modal component
  readonly isOpen = signal(false);
  readonly config = signal<ConfirmationConfig | null>(null);
  
  // Private resolver for the promise
  private resolveConfirmation: ((value: boolean) => void) | null = null;

  /**
   * Show a confirmation modal and wait for user response.
   * Returns true if confirmed, false if cancelled.
   */
  confirm(config: ConfirmationConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolveConfirmation = resolve;
      this.config.set(config);
      this.isOpen.set(true);
    });
  }

  /**
   * Called by the modal component when user confirms
   */
  onConfirm(): void {
    this.resolveConfirmation?.(true);
    this.close();
  }

  /**
   * Called by the modal component when user cancels
   */
  onCancel(): void {
    this.resolveConfirmation?.(false);
    this.close();
  }

  private close(): void {
    this.isOpen.set(false);
    this.config.set(null);
    this.resolveConfirmation = null;
  }

  // ============================================
  // Convenience Methods
  // ============================================

  /**
   * Show a delete confirmation
   */
  confirmDelete(itemName: string, description?: string): Promise<boolean> {
    return this.confirm({
      title: 'Delete ' + itemName,
      message: `Are you sure you want to delete this ${itemName.toLowerCase()}?`,
      description: description ?? 'This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete'
    });
  }

  /**
   * Show a warning confirmation
   */
  confirmWarning(title: string, message: string, description?: string): Promise<boolean> {
    return this.confirm({
      title,
      message,
      description,
      variant: 'warning'
    });
  }
}
```

---

### Modal Component

```typescript
// confirmation-modal.component.ts

import { Component, inject, computed } from '@angular/core';
import { ConfirmationService } from '../../services/confirmation.service';

const VARIANT_DEFAULTS = {
  info: { icon: 'ℹ️', confirmText: 'Confirm', confirmButtonVariant: 'primary' as const },
  warning: { icon: '⚠️', confirmText: 'Continue', confirmButtonVariant: 'primary' as const },
  danger: { icon: '🗑️', confirmText: 'Delete', confirmButtonVariant: 'danger' as const },
  success: { icon: '✅', confirmText: 'Confirm', confirmButtonVariant: 'primary' as const }
};

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  standalone: true,
  imports: [ModalComponent]
})
export class ConfirmationModalComponent {
  private confirmationService = inject(ConfirmationService);

  // State from service
  readonly isOpen = this.confirmationService.isOpen;
  readonly config = this.confirmationService.config;

  // Computed values with defaults
  readonly variant = computed(() => this.config()?.variant ?? 'info');
  
  readonly icon = computed(() => {
    const cfg = this.config();
    return cfg?.icon ?? VARIANT_DEFAULTS[this.variant()].icon;
  });

  readonly confirmText = computed(() => {
    const cfg = this.config();
    return cfg?.confirmText ?? VARIANT_DEFAULTS[this.variant()].confirmText;
  });

  readonly cancelText = computed(() => {
    return this.config()?.cancelText ?? 'Cancel';
  });

  readonly confirmButtonVariant = computed(() => {
    const cfg = this.config();
    return cfg?.confirmButtonVariant ?? VARIANT_DEFAULTS[this.variant()].confirmButtonVariant;
  });

  // Actions
  onConfirm(): void {
    this.confirmationService.onConfirm();
  }

  onCancel(): void {
    this.confirmationService.onCancel();
  }
}
```

### Modal Template

```html
<!-- confirmation-modal.component.html -->

<app-modal 
  [open]="isOpen()" 
  [title]="config()?.title ?? 'Confirm'"
  (onClose)="onCancel()"
  size="sm"
>
  <div class="confirmation-content">
    
    <!-- Icon + Message -->
    <div class="flex gap-3">
      <span class="text-2xl flex-shrink-0">{{ icon() }}</span>
      <div class="space-y-2">
        <p class="text-gray-900">{{ config()?.message }}</p>
        @if (config()?.description) {
          <p class="text-sm text-gray-500">{{ config()?.description }}</p>
        }
      </div>
    </div>

  </div>

  <!-- Footer -->
  <ng-container slot="footer">
    <button 
      class="btn btn-secondary" 
      (click)="onCancel()">
      {{ cancelText() }}
    </button>
    <button 
      class="btn"
      [class.btn-primary]="confirmButtonVariant() === 'primary'"
      [class.btn-danger]="confirmButtonVariant() === 'danger'"
      (click)="onConfirm()">
      {{ confirmText() }}
    </button>
  </ng-container>
</app-modal>
```

### Styles

```css
/* confirmation-modal.component.css */

.confirmation-content {
  padding: 0.5rem 0;
}
```

---

## App Integration

Add the confirmation modal to the app root so it's always available:

```html
<!-- app.component.html -->

<router-outlet />

<!-- Global modals -->
<app-confirmation-modal />
<app-toast-container />
```

---

## Usage Examples

### Basic Confirmation

```typescript
const confirmed = await this.confirmationService.confirm({
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?'
});

if (confirmed) {
  // User clicked confirm
}
```

### Delete Confirmation

```typescript
const confirmed = await this.confirmationService.confirmDelete('Unit');

if (confirmed) {
  await this.unitService.delete(unitId);
}
```

### Warning with Description

```typescript
const confirmed = await this.confirmationService.confirm({
  title: 'Suspend Member',
  message: 'Are you sure you want to suspend this member?',
  description: 'The member will not be able to access their account until reactivated.',
  variant: 'warning',
  confirmText: 'Suspend'
});
```

### Custom Danger Action

```typescript
const confirmed = await this.confirmationService.confirm({
  title: 'Reject Claim',
  message: 'Are you sure you want to reject this death claim?',
  description: 'The claimant will be notified of the rejection.',
  variant: 'danger',
  confirmText: 'Reject Claim',
  icon: '❌'
});
```

### Admin Assignment (from this document)

```typescript
const confirmed = await this.confirmationService.confirm({
  title: 'Confirm Assignment',
  message: `Are you sure you want to assign ${newAdmin.name} as the admin of ${entity.name}?`,
  description: currentAdmin 
    ? `${currentAdmin.name} will be removed as admin of this ${entityType}.`
    : undefined,
  variant: 'info',
  confirmText: 'Confirm'
});
```

---

## Summary

### Admin Assignment Modal

- **Trigger**: Row action on entity listing pages
- **Flow**: Select user → Confirmation → API call → Success/Error
- **Error Handling**: Cash custody validation shown inline

### Shared Confirmation Modal

- **Service-based**: `ConfirmationService.confirm()` returns a Promise
- **Variants**: info, warning, danger, success
- **Customizable**: title, message, description, icon, button text
- **Convenience methods**: `confirmDelete()`, `confirmWarning()`
- **Global**: Added once in app.component, available everywhere