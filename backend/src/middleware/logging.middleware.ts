import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Only log request completion (not start) to reduce duplicate logs
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        const contentLength = Buffer.byteLength(data || '', 'utf-8');

        logger.info('Request', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength,
            correlationId: req.correlationId,
            userId: req.user?.id || 'anonymous'
        });
        return originalSend.call(this, data);
    }

    req.on('close', () => {
        if (!res.headersSent) {
            logger.warn('Request aborted', {
                method: req.method,
                url: req.url,
                duration: `${Date.now() - startTime}ms`,
                correlationId: req.correlationId,
                userId: req.user?.id || 'anonymous'
            });
        }
    })
    next();
}
