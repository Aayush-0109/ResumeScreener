import { Job, Resume } from "@prisma/client";
import { IJobMatcher, MatchScores } from "../types/matching.inteface.js";

export class BaselineMatcher implements IJobMatcher {
    async score(_job: Job, _resume: Resume): Promise<MatchScores> {
      return {
        overallMatchScore: null,
        skillsMatchScore: null,
        experienceMatchScore: null,
        educationMatchScore: null,
        technicalMatchScore: null,
        culturalFitMatchScore: null,
        biasMatchScore: null,
        matchedSkills: [],
        missingSkills: [],
        experienceGap: null,
        educationMatch: null,
        aiMatchInsights: null
      };
    }
}