import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { UnauthorizedError } from '../utils/ApiError.js';
import { prisma } from '../config/db.js';

export const authMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authorization as string;
    const accessToken = req.cookies?.accessToken || authHeader?.split(" ")[1];
    if (!accessToken) throw new UnauthorizedError("Access Token Not Found");
    let payload: any;
    try {
        payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!);
    } catch (err: any) {
        if (err?.name === 'TokenExpiredError') throw new UnauthorizedError('Access token expired');
        if (err?.name === 'JsonWebTokenError') throw new UnauthorizedError('Invalid access token');
        throw err; // other unexpected errors
    };

    const user = await prisma.user.findUnique({
        where: {
            id: payload.userId
        },
        select: {
            name: true,
            email: true,
            id: true,
            role: true
        }
    })
    if (!user) throw new UnauthorizedError("User not authenticated");


    (req as any).user = user;
    next();
})