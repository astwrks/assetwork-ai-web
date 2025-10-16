/**
 * Individual Thread API Endpoint
 * Handles operations on specific conversation threads
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheTTL } from '@/lib/services/redis.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';

// Validation schemas
const UpdateThreadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
  isBookmarked: z.boolean().optional(),
  customName: z.string().min(1).max(200).optional(),
});

/**
 * GET /api/v2/threads/[threadId]
 * Get a specific thread with messages and reports
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const operationId = `thread-get-${Date.now()}`;
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

    // Await params in Next.js 15
    const { threadId } = await params;

    // Check cache
    const cacheKey = `thread:${threadId}:${user.id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      PerformanceMonitor.end(operationId, { cached: true });
      return NextResponse.json({
        success: true,
        ...cached,
        meta: { cached: true },
      });
    }

    // Fetch thread with messages and reports
    const thread = await prisma.threads.findFirst({
      where: {
        id: threadId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            metadata: true,
            createdAt: true,
          },
        },
        playground_reports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            htmlContent: true,
            sections: true,
            insights: true,
            metadata: true,
            model: true,
            totalTokens: true,
            totalCost: true,
            createdAt: true,
          },
        },
      },
    });

    if (!thread) {
      throw new AppErrors.NOT_FOUND('Thread not found');
    }

    // Get entities for the latest report
    let entities: any[] = [];
    if (thread.playground_reports[0]) {
      const reportId = thread.playground_reports[0].id;
      entities = await prisma.entity_mentions.findMany({
        where: { reportId },
        include: {
          entities: {
            select: {
              id: true,
              name: true,
              type: true,
              ticker: true,
              description: true,
            },
          },
        },
      });
    }

    // Extract metadata
    const metadata = (thread.metadata as any) || {};

    // Transform data
    const result = {
      thread: {
        id: thread.id,
        title: thread.title,
        description: thread.description,
        status: thread.status.toLowerCase(),
        isBookmarked: metadata.isBookmarked || false,
        customName: metadata.customName || undefined,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
      messages: thread.messages.map(msg => ({
        id: msg.id,
        threadId: thread.id,
        role: msg.role.toLowerCase(),
        content: msg.content,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
      })),
      report: thread.playground_reports[0] ? {
        id: thread.playground_reports[0].id,
        threadId: thread.id,
        title: thread.title,
        content: thread.playground_reports[0].htmlContent,
        format: 'html',
        sections: thread.playground_reports[0].sections || [],
        entities: entities.map(em => ({
          id: em.entities.id,
          name: em.entities.name,
          type: em.entities.type,
          ticker: em.entities.ticker,
          description: em.entities.description,
          sentiment: em.sentiment,
          relevance: em.relevance,
        })),
        insights: thread.playground_reports[0].insights || [],
        metadata: {
          model: thread.playground_reports[0].model || 'claude-3-opus-20240229',
          tokens: thread.playground_reports[0].totalTokens,
          cost: thread.playground_reports[0].totalCost,
          generationTime: thread.playground_reports[0].metadata?.generationTime || 0,
        },
        createdAt: thread.playground_reports[0].createdAt,
      } : null,
    };

    // Cache result
    await CacheService.set(cacheKey, result, CacheTTL.SHORT);

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      threadId,
    });

    LoggingService.info('Thread fetched', {
      userId: user.id,
      threadId,
      messageCount: thread.messages.length,
      hasReport: !!thread.playground_reports[0],
      duration,
    });

    return NextResponse.json({
      success: true,
      ...result,
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Thread fetch failed', error as Error);

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
        error: 'Failed to fetch thread',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/threads/[threadId]
 * Update a thread
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const operationId = `thread-update-${Date.now()}`;
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

    // Await params in Next.js 15
    const { threadId } = await params;

    // Parse and validate request
    const body = await request.json();
    const validated = UpdateThreadSchema.parse(body);

    // Check thread ownership
    const thread = await prisma.threads.findFirst({
      where: {
        id: threadId,
        userId: user.id,
      },
    });

    if (!thread) {
      throw new AppErrors.NOT_FOUND('Thread not found');
    }

    // Prepare metadata update
    const existingMetadata = (thread.metadata as any) || {};
    const updatedMetadata = {
      ...existingMetadata,
      ...(validated.isBookmarked !== undefined && { isBookmarked: validated.isBookmarked }),
      ...(validated.customName !== undefined && { customName: validated.customName }),
    };

    // Update thread
    const updated = await prisma.threads.update({
      where: { id: threadId },
      data: {
        title: validated.customName || validated.title || thread.title,
        description: validated.description,
        status: validated.status?.toUpperCase() as any,
        metadata: updatedMetadata,
        updatedAt: new Date(),
      },
    });

    // Clear cache
    await CacheService.del(`thread:${threadId}:${user.id}`);
    await CacheService.clearPattern(`threads:${user.id}:*`);

    // Broadcast via WebSocket if available
    if (typeof process !== 'undefined' && (global as any).io) {
      (global as any).io.to(`user:${user.id}`).emit('thread:updated', {
        threadId,
        changes: validated,
      });
    }

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      threadId,
    });

    LoggingService.info('Thread updated', {
      userId: user.id,
      threadId,
      changes: Object.keys(validated),
      duration,
    });

    const returnMetadata = (updated.metadata as any) || {};

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        status: updated.status.toLowerCase(),
        isBookmarked: returnMetadata.isBookmarked || false,
        customName: returnMetadata.customName || undefined,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Thread update failed', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid update data',
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
        error: 'Failed to update thread',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/threads/[threadId]
 * Delete a thread and all its associated data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const operationId = `thread-delete-${Date.now()}`;
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

    // Await params in Next.js 15
    const { threadId } = await params;

    // Check thread ownership
    const thread = await prisma.threads.findFirst({
      where: {
        id: threadId,
        userId: user.id,
      },
    });

    if (!thread) {
      throw new AppErrors.NOT_FOUND('Thread not found');
    }

    // Delete thread (cascades to messages and reports)
    await prisma.threads.delete({
      where: { id: threadId },
    });

    // Clear cache
    await CacheService.del(`thread:${threadId}:${user.id}`);
    await CacheService.clearPattern(`threads:${user.id}:*`);

    // Broadcast via WebSocket if available
    if (typeof process !== 'undefined' && (global as any).io) {
      (global as any).io.to(`user:${user.id}`).emit('thread:deleted', {
        threadId,
      });
    }

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      threadId,
    });

    LoggingService.info('Thread deleted', {
      userId: user.id,
      threadId,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Thread deleted successfully',
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Thread deletion failed', error as Error);

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
        error: 'Failed to delete thread',
      },
      { status: 500 }
    );
  }
}