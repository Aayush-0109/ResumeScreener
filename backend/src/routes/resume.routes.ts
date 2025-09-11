import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadMany, listMyResumes, removeOne, clearMyResumes } from '../controllers/resume.controller.js';
import { uploadMultipleResumes } from '../middleware/upload.middleware.js';
import { gentleLimit, moderateLimit } from '../middleware/ratelimit.middleware.js';

const router = Router();

router.post('/upload-many', authMiddleware, uploadMultipleResumes, moderateLimit, uploadMany);
router.get('/my', authMiddleware, gentleLimit, listMyResumes);
router.delete('/clear-session', authMiddleware, moderateLimit, clearMyResumes);
router.delete('/:id', authMiddleware, moderateLimit, removeOne);

export default router;