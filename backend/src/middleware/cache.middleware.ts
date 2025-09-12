import { NextFunction ,Request , Response } from "express";
import redisService from "../services/redis.service.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const cacheResponse = (ttl : number) => asyncHandler(async (req : Request  , res :Response, next : NextFunction)=>{
     const key = `${(req as any).user.id}/${req.method}/${req.url}`
    const result =  await redisService.get(key);
    if(result){
       
      return  res.status(200).json(result);
    }

     const Json =res.json;
     res.json  = function (response : ApiResponse<any>){
         redisService.set(key,response,ttl);
        return Json.call(this,response);
     }; 
     next();

})