import { randomUUID } from 'crypto';
import redisService from '../services/redis.service.js';
import service from '../services/matching.service.js';
import { prisma } from '../config/db.js';

const WORKER_ID = `worker-${process.pid}-${randomUUID()}`;
const QUEUE = 'queue:pending';

async function processQueueItem(queueId: string) {
  const locked = await redisService.setWorkerLock(WORKER_ID, queueId, 300);
  if (!locked) return; // another worker is processing

  try {
    const job = await prisma.jobQueue.findUnique({ where: { id: queueId } });
    if (!job) return;
    if (['CANCELLED', 'COMPLETED', 'FAILED'].includes(job.status)) return;

    await prisma.jobQueue.update({
      where: { id: queueId },
      data: { status: 'PROCESSING', startedAt: new Date() }
    });

    const result = await service.matchJobForUserViaAI(
      job.jobId,
      job.userId,
      {
        topN: job.topN ?? undefined,
        weights: (job.weights as any) ?? undefined,
        insightsTopK: job.insightsTopK ?? 5
      }
    );

    await prisma.jobQueue.update({
      where: { id: queueId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        resultData: result
      }
    });
  } catch (e: any) {
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