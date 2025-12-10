import { Component, Input, Output, EventEmitter, OnInit, signal, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { PaginationComponent } from '../pagination/pagination.component';
import { DataTableColumn, DataTableAction, DataTableConfig } from '../../models/datatable.model';
import { SearchRequest, SearchResponse, Filter } from '../../models/search.model';

@Component({
  selector: 'app-datatable',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DatatableComponent<T = any> implements OnInit {
  @Input() config!: DataTableConfig<T>;
  @Input() data: SearchResponse<T> | null = null;
  @Input() loading = false;
  
  @Output() searchChange = new EventEmitter<SearchRequest>();
  @Output() rowAction = new EventEmitter<{ action: string; row: T }>();

  searchTerm = signal('');
  currentSort = signal<{ field: string; order: 'asc' | 'desc' } | null>(null);
  currentPage = signal(1);
  filters = signal<Filter[]>([]);
  showFilters = signal(false);
  filterValues = signal<Record<string, any>>({});

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
      this.emitSearch();
    });

    // Initial load
    this.emitSearch();
  }

  get visibleColumns(): DataTableColumn<T>[] {
    return this.config.columns.filter(col => !col.hidden);
  }

  get showActionsColumn(): boolean {
    return this.config.showActions !== false && (this.config.actions?.length ?? 0) > 0;
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onSort(column: DataTableColumn<T>): void {
    if (!column.sortable) return;

    const current = this.currentSort();
    if (current?.field === column.key) {
      if (current.order === 'asc') {
        this.currentSort.set({ field: column.key, order: 'desc' });
      } else {
        this.currentSort.set(null);
      }
    } else {
      this.currentSort.set({ field: column.key, order: 'asc' });
    }

    this.emitSearch();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.emitSearch();
  }

  onFilterChange(key: string, value: any): void {
    this.filterValues.update(current => ({
      ...current,
      [key]: value
    }));
  }

  getFilterValueCount(key: string): number {
    const value = this.filterValues()[key];
    if (value === null || value === undefined || value === '') return 0;
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object' && value.start && value.end) return 1;
    return 1;
  }

  onApplyFilters(): void {
    const filterValues = this.filterValues();
    const activeFilters: Filter[] = [];

    Object.entries(filterValues).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        const filter = this.config.filters?.find(f => f.key === key);
        if (!filter) return;

        if (filter.type === 'multiselect' && Array.isArray(value)) {
          // Convert string booleans to actual booleans if needed
          const convertedValue = value.map(v => {
            if (v === 'true') return true;
            if (v === 'false') return false;
            return v;
          });
          
          activeFilters.push({
            field: key,
            operator: 'in',
            value: convertedValue
          });
        } else if (filter.type === 'daterange' && value.start && value.end) {
          // Convert dates to ISO-8601 DateTime
          const startDate = new Date(value.start);
          const endDate = new Date(value.end);
          endDate.setHours(23, 59, 59, 999); // Set to end of day
          
          activeFilters.push({
            field: key,
            operator: 'between',
            value: [startDate.toISOString(), endDate.toISOString()]
          });
        } else if (filter.type === 'date') {
          // Convert date to ISO-8601 DateTime
          const date = new Date(value);
          activeFilters.push({
            field: key,
            operator: 'equals',
            value: date.toISOString()
          });
        } else {
          // Convert string boolean to actual boolean for select filters
          let convertedValue = value;
          if (value === 'true') convertedValue = true;
          if (value === 'false') convertedValue = false;
          
          activeFilters.push({
            field: key,
            operator: 'equals',
            value: convertedValue
          });
        }
      }
    });

    this.filters.set(activeFilters);
    this.currentPage.set(1);
    this.emitSearch();
  }

  onClearFilters(): void {
    this.filterValues.set({});
    this.filters.set([]);
    this.currentPage.set(1);
    this.emitSearch();
  }

  getActiveFilterCount(): number {
    return this.filters().length;
  }

  onMultiselectChange(key: string, value: any, checked: boolean): void {
    this.filterValues.update(current => {
      const currentValues = current[key] || [];
      return {
        ...current,
        [key]: checked 
          ? [...currentValues, value]
          : currentValues.filter((v: any) => v !== value)
      };
    });
  }

  onDateRangeChange(key: string, field: 'start' | 'end', value: string): void {
    this.filterValues.update(current => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        [field]: value
      }
    }));
  }

  onRefresh(): void {
    this.emitSearch();
  }

  private emitSearch(): void {
    const sort = this.currentSort();
    const request: SearchRequest = {
      page: this.currentPage(),
      pageSize: this.config.pageSize ?? 10,
      searchTerm: this.searchTerm() || undefined,
      searchFields: this.config.searchFields,
      eagerLoad: this.config.eagerLoad,
      sortBy: sort?.field,
      sortOrder: sort?.order,
      filters: this.filters().length > 0 ? this.filters() : undefined
    };

    this.searchChange.emit(request);
  }

  getCellValue(row: T, column: DataTableColumn<T>): any {
    const value = (row as any)[column.key];
    
    if (column.format) {
      return column.format(value, row);
    }
    
    if (column.valueMapping && value !== null && value !== undefined) {
      return column.valueMapping[value] ?? value;
    }
    
    return value ?? '-';
  }

  getCellClass(column: DataTableColumn<T>, value: any): string {
    if (column.type === 'badge') {
      const baseClasses = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium';
      // You can customize badge colors based on value
      return `${baseClasses} bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/20 dark:bg-primary-400/10 dark:text-primary-400 dark:ring-primary-400/30`;
    }
    return '';
  }

  formatDate(value: any): string {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  }

  onActionClick(action: DataTableAction<T>, row: T): void {
    if (action.callback) {
      action.callback(row);
    }
    this.rowAction.emit({ action: action.label, row });
  }

  isActionVisible(action: DataTableAction<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  getSortIcon(column: DataTableColumn<T>): string {
    const sort = this.currentSort();
    if (sort?.field !== column.key) return 'sort';
    return sort.order === 'asc' ? 'sort-asc' : 'sort-desc';
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByKey(index: number, column: DataTableColumn<T>): string {
    return column.key;
  }
}
