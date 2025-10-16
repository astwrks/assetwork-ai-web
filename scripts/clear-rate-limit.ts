#!/usr/bin/env tsx

/**
 * Script to clear rate limit for a specific user
 * Usage: npx tsx scripts/clear-rate-limit.ts
 */

import { CacheService } from '../lib/services/redis.service';

async function clearRateLimit() {
  const email = 'test@assetworks.ai';
  const key = `rate-limit:report-gen:${email}`;

  console.log(`🧹 Clearing rate limit for ${email}...`);

  try {
    await CacheService.delete(key);
    console.log(`✅ Rate limit cleared for ${email}`);
    console.log(`📊 User can now generate reports again`);
  } catch (error) {
    console.error('❌ Failed to clear rate limit:', error);
  }

  process.exit(0);
}

clearRateLimit();