import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { gentleLimit } from '../middleware/ratelimit.middleware.js';
import { JobIdParamSchema } from '../types/zod/matching.schema.js';
import { ExportQuerySchema } from '../types/zod/export.schema.js';
import { exportMatches } from '../controllers/export.controller.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/match/:jobId/exports',
  validateParams(JobIdParamSchema),
  validateQuery(ExportQuerySchema),
  gentleLimit,
  exportMatches
);

export default router;