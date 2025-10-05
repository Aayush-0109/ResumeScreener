import { get, post, del } from '../api/client';
import type { ApiResponse, MatchQueueResponse, MatchQueueStatus, MatchResult, MatchesResponse, MatchOptions, ListMatchesQuery } from '../api/types';

class MatchingService {
    static async enqueueMatch(jobId: string, options?: MatchOptions): Promise<ApiResponse<MatchQueueResponse>> {
        const response = await post<MatchQueueResponse>(`/matches/match/${jobId}/async`, options, {
            params: { topN: options?.topN }
        });
        return response.data;
    }

    static async getMatchStatus(queueId: string): Promise<ApiResponse<MatchQueueStatus>> {
        const response = await get<MatchQueueStatus>(`/matches/match/status/${queueId}`);
        return response.data;
    }

    static async cancelMatch(queueId: string): Promise<ApiResponse<{ queueId: string }>> {
        const response = await del<{ queueId: string }>(`/matches/match/${queueId}`);
        return response.data;
    }

    static async listMatches(jobId: string, query?: ListMatchesQuery): Promise<ApiResponse<MatchesResponse>> {
        const response = await get<MatchesResponse>(`/matches/match/${jobId}/matches`, { params: query });
        return response.data;
    }

    static async clearMatches(jobId: string): Promise<ApiResponse<{ deleted: number }>> {
        const response = await del<{ deleted: number }>(`/matches/match/${jobId}/matches`);
        return response.data;
    }

    static async exportMatches(jobId: string, format: 'csv' | 'json', query?: ListMatchesQuery): Promise<Blob> {
        const response = await get(`/matches/match/${jobId}/exports`, {
            params: { format, ...query },
            responseType: 'blob'
        });
        return response.data;
    }
}

export default MatchingService;
