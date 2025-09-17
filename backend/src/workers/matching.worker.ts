import { randomUUID } from 'crypto';
import redisService from '../services/redis.service.js';
import service from '../services/matching.service.js';
import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';

const WORKER_ID = `worker-${process.pid}-${randomUUID()}`;
const QUEUE = 'queue:pending';

async function processQueueItem(queueId: string) {
  const locked = await redisService.setWorkerLock(WORKER_ID, queueId, 300);
  if (!locked) {
    logger.debug('Job already locked by another worker', {
      queueId,
      workerId: WORKER_ID,
      service: 'worker'
    });
    return;
  }


  logger.info('Worker processing job', {
    queueId,
    workerId: WORKER_ID,
    service: 'worker'
  });

  try {
    const job = await prisma.jobQueue.findUnique({ where: { id: queueId } });
    if (!job) {
      logger.warn('Queue job not found', { queueId, service: 'worker' });
      return;
    }

    if (['CANCELLED', 'COMPLETED', 'FAILED'].includes(job.status)) {
      logger.info('Job already processed, skipping', {
        queueId,
        status: job.status,
        service: 'worker'
      });
      return;
    }

    await prisma.jobQueue.update({
      where: { id: queueId },
      data: { status: 'PROCESSING', startedAt: new Date() }
    });


    logger.info('Starting AI matching for queued job', {
      queueId,
      jobId: job.jobId,
      userId: job.userId,
      service: 'worker'
    });

    const startTime = Date.now();
    const result = await service.matchJobForUserViaAI(
      job.jobId,
      job.userId,
      {
        topN: job.topN ?? undefined,
        weights: (job.weights as any) ?? undefined,
        insightsTopK: job.insightsTopK ?? 5
      }
    );
    const duration = Date.now() - startTime;

    await prisma.jobQueue.update({
      where: { id: queueId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        resultData: result
      }
    });


    logger.info('Worker job completed successfully', {
      queueId,
      jobId: job.jobId,
      matchCount: result.matched?.length || 0,
      duration,
      service: 'worker'
    });

  } catch (e: any) {

    logger.error('Worker job failed', {
      queueId,
      error: e.message,
      stack: e.stack,
      service: 'worker'
    });

    await prisma.jobQueue.update({
      where: { id: queueId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: e?.message ?? 'Unknown error'
      }
    });
  } finally {
    await redisService.releaseWorkerLock(WORKER_ID);
  }
}

async function loop() {
  while (true) {
    const queueId = await redisService.brpop(QUEUE, 5);
    if (!queueId) continue;
    await processQueueItem(queueId);
  }
}

loop().catch(err => {
  console.error('Worker crashed', err);
  process.exit(1);
});