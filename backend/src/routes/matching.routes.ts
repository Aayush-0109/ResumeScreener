import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { gentleLimit, moderateLimit } from '../middleware/ratelimit.middleware.js';
import { cacheResponse } from '../middleware/cache.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';

import {
    JobIdParamSchema,
    MatchRequestSchema,
    MatchRequestQuerySchema,
    ListMatchesQuerySchema
} from '../types/zod/matching.schema.js';
import {

    listMatches,
    clearMatches,
    enqueueMatch,
    getMatchStatus,
    cancelMatch
} from '../controllers/matching.controller.js';
import { ExportQuerySchema } from '../types/zod/export.schema.js';
import { exportMatches } from '../controllers/export.controller.js';

const router = Router();

router.use(authMiddleware);


router.post(
    '/match/:jobId/async',
    validateParams(JobIdParamSchema),
    validateBody(MatchRequestSchema),
    validateQuery(MatchRequestQuerySchema),
    moderateLimit,
    enqueueMatch
);


router.get(
    '/match/status/:queueId',
    gentleLimit,
    getMatchStatus
);




router.delete(
    '/match/:queueId',
    gentleLimit,
    cancelMatch
);


router.get(
    '/match/:jobId/matches',
    gentleLimit,
    validateQuery(ListMatchesQuerySchema),
    validateParams(JobIdParamSchema),
    cacheResponse(15 * 60),
    listMatches
);

router.delete(
    '/match/:jobId/matches',
    gentleLimit,
    validateParams(JobIdParamSchema),
    clearMatches
);

router.get(
    '/match/:jobId/exports',
    validateParams(JobIdParamSchema),
    validateQuery(ExportQuerySchema),
    gentleLimit,
    exportMatches
);

export default router;