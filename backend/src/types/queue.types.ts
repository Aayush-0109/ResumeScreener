import { JobQueueStatus } from "@prisma/client";

export interface QueueJobOptions {
    topN?: number;
    weights?: Record<string, number>;
    insightsTopK?: number;
  }

  export interface JobStatus {
    id: string;
    status: JobQueueStatus;
    progress: number;
    totalResumes: number;
    processedResumes: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    errorMessage?: string;
  }