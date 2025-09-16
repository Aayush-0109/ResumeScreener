import { prisma } from '../config/db.js';
import type { ExportQuery } from '../types/zod/export.schema.js';

class ExportService {
    async *streamMatches(jobId: string, userId: string, query: ExportQuery) {
        const batchSize = 100; 
        let skip = 0;

        while (true) {
            const matches = await prisma.jobMatch.findMany({
                where: {
                    jobId,
                    job: { userId }
                },
                orderBy: query.sortField ? {
                    [query.sortField]: query.sortOrder
                } : { matchedAt: 'desc' },
                take: batchSize,
                skip,
                select: {
                    id: true,
                    overallMatchScore: true,
                    skillsMatchScore: true,
                    experienceMatchScore: true,
                    educationMatchScore: true,
                    technicalMatchScore: true,
                    matchedSkills: true,
                    missingSkills: true,
                    experienceGap: true,
                    educationMatch: true,
                    aiMatchInsights: true,
                    matchedAt: true,
                    resumeId: true
                }
            });

            if (matches.length === 0) break;

            yield matches; 
            skip += batchSize;

            if (query.limit && skip >= query.limit) break;
        }
    }
}

export default new ExportService();
