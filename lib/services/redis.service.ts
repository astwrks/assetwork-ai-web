/**
 * Redis Service for High-Performance Caching
 * Provides multi-layer caching with automatic fallback
 */

import { z } from 'zod';

// Optional Redis - gracefully degraded if not available
let Redis: any = null;
let redisEnabled = false;

try {
  Redis = require('ioredis');
  redisEnabled = process.env.REDIS_ENABLED !== 'false';
} catch {
  console.warn('⚠️  Redis not available - using in-memory cache fallback');
}

// In-memory cache fallback for development
class InMemoryCache {
  private cache = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl * 1000),
    });
  }

  async del(...keys: string[]): Promise<void> {
    keys.forEach(key => this.cache.delete(key));
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async incr(key: string): Promise<number> {
    const item = this.cache.get(key);
    const current = item ? parseInt(item.value) : 0;
    const newValue = current + 1;
    this.cache.set(key, {
      value: String(newValue),
      expiresAt: item?.expiresAt || Date.now() + 3600000,
    });
    return newValue;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      item.expiresAt = Date.now() + (ttl * 1000);
    }
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return -2;
    const remaining = Math.max(0, Math.ceil((item.expiresAt - Date.now()) / 1000));
    return remaining;
  }

  async exists(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiresAt) return 0;
    return 1;
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map(key => this.get(key)));
  }

  pipeline() {
    const commands: Array<() => Promise<any>> = [];
    return {
      setex: (key: string, ttl: number, value: string) => {
        commands.push(() => this.setex(key, ttl, value));
        return this;
      },
      set: (key: string, value: string) => {
        commands.push(() => this.setex(key, 3600, value));
        return this;
      },
      exec: async () => {
        await Promise.all(commands.map(cmd => cmd()));
        return [];
      },
    };
  }

  // PubSub methods for compatibility
  async publish(channel: string, message: string): Promise<number> {
    // In-memory implementation: emit to local subscribers only
    // In a real application, you'd need an EventEmitter here
    console.log(`[InMemoryCache] PubSub publish to ${channel}:`, message.substring(0, 100));
    return 1; // Return 1 to indicate one subscriber received it
  }

  subscribe(channel: string): void {
    console.log(`[InMemoryCache] Subscribe to channel: ${channel}`);
  }

  unsubscribe(channel: string): void {
    console.log(`[InMemoryCache] Unsubscribe from channel: ${channel}`);
  }

  // Event handler stub
  on(event: string, handler: Function): void {
    console.log(`[InMemoryCache] Event handler registered for: ${event}`);
  }
}

const inMemoryCache = new InMemoryCache();

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
};

// Create Redis clients (or use in-memory fallback)
export const redisClient = Redis && redisEnabled ? new Redis(redisConfig) : inMemoryCache;
export const redisPubClient = Redis && redisEnabled ? new Redis(redisConfig) : inMemoryCache;
export const redisSubClient = Redis && redisEnabled ? new Redis(redisConfig) : inMemoryCache;

// Cache key prefixes for organization
export const CacheKeys = {
  USER: (id: string) => `user:${id}`,
  REPORT: (id: string) => `report:${id}`,
  ENTITY: (id: string) => `entity:${id}`,
  MARKET_DATA: (symbol: string) => `market:${symbol}`,
  SESSION: (token: string) => `session:${token}`,
  RATE_LIMIT: (key: string) => `ratelimit:${key}`,
  DASHBOARD: (userId: string) => `dashboard:${userId}`,
  ANALYTICS: (metric: string) => `analytics:${metric}`,
} as const;

// Cache TTL configurations (in seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 600,         // 10 minutes
  LONG: 3600,          // 1 hour
  DAILY: 86400,        // 24 hours
  MARKET_DATA: 10,     // 10 seconds for real-time data
  USER_SESSION: 1800,  // 30 minutes
  REPORT: 7200,        // 2 hours
} as const;

/**
 * Generic cache service with automatic serialization
 */
export class CacheService {
  /**
   * Get value from cache
   */
  static async get<T>(key: string, schema?: z.ZodSchema<T>): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;

      const parsed = JSON.parse(value);
      if (schema) {
        return schema.parse(parsed);
      }
      return parsed as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  static async set<T>(
    key: string,
    value: T,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await redisClient.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  static async delete(key: string | string[]): Promise<boolean> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length === 0) return true;

