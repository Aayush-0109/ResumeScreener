import  service  from "../services/resume.service.js";
import { ValidationError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Request, Response } from 'express'
import { ListMyResumesQuery } from '../types/resume.types.js';
import redisService from "../services/redis.service.js";



export const uploadMany = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const userId = (req as any).user.id;

  if (!files.length) throw new ValidationError("No files provided");

  const inputs = files.map(f => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalname: f.originalname
  }))
  const result = await service.uploadMany(inputs, userId);
  await redisService.delPattern(`${userId}/GET//resume/my*`)
  return res.status(201).json(new ApiResponse(201, 'Uploaded', result));
})
export const listMyResumes = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const query = req.query as unknown as ListMyResumesQuery;
  const result = await service.listMyResumes(userId, query);
  return res.json(new ApiResponse(200, 'Resumes retrieved', result));
});

export const removeOne = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const result = await service.deleteById(id, userId);
  await redisService.delPattern(`${(req as any).id}/GET//resume/my*`)
  return res.json(new ApiResponse(200, 'Deleted', result));
};

export const clearMyResumes = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await service.clearUserResumes(userId);
  await redisService.delPattern(`${(req as any).id}/GET//resume/my*`)
  return res.json(new ApiResponse(200, 'Session cleared', result));
});