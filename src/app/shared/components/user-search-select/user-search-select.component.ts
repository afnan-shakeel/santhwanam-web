import { Component, Input, Output, EventEmitter, forwardRef, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';

import { SearchSelectComponent, SearchSelectOption } from '../search-select/search-select.component';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../models/user.model';
import { Filter } from '../../models/search.model';

@Component({
  selector: 'app-user-search-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchSelectComponent],
  template: `
    <app-search-select
      [label]="label"
      [placeholder]="placeholder"
      [mode]="mode"
      [options]="userOptions()"
      [loading]="loading()"
      [debounceTime]="debounceTime"
      [required]="required"
      [disabled]="disabled"
      [hint]="hint"
      [error]="error"
      [maxHeight]="maxHeight"
      [formControl]="internalControl"
      (search)="onSearch($event)"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UserSearchSelectComponent),
      multi: true
    }
  ]
})
export class UserSearchSelectComponent implements ControlValueAccessor, OnInit {
  @Input() label = 'Select User';
  @Input() placeholder = 'Search users...';
  @Input() mode: 'single' | 'multiple' = 'single';
  @Input() debounceTime = 300;
  @Input() required = false;
  @Input() disabled = false;
  @Input() hint = '';
  @Input() error = '';
  @Input() maxHeight = '300px';
  @Input() additionalFilters: Filter[] = [];

  @Output() selectionChange = new EventEmitter<string | string[] | null>();

  loading = signal(false);
  users = signal<User[]>([]);
  internalControl = new FormControl<string | string[] | null>(null);
  
  userOptions = computed<SearchSelectOption<string>[]>(() => {
    return this.users().map(user => ({
      value: user.userId,
      label: `${user.firstName} ${user.lastName}`,
      disabled: !user.isActive
    }));
  });

  private onChange: (value: string | string[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private userService: UserService) {
    // Subscribe to internal control changes
    this.internalControl.valueChanges.subscribe(value => {
      this.onChange(value);
      this.onTouched();
      this.selectionChange.emit(value);
    });
  }

  ngOnInit(): void {
    // Load initial users
    this.loadUsers('');
  }

  onSearch(term: string): void {
    this.loadUsers(term);
  }

  private loadUsers(searchTerm: string): void {
    this.loading.set(true);
    
    this.userService.searchUsersForSelect(searchTerm, this.additionalFilters).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.loading.set(false);
      }
    });
  }

  writeValue(value: string | string[] | null): void {
    this.internalControl.setValue(value, { emitEvent: false });
    
    // If we have an initial value, fetch the user(s) to populate options
    if (value) {
      this.loadInitialValue(value);
    }
  }

  private loadInitialValue(value: string | string[]): void {
    const userIds = Array.isArray(value) ? value : [value];
    
    // Fetch each user and add to the users list if not already present
    userIds.forEach(userId => {
      if (userId) {
        this.userService.getUser(userId).subscribe({
          next: (user) => {
            // Add user to list if not already present
            const currentUsers = this.users();
            if (!currentUsers.find(u => u.userId === user.userId)) {
              this.users.set([user, ...currentUsers]);
            }
          },
          error: (error) => {
            console.error('Failed to load user for initial value:', error);
          }
        });
      }
    });
  }

  registerOnChange(fn: (value: string | string[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.internalControl.disable({ emitEvent: false });
    } else {
      this.internalControl.enable({ emitEvent: false });
    }
  }
}
