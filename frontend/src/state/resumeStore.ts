import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import ResumeService from '../services/resumeService';
import type { Resume, ListResumesQuery, PaginationMeta, ParseQueueStatus } from '../api/types';


export interface ResumeFilters {
    
    skills?: string[];
    experienceMin?: number;
    experienceMax?: number;

    
    parseStatus?: 'ALL' | 'PENDING' | 'DONE' | 'FAILED';
    uploadDate?: 'all' | 'today' | 'last7days' | 'last30days';
}


export type ResumeSortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'exp-high' | 'exp-low' | 'skills-count';


export interface BulkSelection {
    selectedIds: Set<string>;
    isAllSelected: boolean;
}

interface ResumeStore {
    
    resumes: Resume[];
    filteredResumes: Resume[]; 
    pagination: PaginationMeta;
    parseQueue: ParseQueueStatus | null;

    
    isLoading: boolean;
    isMutating: boolean;
    isProcessing: boolean;
    pollId: number | null;
    error: string | null;

    
    filters: ResumeFilters;
    sortBy: ResumeSortOption;

    
    bulkSelection: BulkSelection;

    
    activeParseJobs: Map<string, ParseQueueStatus>;

    
    fetchResumes: (query?: ListResumesQuery) => Promise<void>;
    uploadResumes: (files: File[]) => Promise<void>;
    startProcessingMonitor: (opts?: { intervalMs?: number; timeoutMs?: number }) => void;
    stopProcessingMonitor: () => void;
    deleteResume: (id: string) => Promise<void>;
    bulkDeleteResumes: (ids: string[]) => Promise<void>;
    clearAllResumes: () => Promise<void>;

    
    setFilters: (filters: Partial<ResumeFilters>) => void;
    clearFilters: () => void;
    setSortBy: (sortBy: ResumeSortOption) => void;
    applyClientSideFiltersAndSort: () => void;

    
    toggleSelectResume: (id: string) => void;
    selectAllResumes: () => void;
    clearSelection: () => void;
    getSelectedResumeIds: () => string[];

    
    addParseJob: (queueId: string, status: ParseQueueStatus) => void;
    updateParseJob: (queueId: string, status: ParseQueueStatus) => void;
    removeParseJob: (queueId: string) => void;
    getParseJob: (queueId: string) => ParseQueueStatus | undefined;

    clearError: () => void;
}

const defaultFilters: ResumeFilters = {
    parseStatus: 'ALL',
    uploadDate: 'all'
};

