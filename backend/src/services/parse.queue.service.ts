import { JobQueueStatus } from "@prisma/client";
import { prisma } from "../config/db.js";
import { NotFoundError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import redisService from "./redis.service.js";

const QUEUE_PENDING = 'queue:parse-pending'
export interface ParseStatus {
    id: string;
    status: JobQueueStatus;
    resumeIds: string[];
    processedCount: number;
    totalCount: number;
    createdAt: Date;
    startedAt?: Date | null;
    completedAt?: Date | null;
    errorMessage?: string | null;
}
class ParseQueueService {
    async enqueueParseJob(resumeIds: string[], userId: string) {

        logger.info("Enqueuing  job", {
            userId,
            service: 'parse queue'
        })
        const queue = await prisma.parseQueue.create({
            data: {
                resumeIds,
                userID: userId,
                status : 'PENDING',
                totalCount: resumeIds.length
            },
            select: {
                id: true,
            }
        })
        await redisService.lpush(QUEUE_PENDING, queue.id);

        logger.info('Job enqueued successfully', {
            queueId: queue.id,
            userId,
            service: ' parse queue'
        });

        return queue.id;
    }
    async getParseStatus(queueId: string): Promise<ParseStatus | null> {
        return await prisma.parseQueue.findUnique({
            where: { id: queueId },
            select: {
                id: true,
                status: true,
                resumeIds: true,
                processedCount: true,
                totalCount: true,
                createdAt: true,
                startedAt: true,
                completedAt: true,
                errorMessage: true
            }
        });
    }
    async getNextParseJobId(timeoutSeconds: number = 5) {
        const queueId = await redisService.brpop(QUEUE_PENDING, timeoutSeconds);
        return queueId
    }
    async markParseProcessing(queueId: string) {
        const updatedQueue = await prisma.parseQueue.update({
            where: {
                id: queueId
            },
            data: {
                status: 'PROCESSING',
                startedAt: new Date()
            }
        })
    }
    async updateParseProgress(queueId: string, processedCount: number) {
        await prisma.parseQueue.update({
            where: {
                id: queueId
            },
            data: {
                processedCount
            }
        })
    }
    async markParseCompleted(queueId: string) {
        await prisma.parseQueue.update({
            where: {
                id: queueId
            },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        })
    }
    async markParseFailed(queueId: string, error: any) {
        await prisma.parseQueue.update({
            where: {
                id: queueId
            },
            data: {
                status: 'FAILED',
                errorMessage: error.message!
            }
        })
    }

}
export default new ParseQueueService()