export type Job = { id: string; title: string; description: string; skills: string[]; experience?: number | null; education?: string | null };
export type Resume = { id: string; fileName: string; fileSize: number; mimeType: string; uploadedAt: string; name?: string | null; email?: string | null; skills: string[]; experience?: number | null; education?: string | null };
export type Match = { resumeId: string; overallMatchScore: number; skillsMatchScore: number; experienceMatchScore: number; educationMatchScore: number; matchedSkills: string[]; missingSkills: string[] };

export const MockDB = {
    jobs: [
        { id: 'ck_job_1', title: 'Frontend Engineer', description: 'React/TS expert', skills: ['react', 'typescript', 'css'], experience: 2, education: 'Bachelors' },
        { id: 'ck_job_2', title: 'Backend Engineer', description: 'Node/Prisma', skills: ['node', 'prisma', 'postgres'], experience: 3, education: 'Bachelors' }
    ] as Job[],
    resumes: [
        { id: 'ck_res_1', fileName: 'john.pdf', fileSize: 12345, mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), name: 'John', email: 'john@mail.com', skills: ['react', 'css'], experience: 2, education: 'Bachelors' },
        { id: 'ck_res_2', fileName: 'jane.pdf', fileSize: 22222, mimeType: 'application/pdf', uploadedAt: new Date().toISOString(), name: 'Jane', email: 'jane@mail.com', skills: ['node', 'postgres'], experience: 4, education: 'Masters' }
    ] as Resume[]
};

export const JobService = {
    async listMyJobs() {
        return MockDB.jobs;
    }
};

export const ResumeService = {
    async listMyResumes() {
        return { data: MockDB.resumes, page: 1, limit: 10, total: MockDB.resumes.length, totalPages: 1 };
    },
    async uploadMany(files: File[]) {
        return { queueId: 'ck_parse_queue_1', resumeCount: files.length, status: 'PENDING' };
    }
};

export const MatchingService = {
    async enqueueMatch(jobId: string, options?: { topN?: number; insightsTopK?: number }) {
        return { queueId: 'ck_match_queue_1', status: 'PENDING' };
    },
    async listMatches(jobId: string) {
        const matches: Match[] = [
            { resumeId: 'ck_res_1', overallMatchScore: 0.82, skillsMatchScore: 0.8, experienceMatchScore: 0.9, educationMatchScore: 1, matchedSkills: ['react', 'css'], missingSkills: ['typescript'] },
            { resumeId: 'ck_res_2', overallMatchScore: 0.65, skillsMatchScore: 0.6, experienceMatchScore: 0.7, educationMatchScore: 0.9, matchedSkills: ['postgres'], missingSkills: ['node', 'prisma'] }
        ];
        return { data: matches, page: 1, limit: 10, total: matches.length, totalPages: 1 };
    }
};


