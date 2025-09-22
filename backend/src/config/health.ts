import { Env } from "../types/zod/env.schema.js"
import { InternalServerError } from "../utils/ApiError.js";
import { prisma } from "./db.js";
import { redisClient } from "./redis.js";

export const validateConnections = async (env: Env): Promise<void> => {
  const checks = [];
  checks.push(
    prisma.$queryRaw`SELECT 1`
      .then(() => console.log('✅ Database connection OK'))
      .catch((err: Error) => {
        console.error('❌ Database connection failed:', err.message);
        throw new InternalServerError('Database unreachable');
      })
  );

  checks.push(
    redisClient.ping().then(() => ({ service: 'redis', status: 'healthy' }))
      .catch((error: any) => ({ service: 'redis', status: 'unhealthy', error: error.message }))
  );

  checks.push(
    fetch(`${env.AI_SERVICE_URL}/health`).then(r =>
      r.ok ? { service: 'ai-service', status: 'healthy' }
        : { service: 'ai-service', status: 'unhealthy', error: `HTTP ${r.status}` }
    ).catch((error: any) => ({ service: 'ai-service', status: 'unhealthy', error: error.message }))
  );

  try {
    await Promise.all(checks);
    console.log('🚀 All services healthy');
  } catch (error) {
    console.error('💥 Startup failed - fix connections and restart');
    process.exit(1);
  }

}