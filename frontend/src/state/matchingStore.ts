import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import MatchingService, { type MatchSortField, type MatchSortOrder } from '../services/matchingService';
import type { MatchResult, MatchOptions, ListMatchesQuery, PaginationMeta, MatchQueueStatus } from '../api/types';

/**
 * Match filter state (client-side)
 */
export interface MatchFilters {
    scoreThresholds?: {
        overall?: number;
        skills?: number;
        experience?: number;
        education?: number;
        technical?: number;
    };
    requiredSkills?: string[];
    maxExperienceGap?: number;
    minEducationQuality?: 'Perfect' | 'Good' | 'Fair';
}

/**
 * Match sort state (backend)
 */
export interface MatchSortState {
    field: MatchSortField;
    order: MatchSortOrder;
}

/**
 * Last used match configuration
 */
export interface MatchConfig {
    topN?: number;
    weights?: {
        skills?: number;
        experience?: number;
        education?: number;
        technical?: number;
    };
    insightsTopK?: number;
}

interface MatchingStore {
    // Data
    matches: MatchResult[];
    filteredMatches: MatchResult[]; // After applying client-side filters
    pagination: PaginationMeta;
    matchQueue: MatchQueueStatus | null;

    // Loading states
    isLoading: boolean;
    isMutating: boolean;
    error: string | null;

    // Filter & Sort state
    filters: MatchFilters;
    sortState: MatchSortState;

    // Active match jobs tracking
    activeMatchJobs: Map<string, MatchQueueStatus>;

    // Last used config (for quick re-run)
    lastConfig: MatchConfig | null;
    currentJobId: string | null; // For the current results being viewed

    // Actions
    enqueueMatch: (jobId: string, options?: MatchOptions) => Promise<string>;
    checkMatchStatus: (queueId: string) => Promise<void>;
    fetchMatches: (jobId: string, query?: ListMatchesQuery) => Promise<void>;
    clearMatches: (jobId: string) => Promise<void>;
    exportMatches: (jobId: string, format: 'csv' | 'json') => Promise<void>;

    // Filter & Sort actions
    setFilters: (filters: Partial<MatchFilters>) => void;
    clearFilters: () => void;
    setSortState: (sortState: MatchSortState) => void;
    applyClientSideFilters: () => void;
    buildQueryAndFetch: (jobId: string) => Promise<void>;

    // Match job tracking
    addMatchJob: (queueId: string, status: MatchQueueStatus) => void;
    updateMatchJob: (queueId: string, status: MatchQueueStatus) => void;
    removeMatchJob: (queueId: string) => void;
    getMatchJob: (queueId: string) => MatchQueueStatus | undefined;

    // Config management
    saveConfig: (config: MatchConfig) => void;
    getLastConfig: () => MatchConfig | null;
    setCurrentJobId: (jobId: string | null) => void;

    // Analytics
    getScoreDistribution: () => { excellent: number; good: number; fair: number; poor: number };
    getAverageScore: () => number;
    getMostCommonMissingSkills: (topN?: number) => Array<{ skill: string; count: number }>;

    clearError: () => void;
}

const defaultFilters: MatchFilters = {};

const defaultSortState: MatchSortState = {
    field: 'overallMatchScore',
    order: 'desc'
};

