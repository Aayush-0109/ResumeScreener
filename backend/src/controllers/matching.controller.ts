import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import service from '../services/matching.service.js';
import redisService from '../services/redis.service.js';
import queueService from '../services/queue.service.js';
import { prisma } from '../config/db.js';
import { NotFoundError, InternalServerError, ConflictError } from '../utils/ApiError.js';


export const enqueueMatch = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const { jobId } = req.params;
  const { topN, weights, insightsTopK } = req.body || {};

  const queueId = await queueService.enqueueJob(jobId, userId, { topN, weights, insightsTopK });

  return res.json(new ApiResponse(200, 'Queued', { queueId, status: 'PENDING' }));
});


export const getMatchStatus = asyncHandler(async (req: Request, res: Response) => {
  const { queueId } = req.params;
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
  const ok = await queueService.cancelJob(queueId);
  if (!ok) throw new ConflictError('Cannot cancel (already finished or not found)');
  return res.json(new ApiResponse(200, 'Cancelled', { queueId }));
});


export const listMatches = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { jobId } = req.params;
  const result = await service.listMatches(jobId, userId, req.query as any);
  return res.json(new ApiResponse(200, 'OK', result));
});


export const clearMatches = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { jobId } = req.params;
  const result = await service.clearMatches(jobId, userId);
  await redisService.delPattern(`${userId}/GET//match/${jobId}/*`);
  return res.json(new ApiResponse(200, 'Cleared', result));
});