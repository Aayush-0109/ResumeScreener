import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import service from '../services/matching.service.js';
import redisService from '../services/redis.service.js';

export const matchForJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { jobId } = req.params;
  const topN = req.query.topN ? Number(req.query.topN) : undefined;
  const weights = req.body?.weights;
  await service.clearMatches(jobId,userId);
  const result = await service.matchJobForUserViaAI(jobId, userId, { topN, weights, insightsTopK: 5 });

  await redisService.delPattern(`${userId}/GET//match/${jobId}/*`)

  return res.json(new ApiResponse(200, 'Matched', result));
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
  await redisService.delPattern(`${userId}/GET//match/${jobId}/*`)
  return res.json(new ApiResponse(200, 'Cleared', result));
});