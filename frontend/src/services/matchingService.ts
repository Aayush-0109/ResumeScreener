import { get, post, del } from '../api/client';
import type { ApiResponse, MatchQueueResponse, MatchQueueStatus, MatchesResponse, MatchOptions, ListMatchesQuery, MatchResult } from '../api/types';
import type { AxiosRequestConfig } from 'axios';

export type MatchSortField =
    | 'overallMatchScore'
    | 'skillsMatchScore'
    | 'experienceMatchScore'
    | 'educationMatchScore'
    | 'technicalMatchScore'
    | 'culturalFitMatchScore'
    | 'biasMatchScore'
    | 'matchedAt';

export type MatchSortOrder = 'asc' | 'desc';

class MatchingService {
    /**
     * Enqueue a matching job
     * Returns queueId for polling status
     */
    static async enqueueMatch(
        jobId: string,
        options?: MatchOptions
    ): Promise<ApiResponse<MatchQueueResponse>> {
        try {
            const response = await post<MatchQueueResponse>(
                `/matches/match/${jobId}/async`,
                options,
                { params: { topN: options?.topN } }
            );
            return response.data;
        } catch (error: any) {
            console.error(`Failed to enqueue match for job ${jobId}:`, error);
            throw this.handleError(error, 'Failed to start matching');
        }
    }

