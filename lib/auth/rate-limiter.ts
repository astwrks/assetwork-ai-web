/**
 * Rate Limiter for Authentication Endpoints
 * Implements industry-standard rate limiting to prevent brute force attacks
 *
 * OWASP Recommendations:
 * - Limit failed login attempts to 5 per 15 minutes
 * - Implement exponential backoff for repeated failures
 * - Use IP-based and account-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

// In-memory store (consider Redis for production with multiple servers)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration constants
const MAX_ATTEMPTS = 5; // Maximum failed attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes lockout after max attempts
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Clean up old entries every hour

/**
 * Check if a request should be rate limited
 * @param identifier - Usually email or IP address
 * @returns Object with isAllowed and remaining attempts
 */
export function checkRateLimit(identifier: string): {
  isAllowed: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Check if account is locked
  if (entry?.lockedUntil && entry.lockedUntil > now) {
    return {
      isAllowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(entry.lockedUntil),
    };
  }

  // Reset if window has passed
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 0,
      resetTime: now + WINDOW_MS,
    });
    return {
      isAllowed: true,
      remainingAttempts: MAX_ATTEMPTS,
    };
  }

  // Check if limit exceeded
  if (entry.count >= MAX_ATTEMPTS) {
    // Lock the account
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    rateLimitStore.set(identifier, entry);

    return {
      isAllowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(entry.lockedUntil),
    };
  }

  return {
    isAllowed: true,
    remainingAttempts: MAX_ATTEMPTS - entry.count,
  };
}

/**
 * Record a failed login attempt
 * @param identifier - Usually email or IP address
 */
export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
  } else {
    entry.count++;

    // Lock if max attempts reached
    if (entry.count >= MAX_ATTEMPTS) {
      entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    }

    rateLimitStore.set(identifier, entry);
  }
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 * @param identifier - Usually email or IP address
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get rate limit status for an identifier
 * @param identifier - Usually email or IP address
 * @returns Current status information
 */
export function getRateLimitStatus(identifier: string): {
  attempts: number;
  remainingAttempts: number;
  resetTime: Date | null;
  isLocked: boolean;
  lockedUntil: Date | null;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    return {
      attempts: 0,
      remainingAttempts: MAX_ATTEMPTS,
      resetTime: null,
      isLocked: false,
      lockedUntil: null,
    };
  }

  const isLocked = !!entry.lockedUntil && entry.lockedUntil > now;

  return {
    attempts: entry.count,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - entry.count),
    resetTime: new Date(entry.resetTime),
    isLocked,
    lockedUntil: entry.lockedUntil ? new Date(entry.lockedUntil) : null,
  };
}

/**
 * Cleanup expired entries to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const [identifier, entry] of rateLimitStore.entries()) {
    // Remove if reset time has passed and not locked
    if (entry.resetTime < now && (!entry.lockedUntil || entry.lockedUntil < now)) {
      rateLimitStore.delete(identifier);
    }
  }
}

// Run cleanup periodically
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
}

/**
 * Get client IP address from request headers
 * Handles common proxy headers
 * @param headers - Request headers
 * @returns IP address string
 */
export function getClientIp(headers: Headers): string {
  // Check common proxy headers in order of reliability
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback
  return 'unknown';
}
