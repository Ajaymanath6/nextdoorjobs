import { redis } from '../redis';

/**
 * CacheService - Centralized caching with Redis and in-memory fallback
 * 
 * Provides a consistent caching interface that works with or without Redis.
 * Falls back to in-memory Map when Redis is unavailable (dev mode).
 */
class CacheService {
  constructor() {
    this.redis = redis;
    this.memoryCache = new Map(); // Fallback for dev without Redis
    this.memoryTimestamps = new Map(); // Track TTLs for memory cache
  }

  /**
   * Get a cached value by key
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} - Cached value or null if not found/expired
   */
  async get(key) {
    if (!this.redis) {
      // Memory fallback: check TTL
      const timestamp = this.memoryTimestamps.get(key);
      if (timestamp && Date.now() > timestamp) {
        this.memoryCache.delete(key);
        this.memoryTimestamps.delete(key);
        return null;
      }
      return this.memoryCache.get(key) ?? null;
    }
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.error(`Cache get error for key ${key}:`, err.message);
      return null;
    }
  }

  /**
   * Set a cached value with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON serialized)
   * @param {number} ttlSeconds - Time to live in seconds (default: 300 = 5 min)
   */
  async set(key, value, ttlSeconds = 300) {
    if (!this.redis) {
      // Memory fallback
      this.memoryCache.set(key, value);
      this.memoryTimestamps.set(key, Date.now() + ttlSeconds * 1000);
      
      // Auto-cleanup after TTL
      setTimeout(() => {
        this.memoryCache.delete(key);
        this.memoryTimestamps.delete(key);
      }, ttlSeconds * 1000);
      return;
    }
    
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.error(`Cache set error for key ${key}:`, err.message);
    }
  }

  /**
   * Delete a cached value by key
   * @param {string} key - Cache key to delete
   */
  async del(key) {
    if (!this.redis) {
      this.memoryCache.delete(key);
      this.memoryTimestamps.delete(key);
      return;
    }
    
    try {
      await this.redis.del(key);
    } catch (err) {
      console.error(`Cache del error for key ${key}:`, err.message);
    }
  }

  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Redis key pattern (e.g., "user:*")
   */
  async delPattern(pattern) {
    if (!this.redis) {
      // Memory fallback: clear all matching keys
      const keysToDelete = [];
      for (const key of this.memoryCache.keys()) {
        // Simple pattern matching: convert * to regex
        const regexPattern = pattern.replace(/\*/g, '.*');
        if (new RegExp(`^${regexPattern}$`).test(key)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => {
        this.memoryCache.delete(key);
        this.memoryTimestamps.delete(key);
      });
      return;
    }
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      console.error(`Cache delPattern error for pattern ${pattern}:`, err.message);
    }
  }

  /**
   * Cache wrapper - get from cache or fetch and cache
   * @param {string} key - Cache key
   * @param {number} ttlSeconds - Time to live in seconds
   * @param {Function} fetchFn - Async function to fetch data if not cached
   * @returns {Promise<any>} - Cached or fetched value
   */
  async wrap(key, ttlSeconds, fetchFn) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

export const cacheService = new CacheService();
