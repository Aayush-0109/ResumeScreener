import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadMultipleResumes } from '../middleware/upload.middleware.js';
import { uploadMany, listMine, removeOne } from '../controllers/resume.controller.js';
import { validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { listResumesQuery, resumeIdParams, uploadResumesQuery } from '../types/zod/resume.schema.js';
import { gentleLimit, uploaderLimit } from '../middleware/ratelimit.middleware.js';

const router = Router();

router.post('/upload', authMiddleware, uploaderLimit,validateQuery(uploadResumesQuery), uploadMultipleResumes, uploadMany);
router.get('/my', authMiddleware,  gentleLimit,validateQuery(listResumesQuery), listMine);
router.delete('/:id', authMiddleware, gentleLimit ,validateParams(resumeIdParams), removeOne);

export default router;