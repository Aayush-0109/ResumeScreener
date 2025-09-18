import { prisma } from '../config/db.js';
import { JobQueueStatus } from '@prisma/client';
import redisService from './redis.service.js';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';

const QUEUE_PENDING = 'queue:pending';

export interface QueueJobOptions {
    topN?: number;
    weights?: Record<string, number>;
    insightsTopK?: number;
}

export interface JobStatus {
    id: string;
    jobId: string;
    userId: string;
    topN?: number | null;
    weights?: any;
    insightsTopK?: number | null;
    status: JobQueueStatus;
    createdAt: Date;
    startedAt?: Date | null;
    completedAt?: Date | null;
    errorMessage?: string | null;
}

class MatchQueueService {

    async enqueueJob(jobId: string, userId: string, opts: QueueJobOptions = {}): Promise<string> {

        logger.info('Enqueuing job', {
            jobId,
            userId,
            options: opts,
            service: 'match queue'
        });

        const queueJob = await prisma.jobQueue.create({
            data: {
                jobId,
                userId,
                status: 'PENDING',
                topN: opts.topN ?? null,
                weights: opts.weights as Prisma.InputJsonValue ?? null,
                insightsTopK: opts.insightsTopK ?? 5
            },
            select: { id: true }
        });

        await redisService.lpush(QUEUE_PENDING, queueJob.id);


        logger.info('Job enqueued successfully', {
            queueId: queueJob.id,
            jobId,
            userId,
            service: 'queue'
        });

        return queueJob.id;
    }

    async getJobStatus(queueId: string): Promise<JobStatus | null> {
        return await prisma.jobQueue.findUnique({
            where: { id: queueId },
            select: {
                id: true,
                jobId: true,
                userId: true,
                topN: true,
                weights: true,
                insightsTopK: true,
                status: true,
                createdAt: true,
                startedAt: true,
                completedAt: true,
                errorMessage: true
            }
        });
    }

    async cancelJob(queueId: string): Promise<boolean> {

        logger.info('Cancelling job', {
            queueId,
            service: 'queue'
        });

        const updated = await prisma.jobQueue.updateMany({
            where: { id: queueId, status: { in: ['PENDING', 'PROCESSING'] } },
            data: { status: 'CANCELLED', completedAt: new Date() }
        });

        await redisService.lrem(QUEUE_PENDING, 0, queueId);

        const success = updated.count > 0;


        logger.info('Job cancellation completed', {
            queueId,
            success,
            service: 'queue'
        });

        return success;
    }


    async getNextJobId(timeoutSeconds: number = 5): Promise<string | null> {
        const id = await redisService.brpop(QUEUE_PENDING, timeoutSeconds);
        return id;
    }


    async markProcessing(queueId: string): Promise<void> {
        await prisma.jobQueue.update({
            where: { id: queueId },
            data: { status: 'PROCESSING', startedAt: new Date() }
        });
    }
    async markPending(queueId: string) {
        await prisma.jobQueue.update({
            where: { id: queueId },
            data: { status: 'PENDING' }
        });
    }

    async markCompleted(queueId: string, resultData: any): Promise<void> {
        await prisma.jobQueue.update({
            where: { id: queueId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                resultData
            }
        });
    }


    async markFailed(queueId: string, message: string): Promise<void> {
        await prisma.jobQueue.update({
            where: { id: queueId },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
                errorMessage: message
            }
        });
    }
}

export default new MatchQueueService();