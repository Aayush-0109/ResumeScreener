import { get, post, del } from '../api/client';
import type { ApiResponse, Resume, UploadManyResult, ParseQueueStatus, ListResumesQuery } from '../api/types';

class ResumeService {
    static async getMyResumes(query?: ListResumesQuery): Promise<ApiResponse<{ data: Resume[]; page: number; limit: number; total: number; totalPages: number }>> {
        const response = await get<{ data: Resume[]; page: number; limit: number; total: number; totalPages: number }>('/resumes/resume/my', { params: query });
        return response.data;
    }

    static async uploadMany(files: File[]): Promise<ApiResponse<UploadManyResult>> {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await post<UploadManyResult>('/resumes/resume/upload-many', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    static async getParseStatus(queueId: string): Promise<ApiResponse<ParseQueueStatus> | null> {
        try {
            const response = await get<ParseQueueStatus>(`/resumes/resume/parse/status/${queueId}`);
            return response.data;
        } catch (e: any) {
            if (e?.response?.status === 404) return null;
            throw e;
        }
    }

    static async deleteResume(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
        const response = await del<{ deleted: boolean }>(`/resumes/resume/${id}`);
        return response.data;
    }

    static async clearAllResumes(): Promise<ApiResponse<{ deletedCount: number }>> {
        const response = await del<{ deletedCount: number }>('/resumes/resume/clear-all');
        return response.data;
    }
}

export default ResumeService;
