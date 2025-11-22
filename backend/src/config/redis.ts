import { Redis } from "ioredis"

// Parse REDIS_URL if provided, otherwise use individual env vars
const redisUrl = process.env.REDIS_URL;

let redisClient: Redis;

if (redisUrl) {
    // Pass URL as first argument, options as second
    redisClient = new Redis(redisUrl, {
        lazyConnect: true
    });
} else {
    // Fall back to individual env vars
    redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        lazyConnect: true
    });
}

export { redisClient };
