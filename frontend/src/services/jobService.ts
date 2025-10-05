import { get, post, put, del } from '../api/client';
import type { ApiResponse, Job, CreateJobData, ListJobsQuery } from '../api/types';

class JobService {
    static async getMyJobs(query?: ListJobsQuery): Promise<ApiResponse<{ data: Job[]; page: number; limit: number; total: number; totalPages: number }>> {
        const response = await get<{ data: Job[]; page: number; limit: number; total: number; totalPages: number }>('/jobs/job', { params: query });
        return response.data;
    }

    static async getJobById(id: string): Promise<ApiResponse<Job>> {
        const response = await get<Job>(`/jobs/job/${id}`);
        return response.data;
    }

    static async createJob(jobData: CreateJobData): Promise<ApiResponse<Job>> {
        const response = await post<Job>('/jobs/job', jobData);
        return response.data;
    }

    static async updateJob(id: string, jobData: Partial<CreateJobData>): Promise<ApiResponse<Job>> {
        const response = await put<Job>(`/jobs/job/${id}`, jobData);
        return response.data;
    }

    static async deleteJob(id: string): Promise<ApiResponse<null>> {
        const response = await del<null>(`/jobs/job/${id}`);
        return response.data;
    }
}

export default JobService;
