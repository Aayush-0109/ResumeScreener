import { get, post, put, del } from '../api/client';
import type { ApiResponse, Job, CreateJobData, ListJobsQuery } from '../api/types';
import type { AxiosRequestConfig } from 'axios';

export type JobSortField = 'createdAt' | 'updatedAt' | 'title';
export type JobSortOrder = 'asc' | 'desc';

export interface JobSortOption {
    field: JobSortField;
    order: JobSortOrder;
}

class JobService {
    /**
     * Get user's jobs with optional search and sorting
     * Supports backend search: q (searches in title, description, requirements)
     * Supports backend sort: multi-field sorting ("field:order,field:order")
     * Supports pagination: page, limit
     */
    static async getMyJobs(
        query?: ListJobsQuery,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<{ data: Job[]; page: number; limit: number; total: number; totalPages: number }>> {
        try {
            const response = await get<{ data: Job[]; page: number; limit: number; total: number; totalPages: number }>(
                '/jobs/job',
                { params: query, ...config }
            );
            return response.data;
        } catch (error: any) {
            console.error('Failed to fetch jobs:', error);
            throw this.handleError(error, 'Failed to fetch jobs');
        }
    }

    /**
     * Get a single job by ID
     */
    static async getJobById(id: string, config?: AxiosRequestConfig): Promise<ApiResponse<Job>> {
        try {
            const response = await get<Job>(`/jobs/job/${id}`, config);
            return response.data;
        } catch (error: any) {
            console.error(`Failed to fetch job ${id}:`, error);
            throw this.handleError(error, 'Failed to fetch job');
        }
    }

    /**
     * Create a new job
     */
    static async createJob(jobData: CreateJobData): Promise<ApiResponse<Job>> {
        try {
            const response = await post<Job>('/jobs/job', jobData);
            return response.data;
        } catch (error: any) {
            console.error('Failed to create job:', error);
            throw this.handleError(error, 'Failed to create job');
        }
    }

    /**
     * Update an existing job
     */
    static async updateJob(id: string, jobData: Partial<CreateJobData>): Promise<ApiResponse<Job>> {
        try {
            const response = await put<Job>(`/jobs/job/${id}`, jobData);
            return response.data;
        } catch (error: any) {
            console.error(`Failed to update job ${id}:`, error);
            throw this.handleError(error, 'Failed to update job');
        }
    }

    /**
     * Delete a job
     */
    static async deleteJob(id: string): Promise<ApiResponse<null>> {
        try {
            const response = await del<null>(`/jobs/job/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Failed to delete job ${id}:`, error);
            throw this.handleError(error, 'Failed to delete job');
        }
    }

    /**
     * Format sort options to backend format
     * Converts array of {field, order} to "field:order,field:order" string
     * Example: [{field: 'createdAt', order: 'desc'}, {field: 'title', order: 'asc'}]
     *          -> "createdAt:desc,title:asc"
     */
    static formatSortString(sortOptions: JobSortOption[]): string {
        return sortOptions
            .filter(opt => opt.field && opt.order)
            .map(opt => `${opt.field}:${opt.order}`)
            .join(',');
    }

    /**
     * Parse sort string to sort options
     * Converts "field:order,field:order" string to array of {field, order}
     */
    static parseSortString(sortString: string): JobSortOption[] {
        if (!sortString) return [];

        return sortString.split(',').map(part => {
            const [field, order] = part.split(':');
            return {
                field: field as JobSortField,
                order: (order || 'desc') as JobSortOrder
            };
        });
    }

    /**
     * Get default sort string (newest first)
     */
    static getDefaultSort(): string {
        return 'createdAt:desc';
    }

    /**
     * Build query with sort
     */
    static buildQueryWithSort(
        searchQuery?: string,
        sortOptions?: JobSortOption[],
        page: number = 1,
        limit: number = 10
    ): ListJobsQuery {
        const query: ListJobsQuery = {
            page,
            limit
        };

        if (searchQuery) {
            query.q = searchQuery;
        }

        if (sortOptions && sortOptions.length > 0) {
            query.sort = this.formatSortString(sortOptions);
        } else {
            query.sort = this.getDefaultSort();
        }

        return query;
    }

    /**
     * Handle and format errors
     */
    private static handleError(error: any, defaultMessage: string): Error {
        const message = error?.response?.data?.message || error?.message || defaultMessage;
        const newError = new Error(message);
        (newError as any).statusCode = error?.response?.status;
        (newError as any).correlationId = error?.response?.data?.correlationId;
        return newError;
    }
}

export default JobService;
