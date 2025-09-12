import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createJob, listJobs, getJob, updateJob, deleteJob } from '../controllers/job.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { createJobBody, jobIdParams, listJobsQuery, updateJobBody } from '../types/zod/job.schema.js';
import { gentleLimit, moderateLimit } from '../middleware/ratelimit.middleware.js';
import { cacheResponse } from '../middleware/cache.middleware.js';

const router = Router();
router.use(authMiddleware);
router.post('/job', moderateLimit, validateBody(createJobBody),createJob);
router.get('/job', gentleLimit,validateQuery(listJobsQuery),cacheResponse(24*60*60),listJobs);
router.get('/job/:id',gentleLimit, validateParams(jobIdParams), getJob);
router.patch('/job/:id', moderateLimit,validateParams(jobIdParams), validateBody(updateJobBody), updateJob);
router.delete('/job/:id', moderateLimit,validateParams(jobIdParams), deleteJob);
export default router;