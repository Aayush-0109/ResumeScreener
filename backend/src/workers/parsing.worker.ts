import { randomUUID } from "crypto";
import redisService from "../services/redis.service.js";
import { logger } from "../utils/logger.js";
import parseQueueService from "../services/parse.queue.service.js";
import resumeService from "../services/resume.service.js";

const WORKER_ID = `parse-worker-${process.pid}-${randomUUID()}`;

let isShuttingDown = false;

logger.info('Parse worker starting up', {
    workerId: WORKER_ID,
    pid: process.pid,
    service: 'parse-worker'
});

const processParseQueueItem = async (queueId: string) => {
    const locked = await redisService.setWorkerLock(WORKER_ID, queueId, 300);
    if (!locked) return;

    if (isShuttingDown) {
        logger.info('Shutdown in progress, skipping parse job', { queueId, workerId: WORKER_ID });
        await redisService.releaseWorkerLock(WORKER_ID);
        return;
    }

    logger.info('Parse worker processing job', {
        queueId,
        workerId: WORKER_ID,
        service: 'parse-worker'
    });
  
    try {
        await resumeService.processParseQueueJob(queueId);

    } catch (error: any) {
        logger.error('Parse worker job failed', {
            queueId,
            error: error.message,
            service: 'parse-worker'
        });

        await parseQueueService.markParseFailed(queueId, error.message);
    } finally {
        await redisService.releaseWorkerLock(WORKER_ID);
    }
};

const loop = async () => {
    logger.info('Parse worker started and ready for jobs', {
        workerId: WORKER_ID,
        queue: 'queue:parse-pending'
    });

    while (!isShuttingDown) {
        const queueId = await parseQueueService.getNextParseJobId(5);
        if (!queueId) continue;

        await processParseQueueItem(queueId);
    }

    logger.info('Parse worker loop ended', { workerId: WORKER_ID });
};

const gracefulWorkerShutdown = async (signal: string): Promise<void> => {
    logger.info('Parse worker shutdown signal received', {
        signal,
        workerId: WORKER_ID
    });

    isShuttingDown = true;

    let attempts = 0;
    while (attempts < 30) {
        const currentLock = await redisService.redis.get(`lock:worker:${WORKER_ID}`);
        if (!currentLock) {
            logger.info('No active parse job, worker can shutdown');
            break;
        }

        logger.info('Waiting for current parse job to complete', {
            currentJob: currentLock,
            attempt: attempts + 1
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    await redisService.releaseWorkerLock(WORKER_ID);

    logger.info('Parse worker shutdown completed', { workerId: WORKER_ID });
    process.exit(0);
};

process.on('SIGTERM', () => gracefulWorkerShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulWorkerShutdown('SIGINT'));

loop().catch(err => {
    logger.error('Parse worker crashed', {
        error: err.message,
        workerId: WORKER_ID
    });
    process.exit(1);
});