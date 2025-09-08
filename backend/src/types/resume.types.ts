export type PersistedResume = {
    id: string;
    fileName: string;
    fileUrl: string;
    publicId: string;
    fileSize: number;
    mimeType: string;
    userId: string;
    uploadedAt: Date;
  };
  
  export type UploadManyResult = {
    createdCount: number;
    created: UploadedAsset[];     // successfully uploaded to Cloudinary
    failed: Array<{ file: string; reason: string }>;
  };
  
  export type ListMyResumesQuery = {
    page?: number;
    limit?: number;
  };
  
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
        mimeType: string;
        fileSize: number;
      };