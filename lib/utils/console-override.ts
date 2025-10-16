/**
 * Console Override for Clean Development
 * Aggressively filters console output to reduce noise
 */

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

// Patterns to completely suppress
const SUPPRESS_PATTERNS = [
  /API_RATE_LIMIT/,
  /Rate limit exceeded/,
  /WebSocket token generation failed/,
  /notifications\.count/,
  /public\.notifications/,
  /TURBOPACK/,
  /prisma\.notifications/,
  /error: WebSocket/,
  /error: Dashboard/,
  /AppError: Rate limit/,
  /at instantiateModule/,
  /at getOrInstantiateModule/,
  /at esmImport/,
  /at TracingChannel/,
  /node:internal/,
  /node_modules/,
  /\.next\/server/,
  /at async/,
  /at Module\._compile/,
  /BashOutput\(Reading shell output/,
];

// Patterns to show briefly
const BRIEF_PATTERNS = [
  { pattern: /GET \/api\/auth\/session/, replacement: '✓ Auth check' },
  { pattern: /GET \/financial-playground/, replacement: '✓ Page loaded' },
  { pattern: /POST \/api\/auth\/callback/, replacement: '⚡ Auth callback' },
];

/**
 * Check if message should be suppressed
 */
function shouldSuppress(args: any[]): boolean {
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  return SUPPRESS_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Transform message to brief version if applicable
 */
function transformMessage(args: any[]): any[] {
  const message = args.join(' ');

  for (const { pattern, replacement } of BRIEF_PATTERNS) {
    if (pattern.test(message)) {
      return [replacement];
    }
  }

  return args;
}

/**
 * Override console methods
 */
export function overrideConsole() {
  // Only override in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log = (...args: any[]) => {
    if (!shouldSuppress(args)) {
      const transformed = transformMessage(args);
      originalConsole.log(...transformed);
    }
  };

  console.error = (...args: any[]) => {
    if (!shouldSuppress(args)) {
      // For errors, show only the first line if it's a stack trace
      if (args[0] && typeof args[0] === 'string' && args[0].includes('\n')) {
        const firstLine = args[0].split('\n')[0];
        originalConsole.error('❌', firstLine);
      } else {
        originalConsole.error(...args);
      }
    }
  };

  console.warn = (...args: any[]) => {
    if (!shouldSuppress(args)) {
      originalConsole.warn(...args);
    }
  };

  console.info = (...args: any[]) => {
    if (!shouldSuppress(args)) {
      originalConsole.info(...args);
    }
  };

  console.debug = (...args: any[]) => {
    // Suppress all debug logs in development
  };
}

/**
 * Restore original console methods
 */
export function restoreConsole() {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
}

// Auto-initialize if imported
if (typeof window === 'undefined') {
  overrideConsole();
}