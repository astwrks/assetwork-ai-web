import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// Custom API Error class
export class APIError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Error handler wrapper
export function errorHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      console.error('[API Error]:', error);

      if (error instanceof APIError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        );
      }

      // MongoDB duplicate key error
      if (error.code === 11000) {
        return NextResponse.json(
          {
            error: 'Duplicate entry found',
            code: 'DUPLICATE_ENTRY',
          },
          { status: 409 }
        );
      }

      // MongoDB validation error
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => err.message);
        return NextResponse.json(
          {
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors,
          },
          { status: 400 }
        );
      }

      // Generic server error
      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }
  };
}

// Authentication middleware
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new APIError('Unauthorized - Please sign in', 401, 'UNAUTHORIZED');
  }

  return session;
}

// Validation middleware
export function validateBody<T = any>(
  schema: {
    [key: string]: {
      type: string;
      required?: boolean;
      min?: number;
      max?: number;
      enum?: any[];
    };
  }
) {
  return async (request: NextRequest): Promise<T> => {
    const body = await request.json();
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field}' is required`);
        continue;
      }

      // Skip further validation if field is not required and empty
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }

      // Type check
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`Field '${field}' must be a string`);
      } else if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`Field '${field}' must be a number`);
      } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Field '${field}' must be a boolean`);
      } else if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`Field '${field}' must be an array`);
      } else if (rules.type === 'object' && typeof value !== 'object') {
        errors.push(`Field '${field}' must be an object`);
      }

      // Min/Max validation
      if (rules.min !== undefined) {
        if (typeof value === 'string' || Array.isArray(value)) {
          if (value.length < rules.min) {
            errors.push(`Field '${field}' must have at least ${rules.min} items`);
          }
        } else if (typeof value === 'number') {
          if (value < rules.min) {
            errors.push(`Field '${field}' must be at least ${rules.min}`);
          }
        }
      }

      if (rules.max !== undefined) {
        if (typeof value === 'string' || Array.isArray(value)) {
          if (value.length > rules.max) {
            errors.push(`Field '${field}' must have at most ${rules.max} items`);
          }
        } else if (typeof value === 'number') {
          if (value > rules.max) {
            errors.push(`Field '${field}' must be at most ${rules.max}`);
          }
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(
          `Field '${field}' must be one of: ${rules.enum.join(', ')}`
        );
      }
    }

    if (errors.length > 0) {
      throw new APIError(
        'Validation failed',
        400,
        'VALIDATION_ERROR'
      );
    }

    return body as T;
  };
}

// Rate limiting middleware (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: {
  maxRequests: number;
  windowMs: number;
}) {
  return (request: NextRequest, identifier?: string) => {
    const key = identifier || request.ip || 'unknown';
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Create new window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return true;
    }

    if (record.count >= options.maxRequests) {
      throw new APIError(
        'Too many requests - Please try again later',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    record.count++;
    return true;
  };
}

// Pagination helper
export function parsePagination(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Sort helper
export function parseSort(request: NextRequest, defaultSort: string = 'createdAt') {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sortBy') || defaultSort;
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  return {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };
}

// Success response helper
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  );
}

// Error response helper
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status }
  );
}