export const useMatchingStore = create<MatchingStore>()(
    persist(
        devtools(
            (set, get) => ({
                // Initial state
                matches: [],
                filteredMatches: [],
                pagination: {},
                matchQueue: null,
                isLoading: false,
                isMutating: false,
                error: null,
                filters: defaultFilters,
                sortState: defaultSortState,
                activeMatchJobs: new Map(),
                lastConfig: null,
                currentJobId: null,

                enqueueMatch: async (jobId, options) => {
                    set({ isMutating: true, error: null });
                    try {
                        const response = await MatchingService.enqueueMatch(jobId, options);
                        if (response.success && response.data) {
                            set({
                                isMutating: false,
                                currentJobId: jobId
                            });
                            // Save config for re-use
                            if (options) {
                                get().saveConfig(options);
                            }
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
                            get().updateMatchJob(queueId, response.data);
                        }
                    } catch (error: any) {
                        set({
                            error: error?.response?.data?.message || 'Failed to check match status'
                        });
                    }
                },

                fetchMatches: async (jobId, query) => {
                    set({ isLoading: true, error: null, currentJobId: jobId });
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
                            // Apply client-side filters
                            get().applyClientSideFilters();
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
                            filteredMatches: [],
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
                        MatchingService.downloadMatchesFile(blob, jobId, format);
                        set({ isMutating: false });
                    } catch (error: any) {
                        set({
                            error: error?.response?.data?.message || 'Failed to export matches',
                            isMutating: false
                        });
                        throw error;
                    }
                },

                // Filter & Sort actions
                setFilters: (filters) => {
                    set((state) => ({
                        filters: { ...state.filters, ...filters }
                    }));
                    get().applyClientSideFilters();
                },

                clearFilters: () => {
                    set({ filters: defaultFilters });
                    get().applyClientSideFilters();
                },

                setSortState: (sortState) => {
                    set({ sortState });
                },

                applyClientSideFilters: () => {
                    const { matches, filters } = get();
                    let filtered = [...matches];

                    // Apply score threshold filters
                    if (filters.scoreThresholds) {
                        filtered = MatchingService.filterByScoreThresholds(filtered, filters.scoreThresholds);
                    }

                    // Apply required skills filter
                    if (filters.requiredSkills && filters.requiredSkills.length > 0) {
                        filtered = MatchingService.filterByMatchedSkills(filtered, filters.requiredSkills);
                    }

                    // Apply experience gap filter
                    if (filters.maxExperienceGap !== undefined) {
                        filtered = MatchingService.filterByExperienceGap(filtered, filters.maxExperienceGap);
                    }

                    // Apply education quality filter
                    if (filters.minEducationQuality) {
                        filtered = MatchingService.filterByEducationMatch(filtered, filters.minEducationQuality);
                    }

                    set({ filteredMatches: filtered });
                },

                buildQueryAndFetch: async (jobId) => {
                    const { sortState } = get();
                    const query = MatchingService.buildQueryWithSort(
                        sortState.field,
                        sortState.order,
                        1, // Reset to page 1 when changing sort
                        10
                    );
                    await get().fetchMatches(jobId, query);
                },

                // Match job tracking
                addMatchJob: (queueId, status) => {
                    set((state) => {
                        const newJobs = new Map(state.activeMatchJobs);
                        newJobs.set(queueId, status);
                        return { activeMatchJobs: newJobs };
                    });
                },

                updateMatchJob: (queueId, status) => {
                    set((state) => {
                        const newJobs = new Map(state.activeMatchJobs);
                        newJobs.set(queueId, status);
                        return { activeMatchJobs: newJobs };
                    });
                },

                removeMatchJob: (queueId) => {
                    set((state) => {
                        const newJobs = new Map(state.activeMatchJobs);
                        newJobs.delete(queueId);
                        return { activeMatchJobs: newJobs };
                    });
                },

                getMatchJob: (queueId) => {
                    return get().activeMatchJobs.get(queueId);
                },

                // Config management
                saveConfig: (config) => {
                    set({ lastConfig: config });
                },

                getLastConfig: () => {
                    return get().lastConfig;
                },

                setCurrentJobId: (jobId) => {
                    set({ currentJobId: jobId });
                },

                // Analytics
                getScoreDistribution: () => {
                    const { filteredMatches } = get();
                    return MatchingService.getScoreDistribution(filteredMatches);
                },

                getAverageScore: () => {
                    const { filteredMatches } = get();
                    return MatchingService.calculateAverageScore(filteredMatches);
                },

                getMostCommonMissingSkills: (topN = 10) => {
                    const { filteredMatches } = get();
                    return MatchingService.getMostCommonMissingSkills(filteredMatches, topN);
                },

                clearError: () => set({ error: null })
            }),
            { name: 'MatchingStore' }
        ),
        {
            name: 'matching-storage',
            partialize: (state) => ({
                filters: state.filters,
                sortState: state.sortState,
                lastConfig: state.lastConfig
            })
        }
    )
);
