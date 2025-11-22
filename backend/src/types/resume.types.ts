export interface PersistedResume {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  userId: string;
  uploadedAt: Date;
  parseStatus: string;
  parsedAt?: Date | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  skills: string[];
  experience?: number | null;
  education?: string | null;
}

export type UploadManyResult = {
  createdCount: number;
  created: UploadedAsset[];
  failed: Array<{ file: string; reason: string }>;
};

export interface ListMyResumesQuery {
  page?: number;
  limit?: number;
  skills?: string[];           // Filter by skills
  experienceMin?: number;      // Minimum experience
  experienceMax?: number;      // Maximum experience
  education?: string;          // Filter by education
}

export type ListMyResumesResult = {
  data: PersistedResume[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export interface IResumeService {
  uploadMany(files: UploadInput[], userId: string): Promise<UploadManyResult>;
  listMyResumes(userId: string, query?: ListMyResumesQuery): Promise<ListMyResumesResult>;
  deleteById(id: string, userId: string): Promise<{ deleted: boolean }>;
}

export type UploadInput = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};
export type UploadedAsset = {
  fileName: string;
  fileUrl: string;
  downloadUrl: string;
  publicId: string;
  fileSize: number;
  mimeType: string;
};