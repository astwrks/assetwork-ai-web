/**
 * Individual Message API Endpoint
 * Handles operations on specific messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { CacheService } from '@/lib/services/redis.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';

// Validation schemas
const UpdateMessageSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/v2/messages/[messageId]
 * Get a specific message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  const operationId = `message-get-${Date.now()}`;
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

    const messageId = params.messageId;

    // Fetch message with thread to verify ownership
    const message = await prisma.messages.findFirst({
      where: { id: messageId },
      include: {
        threads: {
          select: { userId: true },
        },
      },
    });

    if (!message) {
      throw new AppErrors.NOT_FOUND('Message not found');
    }

    // Verify ownership through thread
    if (message.threads.userId !== user.id) {
      throw AppErrors.FORBIDDEN;
    }

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      messageId,
    });

    LoggingService.info('Message fetched', {
      userId: user.id,
      messageId,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        threadId: message.threadId,
        role: message.role.toLowerCase(),
        content: message.content,
        metadata: message.metadata || {},
        createdAt: message.createdAt,
      },
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Message fetch failed', error as Error);

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
        error: 'Failed to fetch message',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/messages/[messageId]
 * Update a message (only metadata can be updated, not content)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  const operationId = `message-update-${Date.now()}`;
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

    const messageId = params.messageId;

    // Parse and validate request
    const body = await request.json();
    const validated = UpdateMessageSchema.parse(body);

    // Fetch message with thread to verify ownership
    const message = await prisma.messages.findFirst({
      where: { id: messageId },
      include: {
        threads: {
          select: { userId: true },
        },
      },
    });

    if (!message) {
      throw new AppErrors.NOT_FOUND('Message not found');
    }

    // Verify ownership through thread
    if (message.threads.userId !== user.id) {
      throw AppErrors.FORBIDDEN;
    }

    // Update message (only metadata, not content for data integrity)
    const updated = await prisma.messages.update({
      where: { id: messageId },
      data: {
        metadata: validated.metadata || message.metadata,
      },
    });

    // Clear caches
    await CacheService.clearPattern(`messages:${message.threadId}:*`);
    await CacheService.del(`thread:${message.threadId}:${user.id}`);

    // Broadcast via WebSocket if available
    if (typeof process !== 'undefined' && (global as any).io) {
      (global as any).io.to(`thread:${message.threadId}`).emit('message:updated', {
        id: updated.id,
        changes: validated,
      });
    }

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      messageId,
    });

    LoggingService.info('Message updated', {
      userId: user.id,
      messageId,
      changes: Object.keys(validated),
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        threadId: updated.threadId,
        role: updated.role.toLowerCase(),
        content: updated.content,
        metadata: updated.metadata || {},
        createdAt: updated.createdAt,
      },
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Message update failed', error as Error);

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
        error: 'Failed to update message',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/messages/[messageId]
 * Delete a message (soft delete - mark as deleted but keep for audit)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  const operationId = `message-delete-${Date.now()}`;
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

    const messageId = params.messageId;

    // Fetch message with thread to verify ownership
    const message = await prisma.messages.findFirst({
      where: { id: messageId },
      include: {
        threads: {
          select: { userId: true },
        },
      },
    });

    if (!message) {
      throw new AppErrors.NOT_FOUND('Message not found');
    }

    // Verify ownership through thread
    if (message.threads.userId !== user.id) {
      throw AppErrors.FORBIDDEN;
    }

    // Soft delete - update metadata to mark as deleted
    await prisma.messages.update({
      where: { id: messageId },
      data: {
        metadata: {
          ...(message.metadata as object || {}),
          deleted: true,
          deletedAt: new Date(),
          deletedBy: user.id,
        },
      },
    });

    // Clear caches
    await CacheService.clearPattern(`messages:${message.threadId}:*`);
    await CacheService.del(`thread:${message.threadId}:${user.id}`);

    // Broadcast via WebSocket if available
    if (typeof process !== 'undefined' && (global as any).io) {
      (global as any).io.to(`thread:${message.threadId}`).emit('message:deleted', {
        id: messageId,
      });
    }

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      messageId,
    });

    LoggingService.info('Message deleted', {
      userId: user.id,
      messageId,
      threadId: message.threadId,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Message deletion failed', error as Error);

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
        error: 'Failed to delete message',
      },
      { status: 500 }
    );
  }
}