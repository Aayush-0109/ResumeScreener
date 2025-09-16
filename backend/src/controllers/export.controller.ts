import { Request, Response } from 'express';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { NotFoundError } from '../utils/ApiError.js';
import exportService from '../services/export.service.js';
import type { ExportQuery } from '../types/zod/export.schema.js';
import { prisma } from '../config/db.js';


const toCsvHeader = (): string => {
  return [
    'resumeId', 'overallMatchScore', 'skillsMatchScore', 
    'experienceMatchScore', 'educationMatchScore', 'technicalMatchScore',
    'matchedSkills', 'missingSkills', 'experienceGap', 
    'educationMatch', 'aiMatchInsights', 'matchedAt'
  ].join(',') + '\n';
};

const toCsvRow = (match:any): string =>{
    return [
        match.resumeId,
        match.overallMatchScore || '',
        match.skillsMatchScore || '',
        match.experienceMatchScore || '',
        match.educationMatchScore || '',
        match.technicalMatchScore || '',
        `"${match.matchedSkills?.join(';') || ''}"`,
        `"${match.missingSkills?.join(';') || ''}"`,
        match.experienceGap || '',
        match.educationMatch || '',
        `"${match.aiMatchInsights || ''}"`,
        match.matchedAt
    ].join(',')+'\n';
};
export const exportMatches = asyncHandler(async (req:Request , res  :Response)=>{
    const userId = req.user.id!;
    const {jobId} = req.params;
    const query = req.validatedQuery as ExportQuery;

    const job = await prisma.job.findMany({where : {
        id : jobId ,userId
    }})
    if(!job) throw new NotFoundError('Job not found');

    const isCSV = query.format ==='csv';
    const filename = `matches-${jobId}-${Date.now()}.${query.format}`;

    res.setHeader('Content-Type', isCSV ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        if (isCSV) {
    
          res.write(toCsvHeader());
          
    
          for await (const batch of exportService.streamMatches(jobId, userId, query)) {
            for (const match of batch) {
              res.write(toCsvRow(match));
            }
          }
        } else {
    
          for await (const batch of exportService.streamMatches(jobId, userId, query)) {
            for (const match of batch) {
              res.write(JSON.stringify(match) + '\n');
            }
          }
        }
        
        res.end();
      } catch (error) {
        console.error('Export stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Export failed' });
        } else {
          res.destroy();
        }
      }
});