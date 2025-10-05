import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import JobService from '../services/jobService';
import type { Job, CreateJobData, ListJobsQuery, PaginationMeta } from '../api/types';

interface JobStore {
    jobs: Job[];
    currentJob: Job | null;
    pagination: PaginationMeta;
    isLoading: boolean;
    isMutating: boolean;
    error: string | null;

    fetchJobs: (query?: ListJobsQuery) => Promise<void>;
    fetchJobById: (id: string) => Promise<void>;
    createJob: (data: CreateJobData) => Promise<Job>;
    updateJob: (id: string, data: Partial<CreateJobData>) => Promise<void>;
    deleteJob: (id: string) => Promise<void>;
    clearError: () => void;
}

export const useJobStore = create<JobStore>()(
    devtools(
        (set) => ({
            jobs: [],
            currentJob: null,
            pagination: {},
            isLoading: false,
            isMutating: false,
            error: null,

            fetchJobs: async (query) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await JobService.getMyJobs(query);
                    if (response.success && response.data) {
                        set({
                            jobs: response.data.data,
                            pagination: {
                                page: response.data.page,
                                limit: response.data.limit,
                                total: response.data.total,
                                totalPages: response.data.totalPages
                            },
                            isLoading: false
                        });
                    }
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to fetch jobs',
                        isLoading: false
                    });
                }
            },

            fetchJobById: async (id) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await JobService.getJobById(id);
                    if (response.success && response.data) {
                        set({
                            currentJob: response.data,
                            isLoading: false
                        });
                    }
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to fetch job',
                        isLoading: false
                    });
                }
            },

            createJob: async (data) => {
                set({ isMutating: true, error: null });
                try {
                    const response = await JobService.createJob(data);
                    if (response.success && response.data) {
                        set((state) => ({
                            jobs: [response.data!, ...state.jobs],
                            isMutating: false
                        }));
                        return response.data;
                    }
                    throw new Error('Failed to create job');
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to create job',
                        isMutating: false
                    });
                    throw error;
                }
            },

            updateJob: async (id, data) => {
                set({ isMutating: true, error: null });
                try {
                    const response = await JobService.updateJob(id, data);
                    if (response.success && response.data) {
                        set((state) => ({
                            jobs: state.jobs.map(j => j.id === id ? response.data! : j),
                            currentJob: state.currentJob?.id === id ? response.data : state.currentJob,
                            isMutating: false
                        }));
                    }
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to update job',
                        isMutating: false
                    });
                    throw error;
                }
            },

            deleteJob: async (id) => {
                set({ isMutating: true, error: null });
                try {
                    await JobService.deleteJob(id);
                    set((state) => ({
                        jobs: state.jobs.filter(j => j.id !== id),
                        isMutating: false
                    }));
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to delete job',
                        isMutating: false
                    });
                    throw error;
                }
            },

            clearError: () => set({ error: null })
        }),
        { name: 'JobStore' }
    )
);
