import { access } from "fs";
import { AuthService } from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { CookieOptions, Request, Response } from 'express';
import { logger } from '../utils/logger.js';  // ✅ Add this import

const isProd = process.env.NODE_ENV === 'production'
const secureFlag = (process.env.COOKIE_SECURE === 'true') || isProd
const sameSiteValue = secureFlag ? 'none' : 'lax'
const cookieOption: CookieOptions = {
    httpOnly: true,
    secure: secureFlag,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: sameSiteValue
}

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

   
    logger.info('User registration started', {
        email,
        name,
        correlationId: req.correlationId
    });

    const result = await AuthService.register(email, password, name);

    
    logger.info('User registration completed', {
        userId: result.id,
        email,
        correlationId: req.correlationId
    });

    res.status(201).json(new ApiResponse(201, "User registered successfully", result));
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

   
    logger.info('User login started', {
        email,
        correlationId: req.correlationId
    });

    const { user, accessToken, refreshToken } = await AuthService.login(email, password);

    
    logger.info('User login completed', {
        userId: user.id,
        email: user.email,
        correlationId: req.correlationId
    });

    res.cookie("refreshToken", refreshToken, cookieOption)
        .cookie("accessToken", accessToken, cookieOption)
        .status(200).json(new ApiResponse(200, "Login successful", user));
});
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken
    const { updatedUser, newAccessToken, newRefreshToken } = await AuthService.refreshAccessToken(refreshToken)
    res.cookie("refreshToken", newRefreshToken, cookieOption)
        .cookie("accessToken", newAccessToken, cookieOption)
        .status(200).json(new ApiResponse(200, "Token refreshed successfully", updatedUser))
})
export const logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await AuthService.logout(userId);

    res.clearCookie("accessToken").clearCookie("refreshToken").json(new ApiResponse(200, 'Logout successful', result));
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const user = await AuthService.getUserById(userId);

    res.json(new ApiResponse(200, 'Profile retrieved successfully', user));
});