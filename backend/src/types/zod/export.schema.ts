import { z } from 'zod';

export const ExportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).default('json'),
  limit: z.coerce.number().min(1).max(10000).optional(),
  sortField: z.enum([
    'overallMatchScore',
    'skillsMatchScore', 
    'experienceMatchScore',
    'matchedAt'
  ]).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type ExportQuery = z.infer<typeof ExportQuerySchema>;