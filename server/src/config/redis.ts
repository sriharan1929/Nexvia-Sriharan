import Redis from 'ioredis';
import env from './env';

let redis: Redis | null = null;

const connectRedis = (): Redis => {
  if (redis) return redis;

  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
  });

  redis.on('connect', () => console.log('[Redis] Connected'));
  redis.on('error', (err) => console.error('[Redis] Error:', err.message));

  return redis;
};

export const getRedis = (): Redis => {
  if (!redis) return connectRedis();
  return redis;
};

export default connectRedis;
