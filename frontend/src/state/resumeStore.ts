import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import ResumeService from '../services/resumeService';
import type { Resume, ListResumesQuery, PaginationMeta, ParseQueueStatus } from '../api/types';

interface ResumeStore {
    resumes: Resume[];
    pagination: PaginationMeta;
    parseQueue: ParseQueueStatus | null;
    isLoading: boolean;
    isMutating: boolean;
    isProcessing: boolean;
    pollId: number | null;
    error: string | null;

    fetchResumes: (query?: ListResumesQuery) => Promise<void>;
    uploadResumes: (files: File[]) => Promise<void>;
    startProcessingMonitor: (opts?: { intervalMs?: number; timeoutMs?: number }) => void;
    stopProcessingMonitor: () => void;
    deleteResume: (id: string) => Promise<void>;
    clearAllResumes: () => Promise<void>;
    clearError: () => void;
}

export const useResumeStore = create<ResumeStore>()(
    devtools(
        (set) => ({
            resumes: [],
            pagination: {},
            parseQueue: null,
            isLoading: false,
            isMutating: false,
            isProcessing: false,
            pollId: null,
            error: null,

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
                        const { startProcessingMonitor } = useResumeStore.getState();
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
                const { pollId } = useResumeStore.getState();
                if (pollId) {
                    clearInterval(pollId as any);
                }
                const startedAt = Date.now();
                const id = window.setInterval(async () => {
                    const { fetchResumes, stopProcessingMonitor } = useResumeStore.getState();
                    await fetchResumes();
                    const { resumes } = useResumeStore.getState();
                    const hasPending = Array.isArray(resumes) && resumes.some(r => (r as any).parseStatus === 'PENDING');
                    const timedOut = Date.now() - startedAt > timeoutMs;
                    if (!hasPending || timedOut) {
                        stopProcessingMonitor();
                    }
                }, intervalMs);
                set({ pollId: id, isProcessing: true });
            },
            stopProcessingMonitor: () => {
                const { pollId } = useResumeStore.getState();
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
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to delete resume',
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
                        isMutating: false
                    });
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to clear resumes',
                        isMutating: false
                    });
                    throw error;
                }
            },

            clearError: () => set({ error: null })
        }),
        { name: 'ResumeStore' }
    )
);
