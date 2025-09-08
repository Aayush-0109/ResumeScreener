export type CreateJobDto = {
    title: string;
    description: string;
    requirements: string;
    skills: string[];         
    experience?: number | null;
    education?: string | null;
    location?: string | null;
    salary?: string | null;
  };
  
  export type UpdateJobDto = Partial<CreateJobDto>;
  
  export type ListQuery = { page?: number; limit?: number; q?: string };