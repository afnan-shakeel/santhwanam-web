import { TemplateRef } from '@angular/core';

export type ColumnType = 'text' | 'number' | 'date' | 'badge' | 'boolean' | 'custom' | 'link';
export type FilterType = 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number';

export interface ColumnValueMapping {
  [key: string]: string;
}

export interface FilterOption {
  label: string;
  value: any;
}

export interface DataTableFilter {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: any;
}

export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  type?: ColumnType;
  width?: string;
  cellTemplate?: TemplateRef<any>;
  valueMapping?: ColumnValueMapping;
  format?: (value: any, row: T) => string;
  linkUrl?: (row: T) => string;
  hidden?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: FilterOption[];
}

export interface DataTableAction<T = any> {
  label: string;
  icon?: string;
  callback: (row: T) => void;
  visible?: (row: T) => boolean;
  class?: string;
}

export interface DataTableConfig<T = any> {
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  showActions?: boolean;
  pageSize?: number;
  searchFields?: string[];
  eagerLoad?: string[];
  filters?: DataTableFilter[];
}
