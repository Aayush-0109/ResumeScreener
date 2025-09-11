import { z } from "zod";

export const MatchWeightsSchema = z.object({
    skills: z.number().nonnegative().optional(),
    experience: z.number().nonnegative().optional(),
    education: z.number().nonnegative().optional()
  }).refine(w => (w.skills ?? 0) + (w.experience ?? 0) + (w.education ?? 0) > 0, {
    message: "At least one weight must be > 0"
  });
  
  export const MatchRequestSchema = z.object({
    weights: MatchWeightsSchema.optional(),
    topN: z.number().int().min(1).max(100).optional()
  });