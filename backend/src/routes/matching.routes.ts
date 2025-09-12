import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { listMatches, matchForJob, clearMatches } from '../controllers/matching.controller.js';
import { gentleLimit, moderateLimit } from '../middleware/ratelimit.middleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { ListMatchesQuerySchema, MatchRequestSchema } from '../types/zod/matching.schema.js';
import { cacheResponse } from '../middleware/cache.middleware.js';

const router = Router();
router.post('/match/:jobId/match', authMiddleware, validateBody(MatchRequestSchema), moderateLimit, matchForJob);
router.get('/match/:jobId/matches', authMiddleware, gentleLimit, validateQuery(ListMatchesQuerySchema), cacheResponse(15*60),listMatches);
router.delete('/match/:jobId/matches', authMiddleware, gentleLimit, clearMatches);
export default router;