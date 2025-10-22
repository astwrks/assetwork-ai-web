/**
 * Message Management API Endpoint
 * Handles conversation messages within threads
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getServerSessionWithDev } from '@/lib/auth/dev-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheTTL } from '@/lib/services/redis.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import { nanoid } from 'nanoid';

// Validation schemas
const CreateMessageSchema = z.object({
  threadId: z.string(),
  content: z.string().min(1).max(10000),
  role: z.enum(['user', 'assistant', 'system']).default('user'),
  metadata: z.record(z.any()).optional(),
});

const MessageFilterSchema = z.object({
  threadId: z.string(),
  role: z.enum(['user', 'assistant', 'system']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  orderBy: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * GET /api/v2/messages
 * List messages for a thread
 */
export async function GET(request: NextRequest) {
  const operationId = `message-list-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSessionWithDev(authOptions);
    if (!session?.user?.id) {
      throw AppErrors.UNAUTHORIZED;
    }

    const userId = session.user.id;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = MessageFilterSchema.parse({
      threadId: searchParams.get('threadId'),
      role: searchParams.get('role') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      orderBy: searchParams.get('orderBy') || 'asc',
    });

    if (!filters.threadId) {
      throw new AppErrors.BAD_REQUEST('Thread ID is required');
    }

    // Verify thread ownership
    const thread = await prisma.threads.findFirst({
      where: {
        id: filters.threadId,
        userId: userId,
      },
    });

    if (!thread) {
      throw new AppErrors.NOT_FOUND('Thread not found');
    }

    // Check cache
    const cacheKey = `messages:${filters.threadId}:${JSON.stringify(filters)}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      PerformanceMonitor.end(operationId, { cached: true });
      return NextResponse.json({
        success: true,
        data: cached,
        meta: { cached: true },
      });
    }

    // Build query
    const where: any = {
      threadId: filters.threadId,
    };

    if (filters.role) {
      where.role = filters.role.toUpperCase();
    }

    // Fetch messages with pagination
    const [messages, total] = await Promise.all([
      prisma.messages.findMany({
        where,
        take: filters.limit,
        skip: filters.offset,
        orderBy: { createdAt: filters.orderBy },
        select: {
          id: true,
          threadId: true,
          role: true,
          content: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.messages.count({ where }),
    ]);

    // Transform messages
    const transformedMessages = messages.map(message => ({
      id: message.id,
      threadId: message.threadId,
      role: message.role.toLowerCase(),
      content: message.content,
      metadata: message.metadata || {},
      createdAt: message.createdAt,
    }));

    // Cache result
    await CacheService.set(cacheKey, transformedMessages, CacheTTL.SHORT);

    const duration = PerformanceMonitor.end(operationId, {
      userId: userId,
      threadId: filters.threadId,
      count: messages.length,
    });

    LoggingService.info('Messages fetched', {
      userId: userId,
      threadId: filters.threadId,
      count: messages.length,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: transformedMessages,
      meta: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total,
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Message fetch failed', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: (error as any).statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch messages',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/messages
 * Create a new message in a thread
 */
export async function POST(request: NextRequest) {
  const operationId = `message-create-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    console.log('[Messages API] Starting authentication...');
    const session = await getServerSessionWithDev(authOptions);
    if (!session?.user?.id) {
      console.error('[Messages API] No session found');
      throw AppErrors.UNAUTHORIZED;
    }

    const userId = session.user.id;
    console.log('[Messages API] User ID from session:', userId);

    // Parse and validate request
    console.log('[Messages API] Parsing request body...');
    const body = await request.json();
    const validated = CreateMessageSchema.parse(body);
    console.log('[Messages API] Validated data:', {
      threadId: validated.threadId,
      role: validated.role,
      contentLength: validated.content.length,
    });

    // Verify thread ownership
    console.log('[Messages API] Verifying thread ownership...');
    const thread = await prisma.threads.findFirst({
      where: {
        id: validated.threadId,
        userId: userId,
      },
    });

    if (!thread) {
      console.error('[Messages API] Thread not found or unauthorized');
      throw new AppErrors.NOT_FOUND('Thread not found');
    }

    // Create message
    console.log('[Messages API] Creating message...');
    const messageId = nanoid();
    console.log('[Messages API] Message ID:', messageId);

    const message = await prisma.messages.create({
      data: {
        id: messageId,
        threads: {
          connect: { id: validated.threadId }
        },
        users: {
          connect: { id: userId }
        },
        role: validated.role.toUpperCase() as any,
        content: validated.content,
        metadata: validated.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('[Messages API] Message created successfully');

    // Update thread's updatedAt
    console.log('[Messages API] Updating thread timestamp...');
    await prisma.threads.update({
      where: { id: validated.threadId },
      data: { updatedAt: new Date() },
    });
    console.log('[Messages API] Thread updated');

    // Clear caches
    console.log('[Messages API] Clearing caches...');
    try {
      await CacheService.clearPattern(`messages:${validated.threadId}:*`);
      await CacheService.delete(`thread:${validated.threadId}:${userId}`);
      await CacheService.clearPattern(`threads:${userId}:*`);
      console.log('[Messages API] Caches cleared');
    } catch (cacheError) {
      console.warn('[Messages API] Cache clearing failed (non-critical):', cacheError);
    }

    // Broadcast via WebSocket if available
    if (typeof process !== 'undefined' && (global as any).io) {
      (global as any).io.to(`thread:${validated.threadId}`).emit('message:created', {
        id: message.id,
        threadId: message.threadId,
        role: message.role.toLowerCase(),
        content: message.content,
        metadata: message.metadata,
        createdAt: message.createdAt,
      });
    }

    const duration = PerformanceMonitor.end(operationId, {
      userId: userId,
      threadId: validated.threadId,
      messageId: message.id,
    });

    LoggingService.info('Message created', {
      userId: userId,
      threadId: validated.threadId,
      messageId: message.id,
      role: message.role,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        threadId: message.threadId,
        role: message.role.toLowerCase(),
        content: message.content,
        metadata: message.metadata,
        createdAt: message.createdAt,
      },
      meta: {
        processingTime: duration,
      },
    }, { status: 201 });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    console.error('[Messages API] Error caught:', error);
    LoggingService.error('Message creation failed', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid message data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: (error as any).statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create message',
      },
      { status: 500 }
    );
  }
}