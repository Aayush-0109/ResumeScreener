import { prisma } from '../config/db.js';
import { Cloudinary } from '../services/coudinary.service.js';
import { IResumeService, ListMyResumesQuery, ListMyResumesResult, PersistedResume, UploadInput, UploadManyResult } from '../types/resume.types.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/ApiError.js';



  export class ResumeService implements IResumeService{
    async uploadMany(files: UploadInput[], userId: string): Promise<UploadManyResult> {
        if (!files?.length) throw new ValidationError( 'No files provided');
        
       const {created , failed} =  await Cloudinary.uploadMany(files,userId);

       if (!created.length && failed.length) {
        throw new ValidationError( 'All uploads failed');
      }
      const data = created.map((a) => ({
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        publicId: a.publicId,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        userId
      }));
  
        await prisma.resume.createMany({data});
        return {
            createdCount: created.length,
            created,
            failed: failed.map((f: any) => ({ file: f.file || 'unknown', reason: f.reason || 'upload_failed' }))
          };
    }
    async listMyResumes(userId: string, query: ListMyResumesQuery = {}): Promise<ListMyResumesResult> {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
        const skip = (page - 1) * limit;
    
        const [total, rows] = await Promise.all([
          prisma.resume.count({ where: { userId } }),
          prisma.resume.findMany({
            where: { userId },
            orderBy: { uploadedAt: 'desc' },
            skip,
            take: limit,
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              publicId: true,
              fileSize: true,
              mimeType: true,
              userId: true,
              uploadedAt: true
            }
          })
        ]);
    
        return {
          data: rows as PersistedResume[],
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1
        };

  }
  
  async deleteById(id: string, userId: string): Promise<{ deleted: boolean }> {
    const resume = await prisma.resume.findUnique({
      where: { id },
      select: { id: true, userId: true, publicId: true }
    });

    if (!resume) throw new NotFoundError('Resume not found');
    if (resume.userId !== userId) throw new ForbiddenError('Not allowed to delete this resume');

    await Cloudinary.deleteByPublicId(resume.publicId);
    await prisma.resume.delete({ where: { id: resume.id } });

    return { deleted: true };
  }
}