import { Component, Input, Output, EventEmitter, forwardRef, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';

import { SearchSelectComponent, SearchSelectOption } from '../search-select/search-select.component';
import { ForumService } from '../../../core/services/forum.service';
import { Forum } from '../../models/forum.model';
import { Filter } from '../../models/search.model';

@Component({
  selector: 'app-forum-search-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchSelectComponent],
  template: `
    <app-search-select
      [label]="label"
      [placeholder]="placeholder"
      [mode]="mode"
      [options]="forumOptions()"
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
      useExisting: forwardRef(() => ForumSearchSelectComponent),
      multi: true
    }
  ]
})
export class ForumSearchSelectComponent implements ControlValueAccessor, OnInit {
  @Input() label = 'Select Forum';
  @Input() placeholder = 'Search forums...';
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
  forums = signal<Forum[]>([]);
  internalControl = new FormControl<string | string[] | null>(null);
  
  forumOptions = computed<SearchSelectOption<string>[]>(() => {
    return this.forums().map(forum => ({
      value: forum.forumId,
      label: `${forum.forumName} (${forum.forumCode})`,
    }));
  });

  private onChange: (value: string | string[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private forumService: ForumService) {
    // Subscribe to internal control changes
    this.internalControl.valueChanges.subscribe(value => {
      this.onChange(value);
      this.onTouched();
      this.selectionChange.emit(value);
    });
  }

  ngOnInit(): void {
    // Load initial forums
    this.loadForums('');
  }

  onSearch(term: string): void {
    this.loadForums(term);
  }

  private loadForums(searchTerm: string): void {
    this.loading.set(true);
    
    this.forumService.searchForumsForSelect(searchTerm, this.additionalFilters).subscribe({
      next: (forums) => {
        this.forums.set(forums);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load forums:', error);
        this.loading.set(false);
      }
    });
  }

  writeValue(value: string | string[] | null): void {
    this.internalControl.setValue(value, { emitEvent: false });
    
    // If we have an initial value, fetch the forum(s) to populate options
    console.log('ForumSearchSelectComponent writeValue called with:', value);
    if (value) {
      this.loadInitialValue(value);
    }
  }

  private loadInitialValue(value: string | string[]): void {
    const forumIds = Array.isArray(value) ? value : [value];
    console.log('Loading initial forums for IDs:', forumIds);
    // Fetch each forum and add to the forums list if not already present
    forumIds.forEach(forumId => {
      if (forumId) {
        this.forumService.getForum(forumId).subscribe({
          next: (forum) => {
            // Add forum to list if not already present
            const currentForums = this.forums();
            if (!currentForums.find(f => f.forumId === forum.forumId)) {
              this.forums.set([forum, ...currentForums]);
            }
            console.log('Added forum to options:', this.forumOptions());
          },
          error: (error) => {
            console.error('Failed to load forum for initial value:', error);
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
