# User Search Select Component

A specialized search select component for searching and selecting users. Built on top of the base `SearchSelectComponent`.

## Features

✅ **Single & Multi-select modes** for users
✅ **Real-time user search** with debouncing
✅ **Auto-loads initial users** on component init
✅ **FormControl integration** (ControlValueAccessor)
✅ **Additional filters support** for fixed filtering
✅ **Displays full name** (firstName + lastName)
✅ **Disabled state** for inactive users
✅ **Loading states** with spinner

## UserService Method

Added `searchUsersForSelect()` method to UserService:

```typescript
/**
 * Search users for select/autocomplete components
 * @param searchTerm - The search term to filter users
 * @param additionalFilters - Optional additional filters to apply
 * @returns Observable of User array
 */
searchUsersForSelect(searchTerm: string, additionalFilters?: Filter[]): Observable<User[]>
```

This method:
- Searches by firstName, lastName, and email
- Returns up to 50 results
- Sorts by firstName ascending
- Accepts additional filters for fixed filtering needs
- Maps SearchResponse to User array

## Usage Examples

### 1. Basic Single Select

```typescript
// Component
import { FormControl } from '@angular/forms';

userControl = new FormControl<string | null>(null);
```

```html
<!-- Template -->
<app-user-search-select
  label="Assign to User"
  [formControl]="userControl"
  placeholder="Search users..."
/>
```

### 2. Multi-select with ngModel

```typescript
// Component
selectedUserIds: string[] = [];

onUserSelectionChange(userIds: string[]) {
  console.log('Selected users:', userIds);
}
```

```html
<!-- Template -->
<app-user-search-select
  label="Select Team Members"
  mode="multiple"
  [(ngModel)]="selectedUserIds"
  (selectionChange)="onUserSelectionChange($event)"
/>
```

### 3. With Additional Filters (Active Users Only)

```typescript
// Component
import { Filter } from '@shared/models/search.model';

activeUserFilter: Filter[] = [
  {
    field: 'isActive',
    value: true,
    operator: 'equals'
  }
];
```

```html
<!-- Template -->
<app-user-search-select
  label="Select Active User"
  [additionalFilters]="activeUserFilter"
  [formControl]="userControl"
/>
```

### 4. With Role Filter

```typescript
// Component
adminRoleFilter: Filter[] = [
  {
    field: 'roleId',
    value: 'admin-role-id',
    operator: 'equals'
  }
];
```

```html
<!-- Template -->
<app-user-search-select
  label="Select Admin"
  [additionalFilters]="adminRoleFilter"
  hint="Only users with admin role"
/>
```

### 5. With Multiple Fixed Filters

```typescript
// Component
complexFilters: Filter[] = [
  {
    field: 'isActive',
    value: true,
    operator: 'equals'
  },
  {
    field: 'departmentId',
    value: 'sales-dept-id',
    operator: 'equals'
  }
];
```

```html
<!-- Template -->
<app-user-search-select
  label="Select Sales Team Member"
  mode="multiple"
  [additionalFilters]="complexFilters"
  [formControl]="salesTeamControl"
  hint="Active sales department users only"
/>
```

### 6. Reactive Form with Validation

```typescript
// Component
form = this.fb.group({
  assignedUser: ['', Validators.required],
  reviewers: [[], Validators.minLength(2)]
});

get assignedUserError(): string {
  const control = this.form.get('assignedUser');
  if (control?.touched && control?.errors?.['required']) {
    return 'User assignment is required';
  }
  return '';
}

get reviewersError(): string {
  const control = this.form.get('reviewers');
  if (control?.touched && control?.errors?.['minLength']) {
    return 'At least 2 reviewers are required';
  }
  return '';
}
```

```html
<!-- Template -->
<form [formGroup]="form">
  <app-user-search-select
    label="Assigned User"
    formControlName="assignedUser"
    [required]="true"
    [error]="assignedUserError"
  />

  <app-user-search-select
    label="Reviewers"
    mode="multiple"
    formControlName="reviewers"
    [required]="true"
    [error]="reviewersError"
  />

  <button type="submit" [disabled]="form.invalid">Submit</button>
</form>
```

## API Reference

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | `'Select User'` | Label text |
| `placeholder` | `string` | `'Search users...'` | Placeholder text |
| `mode` | `'single' \| 'multiple'` | `'single'` | Selection mode |
| `debounceTime` | `number` | `300` | Search debounce (ms) |
| `required` | `boolean` | `false` | Show required asterisk |
| `disabled` | `boolean` | `false` | Disable the select |
| `hint` | `string` | `''` | Hint text |
| `error` | `string` | `''` | Error message |
| `maxHeight` | `string` | `'300px'` | Max dropdown height |
| `additionalFilters` | `Filter[]` | `[]` | Fixed filters to apply |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `selectionChange` | `EventEmitter<string \| string[] \| null>` | Emits selected user ID(s) |

### FormControl Integration

The component implements `ControlValueAccessor` and works with:
- `[(ngModel)]` - Two-way binding
- `[formControl]` - Reactive form control
- `formControlName` - Within FormGroup

### Value Types

- **Single mode**: Emits `string | null` (user ID)
- **Multiple mode**: Emits `string[]` (array of user IDs)

## User Display

- Shows full name: `firstName + lastName`
- Inactive users are disabled but still visible
- Users are sorted by first name

## Search Behavior

- Searches across: firstName, lastName, email
- Debounced search (default 300ms)
- Returns up to 50 results
- Auto-loads initial users on component init
- Additional filters are always applied to search

## Common Use Cases

1. **Task Assignment**: Single select for assigning a task to one user
2. **Team Selection**: Multi-select for building teams
3. **Access Control**: Filter by role for permission assignment
4. **Active Users Only**: Filter out inactive users for current operations
5. **Department-specific**: Combine filters for department + active status
6. **Review Workflows**: Multi-select for selecting reviewers/approvers

## Filter Examples

```typescript
// Active users only
const activeOnly: Filter[] = [
  { field: 'isActive', value: true, operator: 'equals' }
];

// Specific role
const byRole: Filter[] = [
  { field: 'roleId', value: roleId, operator: 'equals' }
];

// Multiple roles
const multipleRoles: Filter[] = [
  { field: 'roleId', value: [role1, role2], operator: 'in' }
];

// Department filter
const byDepartment: Filter[] = [
  { field: 'departmentId', value: deptId, operator: 'equals' }
];

// Combined filters
const activeAdmins: Filter[] = [
  { field: 'isActive', value: true, operator: 'equals' },
  { field: 'roleId', value: 'admin-id', operator: 'equals' }
];
```

## Notes

- The component automatically loads initial users when initialized
- Users are always sorted by first name
- Inactive users are shown but disabled (cannot be selected)
- Search is performed on the backend via the UserService
- The component handles loading states automatically
