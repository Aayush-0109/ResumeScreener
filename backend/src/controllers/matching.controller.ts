// backend/src/controllers/matching.controller.ts
import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { MatchingService } from '../services/matching.service.js';
import { BaselineMatcher } from '../services/matching.baseline.js';
import { SearchQuery } from '../types/general.types.js';

const service = new MatchingService(new BaselineMatcher());

export const matchForJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { jobId } = req.params;
  const topN = req.query.topN ? Number(req.query.topN) : undefined;

  const result = await service.matchJobForUser(jobId, userId, { topN });
  return res.json(new ApiResponse(200, 'Matched', result));
});

export const listMatches = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { jobId } = req.params;
  const result = await service.listMatches(jobId, userId, req.query as unknown as SearchQuery);
  return res.json(new ApiResponse(200, 'OK', result));
});