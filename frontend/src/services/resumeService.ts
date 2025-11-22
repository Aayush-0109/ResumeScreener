import { get, post, del } from '../api/client';
import type { ApiResponse, Resume, UploadManyResult, ParseQueueStatus, ListResumesQuery } from '../api/types';
import type { AxiosRequestConfig } from 'axios';

class ResumeService {
    
    static async getMyResumes(
        query?: ListResumesQuery,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<{ data: Resume[]; page: number; limit: number; total: number; totalPages: number }>> {
        try {
            const response = await get<{ data: Resume[]; page: number; limit: number; total: number; totalPages: number }>(
                '/resumes/resume/my',
                { params: query, ...config }
            );
            return response.data;
        } catch (error: any) {
            console.error('Failed to fetch resumes:', error);
            throw this.handleError(error, 'Failed to fetch resumes');
        }
    }

    
    static async uploadMany(
        files: File[],
        onUploadProgress?: (progress: number) => void,
        signal?: AbortSignal
    ): Promise<ApiResponse<UploadManyResult>> {
        if (!files.length) {
            throw new Error('No files provided for upload');
        }

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await post<UploadManyResult>('/resumes/resume/upload-many', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onUploadProgress) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onUploadProgress(progress);
                    }
                },
                signal
            });
            return response.data;
        } catch (error: any) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
                throw new Error('Upload cancelled');
            }
            console.error('Failed to upload resumes:', error);
            throw this.handleError(error, 'Failed to upload resumes');
        }
    }

    
    static async getParseStatus(
        queueId: string,
        signal?: AbortSignal
    ): Promise<ApiResponse<ParseQueueStatus> | null> {
        try {
            const response = await get<ParseQueueStatus>(
                `/resumes/resume/parse/status/${queueId}`,
                { signal }
            );
            return response.data;
        } catch (error: any) {
            if (error?.response?.status === 404) {
                return null;
            }
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
                return null;
            }
            console.error('Failed to fetch parse status:', error);
            throw this.handleError(error, 'Failed to fetch parse status');
        }
    }

    
    static async deleteResume(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
        try {
            const response = await del<{ deleted: boolean }>(`/resumes/resume/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Failed to delete resume ${id}:`, error);
            throw this.handleError(error, 'Failed to delete resume');
        }
    }

    
    static async bulkDeleteResumes(ids: string[]): Promise<{ deleted: number; failed: string[] }> {
        const results = {
            deleted: 0,
            failed: [] as string[]
        };

        for (const id of ids) {
            try {
                await this.deleteResume(id);
                results.deleted++;
            } catch (error) {
                results.failed.push(id);
                console.error(`Failed to delete resume ${id}:`, error);
            }
        }

        return results;
    }

    
    static async clearAllResumes(): Promise<ApiResponse<{ deletedCount: number }>> {
        try {
            const response = await del<{ deletedCount: number }>('/resumes/resume/clear-all');
            return response.data;
        } catch (error: any) {
            console.error('Failed to clear all resumes:', error);
            throw this.handleError(error, 'Failed to clear all resumes');
        }
    }

    
    static filterByParseStatus(
        resumes: Resume[],
        status?: 'PENDING' | 'DONE' | 'FAILED' | 'ALL'
    ): Resume[] {
        if (!status || status === 'ALL') {
            return resumes;
        }
        return resumes.filter(r => r.parseStatus === status);
    }

    
    static filterByUploadDate(
        resumes: Resume[],
        dateFilter?: 'today' | 'last7days' | 'last30days'
    ): Resume[] {
        if (!dateFilter) {
            return resumes;
        }

        const now = new Date();
        const cutoffDate = new Date();

        switch (dateFilter) {
            case 'today':
                cutoffDate.setHours(0, 0, 0, 0);
                break;
            case 'last7days':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case 'last30days':
                cutoffDate.setDate(now.getDate() - 30);
                break;
        }

        return resumes.filter(r => new Date(r.uploadedAt) >= cutoffDate);
    }

    
    static sortResumes(
        resumes: Resume[],
        sortBy: 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'exp-high' | 'exp-low' | 'skills-count'
    ): Resume[] {
        const sorted = [...resumes];

        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
            case 'name-asc':
                return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            case 'name-desc':
                return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            case 'exp-high':
                return sorted.sort((a, b) => (b.experience || 0) - (a.experience || 0));
            case 'exp-low':
                return sorted.sort((a, b) => (a.experience || 0) - (b.experience || 0));
            case 'skills-count':
                return sorted.sort((a, b) => b.skills.length - a.skills.length);
            default:
                return sorted;
        }
    }

    
    private static handleError(error: any, defaultMessage: string): Error {
        const message = error?.response?.data?.message || error?.message || defaultMessage;
        const newError = new Error(message);
        (newError as any).statusCode = error?.response?.status;
        (newError as any).correlationId = error?.response?.data?.correlationId;
        return newError;
    }
}

export default ResumeService;
