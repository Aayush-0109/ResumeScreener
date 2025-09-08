import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { listMatches, matchForJob } from '../controllers/matching.controller.js';
import { gentleLimit, moderateLimit } from '../middleware/ratelimit.middleware.js';

const router = Router();
router.post('/jobs/:jobId/match', authMiddleware, moderateLimit,matchForJob);
router.get('/jobs/:jobId/matches', authMiddleware, gentleLimit,listMatches);
export default router;