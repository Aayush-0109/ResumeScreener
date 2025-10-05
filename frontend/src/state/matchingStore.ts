import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import MatchingService from '../services/matchingService';
import type { MatchResult, MatchOptions, ListMatchesQuery, PaginationMeta, MatchQueueStatus } from '../api/types';

interface MatchingStore {
    matches: MatchResult[];
    pagination: PaginationMeta;
    matchQueue: MatchQueueStatus | null;
    isLoading: boolean;
    isMutating: boolean;
    error: string | null;

    enqueueMatch: (jobId: string, options?: MatchOptions) => Promise<string>;
    checkMatchStatus: (queueId: string) => Promise<void>;
    fetchMatches: (jobId: string, query?: ListMatchesQuery) => Promise<void>;
    clearMatches: (jobId: string) => Promise<void>;
    exportMatches: (jobId: string, format: 'csv' | 'json') => Promise<void>;
    clearError: () => void;
}

export const useMatchingStore = create<MatchingStore>()(
    devtools(
        (set) => ({
            matches: [],
            pagination: {},
            matchQueue: null,
            isLoading: false,
            isMutating: false,
            error: null,

            enqueueMatch: async (jobId, options) => {
                set({ isMutating: true, error: null });
                try {
                    const response = await MatchingService.enqueueMatch(jobId, options);
                    if (response.success && response.data) {
                        set({ isMutating: false });
                        return response.data.queueId;
                    }
                    throw new Error('Enqueue failed');
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to enqueue matching',
                        isMutating: false
                    });
                    throw error;
                }
            },

            checkMatchStatus: async (queueId) => {
                try {
                    const response = await MatchingService.getMatchStatus(queueId);
                    if (response.success && response.data) {
                        set({ matchQueue: response.data });
                    }
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to check match status'
                    });
                }
            },

            fetchMatches: async (jobId, query) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await MatchingService.listMatches(jobId, query);
                    if (response.success && response.data) {
                        set({
                            matches: response.data.data,
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
                        error: error?.response?.data?.message || 'Failed to fetch matches',
                        isLoading: false
                    });
                }
            },

            clearMatches: async (jobId) => {
                set({ isMutating: true, error: null });
                try {
                    await MatchingService.clearMatches(jobId);
                    set({
                        matches: [],
                        isMutating: false
                    });
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to clear matches',
                        isMutating: false
                    });
                    throw error;
                }
            },

            exportMatches: async (jobId, format) => {
                set({ isMutating: true, error: null });
                try {
                    const blob = await MatchingService.exportMatches(jobId, format);
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `matches-${jobId}-${Date.now()}.${format}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    set({ isMutating: false });
                } catch (error: any) {
                    set({
                        error: error?.response?.data?.message || 'Failed to export matches',
                        isMutating: false
                    });
                    throw error;
                }
            },

            clearError: () => set({ error: null })
        }),
        { name: 'MatchingStore' }
    )
);
