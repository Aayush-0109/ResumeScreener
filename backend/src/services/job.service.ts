import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";
import { CreateJobDto, ListQuery, UpdateJobDto } from "../types/job.types.js";
import { ForbiddenError, NotFoundError } from "../utils/ApiError.js";
import { SearchQuery } from "../types/general.types.js";

export class JobService {
    async create(userId: string, dto: CreateJobDto) {
        const job = await prisma.job.create({ data: { ...dto, userId } });
        return job;
    }
    async list(userId: string, query : SearchQuery) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
        const skip = (page - 1) * limit;
        const q = query.q?.trim();

        const whereClause: Prisma.JobWhereInput = {
            userId,
            ...(q && {
                OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                    { requirements: { contains: q, mode: 'insensitive' } }
                ]
            })
            // todo : apply filtter
        }
        const orderBy: Prisma.JobOrderByWithRelationInput[] =
            (query.sort && query.sort.length)
                ? query.sort.map(s => ({ [s.field]: (s.order || 'asc') as any }))
                : [{ createdAt: 'desc' }];

        const [data, total] = await Promise.all([
            prisma.job.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy
            }),
            prisma.job.count({
                where: whereClause,
                skip,
                take: limit
            })
        ])
        return { data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 };
    }
    async getById(id: string, userId: string) {
        const job = await prisma.job.findFirst({ where: { id, userId } });
        if (!job) throw new NotFoundError('Job not found');
        return job;
    }
    async update(id: string, userId: string, dto: UpdateJobDto) {
        const exists = await prisma.job.findUnique({ where: { id } });
        if (!exists) throw new NotFoundError('Job not found');
        if (exists.userId !== userId) throw new ForbiddenError('Not allowed');
        const job = await prisma.job.update({ where: { id }, data: dto });
        return job;
    }
    async remove(id: string, userId: string) {
        const exists = await prisma.job.findUnique({ where: { id } });
        if (!exists) throw new NotFoundError('Job not found');
        if (exists.userId !== userId) throw new ForbiddenError('Not allowed');
        await prisma.job.delete({ where: { id } });
        return { deleted: true };
    }
}