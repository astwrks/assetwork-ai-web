/**
 * Error Handling and Logging Service
 * Comprehensive error tracking, logging, and monitoring
 */

import * as Sentry from '@sentry/nextjs';
import winston from 'winston';
import pino from 'pino';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { CacheService } from './redis.service';
import { WebSocketService } from './websocket.service';
import { cleanError, formatDevLog, shouldLogError } from '@/lib/utils/dev-logger';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  API = 'api',
  NETWORK = 'network',
  SYSTEM = 'system',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
}

// Error schema
export const ApplicationErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.nativeEnum(ErrorSeverity),
  category: z.nativeEnum(ErrorCategory),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  stack: z.string().optional(),
  timestamp: z.number(),
});

export type ApplicationError = z.infer<typeof ApplicationErrorSchema>;

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly statusCode: number;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    statusCode: number = 500,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.statusCode = statusCode;
    this.metadata = metadata;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ApplicationError {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      category: this.category,
      metadata: this.metadata,
      stack: this.stack,
      timestamp: Date.now(),
    };
  }
}

/**
 * Common Application Errors
 */
export const AppErrors = {
  // Authentication Errors
  INVALID_CREDENTIALS: new AppError(
    'Invalid email or password',
    'AUTH_INVALID_CREDENTIALS',
    ErrorSeverity.LOW,
    ErrorCategory.AUTHENTICATION,
    401
  ),

  TOKEN_EXPIRED: new AppError(
    'Authentication token has expired',
    'AUTH_TOKEN_EXPIRED',
    ErrorSeverity.LOW,
    ErrorCategory.AUTHENTICATION,
    401
  ),

  UNAUTHORIZED: new AppError(
    'Unauthorized access',
    'AUTH_UNAUTHORIZED',
    ErrorSeverity.MEDIUM,
    ErrorCategory.AUTHENTICATION,
    401
  ),

  // Validation Errors
  INVALID_INPUT: (field: string) => new AppError(
    `Invalid input for field: ${field}`,
    'VALIDATION_INVALID_INPUT',
    ErrorSeverity.LOW,
    ErrorCategory.VALIDATION,
    400,
    { field }
  ),

  MISSING_REQUIRED_FIELD: (field: string) => new AppError(
    `Missing required field: ${field}`,
    'VALIDATION_MISSING_FIELD',
    ErrorSeverity.LOW,
    ErrorCategory.VALIDATION,
    400,
    { field }
  ),

  // Database Errors
  RECORD_NOT_FOUND: (resource: string, id: string) => new AppError(
    `${resource} not found`,
    'DB_RECORD_NOT_FOUND',
    ErrorSeverity.LOW,
    ErrorCategory.DATABASE,
    404,
    { resource, id }
  ),

  DATABASE_ERROR: (operation: string, error?: any) => new AppError(
    `Database operation failed: ${operation}`,
    'DB_OPERATION_FAILED',
    ErrorSeverity.HIGH,
    ErrorCategory.DATABASE,
    500,
    { operation, originalError: error?.message }
  ),

  // API Errors
  RATE_LIMIT_EXCEEDED: new AppError(
    'Rate limit exceeded',
    'API_RATE_LIMIT',
    ErrorSeverity.LOW,
    ErrorCategory.API,
    429
  ),

  EXTERNAL_API_ERROR: (service: string, error?: any) => new AppError(
    `External API error: ${service}`,
    'API_EXTERNAL_ERROR',
    ErrorSeverity.MEDIUM,
    ErrorCategory.EXTERNAL_SERVICE,
    502,
    { service, originalError: error?.message }
  ),

  // Business Logic Errors
  INSUFFICIENT_CREDITS: new AppError(
    'Insufficient credits for this operation',
    'BUSINESS_INSUFFICIENT_CREDITS',
    ErrorSeverity.LOW,
    ErrorCategory.BUSINESS_LOGIC,
    402
  ),

  OPERATION_NOT_ALLOWED: (reason: string) => new AppError(
    `Operation not allowed: ${reason}`,
    'BUSINESS_OPERATION_NOT_ALLOWED',
    ErrorSeverity.MEDIUM,
    ErrorCategory.BUSINESS_LOGIC,
    403,
    { reason }
  ),
};

/**
 * Winston Logger Configuration
 */
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'assetworks',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File transports (production only)
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

/**
 * Pino Logger Configuration (High Performance)
 */
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.headers,
    }),
    err: pino.stdSerializers.err,
  },
});

/**
 * Logging Service
 */
export class LoggingService {
  private static logger = process.env.USE_PINO === 'true' ? pinoLogger : winstonLogger;

  /**
   * Log info message
   */
  static info(message: string, metadata?: Record<string, any>) {
    this.logger.info(message, metadata);
  }

  /**
   * Log warning message
   */
  static warn(message: string, metadata?: Record<string, any>) {
    this.logger.warn(message, metadata);
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error | AppError, metadata?: Record<string, any>) {
    // In development, use cleaner error logging
    if (process.env.NODE_ENV === 'development') {
      // Skip errors we want to hide
      if (error && !shouldLogError(error)) {
        return;
      }

      const cleanMessage = cleanError(error);
      if (cleanMessage) {
        console.error(cleanMessage);
      }
      return;
    }

    // Production logging remains unchanged
    const errorData = {
      ...metadata,
      error: error instanceof AppError ? error.toJSON() : error?.message,
      stack: error?.stack,
    };

    this.logger.error(message, errorData);

    // Send to Sentry in production
    if (process.env.NODE_ENV === 'production' && error) {
      Sentry.captureException(error, {
        extra: metadata,
        level: error instanceof AppError ? this.mapSeverityToSentry(error.severity) : 'error',
      });
    }

    // Store critical errors in database
    if (error instanceof AppError && error.severity === ErrorSeverity.CRITICAL) {
      this.storeCriticalError(error, metadata);
    }
  }

