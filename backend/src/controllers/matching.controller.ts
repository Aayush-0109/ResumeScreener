import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import service from '../services/matching.service.js';
import redisService from '../services/redis.service.js';
import queueService from '../services/match.queue.service.js';
import { NotFoundError, ConflictError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';


export const enqueueMatch = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const { jobId } = req.params;
  const { topN, weights, insightsTopK } = req.body || {};


  logger.info('Match job enqueued', {
    userId,
    jobId,
    topN,
    weights,
    insightsTopK,
    correlationId: req.correlationId
  });

  const queueId = await queueService.enqueueJob(jobId, userId, { topN, weights, insightsTopK });


  logger.info('Match job queued successfully', {
    userId,
    jobId,
    queueId,
    correlationId: req.correlationId
  });

  return res.json(new ApiResponse(200, 'Queued', { queueId, status: 'PENDING' }));
});


export const getMatchStatus = asyncHandler(async (req: Request, res: Response) => {
  const { queueId } = req.params;


  logger.info('Queue status checked', {
    queueId,
    correlationId: req.correlationId
  });

  const job = await queueService.getJobStatus(queueId);
  if (!job) throw new NotFoundError('Job not found');

  return res.json(new ApiResponse(200, 'OK', {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    errorMessage: job.errorMessage
  }));
});


export const cancelMatch = asyncHandler(async (req: Request, res: Response) => {
  const { queueId } = req.params;


  logger.info('Match job cancellation started', {
    queueId,
    correlationId: req.correlationId
  });

  const ok = await queueService.cancelJob(queueId);
  if (!ok) throw new ConflictError('Cannot cancel');


  logger.info('Match job cancelled successfully', {
    queueId,
    correlationId: req.correlationId
  });

  return res.json(new ApiResponse(200, 'Cancelled', { queueId }));
});


export const listMatches = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const { jobId } = req.params;

  logger.info('List matches started', {
    userId,
    jobId,
    query: req.query,
    correlationId: req.correlationId
  });

  const { data, ...meta } = await service.listMatches(jobId, userId, req.query as any);

  logger.info('List matches completed', {
    userId,
    jobId,
    matchCount: data?.length || 0,
    correlationId: req.correlationId
  });

  return res.json(new ApiResponse(200, 'OK', data, meta));
});


export const clearMatches = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const { jobId } = req.params;

  logger.info('Clear matches started', {
    userId,
    jobId,
    correlationId: req.correlationId
  });

  const result = await service.clearMatches(jobId, userId);
  await redisService.delPattern(`${userId}/GET//match/${jobId}/*`);

  logger.info('Clear matches completed', {
    userId,
    jobId,
    deletedCount: result.deleted || 0,
    correlationId: req.correlationId
  });

  return res.json(new ApiResponse(200, 'Cleared', result));
});