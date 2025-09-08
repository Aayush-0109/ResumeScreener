import { z } from 'zod';

export const uploadResumesQuery = z.object({}).optional();

export const listResumesQuery = z.object({
    q: z.string().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sort: z.string().optional() // e.g., "uploadedAt:desc"
  });
  
  export const resumeIdParams = z.object({
    id: z.cuid()
  });