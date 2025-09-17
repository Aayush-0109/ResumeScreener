import { Request,Response,NextFunction } from "express";
import { logger } from "../utils/logger.js";

export const requestLogger = (req:Request, res: Response ,next : NextFunction)=>{
    const startTime = Date.now();
    logger.info('Request started', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        correlationId: req.correlationId,
        userId: req.user?.id || 'anonymous'
    });
    const originalSend = res.send;
    res.send = function(data){
        const duration = Date.now() - startTime;
        const contentLength = Buffer.byteLength(data ||  '', 'utf-8');

        logger.info('Request completed' , {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            contentLength,
            correlationId: req.correlationId,
            userId: req.user?.id || 'anonymous'
        });
        return originalSend.call(this,data);
    }
    req.on('close',()=>{
        if (!res.headersSent) {
            logger.warn('Request aborted', {
              method: req.method,
              url: req.url,
              duration: Date.now() - startTime,
              correlationId: req.correlationId,
              userId: req.user?.id || 'anonymous'
            });
          }
    })
    next();
}
