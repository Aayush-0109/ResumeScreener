
export interface AIParseResponse {
    success: boolean;
    message: string;
    data: {
      parsed: {
        name: string | null;
        email: string | null;
        phone: string | null;
        skills: string[];
        experience: number | null;
        education: string | null;
      };
      meta: {
        successful_provider?: string;
        processing_time?: number;
        was_truncated?: boolean;
        original_length?: number;
        fallback_used?: boolean;
      };
    };
  }
  
  export interface AIMatchResponse {
    success: boolean;
    message: string;
    data: {
      topN: number;
      matched: Array<{
        resumeId: string;
        scores: {
          overallMatchScore: number;
          skillsMatchScore: number;
          experienceMatchScore: number;
          educationMatchScore: number;
          technicalMatchScore: number;
          matchedSkills: string[];
          missingSkills: string[];
          experienceGap: number | null;
          educationMatch: string | null;
          aiMatchInsights: string | null;
        };
      }>;
    };
  }