import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import MatchingService, { type MatchSortField, type MatchSortOrder } from '../services/matchingService';
import type { MatchResult, MatchOptions, ListMatchesQuery, PaginationMeta, MatchQueueStatus } from '../api/types';


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


export interface MatchSortState {
    field: MatchSortField;
    order: MatchSortOrder;
}


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

    matches: MatchResult[];
    filteredMatches: MatchResult[];
    pagination: PaginationMeta;
    matchQueue: MatchQueueStatus | null;


    isLoading: boolean;
    isMutating: boolean;
    error: string | null;


    filters: MatchFilters;
    sortState: MatchSortState;


    activeMatchJobs: Map<string, MatchQueueStatus>;


    lastConfig: MatchConfig | null;
    currentJobId: string | null;


    enqueueMatch: (jobId: string, options?: MatchOptions) => Promise<string>;
    checkMatchStatus: (queueId: string) => Promise<void>;
    fetchMatches: (jobId: string, query?: ListMatchesQuery) => Promise<void>;
    clearMatches: (jobId: string) => Promise<void>;
    exportMatches: (jobId: string, format: 'csv' | 'json') => Promise<void>;


    setFilters: (filters: Partial<MatchFilters>) => void;
    clearFilters: () => void;
    setSortState: (sortState: MatchSortState) => void;
    applyClientSideFilters: () => void;
    buildQueryAndFetch: (jobId: string) => Promise<void>;


    addMatchJob: (queueId: string, status: MatchQueueStatus) => void;
    updateMatchJob: (queueId: string, status: MatchQueueStatus) => void;
    removeMatchJob: (queueId: string) => void;
    getMatchJob: (queueId: string) => MatchQueueStatus | undefined;


    saveConfig: (config: MatchConfig) => void;
    getLastConfig: () => MatchConfig | null;
    setCurrentJobId: (jobId: string | null) => void;


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
                            const matches = Array.isArray(response.data) ? response.data : (response.data.data || []);
                            const meta = (response.data as any).meta || {};

                            set({
                                matches: matches,
                                pagination: {
                                    page: meta.page || 1,
                                    limit: meta.limit || 10,
                                    total: meta.total || matches.length,
                                    totalPages: meta.totalPages || 1
                                },
                                isLoading: false
                            });

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


                    if (filters.scoreThresholds) {
                        filtered = MatchingService.filterByScoreThresholds(filtered, filters.scoreThresholds);
                    }


                    if (filters.requiredSkills && filters.requiredSkills.length > 0) {
                        filtered = MatchingService.filterByMatchedSkills(filtered, filters.requiredSkills);
                    }


                    if (filters.maxExperienceGap !== undefined) {
                        filtered = MatchingService.filterByExperienceGap(filtered, filters.maxExperienceGap);
                    }


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
                        1,
                        10
                    );
                    await get().fetchMatches(jobId, query);
                },


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


                saveConfig: (config) => {
                    set({ lastConfig: config });
                },

                getLastConfig: () => {
                    return get().lastConfig;
                },

                setCurrentJobId: (jobId) => {
                    set({ currentJobId: jobId });
                },


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
