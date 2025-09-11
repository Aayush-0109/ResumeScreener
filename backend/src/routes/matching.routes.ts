import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { listMatches, matchForJob, clearMatches } from '../controllers/matching.controller.js';
import { gentleLimit, moderateLimit } from '../middleware/ratelimit.middleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { ListMatchesQuerySchema, MatchRequestSchema } from '../types/zod/matching.schema.js';

const router = Router();
router.post('/jobs/:jobId/match', authMiddleware, validateBody(MatchRequestSchema), moderateLimit, matchForJob);
router.get('/jobs/:jobId/matches', authMiddleware, gentleLimit, validateQuery(ListMatchesQuerySchema), listMatches);
router.delete('/jobs/:jobId/matches', authMiddleware, gentleLimit, clearMatches);
export default router;