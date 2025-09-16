import { Env } from "../types/zod/env.schema.js"
import {  InternalServerError } from "../utils/ApiError.js";
import { prisma } from "./db.js";
import { redisClient } from "./redis.js";

export const validateConnections = async (env : Env) :Promise<void> => {
  const checks = [];
  checks.push(
    prisma.$queryRaw`SELECT 1`
      .then(() => console.log('✅ Database connection OK'))
      .catch((err: Error) => {
        console.error('❌ Database connection failed:', err.message);
        throw new InternalServerError('Database unreachable');
      })
  );
  
  // Redis connectivity
  checks.push(
    redisClient.ping()
      .then(() => console.log('✅ Redis connection OK'))
      .catch((err: Error) => {
        console.error('❌ Redis connection failed:', err.message);
        throw new InternalServerError('Redis unreachable');
      })
  );
  
  // AI Service connectivity
  checks.push(
    fetch(`${env.AI_SERVICE_URL}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        console.log('✅ AI Service connection OK');
      })
      .catch((err: Error) => {
        console.error('❌ AI Service connection failed:', err.message);
        throw new InternalServerError('AI Service unreachable');
      })
  );
  
  try {
    await Promise.all(checks);
    console.log('🚀 All services healthy');
  } catch (error) {
    console.error('💥 Startup failed - fix connections and restart');
    process.exit(1);
  }
  
}