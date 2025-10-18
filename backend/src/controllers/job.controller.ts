import { Request, Response } from 'express';
import { JobService } from '../services/job.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { SearchQuery } from '../types/general.types.js';
import matchingService from '../services/matching.service.js';
import redisService from '../services/redis.service.js';
import { logger } from '../utils/logger.js';
const service = new JobService();

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;


  logger.info('Job creation started', {
    userId,
    title: req.body.title,
    skillsCount: req.body.skills?.length || 0,
    correlationId: req.correlationId
  });

  const job = await service.create(userId, req.body);

  await redisService.delPattern(`${userId}/GET//job*`);


  logger.info('Job creation completed', {
    userId,
    jobId: job.id,
    title: job.title,
    correlationId: req.correlationId
  });

  res.status(201).json(new ApiResponse(201, 'Job created', job));
});

export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const query = req.query as any;
  const searchQuery: SearchQuery = {
    q: query.q,
    page: query.page,
    limit: query.limit,
    sort: query.sort ? query.sort.split(',').map((item: string) => {
      const [field, order] = item.split(':');
      return { field, order: order as 'asc' | 'desc' || 'asc' };
    }) : undefined
  };

  const result = await service.list(userId, searchQuery);
  res.json(new ApiResponse(200, 'OK', result));
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const job = await service.getById(req.params.id, userId);
  res.json(new ApiResponse(200, 'OK', job));
});

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const job = await service.update(req.params.id, userId, req.body);
  await matchingService.clearMatches(req.params.id, userId);
  await redisService.delPattern(`${userId}/GET//job*`)
  await redisService.delPattern(`${userId}/GET//match/${req.params.id}/*`)
  res.json(new ApiResponse(200, 'Updated', job));
});

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id!;
  const result = await service.remove(req.params.id, userId);
  await matchingService.clearMatches(req.params.id, userId);
  await redisService.delPattern(`${userId}/GET//job*`)
  await redisService.delPattern(`${userId}/GET//match/${req.params.id}/*`)
  res.json(new ApiResponse(200, 'Deleted', result));
});