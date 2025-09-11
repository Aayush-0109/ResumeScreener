import { z } from 'zod';

export const listResumesQuery = z.object({
  page: z.preprocess(v => Number(v), z.number().int().min(1)).optional(),
  limit: z.preprocess(v => Number(v), z.number().int().min(1).max(50)).optional(),
  skills: z
    .union([
      z.string().transform(s => s.split(',').map(x => x.trim()).filter(Boolean)),
      z.array(z.string())
    ])
    .optional(),
  experienceMin: z.preprocess(v => Number(v), z.number().int().min(0)).optional(),
  experienceMax: z.preprocess(v => Number(v), z.number().int().min(0)).optional()
});

export const uploadResumesQuery = z.object({}); // unchanged
export const resumeIdParams = z.object({ id: z.string().min(1) });