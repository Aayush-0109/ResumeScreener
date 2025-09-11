import { z } from 'zod';

export const MatchRequestSchema = z.object({
  weights: z.object({
    skills: z.number().min(0).max(1).optional(),
    experience: z.number().min(0).max(1).optional(),
    education: z.number().min(0).max(1).optional(),
    technical: z.number().min(0).max(1).optional()
  }).partial().optional()
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