export const useResumeStore = create<ResumeStore>()(
    persist(
        devtools(
            (set, get) => ({
                
                resumes: [],
                filteredResumes: [],
                pagination: {},
                parseQueue: null,
                isLoading: false,
                isMutating: false,
                isProcessing: false,
                pollId: null,
                error: null,
                filters: defaultFilters,
                sortBy: 'newest',
                bulkSelection: {
                    selectedIds: new Set(),
                    isAllSelected: false
                },
                activeParseJobs: new Map(),

                
                fetchResumes: async (query) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await ResumeService.getMyResumes(query);
                        if (response.success && response.data) {
                            set({
                                resumes: response.data.data,
                                pagination: {
                                    page: response.data.page,
                                    limit: response.data.limit,
                                    total: response.data.total,
                                    totalPages: response.data.totalPages
                                },
                                isLoading: false
                            });
                            
                            get().applyClientSideFiltersAndSort();
                        }
                    } catch (error: any) {
                        set({
                            error: error?.response?.data?.message || 'Failed to fetch resumes',
                            isLoading: false
                        });
                    }
                },

                uploadResumes: async (files) => {
                    set({ isMutating: true, error: null });
                    try {
                        const response = await ResumeService.uploadMany(files);
                        if (response.success && response.data) {
                            set({ isMutating: false, isProcessing: true });
                            const { startProcessingMonitor } = get();
                            startProcessingMonitor();
                            return;
                        }
                        throw new Error('Upload failed');
                    } catch (error: any) {
                        set({
                            error: error?.response?.data?.message || 'Failed to upload resumes',
                            isMutating: false
                        });
                        throw error;
                    }
                },

                startProcessingMonitor: ({ intervalMs = 2500, timeoutMs = 120000 } = {}) => {
                    const { pollId } = get();
                    if (pollId) {
                        clearInterval(pollId as any);
                    }
                    const startedAt = Date.now();
                    const id = window.setInterval(async () => {
                        const { fetchResumes, stopProcessingMonitor, resumes } = get();
                        await fetchResumes();
                        const hasPending = Array.isArray(resumes) && resumes.some(r => r.parseStatus === 'PENDING');
                        const timedOut = Date.now() - startedAt > timeoutMs;
                        if (!hasPending || timedOut) {
                            stopProcessingMonitor();
                        }
                    }, intervalMs);
                    set({ pollId: id, isProcessing: true });
                },

                stopProcessingMonitor: () => {
                    const { pollId } = get();
                    if (pollId) clearInterval(pollId as any);
                    set({ pollId: null, isProcessing: false });
                },

                deleteResume: async (id) => {
                    set({ isMutating: true, error: null });
                    try {
                        await ResumeService.deleteResume(id);
                        set((state) => ({
                            resumes: state.resumes.filter(r => r.id !== id),
                            isMutating: false
                        }));
                        get().applyClientSideFiltersAndSort();
                    } catch (error: any) {
                        set({
                            error: error?.response?.data?.message || 'Failed to delete resume',
                            isMutating: false
                        });
                        throw error;
                    }
                },

                bulkDeleteResumes: async (ids) => {
                    set({ isMutating: true, error: null });
                    try {
                        const result = await ResumeService.bulkDeleteResumes(ids);
                        set((state) => ({
                            resumes: state.resumes.filter(r => !ids.includes(r.id)),
                            isMutating: false
                        }));
                        get().clearSelection();
                        get().applyClientSideFiltersAndSort();

                        if (result.failed.length > 0) {
                            throw new Error(`Failed to delete ${result.failed.length} resumes`);
                        }
                    } catch (error: any) {
                        set({
                            error: error?.response?.data?.message || 'Failed to bulk delete resumes',
                            isMutating: false
                        });
                        throw error;
                    }
                },

                clearAllResumes: async () => {
                    set({ isMutating: true, error: null });
                    try {
                        await ResumeService.clearAllResumes();
                        set({
                            resumes: [],
                            filteredResumes: [],
                            isMutating: false
                        });
                        get().clearSelection();
                    } catch (error: any) {
                        set({
                            error: error?.response?.data?.message || 'Failed to clear resumes',
                            isMutating: false
                        });
                        throw error;
                    }
                },

                
                setFilters: (filters) => {
                    set((state) => ({
                        filters: { ...state.filters, ...filters }
                    }));
                    get().applyClientSideFiltersAndSort();
                },

                clearFilters: () => {
                    set({ filters: defaultFilters });
                    get().applyClientSideFiltersAndSort();
                },

                setSortBy: (sortBy) => {
                    set({ sortBy });
                    get().applyClientSideFiltersAndSort();
                },

                applyClientSideFiltersAndSort: () => {
                    const { resumes, filters, sortBy } = get();
                    let filtered = [...resumes];

                    
                    filtered = ResumeService.filterByParseStatus(filtered, filters.parseStatus);

                    
                    if (filters.uploadDate && filters.uploadDate !== 'all') {
                        filtered = ResumeService.filterByUploadDate(filtered, filters.uploadDate);
                    }

                    
                    filtered = ResumeService.sortResumes(filtered, sortBy);

                    set({ filteredResumes: filtered });
                },

                
                toggleSelectResume: (id) => {
                    set((state) => {
                        const newSelection = new Set(state.bulkSelection.selectedIds);
                        if (newSelection.has(id)) {
                            newSelection.delete(id);
                        } else {
                            newSelection.add(id);
                        }
                        return {
                            bulkSelection: {
                                selectedIds: newSelection,
                                isAllSelected: false
                            }
                        };
                    });
                },

                selectAllResumes: () => {
                    const { filteredResumes } = get();
                    set({
                        bulkSelection: {
                            selectedIds: new Set(filteredResumes.map(r => r.id)),
                            isAllSelected: true
                        }
                    });
                },

                clearSelection: () => {
                    set({
                        bulkSelection: {
                            selectedIds: new Set(),
                            isAllSelected: false
                        }
                    });
                },

                getSelectedResumeIds: () => {
                    return Array.from(get().bulkSelection.selectedIds);
                },

                
                addParseJob: (queueId, status) => {
                    set((state) => {
                        const newJobs = new Map(state.activeParseJobs);
                        newJobs.set(queueId, status);
                        return { activeParseJobs: newJobs };
                    });
                },

                updateParseJob: (queueId, status) => {
                    set((state) => {
                        const newJobs = new Map(state.activeParseJobs);
                        newJobs.set(queueId, status);
                        return { activeParseJobs: newJobs };
                    });
                },

                removeParseJob: (queueId) => {
                    set((state) => {
                        const newJobs = new Map(state.activeParseJobs);
                        newJobs.delete(queueId);
                        return { activeParseJobs: newJobs };
                    });
                },

                getParseJob: (queueId) => {
                    return get().activeParseJobs.get(queueId);
                },

                clearError: () => set({ error: null })
            }),
            { name: 'ResumeStore' }
        ),
        {
            name: 'resume-storage',
            partialize: (state) => ({
                filters: state.filters,
                sortBy: state.sortBy
            })
        }
    )
);
