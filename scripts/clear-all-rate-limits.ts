#!/usr/bin/env tsx

/**
 * Script to clear ALL rate limits in Redis
 */

import { redisClient } from '../lib/services/redis.service';

async function clearAllRateLimits() {
  console.log('🧹 Clearing ALL rate limits...');

  try {
    // Get all keys matching rate limit pattern
    const keys = await redisClient.keys('rate-limit:*');

    if (keys.length === 0) {
      console.log('📭 No rate limit keys found');
      return;
    }

    console.log(`📊 Found ${keys.length} rate limit keys`);

    // Delete all rate limit keys
    for (const key of keys) {
      await redisClient.del(key);
      console.log(`  ✅ Deleted: ${key}`);
    }

    console.log(`\n✨ All ${keys.length} rate limits cleared!`);
    console.log('📊 Users can now generate reports again');

  } catch (error) {
    console.error('❌ Failed to clear rate limits:', error);
  } finally {
    await redisClient.quit();
    process.exit(0);
  }
}

clearAllRateLimits();