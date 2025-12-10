import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ɵInternalFormsSharedModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { FilterBox } from "../filter-box/filter-box";
import { TablePagination } from "../table-pagination/table-pagination";
import { DataTableColumn } from './types';

interface RowAction {
  label: string;
  actionCallback: (rowData: any) => void;
}

interface TableConfig {
  sortable?: boolean;
  multiSelect?: boolean;
  rowReferenceField: string; // field to use as unique row identifier for multiSelect/selection/etc.
}

@Component({
  selector: 'app-custom-datatable',
  imports: [TablePagination, ɵInternalFormsSharedModule, FormsModule, FilterBox, CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './custom-datatable.html',
  styleUrl: './custom-datatable.css'
})
export class CustomDatatable {

  @Input() records: any[] = [];
  @Input() columns: DataTableColumn[] = [];
  @Input() loading: boolean = false;

  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;
  @Input() totalRecords: number = 0;
  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();

  @Input() searchQuery: string = '';
  @Output() search: EventEmitter<string> = new EventEmitter<string>();

  @Input() filterData: FilterData | null = null;
  @Output() filterChange: EventEmitter<Filters[]> = new EventEmitter<Filters[]>();

  @Input() rowActions: RowAction[] = [];
  @Output() rowActionTriggered: EventEmitter<{ action: RowAction; rowData: any }> = new EventEmitter();

  @Input() tableConfig: TableConfig = { rowReferenceField: '' };

  // Empty state configuration
  @Input() emptyStateTitle: string = 'No data found';
  @Input() emptyStateMessage: string = 'Get started by adding your first record.';
  @Input() showAddButton: boolean = false;
  @Input() addButtonLabel: string = 'Add New Record';
  @Output() addButtonClick: EventEmitter<void> = new EventEmitter<void>();

  onAddButtonClick() {
    this.addButtonClick.emit();
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.pageChange.emit(this.currentPage);
  }

  onSearchChange(newSearchQuery: string) {
    this.searchQuery = newSearchQuery;
    if (newSearchQuery && newSearchQuery.length >= 3) {
      this.search.emit(newSearchQuery);
    }
    // emit empty string if cleared
    if (!newSearchQuery) {
      this.search.emit('');
    }
  }

  onFilterChange(newFilters: Filters[]) {
    this.filterChange.emit(newFilters);

    // close the filter box after applying filters (desktop view)
    const filterBoxElement = document.getElementById('desktop-datatable-filter');
    if (filterBoxElement) {
      filterBoxElement.hidePopover();
    }
  }


  // generate router link for a cell based on template and record data
  getColumnTemplateRouterLink(
    template: string,
    record: Record<string, any>,
    referenceFields: string[] = []
  ): any[] {
    if (!template) return [];

    const params: Record<string, any> = {};

    // Optionally map reference fields from record into params
    referenceFields.forEach(field => {
      if (record?.[field] !== undefined) {
        params[field] = record[field];
      }
    });

    const parts = template.replace(/^\//, '').split('/')
      .map(part => {
        if (part.startsWith(':')) {
          const key = part.substring(1);
          return record?.[key] ?? params[key] ?? '';
        }
        return part;
      });

      return ['/', ...parts];

  }

  getDisplayedValue(column: DataTableColumn, cellValue: any): string {
    if( cellValue === null || cellValue === undefined) {
      return '';
    }
    const rawValue = cellValue.toString();
    if (column.valueMapper && rawValue !== undefined) {
      return column.valueMapper[rawValue] ?? rawValue;
    }
    return rawValue;
  }
}
