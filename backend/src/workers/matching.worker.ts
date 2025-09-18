import { randomUUID } from 'crypto';
import redisService from '../services/redis.service.js';
import service from '../services/matching.service.js';
import matchQueueService from '../services/match.queue.service.js';  // ✅ Use queue service
import { logger } from '../utils/logger.js';

const WORKER_ID = `worker-${process.pid}-${randomUUID()}`;

let isShuttingDown = false;

logger.info('Matching worker starting up', {
  workerId: WORKER_ID,
  pid: process.pid,
  service: 'matching-worker'
});

async function processQueueItem(queueId: string) {
  const locked = await redisService.setWorkerLock(WORKER_ID, queueId, 300);
  if (!locked) return;

  if (isShuttingDown) {
    logger.info('Shutdown in progress, skipping job', { queueId, workerId: WORKER_ID });
    await redisService.releaseWorkerLock(WORKER_ID);
    return;
  }

  logger.info('Worker processing job', {
    queueId,
    workerId: WORKER_ID,
    service: 'worker'
  });

  try {

    const job = await matchQueueService.getJobStatus(queueId);
    if (!job) return;
    if (['CANCELLED', 'COMPLETED', 'FAILED'].includes(job.status)) return;


    await matchQueueService.markProcessing(queueId);

    if (isShuttingDown) {
      logger.info('Shutdown during processing, marking job as pending', { queueId });

      await matchQueueService.markPending(queueId);
      await redisService.lpush('queue:pending', queueId);
      return;
    }


    const result = await service.matchJobForUserViaAI(
      job.jobId,
      job.userId,
      {
        topN: job.topN ?? undefined,
        weights: job.weights ?? undefined,
        insightsTopK: job.insightsTopK ?? 5
      }
    );


    await matchQueueService.markCompleted(queueId, result);

    logger.info('Worker job completed', {
      queueId,
      jobId: job.jobId,
      matchCount: result.matched?.length || 0,
      service: 'worker'
    });

  } catch (e: any) {
    logger.error('Worker job failed', {
      queueId,
      error: e.message,
      service: 'worker'
    });


    await matchQueueService.markFailed(queueId, e?.message ?? 'Unknown error');
  } finally {
    await redisService.releaseWorkerLock(WORKER_ID);
  }
}

async function loop() {
  logger.info('Matching worker started and ready for jobs', {
    workerId: WORKER_ID,
    queue: 'queue:pending'
  });

  while (!isShuttingDown) {
    const queueId = await matchQueueService.getNextJobId(5);
    if (!queueId) continue;

    await processQueueItem(queueId);
  }

  logger.info('Matching worker loop ended', { workerId: WORKER_ID });
}


const gracefulWorkerShutdown = async (signal: string): Promise<void> => {
  logger.info('Worker shutdown signal received', {
    signal,
    workerId: WORKER_ID
  });

  isShuttingDown = true;

  let attempts = 0;
  while (attempts < 30) {
    const currentLock = await redisService.redis.get(`lock:worker:${WORKER_ID}`);
    if (!currentLock) {
      logger.info('No active job, worker can shutdown');
      break;
    }

    logger.info('Waiting for current job to complete', {
      currentJob: currentLock,
      attempt: attempts + 1
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }

  await redisService.releaseWorkerLock(WORKER_ID);

  logger.info('Worker shutdown completed', { workerId: WORKER_ID });
  process.exit(0);
};

process.on('SIGTERM', () => gracefulWorkerShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulWorkerShutdown('SIGINT'));

loop().catch(err => {
  logger.error('Worker crashed', {
    error: err.message,
    workerId: WORKER_ID
  });
  process.exit(1);
});