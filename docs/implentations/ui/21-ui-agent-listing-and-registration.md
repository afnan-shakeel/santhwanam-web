# Agent Listing and Registration - UI Implementation Guide

## Overview

This document provides implementation details for the Agent Listing and Registration feature. The feature includes:
- Agent listing page with datatable
- Agent registration modal with multi-section form
- Draft/Submit for Approval workflow
- Edit functionality for draft and approved agents

---

## Route Configuration

```typescript
// app.routes.ts
{
  path: 'agents',
  component: AgentsComponent,
  canActivate: [authGuard],
}
```

**URL**: `/agents`

---

## Feature Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AgentsComponent` | `features/agents/agents.component.ts` | Agent listing page |
| `AgentFormComponent` | `features/agents/agent-form/agent-form.component.ts` | Registration/Edit modal |

---

## 1. Agent Listing Page

### Shared Components Used

| Component | Purpose |
|-----------|---------|
| `BreadcrumbComponent` | Navigation breadcrumbs |
| `ListingPageHeaderComponent` | Page title with action button |
| `DatatableComponent` | Data table with filters, sorting, pagination |
| `AgentFormComponent` | Modal for adding/editing agents |

### Template Structure

```html
<!-- Breadcrumbs -->
<app-breadcrumb [items]="breadcrumbItems" />

<!-- Page Header with Add Button -->
<app-listing-page-header
  title="Agents"
  buttonLabel="Add Agent"
  (buttonClick)="onAddAgent()" />

<!-- Data Table -->
<app-datatable
  [config]="tableConfig"
  [data]="agents()"
  [loading]="loading()"
  [totalItems]="totalItems()"
  [currentPage]="currentPage()"
  (pageChange)="onPageChange($event)"
  (action)="onAction($event)"
  (filterChange)="onFilterChange($event)" />

<!-- Agent Form Modal -->
<app-agent-form
  [agentId]="selectedAgentId()"
  [(open)]="showAgentForm"
  (saved)="onAgentSaved($event)"
  (cancelled)="onAgentCancelled()" />
```

### DataTable Configuration

```typescript
tableConfig: DataTableConfig = {
  columns: [
    { 
      key: 'agentCode', 
      label: 'Agent Code', 
      sortable: true, 
      searchable: true 
    },
    { 
      key: 'firstName', 
      label: 'First Name', 
      sortable: true, 
      searchable: true 
    },
    { 
      key: 'lastName', 
      label: 'Last Name', 
      sortable: true, 
      searchable: true 
    },
    { 
      key: 'email', 
      label: 'Email', 
      sortable: true, 
      searchable: true 
    },
    {
      key: 'registrationStatus',
      label: 'Status',
      type: 'badge',
      badgeConfig: {
        draft: 'yellow',
        pending_approval: 'blue',
        approved: 'green',
        rejected: 'red',
      },
    },
    { 
      key: 'createdAt', 
      label: 'Created', 
      type: 'date', 
      sortable: true 
    },
  ],
  actions: [
    { key: 'view', label: 'View', icon: 'eye' },
    { key: 'edit', label: 'Edit', icon: 'pencil' },
  ],
  filters: [
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ],
  showSearch: true,
  showFilters: true,
  itemsPerPage: 10,
};
```

### Action Handlers

```typescript
onAction(event: { action: string; row: Agent }): void {
  switch (event.action) {
    case 'view':
      this.router.navigate(['/agents', event.row.agentId]);
      break;
    case 'edit':
      this.selectedAgentId.set(event.row.agentId);
      this.showAgentForm = true;
      break;
  }
}

onAddAgent(): void {
  this.selectedAgentId.set(null);
  this.showAgentForm = true;
}
```

---

## 2. Agent Registration Modal

### Form Sections

The registration form is divided into 5 sections:

#### Section 1: Organization Details
| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Forum | `SearchSelectComponent` | Yes | Dropdown from `/forums` API |
| Area | `SearchSelectComponent` | Yes | Filtered by selected Forum |
| Unit | `SearchSelectComponent` | Yes | Filtered by selected Area |

#### Section 2: Agent Identification
| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Agent Code | `InputComponent` | Yes | Unique identifier |
| Joined Date | `InputComponent` (date) | Yes | Date picker |

#### Section 3: Personal Information
| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| First Name | `InputComponent` | Yes | |
| Middle Name | `InputComponent` | No | |
| Last Name | `InputComponent` | Yes | |
| Date of Birth | `InputComponent` (date) | Yes | |
| Gender | `SelectComponent` | Yes | Male, Female, Other |

