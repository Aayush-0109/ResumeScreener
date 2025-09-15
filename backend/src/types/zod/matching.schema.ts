import { z } from 'zod';

export const MatchRequestSchema = z.object({
  weights: z.object({
    skills: z.number().min(0).max(1).optional(),
    experience: z.number().min(0).max(1).optional(),
    education: z.number().min(0).max(1).optional(),
    technical: z.number().min(0).max(1).optional(),
    cultural: z.number().min(0).max(1).optional(),
    bias: z.number().min(0).max(1).optional()
  }).partial().optional().refine((weights) => {
    if (!weights) return true;
    const values = Object.values(weights).filter(v => v !== undefined) as number[]
    if (values.length === 0) return true;
    const sum = values.reduce((acc: number, val: number) => {
      return acc + val;
    }, 0)
    const tolerance = 0.01;
    return sum >= tolerance && sum <= 1 + tolerance;
  }, {

    error: "Weights must sum to approximately 1.0 (±0.01 tolerance)"
  }),
  topN: z.preprocess(v => v ? Number(v) : undefined, z.number().int().min(1).max(1000).optional()),
  insightsTopK: z.number().int().min(0).max(20).optional()
});
export const MatchRequestQuerySchema = z.object({
  topN: z.preprocess(v => v ? Number(v) : undefined, z.number().int().min(1).max(1000).optional())
});

export const ListMatchesQuerySchema = z.object({
  page: z.preprocess(v => Number(v), z.number().int().min(1)).optional(),
  limit: z.preprocess(v => Number(v), z.number().int().min(1).max(50)).optional(),
  sortField: z.enum([
    'overallMatchScore',
    'skillsMatchScore',
    'experienceMatchScore',
    'educationMatchScore',
    'technicalMatchScore',
    'culturalFitMatchScore',
    'biasMatchScore',
    'matchedAt'
  ]).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});
export const JobIdParamSchema = z.object({
  jobId: z.cuid("Invalid job ID format")
})