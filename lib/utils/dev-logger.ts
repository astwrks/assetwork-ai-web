/**
 * Development Logger Configuration
 * Provides clean, minimal logging for development environment
 */

// Define what to show in dev logs
export const DEV_LOG_CONFIG = {
  // Hide these error types completely
  hideErrors: [
    'API_RATE_LIMIT', // Rate limiting errors
    'AUTH_TOKEN_EXPIRED', // Token expiry
  ],

  // Show only brief messages for these
  briefErrors: [
    'DB_RECORD_NOT_FOUND',
    'VALIDATION_ERROR',
  ],

  // Reduce stack trace depth
  maxStackDepth: 3,

  // Hide sensitive paths in stack traces
  cleanPaths: true,

  // Simplify timestamps
  simpleTimestamps: true,
};

/**
 * Clean up error for development display
 */
export function cleanError(error: any): string {
  // Skip certain errors entirely
  if (DEV_LOG_CONFIG.hideErrors.includes(error?.code)) {
    return ''; // Return empty string to skip logging
  }

  // Brief errors - just show message
  if (DEV_LOG_CONFIG.briefErrors.includes(error?.code)) {
    return `❌ ${error.message}`;
  }

  // For other errors, show condensed info
  const errorInfo = {
    message: error?.message || 'Unknown error',
    code: error?.code,
  };

  // Only add stack for non-ignored errors and limit depth
  if (error?.stack && !DEV_LOG_CONFIG.briefErrors.includes(error?.code)) {
    const stackLines = error.stack.split('\n').slice(0, DEV_LOG_CONFIG.maxStackDepth);
    errorInfo['trace'] = stackLines.join(' → ');
  }

  return `❌ ${errorInfo.message} [${errorInfo.code || 'UNKNOWN'}]`;
}

/**
 * Format log message for clean development output
 */
export function formatDevLog(level: string, message: string, metadata?: any): string {
  const icon = {
    'info': '📘',
    'warn': '⚠️',
    'error': '❌',
    'debug': '🔍',
  }[level] || '📝';

  // Skip rate limit errors
  if (metadata?.error?.code === 'API_RATE_LIMIT') {
    return '';
  }

  // Build clean message
  let output = `${icon} ${message}`;

  // Add condensed metadata if present
  if (metadata && Object.keys(metadata).length > 0) {
    // Filter out verbose fields
    const { stack, error, timestamp, ...cleanMeta } = metadata;
    if (Object.keys(cleanMeta).length > 0) {
      output += ` ${JSON.stringify(cleanMeta)}`;
    }
  }

  return output;
}

/**
 * Check if error should be logged
 */
export function shouldLogError(error: any): boolean {
  return !DEV_LOG_CONFIG.hideErrors.includes(error?.code);
}