#### Section 4: Contact Information
| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Contact Number | `InputComponent` | Yes | |
| Alternate Contact | `InputComponent` | No | |
| Email | `InputComponent` | Yes | Email validation |

#### Section 5: Address Information
| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Address Line 1 | `InputComponent` | Yes | |
| Address Line 2 | `InputComponent` | No | |
| City | `InputComponent` | Yes | |
| State | `InputComponent` | Yes | |
| Postal Code | `InputComponent` | Yes | |
| Country | `InputComponent` | Yes | |

### Template Structure

```html
<app-modal
  [open]="open()"
  (openChange)="openChange.emit($event)"
  [title]="modalTitle()"
  size="xl">
  
  <form [formGroup]="agentForm" class="space-y-6">
    
    <!-- Section 1: Organization Details -->
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-gray-700 border-b pb-2">
        Organization Details
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <app-search-select
          label="Forum"
          [options]="forumOptions()"
          formControlName="forumId"
          [disabled]="shouldDisableImmutableFields()"
          [required]="true" />
        <!-- Area and Unit similar structure -->
      </div>
    </div>

    <!-- Additional sections follow same pattern -->

    <!-- Form Actions -->
    <div class="flex justify-between pt-4 border-t">
      <!-- Save as Draft (left side) -->
      @if (showSaveAsDraft()) {
        <button type="button" (click)="onSaveAsDraft()"
          class="btn btn-outline">
          Save as Draft
        </button>
      } @else {
        <div></div>
      }
      
      <!-- Cancel & Submit (right side) -->
      <div class="flex gap-3">
        <button type="button" (click)="onCancel()"
          class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" (click)="onSubmit()"
          class="btn btn-primary"
          [disabled]="!isFormValid()">
          {{ submitButtonLabel() }}
        </button>
      </div>
    </div>
  </form>
</app-modal>
```

## 3. Workflow States

### Registration Status Flow

```
┌─────────┐    Save as Draft    ┌─────────┐
│   New   │ ─────────────────> │  Draft  │
└─────────┘                     └────┬────┘
                                     │
                               Submit for Approval
                                     │
                                     ▼
                               ┌───────────────────┐
                               │ Pending Approval  │
                               └────────┬──────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          ▼                           ▼
                    ┌──────────┐               ┌──────────┐
                    │ Approved │               │ Rejected │
                    └──────────┘               └──────────┘
```

### Status-Based Behavior

| Status | Save as Draft | Submit | Editable Fields |
|--------|--------------|--------|-----------------|
| New (no agentId) | ✅ | ✅ | All fields |
| Draft | ✅ | ✅ | All fields |
| Pending Approval | ❌ | ❌ | None (read-only) |
| Approved | ❌ | ✅ (Update) | Limited fields only |
| Rejected | ❌ | ✅ (Resubmit) | All fields |

---

## 4. Key Signals & Computed Values

```typescript
// Component Inputs
agentId = input<string | null>(null);
open = model<boolean>(false);

// Internal State
currentAgentId = signal<string | null>(null);
isEditMode = signal<boolean>(false);
isDraftMode = signal<boolean>(false);
saving = signal<boolean>(false);
submitting = signal<boolean>(false);

// Dropdown Data
forums = signal<Forum[]>([]);
areas = signal<Area[]>([]);
units = signal<Unit[]>([]);

// Computed Values
modalTitle = computed(() => {
  if (!this.isEditMode()) return 'Add New Agent';
  if (this.isDraftMode()) return 'Edit Draft Agent';
  return 'Edit Agent';
});

submitButtonLabel = computed(() => {
  if (this.isDraftMode()) return 'Submit for Approval';
  if (this.isEditMode()) return 'Update Agent';
  return 'Submit for Approval';
});

showSaveAsDraft = computed(() => {
  return !this.isEditMode() || this.isDraftMode();
});

shouldDisableImmutableFields = computed(() => {
  return this.isEditMode() && !this.isDraftMode();
});
```

---

## 9. Quick Reference

### File Locations
```
src/app/features/agents/
├── agents.component.ts       # Listing page component
├── agents.component.html     # Listing page template
├── agents.component.css      # Listing page styles
├── agent-form/
│   ├── agent-form.component.ts    # Registration modal
│   ├── agent-form.component.html  # Modal template
│   └── agent-form.component.css   # Modal styles
└── agent-profile/
    └── ...                   # Agent profile page (separate feature)
```

---

## Summary

The Agent Listing and Registration feature follows the standard patterns:
1. **Listing Page**: Uses `DatatableComponent` for displaying agents with search, filters, and actions
3. **Workflow**: Draft → Submit for Approval → Approved/Rejected
5. **Shared Components**: Leverages existing shared components for consistency
