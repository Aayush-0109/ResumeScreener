import { rateLimit } from "express-rate-limit";
import { ApiResponse } from "../utils/ApiResponse.js";

export const strictLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req, res) => {
        return `${req.method}::${req.route?.path || req.path}::${(req as any).user?.id || req.ip || 'unknown'}`
    },

    handler: (req: any, res: any) => {
        const retryAfter = Math.ceil((req.rateLimit.resetTime?.getTime() - Date.now()) / 1000) || 900;
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json(new ApiResponse(429, 'Too many requests', undefined, undefined));
    },
    message: {
        success: false,
        message: 'Too many attempts from this IP. Please try again in 15 minutes.',
        errors: [{
            field: 'rateLimit',
            message: 'Request limit exceeded'
        }]
    },
    legacyHeaders: false,
    standardHeaders: true
})
export const moderateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    skipSuccessfulRequests: true,
    keyGenerator: (req, res) => {
        return `${req.method}::${req.route?.path || req.path}::${(req as any).user?.id || req.ip}`
    },
    message: {
        success: false,
        message: 'Too many attempts from this IP. Please try again in 15 minutes.',
        errors: [{
            field: 'rateLimit',
            message: 'Request limit exceeded'
        }]
    },
    legacyHeaders: false,
    standardHeaders: true
})

export const gentleLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    skipSuccessfulRequests: true,
    keyGenerator: (req, res) => {
        return `${req.method}::${req.route?.path || req.path}::${(req as any).user?.id || req.ip}`
    },
    message: {
        success: false,
        message: 'Too many attempts from this IP. Please try again in 15 minutes.',
        errors: [{
            field: 'rateLimit',
            message: 'Request limit exceeded'
        }]
    },
    legacyHeaders: false,
    standardHeaders: true
})

export const uploaderLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipFailedRequests: true,
    keyGenerator: (req, res) => {
        return `${req.method}::${req.route?.path || req.path}::${(req as any).user?.id || req.ip || 'unknown'}`
    },
    message: {
        success: false,
        message: 'Too many attempts from this IP. Please try again in 15 minutes.',
        errors: [{
            field: 'rateLimit',
            message: 'Request limit exceeded'
        }]
    },
    legacyHeaders: false,
    standardHeaders: true
})
