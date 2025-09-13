import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { listMatches, matchForJob, clearMatches } from '../controllers/matching.controller.js';
import { gentleLimit, moderateLimit } from '../middleware/ratelimit.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { JobIdParamSchema, ListMatchesQuerySchema, MatchRequestQuerySchema, MatchRequestSchema } from '../types/zod/matching.schema.js';
import { cacheResponse } from '../middleware/cache.middleware.js';
import { jobIdParams } from '../types/zod/job.schema.js';

const router = Router();

router.post('/match/:jobId/match',
    validateParams(JobIdParamSchema),
    validateBody(MatchRequestSchema),
    validateQuery(MatchRequestQuerySchema),
    moderateLimit,
    matchForJob);


router.get('/match/:jobId/matches',
    gentleLimit,
    validateQuery(ListMatchesQuerySchema),
    validateParams(jobIdParams),
    cacheResponse(15 * 60),
    listMatches);


router.delete('/match/:jobId/matches',
    gentleLimit,
    validateParams(JobIdParamSchema),
    clearMatches);
export default router;