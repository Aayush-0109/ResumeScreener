// Backend API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    meta?: PaginationMeta;
}

export interface ApiError {
    success: false;
    statusCode: number;
    message: string;
    errors?: any;
    correlationId?: string;
    timestamp?: string;
}

export interface PaginationMeta {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
}


export interface User {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    id: string;
    email: string;
    name: string;
    role: string;
}


export interface Job {
    id: string;
    title: string;
    description: string;
    requirements: string;
    skills: string[];
    experience?: number | null;
    education?: string | null;
    location?: string | null;
    salary?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateJobData {
    title: string;
    description: string;
    requirements: string;
    skills: string[];
    experience?: number;
    education?: string;
    location?: string;
    salary?: string;
}


export interface Resume {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    parseStatus: 'PENDING' | 'DONE' | 'FAILED';
    parsedAt?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    skills: string[];
    experience?: number | null;
    education?: string | null;
}

export interface UploadManyResult {
    queueId: string;
    resumeCount: number;
    status: string;
}

export interface ParseQueueStatus {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    processedCount: number;
    totalCount: number;
    createdAt: string;
    startedAt?: string | null;
    completedAt?: string | null;
    errorMessage?: string | null;
}


export interface MatchQueueResponse {
    queueId: string;
    status: string;
}

export interface MatchQueueStatus {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    createdAt: string;
    startedAt?: string | null;
    completedAt?: string | null;
    errorMessage?: string | null;
}

export interface MatchResult {
    id: string;
    resumeId: string;
    overallMatchScore?: number | null;
    skillsMatchScore?: number | null;
    experienceMatchScore?: number | null;
    educationMatchScore?: number | null;
    technicalMatchScore?: number | null;
    culturalFitMatchScore?: number | null;
    biasMatchScore?: number | null;
    matchedSkills: string[];
    missingSkills: string[];
    experienceGap?: number | null;
    educationMatch?: string | null;
    aiMatchInsights?: string | null;
    matchedAt: string;
    resume: Resume;
}

export interface MatchOptions {
    topN?: number;
    weights?: {
        skills?: number;
        experience?: number;
        education?: number;
        technical?: number;
    };
    insightsTopK?: number;
}

export interface MatchesResponse {
    data: MatchResult[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}


export interface ListJobsQuery {
    page?: number;
    limit?: number;
    q?: string;
    sort?: string; 
}

export interface ListResumesQuery {
    page?: number;
    limit?: number;
    skills?: string[];
    experienceMin?: number;
    experienceMax?: number;
}

export interface ListMatchesQuery {
    page?: number;
    limit?: number;
    sortField?: 'overallMatchScore' | 'skillsMatchScore' | 'experienceMatchScore' | 'educationMatchScore' | 'technicalMatchScore' | 'culturalFitMatchScore' | 'biasMatchScore' | 'matchedAt';
    sortOrder?: 'asc' | 'desc';
}
