export interface paginationMeta {
       page? : number;
          limit? : number;
        total ? : number;
        totalPages? : number;
}
export type SortSpec = { field: string; order?: 'asc' | 'desc' };

export type SearchQuery = {
  q?: string;
  filters?: Record<string, any>;
  sort?: SortSpec[];
  page?: number;
  limit?: number;
};

export interface StandardResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  meta?: paginationMeta;
}

export interface PaginatedResponse<T> extends StandardResponse<T[]> {
  meta: paginationMeta;
}