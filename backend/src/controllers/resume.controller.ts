import service from "../services/resume.service.js";
import { ValidationError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Request, Response } from 'express'
import { ListMyResumesQuery } from '../types/resume.types.js';
import redisService from "../services/redis.service.js";
import matchingService from "../services/matching.service.js";
import { logger } from '../utils/logger.js';
import parseQueueService from '../services/parse.queue.service.js';
import { NotFoundError } from '../utils/ApiError.js';


export const uploadMany = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const userId = req.user.id!;

  if (!files.length) throw new ValidationError("No files provided");

  logger.info('Resume upload started', {
    userId,
    fileCount: files.length,
    correlationId: req.correlationId
  });

  const result = await service.uploadManyAsync(files, userId);

  logger.info('Resume upload queued', {
    userId,
    queueId: result.queueId,
    correlationId: req.correlationId
  });
  // await redisService.delPattern(`${userId}/GET//resume/my*`)
  // await matchingService.clearAllUserMatches(userId);
  // await redisService.delPattern(`${userId}/GET//match*`)
  return res.status(201).json(new ApiResponse(201, 'Queued for processing', result));
});


export const getParseStatus = asyncHandler(async (req: Request, res: Response) => {
  const { queueId } = req.params;

  const job = await parseQueueService.getParseStatus(queueId);
  if (!job) throw new NotFoundError('Parse job not found');

  const progress = job.totalCount > 0 ? Math.round((job.processedCount / job.totalCount) * 100) : 0;

  return res.json(new ApiResponse(200, 'OK', {
    status: job.status,
    progress,
    processedCount: job.processedCount,
    totalCount: job.totalCount
  }));
});
export const listMyResumes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const query = req.query as unknown as ListMyResumesQuery;
  const result = await service.listMyResumes(userId, query);
  return res.json(new ApiResponse(200, 'Resumes retrieved', result));
});

export const removeOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const { id } = req.params;
  const result = await service.deleteById(id, userId);
  await redisService.delPattern(`${userId}/GET//resume/my*`)
  await matchingService.clearAllUserMatches(userId);
  await redisService.delPattern(`${userId}/GET//match*`)
  return res.json(new ApiResponse(200, 'Deleted', result));
});

export const clearMyResumes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const result = await service.clearUserResumes(userId);
  await redisService.delPattern(`${userId}/GET//resume/my*`)
  await matchingService.clearAllUserMatches(userId);
  await redisService.delPattern(`${userId}/GET//match*`)
  return res.json(new ApiResponse(200, 'Session cleared', result));
});