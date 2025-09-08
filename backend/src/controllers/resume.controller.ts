import { ResumeService } from "../services/resume.service.js";
import { ValidationError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import {Request,Response} from 'express'
const service = new ResumeService();

export const uploadMany = asyncHandler(async(req:Request , res  : Response)=>{
    const files = (req.files as Express.Multer.File[]) || [];
    const userId = (req as any).user.id;

    if(!files.length)  throw new ValidationError("No files provided");

    const inputs = files.map(f=>({
        buffer: f.buffer,
    mimetype: f.mimetype,
    originalname: f.originalname
    }))
    const result = await service.uploadMany(inputs, userId);
    return res.status(201).json(new ApiResponse(201, 'Uploaded', result));
})
export const listMine = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { page, limit } = req.query as any;
    const result = await service.listMyResumes(userId, { page, limit });
    return res.json(new ApiResponse(200, 'OK', result));
  };
  
  export const removeOne = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const result = await service.deleteById(id, userId);
    
    return res.json(new ApiResponse(200, 'Deleted', result));
  };