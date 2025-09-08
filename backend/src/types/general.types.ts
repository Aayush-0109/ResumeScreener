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