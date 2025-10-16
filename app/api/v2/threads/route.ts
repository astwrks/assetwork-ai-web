/**
 * Thread Management API Endpoint
 * Handles conversation threads for financial playground
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheTTL } from '@/lib/services/redis.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import { nanoid } from 'nanoid';

// Validation schemas
const CreateThreadSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

const ThreadFilterSchema = z.object({
  status: z.enum(['active', 'archived']).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

/**
 * GET /api/v2/threads
 * List user's conversation threads
 */
export async function GET(request: NextRequest) {
  const operationId = `thread-list-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      throw new AppErrors.NOT_FOUND('User not found');
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = ThreadFilterSchema.parse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    });

    // Check cache
    const cacheKey = `threads:${user.id}:${JSON.stringify(filters)}`;
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
      userId: user.id,
    };

    if (filters.status) {
      where.status = filters.status.toUpperCase();
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Fetch threads with message count
    const [threads, total] = await Promise.all([
      prisma.threads.findMany({
        where,
        take: filters.limit,
        skip: filters.offset,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              content: true,
              role: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              messages: true,
              playground_reports: true,
            },
          },
        },
      }),
      prisma.threads.count({ where }),
    ]);

    // Transform threads
    const transformedThreads = threads.map(thread => {
      const metadata = (thread.metadata as any) || {};
      return {
        id: thread.id,
        title: thread.title,
        description: thread.description,
        status: thread.status.toLowerCase(),
        isBookmarked: metadata.isBookmarked || false,
        customName: metadata.customName || undefined,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messageCount: thread._count.messages,
        reportCount: thread._count.playground_reports,
        lastMessage: thread.messages[0] ? {
          content: thread.messages[0].content,
          role: thread.messages[0].role.toLowerCase(),
          createdAt: thread.messages[0].createdAt,
        } : null,
      };
    });

    // Cache result
    await CacheService.set(cacheKey, transformedThreads, CacheTTL.SHORT);

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      count: threads.length,
    });

    LoggingService.info('Threads fetched', {
      userId: user.id,
      count: threads.length,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: transformedThreads,
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

    LoggingService.error('Thread fetch failed', error as Error);

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
        error: 'Failed to fetch threads',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/threads
 * Create a new conversation thread
 */
export async function POST(request: NextRequest) {
  const operationId = `thread-create-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      throw new AppErrors.NOT_FOUND('User not found');
    }

    // Parse and validate request
    const body = await request.json();
    const validated = CreateThreadSchema.parse(body);

    // Create thread
    const thread = await prisma.threads.create({
      data: {
        id: nanoid(),
        userId: user.id,
        title: validated.title,
        description: validated.description,
        status: 'ACTIVE',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Clear cache
    await CacheService.clearPattern(`threads:${user.id}:*`);

    // Broadcast via WebSocket if available
    if (typeof process !== 'undefined' && (global as any).io) {
      (global as any).io.to(`user:${user.id}`).emit('thread:created', {
        threadId: thread.id,
        title: thread.title,
      });
    }

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      threadId: thread.id,
    });

    LoggingService.info('Thread created', {
      userId: user.id,
      threadId: thread.id,
      title: thread.title,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: thread.id,
        title: thread.title,
        description: thread.description,
        status: thread.status.toLowerCase(),
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messageCount: 0,
        reportCount: 0,
        lastMessage: null,
      },
      meta: {
        processingTime: duration,
      },
    }, { status: 201 });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Thread creation failed', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid thread data',
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
        error: 'Failed to create thread',
      },
      { status: 500 }
    );
  }
}