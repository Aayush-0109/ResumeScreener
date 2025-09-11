import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { matchForJob } from '../controllers/matching.controller.js';
import { moderateLimit } from '../middleware/ratelimit.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { MatchRequestSchema } from '../types/zod/matching.schema.js';

const router = Router();
router.post('/jobs/:jobId/match', authMiddleware, validateBody(MatchRequestSchema), moderateLimit, matchForJob);
export default router;