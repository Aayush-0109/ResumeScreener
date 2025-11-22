import { z } from 'zod';

export const createJobBody = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  requirements: z.string().min(5),
  skills: z.array(z.string().min(1)).min(1),
  experience: z.number().int().nonnegative().nullable().optional(),
  education: z.string().max(100).optional().nullable().transform(val => !val || val.trim() === '' ? null : val),
  location: z.string().max(120).optional().nullable().transform(val => !val || val.trim() === '' ? null : val),
  salary: z.string().max(120).optional().nullable().transform(val => !val || val.trim() === '' ? null : val)
});

export const updateJobBody = createJobBody.partial();

export const listJobsQuery = z.object({
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().optional()
});

