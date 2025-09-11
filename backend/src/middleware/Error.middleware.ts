import { Request, Response, NextFunction } from "express"
import { ApiError, NotFoundError } from "../utils/ApiError.js"


export const notFound = (req: Request, res: Response, next: NextFunction) => {
    return next(new NotFoundError("Route not found"));
}
  

export const errorMiddleware = (error: Error | ApiError, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            success : false,
            message: error.message,
            errors: error.errors,
            isOperational: error.isOperational
        })
    }
    else {
        res.status(500).json({
            isOperational : false,
            message : error.message,
            success : false
        })
    }
}