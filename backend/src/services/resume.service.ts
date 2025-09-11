import { prisma } from '../config/db.js';
import { IResumeService, ListMyResumesQuery, ListMyResumesResult, PersistedResume, UploadInput, UploadManyResult } from '../types/resume.types.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/ApiError.js';
import { ParseStatus } from '@prisma/client';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function parseViaAiService(fileBuffer: Buffer, fileName: string, mimeType: string) {
  const b64 = fileBuffer.toString('base64');
  const r = await fetch(`${AI_SERVICE_URL}/parse/resume`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file_content: b64, file_name: fileName, mime_type: mimeType })
  });
  if (!r.ok) throw new Error(`ai_parse_failed: ${r.status}`);
  const j = await r.json() as {
    data?: {
      parsed?: {
        name: string | null; email: string | null; phone: string | null;
        skills: string[]; experience: number | null; education: string | null;
      };
      meta?: { source?: string | null };
    };
  };
  return { parsed: j.data?.parsed, source: j.data?.meta?.source ?? null };
}

export class ResumeService implements IResumeService {
  async uploadMany(files: UploadInput[], userId: string): Promise<UploadManyResult> {
    if (!files?.length) throw new ValidationError('No files provided');

    const successfulResumes = [];

    for (const file of files) {
      try {
        const { parsed } = await parseViaAiService(file.buffer, file.originalname, file.mimetype);

        if (parsed) {
          successfulResumes.push({
            fileName: file.originalname,
            fileSize: file.buffer.length,
            mimeType: file.mimetype,
            fileBuffer: file.buffer,
            userId,
            parseStatus: ParseStatus.DONE,
            parsedAt: new Date(),
            name: parsed.name ?? null,
            email: parsed.email ?? null,
            phone: parsed.phone ?? null,
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            experience: parsed.experience ?? null,
            education: parsed.education ?? null
          });
        }
      } catch (error) {
        // skip failed files
      }
    }

    if (successfulResumes.length > 0) {
      await prisma.resume.createMany({ data: successfulResumes });
    }

    return {
      createdCount: successfulResumes.length,
      created: successfulResumes.map(r => ({ fileName: r.fileName, fileSize: r.fileSize, mimeType: r.mimeType })),
      failed: []
    };
  }

  async listMyResumes(userId: string, query: ListMyResumesQuery = {}): Promise<ListMyResumesResult> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    // Add filtering options
    const whereClause: any = { userId };

    if (query.skills && query.skills.length > 0) {
      whereClause.skills = { hasSome: query.skills };
    }

    if (query.experienceMin !== undefined) {
      whereClause.experience = { gte: query.experienceMin };
    }

    if (query.experienceMax !== undefined) {
      whereClause.experience = { ...whereClause.experience, lte: query.experienceMax };
    }

    if (query.education) {
      whereClause.education = { contains: query.education, mode: 'insensitive' };
    }

    const [total, rows] = await Promise.all([
      prisma.resume.count({ where: whereClause }),
      prisma.resume.findMany({
        where: whereClause,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          userId: true,
          uploadedAt: true,
          parseStatus: true,
          parsedAt: true,
          name: true,
          email: true,
          phone: true,
          skills: true,
          experience: true,
          education: true
        }
      })
    ]);

    return {
      data: rows as PersistedResume[],
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async deleteById(id: string, userId: string): Promise<{ deleted: boolean }> {
    const resume = await prisma.resume.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!resume) throw new NotFoundError('Resume not found');
    if (resume.userId !== userId) throw new ForbiddenError('Not allowed to delete this resume');

    await prisma.resume.delete({ where: { id: resume.id } });
    return { deleted: true };
  }

  async clearUserResumes(userId: string): Promise<{ deletedCount: number }> {
    const result = await prisma.resume.deleteMany({
      where: { userId }
    });
    return { deletedCount: result.count };
  }
}