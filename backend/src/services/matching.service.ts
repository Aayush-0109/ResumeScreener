import { prisma } from '../config/db.js';
import { ParseStatus } from '@prisma/client';
import type { SearchQuery } from '../types/general.types.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

type AiBatchMatchReq = {
  job: { title?: string; description?: string; skills: string[]; experience?: number | null; education?: string | null };
  resumes: Array<{ id: string; skills: string[]; experience?: number | null; education?: string | null; summary?: string | null; name?: string | null; email?: string | null }>;
  options?: { topN?: number; weights?: Record<string, number>; insightsTopK?: number };
};
type AiBatchMatchResp = { data?: { topN: number; matched: Array<{ resumeId: string; scores: any }> } };

export class MatchingService {
  
  async matchJobForUserViaAI(jobId: string, userId: string, opts?: { topN?: number; weights?: Record<string, number>; insightsTopK?: number }) {
    const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
    if (!job) return { topN: opts?.topN ?? 10, matched: [] };

    const resumes = await prisma.resume.findMany({
      where: { userId, parseStatus: ParseStatus.DONE },
      select: { id: true, skills: true, experience: true, education: true, name: true, email: true }
    });
    if (!resumes.length) return { topN: opts?.topN ?? 10, matched: [] };

    const body: AiBatchMatchReq = {
      job: {
        title: job.title, description: job.description, skills: job.skills,
        experience: job.experience ?? null, education: job.education ?? null
      },
      resumes: resumes.map(r => ({
        id: r.id, skills: r.skills, experience: r.experience ?? null, education: r.education ?? null,
        summary: null, name: r.name ?? null, email: r.email ?? null
      })),
      options: { topN: opts?.topN, weights: opts?.weights, insightsTopK: opts?.insightsTopK ?? 0 }
    };

    const r = await fetch(`${AI_SERVICE_URL}/match/batch`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) return { topN: opts?.topN ?? 10, matched: [] };
    const j = (await r.json()) as AiBatchMatchResp;
    const matched = j.data?.matched || [];
    const topN = j.data?.topN ?? (opts?.topN ?? 10);

    await Promise.all(matched.map(m =>
      prisma.jobMatch.upsert({
        where: { jobId_resumeId: { jobId, resumeId: m.resumeId } },
        update: {
          overallMatchScore: m.scores.overallMatchScore,
          skillsMatchScore: m.scores.skillsMatchScore,
          experienceMatchScore: m.scores.experienceMatchScore,
          educationMatchScore: m.scores.educationMatchScore,
          culturalFitMatchScore: m.scores.culturalFitMatchScore,
          technicalMatchScore: m.scores.technicalMatchScore,
          biasMatchScore: m.scores.biasMatchScore,
          matchedSkills: m.scores.matchedSkills ?? [],
          missingSkills: m.scores.missingSkills ?? [],
          experienceGap: m.scores.experienceGap ?? null,
          educationMatch: m.scores.educationMatch ?? null,
          aiMatchInsights: m.scores.aiMatchInsights ?? null
        },
        create: {
          jobId, resumeId: m.resumeId,
          overallMatchScore: m.scores.overallMatchScore,
          skillsMatchScore: m.scores.skillsMatchScore,
          experienceMatchScore: m.scores.experienceMatchScore,
          educationMatchScore: m.scores.educationMatchScore,
          culturalFitMatchScore: m.scores.culturalFitMatchScore,
          technicalMatchScore: m.scores.technicalMatchScore,
          biasMatchScore: m.scores.biasMatchScore,
          matchedSkills: m.scores.matchedSkills ?? [],
          missingSkills: m.scores.missingSkills ?? [],
          experienceGap: m.scores.experienceGap ?? null,
          educationMatch: m.scores.educationMatch ?? null,
          aiMatchInsights: m.scores.aiMatchInsights ?? null
        }
      })
    ));

    const data = await prisma.jobMatch.findMany({
      where: { jobId },
      orderBy: { overallMatchScore: 'desc' },
      take: topN,
      include: {
        resume: {
          select: { id: true, fileName: true, fileSize: true, mimeType: true, uploadedAt: true, name: true, email: true, skills: true, experience: true, education: true }
        }
      }
    });

    return { topN, matched: data };
  }

  async listMatches(jobId: string, userId: string, query: SearchQuery = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const sortField = (query as any).sortField as string | undefined;
    const sortOrder = ((query as any).sortOrder as string | undefined)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy = sortField
    ? [{ [sortField]: sortOrder as any }, { matchedAt: 'desc' as const }]
    : [{ overallMatchScore: 'desc' as const }, { matchedAt: 'desc' as const }];

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
              id: true, fileName: true, fileSize: true, mimeType: true, uploadedAt: true,
              name: true, email: true, skills: true, experience: true, education: true
            }
          }
        }
      }),
      prisma.jobMatch.count({ where: { jobId } })
    ]);

    return { data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 };
  }

  async clearMatches(jobId: string, userId: string): Promise<{ deleted: number }> {
    const job = await prisma.job.findFirst({ where: { id: jobId, userId }, select: { id: true } });
    if (!job) return { deleted: 0 };
    const result = await prisma.jobMatch.deleteMany({ where: { jobId } });
    return { deleted: result.count };
  }
}