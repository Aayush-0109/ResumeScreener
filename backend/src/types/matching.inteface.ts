import type { Job, Resume } from '@prisma/client';

export type MatchScores = {
    overallMatchScore: number | null;
    skillsMatchScore?: number | null;
    experienceMatchScore?: number | null;
    educationMatchScore?: number | null;
    culturalFitMatchScore?: number | null;
    technicalMatchScore?: number | null;
    biasMatchScore?: number | null;
    matchedSkills?: string[];
    missingSkills?: string[];
    experienceGap?: number | null;
    educationMatch?: string | null;
    aiMatchInsights?: string | null;
  };

  export interface IJobMatcher {
    score(job: Job, resume: Resume): Promise<MatchScores>;
  }