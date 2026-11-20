import Redis from 'ioredis';
import env from './env';

let redis: Redis | null = null;
let isRedisAvailable = false;

const connectRedis = (): Redis => {
  if (redis) return redis;

  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 1) return null;
      return 200;
    },
  });

  redis.on('connect', () => {
    isRedisAvailable = true;
    console.log('[Redis] Connected');
  });

  redis.on('error', (_err) => {
    isRedisAvailable = false;
  });

  redis.connect().catch(() => {
    isRedisAvailable = false;
  });

  return redis;
};

export const isRedisOnline = (): boolean => isRedisAvailable;

export const getRedis = (): Redis => {
  if (!redis) return connectRedis();
  return redis;
};

export default connectRedis;