  /**
   * Log debug message
   */
  static debug(message: string, metadata?: Record<string, any>) {
    this.logger.debug(message, metadata);
  }

  /**
   * Log API request
   */
  static logRequest(
    method: string,
    path: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    this.info('API Request', {
      method,
      path,
      userId,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  /**
   * Log API response
   */
  static logResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string
  ) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    this[level]('API Response', {
      method,
      path,
      statusCode,
      duration,
      userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Log performance metric
   */
  static logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ) {
    const level = duration > 5000 ? 'warn' : 'info';

    this[level]('Performance Metric', {
      operation,
      duration,
      ...metadata,
      timestamp: Date.now(),
    });

    // Store slow operations for analysis
    if (duration > 5000) {
      this.storeSlowOperation(operation, duration, metadata);
    }
  }

  /**
   * Log security event
   */
  static logSecurity(
    event: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    this.warn('Security Event', {
      event,
      userId,
      ...metadata,
      timestamp: Date.now(),
    });

    // Always send security events to Sentry
    Sentry.captureMessage(`Security Event: ${event}`, {
      level: 'warning',
      extra: { userId, ...metadata },
    });
  }

  /**
   * Map AppError severity to Sentry severity
   */
  private static mapSeverityToSentry(severity: ErrorSeverity): Sentry.SeverityLevel {
    const map: Record<ErrorSeverity, Sentry.SeverityLevel> = {
      [ErrorSeverity.LOW]: 'info',
      [ErrorSeverity.MEDIUM]: 'warning',
      [ErrorSeverity.HIGH]: 'error',
      [ErrorSeverity.CRITICAL]: 'fatal',
    };
    return map[severity];
  }

  /**
   * Store critical error in database
   */
  private static async storeCriticalError(
    error: AppError,
    metadata?: Record<string, any>
  ) {
    try {
      await prisma.user_activities.create({
        data: {
          id: `error:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
          userId: metadata?.userId || 'system',
          eventType: 'DASHBOARD_VIEWED', // Using existing enum, should be extended
          entityType: 'error',
          entityId: error.code,
          metadata: {
            error: error.toJSON(),
            ...metadata,
          },
          createdAt: new Date(),
        },
      });
    } catch (dbError) {
      console.error('Failed to store critical error:', dbError);
    }
  }

  /**
   * Store slow operation for analysis
   */
  private static async storeSlowOperation(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ) {
    try {
      const key = `slow_ops:${operation}:${Date.now()}`;
      await CacheService.set(
        key,
        {
          operation,
          duration,
          metadata,
          timestamp: Date.now(),
        },
        86400 // 24 hours
      );
    } catch (error) {
      console.error('Failed to store slow operation:', error);
    }
  }
}

/**
 * Error Handler Middleware
 */
export class ErrorHandler {
  /**
   * Global error handler for Next.js API routes
   */
  static handle(error: Error | AppError, req: any, res: any) {
    // Log the error
    LoggingService.error('API Error', error, {
      method: req.method,
      path: req.url,
      userId: req.session?.userId,
    });

    // Prepare error response
    let statusCode = 500;
    let errorResponse: Record<string, any> = {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    };

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      errorResponse = {
        error: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          metadata: error.metadata,
        }),
      };
    } else if (error instanceof z.ZodError) {
      statusCode = 400;
      errorResponse = {
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }

    // Send error notification for critical errors
    if (error instanceof AppError && error.severity === ErrorSeverity.CRITICAL) {
      this.notifyCriticalError(error);
    }

    res.status(statusCode).json(errorResponse);
  }

  /**
   * Async error wrapper for API routes
   */
  static asyncHandler(fn: Function) {
    return async (req: any, res: any, next: any) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        this.handle(error as Error, req, res);
      }
    };
  }

  /**
   * Notify about critical errors
   */
  private static async notifyCriticalError(error: AppError) {
    try {
      // Send WebSocket notification to admins
      await WebSocketService.sendNotification('admin', {
        type: 'ERROR',
        title: 'Critical Error Occurred',
        message: `${error.code}: ${error.message}`,
      });

      // Could also send email, Slack, etc.
    } catch (notifyError) {
      console.error('Failed to send critical error notification:', notifyError);
    }
  }
}

/**
 * Performance Monitoring
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  /**
   * Start timing an operation
   */
  static start(operationId: string) {
    this.timers.set(operationId, Date.now());
  }

  /**
   * End timing and log
   */
  static end(operationId: string, metadata?: Record<string, any>) {
    const startTime = this.timers.get(operationId);
    if (!startTime) {
      LoggingService.warn(`No timer found for operation: ${operationId}`);
      return;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(operationId);

    LoggingService.logPerformance(operationId, duration, metadata);

    return duration;
  }

  /**
   * Time an async function
   */
  static async timeAsync<T>(
    operationId: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(operationId);
    try {
      const result = await fn();
      this.end(operationId, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.end(operationId, { ...metadata, success: false, error: (error as Error).message });
      throw error;
    }
  }
}

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
      }
      return event;
    },
  });
}

export default LoggingService;