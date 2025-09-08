// backend/src/services/matching.service.ts
import { prisma } from '../config/db.js';
import type { IJobMatcher } from '../types/matching.inteface.js';
import type { SortSpec, SearchQuery } from '../types/general.types.js';

export class MatchingService {
  constructor(private readonly matcher: IJobMatcher) {}

  async matchJobForUser(jobId: string, userId: string, opts?: { topN?: number; sort?: SortSpec[] }) {
    const topN = opts?.topN ?? 10;

    const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
    if (!job) return { topN, matched: [] };

    const resumes = await prisma.resume.findMany({ where: { userId } });
    if (!resumes.length) return { topN, matched: [] };

    const results = await Promise.all(
      resumes.map(async (r) => ({ resumeId: r.id, scores: await this.matcher.score(job, r) }))
    );

    await Promise.all(
      results.map((r) =>
        prisma.jobMatch.upsert({
          where: { jobId_resumeId: { jobId, resumeId: r.resumeId } },
          update: {
            overallMatchScore: r.scores.overallMatchScore,
            skillsMatchScore: r.scores.skillsMatchScore,
            experienceMatchScore: r.scores.experienceMatchScore,
            educationMatchScore: r.scores.educationMatchScore,
            culturalFitMatchScore: r.scores.culturalFitMatchScore,
            technicalMatchScore: r.scores.technicalMatchScore,
            biasMatchScore: r.scores.biasMatchScore,
            matchedSkills: r.scores.matchedSkills ?? [],
            missingSkills: r.scores.missingSkills ?? [],
            experienceGap: r.scores.experienceGap ?? null,
            educationMatch: r.scores.educationMatch ?? null,
            aiMatchInsights: r.scores.aiMatchInsights ?? null
          },
          create: {
            jobId,
            resumeId: r.resumeId,
            overallMatchScore: r.scores.overallMatchScore,
            skillsMatchScore: r.scores.skillsMatchScore,
            experienceMatchScore: r.scores.experienceMatchScore,
            educationMatchScore: r.scores.educationMatchScore,
            culturalFitMatchScore: r.scores.culturalFitMatchScore,
            technicalMatchScore: r.scores.technicalMatchScore,
            biasMatchScore: r.scores.biasMatchScore,
            matchedSkills: r.scores.matchedSkills ?? [],
            missingSkills: r.scores.missingSkills ?? [],
            experienceGap: r.scores.experienceGap ?? null,
            educationMatch: r.scores.educationMatch ?? null,
            aiMatchInsights: r.scores.aiMatchInsights ?? null
          }
        })
      )
    );

    const sorted = results
      .slice()
      .sort((a, b) => ((b.scores.overallMatchScore ?? -1) - (a.scores.overallMatchScore ?? -1)))
      .slice(0, topN);

    return { topN, matched: sorted };
  }

  async listMatches(jobId: string, userId: string, query: SearchQuery = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const orderBy =
      query.sort?.length
        ? query.sort.map(s => ({ [s.field]: (s.order || 'desc') as any }))
        : [{ overallMatchScore: 'desc' as const }];

    const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
    if (!job) return { data: [], page, limit, total: 0, totalPages: 1 };

    const [data, total] = await Promise.all([
      prisma.jobMatch.findMany({
        where: { jobId },
        orderBy,
        skip,
        take: limit,
        include: {
          resume: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              uploadedAt: true,
              name: true,
              email: true,
              skills: true,
              experience: true,
              education: true
            }
          }
        }
      }),
      prisma.jobMatch.count({ where: { jobId } })
    ]);

    return { data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 };
  }
}