import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  forwardRef,
  signal,
  computed,
  ViewChild,
  ElementRef,
  HostListener,
  OnInit,
  OnChanges,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ControlValueAccessor, 
  NG_VALUE_ACCESSOR,
  FormsModule
} from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface SearchSelectOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
}

type SelectMode = 'single' | 'multiple';

@Component({
  selector: 'app-search-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './search-select.component.html',
  styleUrls: ['./search-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchSelectComponent),
      multi: true
    }
  ]
})
export class SearchSelectComponent<T = any> implements ControlValueAccessor, OnInit, OnChanges {
  @Input() label = '';
  @Input() placeholder = 'Search...';
  @Input() mode: SelectMode = 'single';
  @Input() loading = false;
  @Input() debounceTime = 300;
  @Input() required = false;
  @Input() disabled = false;
  @Input() hint = '';
  @Input() error = '';

  @Input() size: 'x-small' | 'small' | 'medium' | 'large' = 'medium';
  sizeMapper = {
    'x-small': '2px',
    'small': '4px',
    'medium': '6px',
    'large': '8px'
  };
  @Input() maxHeight = '300px'; // options list size

  @Output() search = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<T | T[] | null>();

  @ViewChild('dropdownButton', { static: false }) dropdownButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('searchInput', { static: false }) searchInput?: ElementRef<HTMLInputElement>;

  // Internal signals for reactive options
  private optionsSignal = signal<SearchSelectOption<T>[]>([]);
  private initialOptionsSignal = signal<SearchSelectOption<T>[]>([]);

  /**
   * Dynamic options from search results
   */
  @Input() 
  set options(value: SearchSelectOption<T>[]) {
    this.optionsSignal.set(value || []);
  }
  get options(): SearchSelectOption<T>[] {
    return this.optionsSignal();
  }

  /**
   * Initial/pre-selected options for edit/update scenarios.
   * These are used to display labels for values that may not be in the current options list.
   * Pass the previously selected option(s) here when editing existing data.
   */
  @Input() 
  set initialOptions(value: SearchSelectOption<T>[]) {
    this.initialOptionsSignal.set(value || []);
  }
  get initialOptions(): SearchSelectOption<T>[] {
    return this.initialOptionsSignal();
  }

  isOpen = signal(false);
  searchTerm = signal('');
  selectedValues = signal<T[]>([]);
  isLoadingDebounced = signal(false);

  private searchSubject = new Subject<string>();
  private onChange: (value: T | T[] | null) => void = () => {};
  private onTouched: () => void = () => {};
  private loadingTimeout?: any;

  /**
   * Merged options combining initialOptions and dynamic options.
   * Initial options take precedence for labels of already-selected values.
   */
  allOptions = computed(() => {
    const optionsMap = new Map<T, SearchSelectOption<T>>();
    
    // Add initial options first (for pre-selected values in edit scenarios)
    for (const opt of this.initialOptionsSignal()) {
      optionsMap.set(opt.value, opt);
    }
    
    // Add/override with current options (dynamic search results)
    for (const opt of this.optionsSignal()) {
      optionsMap.set(opt.value, opt);
    }
    
    return Array.from(optionsMap.values());
  });

  filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const opts = this.optionsSignal();
    if (!term) return opts;
    
    return opts.filter(option => 
      option.label.toLowerCase().includes(term)
    );
  });

  displayValue = computed(() => {
    const selected = this.selectedValues();
    if (selected.length === 0) return '';
    
    if (this.mode === 'single') {
      // Look in allOptions (includes initialOptions) to find the label
      const option = this.allOptions().find(opt => opt.value === selected[0]);
      return option?.label || '';
    }
    
    return `${selected.length} selected`;
  });

  selectedLabels = computed(() => {
    const selected = this.selectedValues();
    // Use allOptions to include labels from initialOptions
    return this.allOptions()
      .filter(opt => selected.includes(opt.value))
      .map(opt => opt.label);
  });

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged()
      )
      .subscribe(term => {
        this.search.emit(term);
      });
  }

  ngOnInit(): void {
    // Initial loading state
    this.updateLoadingState();
  }

  ngOnChanges(): void {
    // Update loading state when loading input changes
    this.updateLoadingState();
  }

  private updateLoadingState(): void {
    // Clear any existing timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = undefined;
    }

    if (this.loading) {
      // Debounce showing the loading spinner to prevent flashing
      this.loadingTimeout = setTimeout(() => {
        this.isLoadingDebounced.set(true);
      }, 200);
    } else {
      // Immediately hide loading spinner
      this.isLoadingDebounced.set(false);
    }
  }

  writeValue(value: T | T[] | null): void {
    if (value === null || value === undefined) {
      this.selectedValues.set([]);
    } else if (Array.isArray(value)) {
      this.selectedValues.set(value);
    } else {
      this.selectedValues.set([value]);
    }
  }

  registerOnChange(fn: (value: T | T[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    
    this.isOpen.update(open => !open);
    this.onTouched();
    
    if (this.isOpen()) {
      setTimeout(() => {
        this.searchInput?.nativeElement?.focus();
      }, 100);
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchTerm.set('');
  }

  onSearchInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }

  selectOption(option: SearchSelectOption<T>): void {
    if (option.disabled) return;

    const selected = this.selectedValues();
    
    if (this.mode === 'single') {
      this.selectedValues.set([option.value]);
      this.closeDropdown();
      this.emitChange();
    } else {
      const index = selected.findIndex(v => v === option.value);
      if (index > -1) {
        this.selectedValues.update(vals => vals.filter((_, i) => i !== index));
      } else {
        this.selectedValues.update(vals => [...vals, option.value]);
      }
      this.emitChange();
    }
  }

  removeValue(value: T, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.selectedValues.update(vals => vals.filter(v => v !== value));
    this.emitChange();
  }

  clearAll(event: Event): void {
    event.stopPropagation();
    this.selectedValues.set([]);
    this.emitChange();
  }

  isSelected(value: T): boolean {
    return this.selectedValues().includes(value);
  }

  private emitChange(): void {
    const selected = this.selectedValues();
    
    if (this.mode === 'single') {
      const value = selected.length > 0 ? selected[0] : null;
      this.onChange(value);
      this.selectionChange.emit(value);
    } else {
      this.onChange(selected);
      this.selectionChange.emit(selected);
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = this.dropdownButton?.nativeElement;
    
    if (dropdown && !dropdown.contains(target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDropdown();
  }
}
