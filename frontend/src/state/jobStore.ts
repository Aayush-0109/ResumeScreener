import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import JobService, { type JobSortOption } from '../services/jobService';
import type { Job, CreateJobData, ListJobsQuery, PaginationMeta } from '../api/types';


export interface JobQueryState {
    searchQuery: string;
    sortOptions: JobSortOption[];
    page: number;
    limit: number;
}

interface JobStore {
    
    jobs: Job[];
    currentJob: Job | null;
    pagination: PaginationMeta;

    
    isLoading: boolean;
    isMutating: boolean;
    error: string | null;

    
    queryState: JobQueryState;

    
    fetchJobs: (query?: ListJobsQuery) => Promise<void>;
    fetchJobById: (id: string) => Promise<void>;
    createJob: (data: CreateJobData) => Promise<Job>;
    updateJob: (id: string, data: Partial<CreateJobData>) => Promise<void>;
    deleteJob: (id: string) => Promise<void>;

    
    setSearchQuery: (query: string) => void;
    setSortOptions: (options: JobSortOption[]) => void;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    resetQuery: () => void;
    buildQueryAndFetch: () => Promise<void>;

    
    clearCurrentJob: () => void;
    clearError: () => void;
}

const defaultQueryState: JobQueryState = {
    searchQuery: '',
    sortOptions: [{ field: 'createdAt', order: 'desc' }],
    page: 1,
    limit: 10
};

export const useJobStore = create<JobStore>()(
    persist(
        devtools(
            (set, get) => ({
                
                jobs: [],
                currentJob: null,
                pagination: {},
                isLoading: false,
                isMutating: false,
                error: null,
                queryState: defaultQueryState,

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
                        console.log('🔍 Fetching job by ID:', id);
                        const response = await JobService.getJobById(id);
                        console.log('📊 Job fetch response:', response);

                        if (response.success && response.data) {
                            console.log('✅ Job loaded:', response.data.title);
                            set({
                                currentJob: response.data,
                                isLoading: false
                            });
                        } else {
                            console.warn('⚠️ Job fetch succeeded but no data');
                            set({ isLoading: false });
                        }
                    } catch (error: any) {
                        console.error('❌ Failed to fetch job:', error);
                        set({
                            error: error?.response?.data?.message || 'Failed to fetch job',
                            isLoading: false,
                            currentJob: null
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
                            
                            get().buildQueryAndFetch();
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
                            currentJob: state.currentJob?.id === id ? null : state.currentJob,
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

                
                setSearchQuery: (searchQuery) => {
                    set((state) => ({
                        queryState: { ...state.queryState, searchQuery, page: 1 }
                    }));
                },

                setSortOptions: (sortOptions) => {
                    set((state) => ({
                        queryState: { ...state.queryState, sortOptions, page: 1 }
                    }));
                },

                setPage: (page) => {
                    set((state) => ({
                        queryState: { ...state.queryState, page }
                    }));
                },

                setLimit: (limit) => {
                    set((state) => ({
                        queryState: { ...state.queryState, limit, page: 1 }
                    }));
                },

                resetQuery: () => {
                    set({ queryState: defaultQueryState });
                },

                buildQueryAndFetch: async () => {
                    const { queryState } = get();
                    const query = JobService.buildQueryWithSort(
                        queryState.searchQuery || undefined,
                        queryState.sortOptions,
                        queryState.page,
                        queryState.limit
                    );
                    await get().fetchJobs(query);
                },

                
                clearCurrentJob: () => set({ currentJob: null }),
                clearError: () => set({ error: null })
            }),
            { name: 'JobStore' }
        ),
        {
            name: 'job-storage',
            partialize: (state) => ({
                queryState: state.queryState
            })
        }
    )
);
