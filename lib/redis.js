import Redis from 'ioredis';

const globalForRedis = globalThis;

export const redis = globalForRedis.redis || (() => {
  if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set, caching will use in-memory fallback');
    return null;
  }
  
  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableOfflineQueue: false,
    lazyConnect: true,
  });
  
  client.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });
  
  client.on('connect', () => {
    console.log('✅ Redis connected');
  });
  
  client.on('ready', () => {
    console.log('✅ Redis ready');
  });
  
  // Connect async
  client.connect().catch((err) => {
    console.error('❌ Redis connection failed:', err.message);
  });
  
  return client;
})();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
