import { Request, Response } from 'express';
import { JobService } from '../services/job.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { SearchQuery } from '../types/general.types.js';
import matchingService from '../services/matching.service.js';
const service = new JobService();

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const job = await service.create(userId, req.body);
  res.status(201).json(new ApiResponse(201, 'Job created', job));
});

export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await service.list(userId, req.query as unknown as SearchQuery);
  res.json(new ApiResponse(200, 'OK', result));
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const job = await service.getById(req.params.id, userId);
  res.json(new ApiResponse(200, 'OK', job));
});

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const job = await service.update(req.params.id, userId, req.body);
  await matchingService.clearMatches(req.params.id,userId);
  res.json(new ApiResponse(200, 'Updated', job));
});

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await service.remove(req.params.id, userId);
  await matchingService.clearMatches(req.params.id,userId);
  res.json(new ApiResponse(200, 'Deleted', result));
});