    /**
     * Get match queue status
     */
    static async getMatchStatus(
        queueId: string,
        signal?: AbortSignal
    ): Promise<ApiResponse<MatchQueueStatus>> {
        try {
            const response = await get<MatchQueueStatus>(
                `/matches/match/status/${queueId}`,
                { signal }
            );
            return response.data;
        } catch (error: any) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
                throw new Error('Status check cancelled');
            }
            console.error(`Failed to fetch match status ${queueId}:`, error);
            throw this.handleError(error, 'Failed to fetch match status');
        }
    }

    /**
     * Cancel a matching job
     */
    static async cancelMatch(queueId: string): Promise<ApiResponse<{ queueId: string }>> {
        try {
            const response = await del<{ queueId: string }>(`/matches/match/${queueId}`);
            return response.data;
        } catch (error: any) {
            console.error(`Failed to cancel match ${queueId}:`, error);
            throw this.handleError(error, 'Failed to cancel match');
        }
    }

    /**
     * List match results for a job
     * Supports backend sorting (sortField + sortOrder)
     * Supports pagination (page, limit)
     */
    static async listMatches(
        jobId: string,
        query?: ListMatchesQuery,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<MatchesResponse>> {
        try {
            const response = await get<MatchesResponse>(
                `/matches/match/${jobId}/matches`,
                { params: query, ...config }
            );
            return response.data;
        } catch (error: any) {
            console.error(`Failed to fetch matches for job ${jobId}:`, error);
            throw this.handleError(error, 'Failed to fetch matches');
        }
    }

    /**
     * Clear all matches for a job
     */
    static async clearMatches(jobId: string): Promise<ApiResponse<{ deleted: number }>> {
        try {
            const response = await del<{ deleted: number }>(`/matches/match/${jobId}/matches`);
            return response.data;
        } catch (error: any) {
            console.error(`Failed to clear matches for job ${jobId}:`, error);
            throw this.handleError(error, 'Failed to clear matches');
        }
    }

    /**
     * Export matches to CSV or JSON
     * Returns a Blob for download
     */
    static async exportMatches(
        jobId: string,
        format: 'csv' | 'json',
        query?: ListMatchesQuery
    ): Promise<Blob> {
        try {
            const response = await get(`/matches/match/${jobId}/exports`, {
                params: { format, ...query },
                responseType: 'blob'
            });
            return response.data as unknown as Blob;
        } catch (error: any) {
            console.error(`Failed to export matches for job ${jobId}:`, error);
            throw this.handleError(error, 'Failed to export matches');
        }
    }

    /**
     * Download exported matches as file
     */
    static downloadMatchesFile(blob: Blob, jobId: string, format: 'csv' | 'json'): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `matches-${jobId}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Build query with sort parameters
     */
    static buildQueryWithSort(
        sortField: MatchSortField = 'overallMatchScore',
        sortOrder: MatchSortOrder = 'desc',
        page: number = 1,
        limit: number = 10
    ): ListMatchesQuery {
        return {
            page,
            limit,
            sortField,
            sortOrder
        };
    }

    /**
     * Filter matches client-side by minimum score thresholds
     */
    static filterByScoreThresholds(
        matches: MatchResult[],
        thresholds?: {
            overall?: number;
            skills?: number;
            experience?: number;
            education?: number;
            technical?: number;
        }
    ): MatchResult[] {
        if (!thresholds) return matches;

        return matches.filter(match => {
            if (thresholds.overall && (match.overallMatchScore || 0) < thresholds.overall) return false;
            if (thresholds.skills && (match.skillsMatchScore || 0) < thresholds.skills) return false;
            if (thresholds.experience && (match.experienceMatchScore || 0) < thresholds.experience) return false;
            if (thresholds.education && (match.educationMatchScore || 0) < thresholds.education) return false;
            if (thresholds.technical && (match.technicalMatchScore || 0) < thresholds.technical) return false;
            return true;
        });
    }

    /**
     * Filter matches client-side by matched skills
     */
    static filterByMatchedSkills(
        matches: MatchResult[],
        requiredSkills: string[]
    ): MatchResult[] {
        if (!requiredSkills.length) return matches;

        return matches.filter(match =>
            requiredSkills.every(skill =>
                match.matchedSkills.some(ms =>
                    ms.toLowerCase() === skill.toLowerCase()
                )
            )
        );
    }

    /**
     * Filter matches client-side by experience gap
     */
    static filterByExperienceGap(
        matches: MatchResult[],
        maxGap?: number
    ): MatchResult[] {
        if (maxGap === undefined) return matches;

        return matches.filter(match => {
            const gap = Math.abs(match.experienceGap || 0);
            return gap <= maxGap;
        });
    }

    /**
     * Filter matches client-side by education match quality
     */
    static filterByEducationMatch(
        matches: MatchResult[],
        minQuality?: 'Perfect' | 'Good' | 'Fair'
    ): MatchResult[] {
        if (!minQuality) return matches;

        const qualityLevels = { 'Perfect': 3, 'Good': 2, 'Fair': 1 };
        const minLevel = qualityLevels[minQuality];

        return matches.filter(match => {
            const matchQuality = match.educationMatch || '';
            const matchLevel = qualityLevels[matchQuality as keyof typeof qualityLevels] || 0;
            return matchLevel >= minLevel;
        });
    }

    /**
     * Get top N matches
     */
    static getTopMatches(matches: MatchResult[], n: number): MatchResult[] {
        return matches.slice(0, n);
    }

    /**
     * Calculate average match score
     */
    static calculateAverageScore(matches: MatchResult[]): number {
        if (!matches.length) return 0;
        const sum = matches.reduce((acc, m) => acc + (m.overallMatchScore || 0), 0);
        return Math.round((sum / matches.length) * 100) / 100;
    }

    /**
     * Get score distribution
     */
    static getScoreDistribution(matches: MatchResult[]): {
        excellent: number; // 90-100
        good: number;      // 75-89
        fair: number;      // 60-74
        poor: number;      // <60
    } {
        return matches.reduce((acc, m) => {
            const score = m.overallMatchScore || 0;
            if (score >= 90) acc.excellent++;
            else if (score >= 75) acc.good++;
            else if (score >= 60) acc.fair++;
            else acc.poor++;
            return acc;
        }, { excellent: 0, good: 0, fair: 0, poor: 0 });
    }

    /**
     * Get most common missing skills across all matches
     */
    static getMostCommonMissingSkills(matches: MatchResult[], topN: number = 10): Array<{ skill: string; count: number }> {
        const skillCounts = new Map<string, number>();

        matches.forEach(match => {
            match.missingSkills.forEach(skill => {
                skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
            });
        });

        return Array.from(skillCounts.entries())
            .map(([skill, count]) => ({ skill, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, topN);
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

export default MatchingService;
