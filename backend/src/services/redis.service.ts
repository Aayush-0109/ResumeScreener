import { redisClient } from "../config/redis.js"
import { Redis } from "ioredis";
import { ApiResponse } from "../utils/ApiResponse.js";
import { InternalServerError } from "../utils/ApiError.js";
class RedisService {
  redis: Redis;

  constructor(client: Redis) {
    this.redis = client
  }

  async set(key: string, data: any, ttl: number = 300) {
    const jsonData = JSON.stringify(data)
    try {
      console.log("SET  : " + data);

      const result = await this.redis.setex(key, ttl, jsonData)
      if (result != "OK") throw new InternalServerError("Error in setting cache");
      return result;
    } catch (e: any) {
      console.log(e.message);
    }
  }
  async get(key: string) {
    try {
      const cacheData = await this.redis.get(key);
      const parsedData = cacheData ? JSON.parse(cacheData) : null;
      console.log(key + " " + cacheData);

      return parsedData

    } catch (error: any) {
      console.log(error.message);

    }
  }
  async del(key: string) {
    try {
      await this.redis.unlink(key);
      console.log("DEL : " + key);

    } catch (error: any) {
      console.log(error.message)
    }
  }
  async delPattern(pattern: string) {
    try {
      console.log("DEL : " + pattern);

      const keys = await this.redis.keys(pattern);
      if (keys.length) {
        const result = await this.redis.unlink(keys);
        console.log("DELPATTERN : " + pattern + " " + result);
      }
    } catch (error: any) {
      console.log(error.message);

    }
  }
  async lpush(queueName: string, value: string): Promise<number> {
    try {
      const result = await this.redis.lpush(queueName, value);
      console.log(`LPUSH ${queueName}: ${value}`);
      return result
    } catch (error: any) {
      console.log(`LPUSH error: ${error.message}`);
      throw error;
    }
  }
  async rpop(queueName: string): Promise<string | null> {
    try {
      const result = await this.redis.rpop(queueName);
      console.log(`RPOP ${queueName}: ${result}`);
      return result;
    } catch (error: any) {
      console.log(`RPOP error: ${error.message}`);
      return null;
    }
  }

  async brpop(queueName: string, timeout: number = 5): Promise<string | null> {
    try {
      const result = await this.redis.brpop(queueName, timeout);
      if (result && result.length > 1) {
        console.log(`BRPOP ${queueName}: ${result[1]}`);
        return result[1];
      }
      return null;
    } catch (error: any) {
      console.log(`BRPOP error: ${error.message}`);
      return null;
    }
  }

  async lrem(queueName: string, count: number, value: string): Promise<number> {
    try {
      const result = await this.redis.lrem(queueName, count, value);
      console.log(`LREM ${queueName}: removed ${result} instances of ${value}`);
      return result;
    } catch (error: any) {
      console.log(`LREM error: ${error.message}`);
      return 0;
    }
  }
  async llen(queueName: string): Promise<number> {
    try {
      const result = await this.redis.llen(queueName);
      console.log(`LLEN ${queueName}: ${result}`);
      return result;
    } catch (error: any) {
      console.log(`LLEN error: ${error.message}`);
      return 0;
    }
  }
  
  async setWorkerLock(workerId: string, queueId: string, ttl: number = 300): Promise<boolean> {
    try {
      const key = `lock:worker:${workerId}`;
      const result = await this.redis.set(key, queueId, 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error: any) {
      console.log(`Set worker lock error: ${error.message}`);
      return false;
    }
  }

  async releaseWorkerLock(workerId: string): Promise<void> {
    try {
      const key = `lock:worker:${workerId}`;
      await this.redis.del(key);
      console.log(`Released worker lock: ${workerId}`);
    } catch (error: any) {
      console.log(`Release worker lock error: ${error.message}`);
    }
  }

}

export default new RedisService(redisClient)