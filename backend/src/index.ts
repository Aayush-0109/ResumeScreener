
import dotenv from "dotenv"
import app from "./app.js";
import { connectDB, prisma } from "./config/db.js";
import { redisClient } from "./config/redis.js";
import { validateEnv } from "./config/env.js";
import { validateConnections } from "./config/health.js";
import { logger } from "./utils/logger.js";

dotenv.config();

let server: any;

const startServer = async () => {
    const env = validateEnv();
    logger.info('Starting server', {
        environment: env.NODE_ENV,
        port: env.PORT,
        service: 'backend'
    });

    await connectDB();
    await redisClient.connect();
    await validateConnections(env);

    server = app.listen(env.PORT, () => {
        logger.info('Server started successfully', {
            port: env.PORT,
            environment: env.NODE_ENV,
            service: 'backend'
        });
    });
}

const gracefulShutdown = async (signal: string) => {
    logger.info('Shutdown signal received', {
        signal,
        service: 'backend'
    });

    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed');

            try {
                await prisma.$disconnect();
                logger.info('Database connection closed');

                await redisClient.quit();
                logger.info('Redis connection closed');

                logger.info('Graceful shutdown completed');
                process.exit(0);
            } catch (error: any) {
                logger.error('Error during shutdown', {
                    error: error.message,
                    service: 'backend'
                });
                process.exit(1);
            }
        });
    }

    setTimeout(() => {
        logger.error('Forced shutdown after timeout', {
            signal,
            service: 'backend'
        });
        process.exit(1);
    }, 30000);
};


process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
        service: 'backend'
    });
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', {
        reason: reason,
        service: 'backend'
    });
    process.exit(1);
});

startServer().catch((err: Error) => {
    logger.error('Startup failed', {
        error: err.message,
        stack: err.stack,
        service: 'backend'
    });
    process.exit(1);
});