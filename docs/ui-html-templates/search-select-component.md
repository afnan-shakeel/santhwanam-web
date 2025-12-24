# Search Select Component

A feature-rich search select component with single and multi-select capabilities, debounced search, and FormControl integration.

## Features

✅ **Single & Multi-select modes**
✅ **Search-as-you-type with debouncing**
✅ **Loading states with spinner**
✅ **FormControl integration (ControlValueAccessor)**
✅ **Emits selection events**
✅ **No free-text input** - values are selected items only
✅ **Dark mode support**
✅ **Keyboard navigation** (Escape to close)
✅ **Click outside to close**
✅ **Disabled state support**
✅ **Error & hint messages**
✅ **Clear selection button**
✅ **Multiple selection badges**

## Usage Examples

### 1. Single Select with Local Options

```typescript
// Component
options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' }
];

selectedValue: string | null = null;

onSelectionChange(value: string | null) {
  console.log('Selected:', value);
}
```

```html
<!-- Template -->
<app-search-select
  label="Select an option"
  [options]="options"
  [(ngModel)]="selectedValue"
  (selectionChange)="onSelectionChange($event)"
  placeholder="Choose one..."
/>
```

### 2. Multi-select with Remote Search

```typescript
// Component
import { FormControl } from '@angular/forms';

userOptions: SearchSelectOption<number>[] = [];
loading = false;
userControl = new FormControl<number[]>([]);

onSearch(term: string) {
  this.loading = true;
  this.userService.searchUsers(term).subscribe(users => {
    this.userOptions = users.map(u => ({
      value: u.id,
      label: `${u.firstName} ${u.lastName}`
    }));
    this.loading = false;
  });
}

onSelectionChange(values: number[]) {
  console.log('Selected users:', values);
}
```

```html
<!-- Template -->
<app-search-select
  label="Select Users"
  mode="multiple"
  [options]="userOptions"
  [loading]="loading"
  [formControl]="userControl"
  (search)="onSearch($event)"
  (selectionChange)="onSelectionChange($event)"
  placeholder="Search users..."
  hint="Search by name"
/>
```

### 3. Reactive Form Integration

```typescript
// Component
import { FormBuilder, Validators } from '@angular/forms';

form = this.fb.group({
  category: [null, Validators.required],
  tags: [[], Validators.required]
});

categoryOptions = [
  { value: 'tech', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'health', label: 'Health' }
];

tagOptions = [
  { value: 1, label: 'Angular' },
  { value: 2, label: 'TypeScript' },
  { value: 3, label: 'Tailwind' }
];

onSubmit() {
  if (this.form.valid) {
    console.log(this.form.value);
  }
}
```

```html
<!-- Template -->
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <app-search-select
    label="Category"
    formControlName="category"
    [options]="categoryOptions"
    [required]="true"
    placeholder="Select category"
  />

  <app-search-select
    label="Tags"
    mode="multiple"
    formControlName="tags"
    [options]="tagOptions"
    [required]="true"
    placeholder="Select tags"
  />

  <button type="submit" [disabled]="form.invalid">Submit</button>
</form>
```

### 4. With Error Handling

```typescript
// Component
roleControl = new FormControl('', Validators.required);

get roleError(): string {
  if (this.roleControl.touched && this.roleControl.errors?.['required']) {
    return 'Role is required';
  }
  return '';
}
```

```html
<!-- Template -->
<app-search-select
  label="Role"
  [formControl]="roleControl"
  [options]="roleOptions"
  [required]="true"
  [error]="roleError"
  placeholder="Select a role"
/>
```

### 5. Disabled Options

```typescript
// Component
options = [
  { value: '1', label: 'Available Option', disabled: false },
  { value: '2', label: 'Disabled Option', disabled: true },
  { value: '3', label: 'Another Available', disabled: false }
];
```

### 6. Custom Debounce Time

```html
<app-search-select
  [options]="options"
  [debounceTime]="500"
  (search)="onSearch($event)"
  placeholder="Search (500ms debounce)..."
/>
```

### 7. Custom Max Height

```html
<app-search-select
  [options]="longListOptions"
  maxHeight="200px"
  placeholder="Scroll through options..."
/>
```

## API Reference

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | `''` | Label text above the select |
| `placeholder` | `string` | `'Search...'` | Placeholder text |
| `mode` | `'single' \| 'multiple'` | `'single'` | Selection mode |
| `options` | `SearchSelectOption<T>[]` | `[]` | Array of options |
| `loading` | `boolean` | `false` | Show loading spinner |
| `debounceTime` | `number` | `300` | Search debounce time (ms) |
| `required` | `boolean` | `false` | Show required asterisk |
| `disabled` | `boolean` | `false` | Disable the select |
| `hint` | `string` | `''` | Hint text below select |
| `error` | `string` | `''` | Error message (red text) |
| `maxHeight` | `string` | `'300px'` | Max height of dropdown |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `search` | `EventEmitter<string>` | Emits search term (debounced) |
| `selectionChange` | `EventEmitter<T \| T[] \| null>` | Emits selected value(s) |

### SearchSelectOption Interface

```typescript
interface SearchSelectOption<T = any> {
  value: T;          // The actual value
  label: string;     // Display text
  disabled?: boolean; // Optional disabled state
}
```

## FormControl Integration

The component implements `ControlValueAccessor`, so it works seamlessly with:
- `[(ngModel)]` - Two-way binding
- `[formControl]` - Reactive form control
- `formControlName` - Within FormGroup

### Value Types

- **Single mode**: Emits `T | null`
- **Multiple mode**: Emits `T[]`

## Styling

The component uses Tailwind CSS classes and supports dark mode out of the box. All states are properly styled:
- Hover states
- Focus states
- Disabled states
- Error states
- Loading states
- Selected states

## Accessibility

- Proper ARIA attributes
- Keyboard support (Escape to close)
- Focus management
- Screen reader friendly
