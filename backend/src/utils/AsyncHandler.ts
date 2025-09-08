import { ApiError } from "./ApiError.js";
import { Request, Response, NextFunction } from 'express';
export const asyncHandler = (fn:Function )=> async (req:Request,res:Response,next:NextFunction)=>{
          Promise.resolve(fn(req,res,next)).catch((err: ApiError | Error)=>{
            if(err instanceof ApiError) return next(err);
            else return next(new ApiError(500 , err.message));
          })
}