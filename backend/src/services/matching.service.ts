// backend/src/services/matching.service.ts
import { prisma } from '../config/db.js';
import { ParseStatus } from '@prisma/client';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

type AiBatchMatchReq = {
  job: { title?: string; description?: string; skills: string[]; experience?: number | null; education?: string | null };
  resumes: Array<{
    id: string;
    skills: string[];
    experience?: number | null;
    education?: string | null;
    summary?: string | null;
    name?: string | null;
    email?: string | null;
  }>;
  options?: { topN?: number; weights?: Record<string, number>; insightsTopK?: number };
};

type AiBatchMatchResp = {
  data?: { topN: number; matched: Array<{ resumeId: string; scores: any }> };
};

export class MatchingService {
  constructor() { }

  async matchJobForUserViaAI(jobId: string, userId: string, opts?: { topN?: number; weights?: Record<string, number>; insightsTopK?: number }) {
    const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
    if (!job) return { topN: opts?.topN ?? 10, matched: [] };

    const resumes = await prisma.resume.findMany({
      where: { userId, parseStatus: ParseStatus.DONE },
      select: {
        id: true,
        skills: true,
        experience: true,
        education: true,
        name: true,
        email: true
      }
    });
    if (!resumes.length) return { topN: opts?.topN ?? 10, matched: [] };

    const body: AiBatchMatchReq = {
      job: {
        title: job.title,
        description: job.description,
        skills: job.skills,
        experience: job.experience ?? null,
        education: job.education ?? null
      },
      resumes: resumes.map(r => ({
        id: r.id,
        skills: r.skills,
        experience: r.experience ?? null,
        education: r.education ?? null,
        summary: null,
        name: r.name ?? null,
        email: r.email ?? null
      })),
      options: { topN: opts?.topN, weights: opts?.weights, insightsTopK: opts?.insightsTopK ?? 0 }
    };

    const r = await fetch(`${AI_SERVICE_URL}/match/batch`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) return { topN: opts?.topN ?? 10, matched: [] };
    const j = (await r.json()) as AiBatchMatchResp;
    const matched = j.data?.matched || [];
    const topN = j.data?.topN ?? (opts?.topN ?? 10);

    await Promise.all(
      matched.map(m =>
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
            jobId,
            resumeId: m.resumeId,
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
      )
    );

    const matchedResumes = await prisma.jobMatch.findMany({
      where: { jobId },
      orderBy: { overallMatchScore: 'desc' },
      take: topN,
      include: {
        resume: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true,
            name: true,
            email: true,
            phone: true,
            skills: true,
            experience: true,
            education: true
          }
        }
      }
    });

    return {
      topN,
      matched: matchedResumes.map(match => ({
        resumeId: match.resumeId,
        scores: {
          overallMatchScore: match.overallMatchScore,
          skillsMatchScore: match.skillsMatchScore,
          experienceMatchScore: match.experienceMatchScore,
          educationMatchScore: match.educationMatchScore,
          culturalFitMatchScore: match.culturalFitMatchScore,
          technicalMatchScore: match.technicalMatchScore,
          biasMatchScore: match.biasMatchScore,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          experienceGap: match.experienceGap,
          educationMatch: match.educationMatch,
          aiMatchInsights: match.aiMatchInsights
        },
        resume: match.resume
      }))
    };
  }
}