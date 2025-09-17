import winston from 'winston'

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({stack : true}),
    process.env.NODE_ENV === 'production'
    ? winston.format.json() : winston.format.combine( 
        winston.format.colorize(),
        winston.format.printf(({timestamp , level,message , ...meta})=>{
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
    )
);

export const logger = winston.createLogger({
    level : process.env.LOG_LEVEL || 'info',
    format : logFormat,
    transports : [
        new winston.transports.Console(),
        
    ]
});

export const logWithContext = (level: string, message: string, context: Record<string, any> = {})=>{
    logger.log(level,message,{
        ...context,
        service : 'backend',
        pid : process.pid
    })
}