      await redisClient.del(...keys);
      return true;
    } catch (error) {
      console.error(`Cache delete error:`, error);
      return false;
    }
  }

  /**
   * Clear cache by pattern
   */
  static async clearPattern(pattern: string): Promise<boolean> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache clear pattern error:`, error);
      return false;
    }
  }

  /**
   * Get or set cache value with factory function
   */
  static async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, schema);
    if (cached !== null) {
      return cached;
    }

    // Generate new value
    const value = await factory();

    // Store in cache (fire and forget)
    this.set(key, value, ttl).catch(console.error);

    return value;
  }

  /**
   * Increment counter
   */
  static async incr(key: string, ttl?: number): Promise<number> {
    try {
      const value = await redisClient.incr(key);
      if (ttl) {
        await redisClient.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set multiple values in a transaction
   */
  static async mset(
    items: Array<{ key: string; value: any; ttl?: number }>
  ): Promise<boolean> {
    try {
      const pipeline = redisClient.pipeline();

      for (const item of items) {
        const serialized = JSON.stringify(item.value);
        if (item.ttl) {
          pipeline.setex(item.key, item.ttl, serialized);
        } else {
          pipeline.set(item.key, serialized);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error(`Cache mset error:`, error);
      return false;
    }
  }

  /**
   * Get multiple values
   */
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];

      const values = await redisClient.mget(...keys);
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error(`Cache mget error:`, error);
      return keys.map(() => null);
    }
  }
}

/**
 * Pub/Sub service for real-time events
 */
export class PubSubService {
  private static subscribers = new Map<string, Set<(data: any) => void>>();

  /**
   * Publish event to channel
   */
  static async publish(channel: string, data: any): Promise<void> {
    try {
      const message = JSON.stringify(data);
      await redisPubClient.publish(channel, message);
    } catch (error) {
      console.error(`PubSub publish error for channel ${channel}:`, error);
    }
  }

  /**
   * Subscribe to channel
   */
  static subscribe(channel: string, callback: (data: any) => void): () => void {
    // Get or create subscriber set for channel
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());

      // Subscribe to Redis channel
      redisSubClient.subscribe(channel);

      // Handle messages
      redisSubClient.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const data = JSON.parse(message);
            const callbacks = this.subscribers.get(channel);
            if (callbacks) {
              callbacks.forEach(cb => cb(data));
            }
          } catch (error) {
            console.error(`PubSub message parse error:`, error);
          }
        }
      });
    }

    // Add callback to subscribers
    const callbacks = this.subscribers.get(channel)!;
    callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);

      // Unsubscribe from Redis if no more callbacks
      if (callbacks.size === 0) {
        redisSubClient.unsubscribe(channel);
        this.subscribers.delete(channel);
      }
    };
  }
}

/**
 * Rate limiting service
 */
export class RateLimitService {
  /**
   * Check if request is rate limited
   */
  static async isLimited(
    identifier: string,
    limit: number,
    window: number = 3600 // 1 hour default
  ): Promise<{ limited: boolean; remaining: number; resetAt: Date }> {
    const key = CacheKeys.RATE_LIMIT(identifier);

    try {
      const current = await CacheService.incr(key, window);
      const ttl = await redisClient.ttl(key);

      return {
        limited: current > limit,
        remaining: Math.max(0, limit - current),
        resetAt: new Date(Date.now() + ttl * 1000),
      };
    } catch (error) {
      console.error(`Rate limit check error:`, error);
      // Fail open to avoid blocking legitimate requests
      return {
        limited: false,
        remaining: limit,
        resetAt: new Date(Date.now() + window * 1000),
      };
    }
  }

  /**
   * Reset rate limit for identifier
   */
  static async reset(identifier: string): Promise<void> {
    const key = CacheKeys.RATE_LIMIT(identifier);
    await CacheService.delete(key);
  }
}

// Connection event handlers (only if real Redis is enabled)
if (Redis && redisEnabled) {
  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redisClient.on('error', (error) => {
    console.error('❌ Redis error:', error);
  });

  redisClient.on('close', () => {
    console.log('Redis connection closed');
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    if (Redis && redisEnabled) {
      await redisClient.quit();
      await redisPubClient.quit();
      await redisSubClient.quit();
    }
  });
} else {
  console.log('✅ Using in-memory cache for development');
}

export default CacheService;