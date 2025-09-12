import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadMany, listMyResumes, removeOne, clearMyResumes } from '../controllers/resume.controller.js';
import { uploadMultipleResumes } from '../middleware/upload.middleware.js';
import { gentleLimit, moderateLimit } from '../middleware/ratelimit.middleware.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import { listResumesQuery } from '../types/zod/resume.schema.js';
import { cacheResponse } from '../middleware/cache.middleware.js';

const router = Router();

router.post('/resume/upload-many', authMiddleware, uploadMultipleResumes, moderateLimit, uploadMany);
router.get('/resume/my', authMiddleware, gentleLimit, validateQuery(listResumesQuery), cacheResponse(24*60*60),listMyResumes);
router.delete('/resume/clear-all', authMiddleware, moderateLimit, clearMyResumes);
router.delete('/resume/:id', authMiddleware, moderateLimit, removeOne);

export default router;