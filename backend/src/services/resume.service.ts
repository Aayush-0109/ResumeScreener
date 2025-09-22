import { prisma } from '../config/db.js';
import { IResumeService, ListMyResumesQuery, ListMyResumesResult, PersistedResume, UploadInput, UploadManyResult } from '../types/resume.types.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/ApiError.js';
import { ParseStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';
import type { AIParseResponse } from '../types/ai.types.js';
import parseQueueService from './parse.queue.service.js';
import redisService from './redis.service.js';
import matchingService from './matching.service.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function parseViaAiService(fileBuffer: Buffer | Uint8Array, fileName: string, mimeType: string): Promise<AIParseResponse> {
  const b64 = fileBuffer.toString('base64');

  logger.info('AI service call started', {
    fileName,
    mimeType,
    fileSize: fileBuffer.length,
    service: 'parse-resume'
  });
  const startTime = Date.now();

  const r = await fetch(`${AI_SERVICE_URL}/parse/resume`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file_content: b64, file_name: fileName, mime_type: mimeType })
  });
  const duration = Date.now() - startTime;

  if (!r.ok) {
    logger.error('AI service call failed', {
      fileName,
      statusCode: r.status,
      duration,
      service: 'parse-resume'
    });
    throw new Error(`ai_parse_failed: ${r.status}`);
  }
  const response = await r.json() as AIParseResponse;
  logger.info('AI service call completed', {
    fileName,
    duration,
    provider: response.data?.meta?.successful_provider,
    wasSuccessful: response.success,
    service: 'parse-resume'
  });
  return response
}

class ResumeService implements IResumeService {
  async uploadManyAsync(files: UploadInput[], userId: string) {
    if (!files?.length) throw new ValidationError('No files provided');
    logger.info('Async resume upload started', {
      userId,
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.buffer.length, 0),
      service: 'resume'
    });
    const pendingResumes = files.map(f => ({
      fileName: f.originalname,
      fileSize: f.buffer.length,
      mimeType: f.mimetype,
      fileBuffer: f.buffer,
      userId,
      parseStatus: ParseStatus.PENDING,
      uploadedAt: new Date()
    }))
    const created = await prisma.resume.createManyAndReturn({
      data: pendingResumes,
      select: {
        id: true
      },
      skipDuplicates: true
    });
    const queueId = await parseQueueService.enqueueParseJob(created.map(c => c.id), userId);
    logger.info('Resume batch queued for processing', {
      userId,
      queueId,
      resumeCount: created.length,
      service: 'resume'
    });
    return {
      queueId,
      resumeCount: created.length,
      status: 'PENDING'
    };
  }
  async uploadMany(files: UploadInput[], userId: string): Promise<UploadManyResult> {
    if (!files?.length) throw new ValidationError('No files provided');

    const successfulResumes = [];

    for (const file of files) {
      try {
        const aiResponse = await parseViaAiService(file.buffer, file.originalname, file.mimetype);
        const parsed = aiResponse.data.parsed;

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
            experience: (typeof parsed.experience === 'number' && Number.isFinite(parsed.experience)) ? parsed.experience : 0,
            education: parsed.education ?? null
          });
        }
      } catch (error) {
        // Skip failed files during sync processing
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

    const whereClause: any = { userId };

    const rawSkills = (query as any).skills as string[] | string | undefined;

    const skillsParam =
      Array.isArray(rawSkills)
        ? rawSkills
        : typeof rawSkills === 'string'
          ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
          : undefined;

    if (skillsParam && skillsParam.length > 0) {
      whereClause.skills = { hasSome: skillsParam };
    }

    const expMinRaw = (query as any).experienceMin;
    const expMaxRaw = (query as any).experienceMax;
    const expMin = expMinRaw !== undefined ? Number(expMinRaw) : undefined;
    const expMax = expMaxRaw !== undefined ? Number(expMaxRaw) : undefined;

    if (expMin !== undefined || expMax !== undefined) {
      whereClause.experience = {
        ...(expMin !== undefined ? { gte: expMin } : {}),
        ...(expMax !== undefined ? { lte: expMax } : {})
      };
    }

    const [total, rows] = await Promise.all([
      prisma.resume.count({ where: whereClause }),
      prisma.resume.findMany({
        where: whereClause,
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


  async processParseQueueJob(queueId: string): Promise<void> {
    logger.info('Processing parse queue job', {
      queueId,
      service: 'resume'
    });

    const job = await parseQueueService.getParseStatus(queueId);
    if (!job) throw new Error('Parse job not found');
    if (['CANCELLED', 'COMPLETED', 'FAILED'].includes(job.status)) return;

    await parseQueueService.markParseProcessing(queueId);

    let processedCount = 0;

    for (const resumeId of job.resumeIds) {
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        select: {
          userId: true,
          id: true,
          fileName: true,
          mimeType: true,
          fileBuffer: true,
          parseStatus: true
        }
      });

      if (!resume || resume.parseStatus !== ParseStatus.PENDING) {
        processedCount++;
        continue;
      }

      try {
        logger.info('Parsing individual resume', {
          resumeId,
          fileName: resume.fileName,
          queueId,
          service: 'resume'
        });


        const aiResponse = await parseViaAiService(
          Buffer.from(resume.fileBuffer!),
          resume.fileName,
          resume.mimeType
        );
        const parsed = aiResponse.data.parsed;
        logger.debug("parse check", {
          parsed
        })
        await prisma.resume.update({
          where: { id: resumeId },
          data: {
            parseStatus: ParseStatus.DONE,
            parsedAt: new Date(),
            name: parsed.name ?? null,
            email: parsed.email ?? null,
            phone: parsed.phone ?? null,
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            experience: (typeof parsed.experience === 'number' && Number.isFinite(parsed.experience)) ? parsed.experience : 0,
            education: parsed.education ?? null
          }
        });

        await redisService.delPattern(`${resume.userId}/GET//resume/my*`)
        await matchingService.clearAllUserMatches(resume.userId);
        await redisService.delPattern(`${resume.userId}/GET//match*`)

        logger.info('Resume parsed successfully', {
          resumeId,
          fileName: resume.fileName,
          provider: aiResponse.data?.meta?.successful_provider,
          service: 'resume'
        });


      } catch (error: any) {
        logger.error('Resume parsing failed', {
          resumeId,
          fileName: resume.fileName,
          error: error.message,
          service: 'resume'
        });

        await prisma.resume.update({
          where: { id: resumeId },
          data: { parseStatus: ParseStatus.FAILED }
        });
      }

      processedCount++;
      await parseQueueService.updateParseProgress(queueId, processedCount);
    }

    await parseQueueService.markParseCompleted(queueId);

    logger.info('Parse queue job completed', {
      queueId,
      processedCount,
      totalCount: job.totalCount,
      service: 'resume'
    });
  }
}
export default new ResumeService()