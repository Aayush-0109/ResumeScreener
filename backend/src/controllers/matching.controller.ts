import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { MatchingService } from '../services/matching.service.js';

const service = new MatchingService();

export const matchForJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { jobId } = req.params;
  const topN = req.query.topN ? Number(req.query.topN) : undefined;
  const weights = req.body?.weights;
  const result = await service.matchJobForUserViaAI(jobId, userId, { topN, weights, insightsTopK: 5 });
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
  return res.json(new ApiResponse(200, 'Cleared', result));
});