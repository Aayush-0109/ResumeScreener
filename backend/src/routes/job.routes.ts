import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createJob, listJobs, getJob, updateJob, deleteJob } from '../controllers/job.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { createJobBody, jobIdParams, listJobsQuery, updateJobBody } from '../types/zod/job.schema.js';
import { gentleLimit, moderateLimit } from '../middleware/ratelimit.middleware.js';

const router = Router();
router.use(authMiddleware);
router.post('/', moderateLimit, validateBody(createJobBody),createJob);
router.get('/', gentleLimit,validateQuery(listJobsQuery), listJobs);
router.get('/:id',gentleLimit, validateParams(jobIdParams), getJob);
router.patch('/:id', moderateLimit,validateParams(jobIdParams), validateBody(updateJobBody), updateJob);
router.delete('/:id', moderateLimit,validateParams(jobIdParams), deleteJob);
export default router;