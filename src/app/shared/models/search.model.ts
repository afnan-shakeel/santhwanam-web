export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'in'
  | 'notIn'
  | 'gte'
  | 'lte'
  | 'gt'
  | 'lt'
  | 'between'
  | 'isNull'
  | 'isNotNull';

export interface Filter {
  field: string;
  value: string | number | boolean | any[] | { from: any; to: any };
  operator: FilterOperator;
  negate?: boolean;
}

export interface SearchRequest {
  searchTerm?: string;
  searchFields?: string[];
  filters?: Filter[];
  sortBy?: string | string[];
  sortOrder?: 'asc' | 'desc' | Record<string, 'asc' | 'desc'>;
  page?: number;
  pageSize?: number;
  eagerLoad?: string[];
}

export interface SearchResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
