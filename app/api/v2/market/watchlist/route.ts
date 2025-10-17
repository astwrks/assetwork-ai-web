/**
 * Market Watchlist API Endpoint
 * Manages user watchlists for tracking favorite stocks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheTTL } from '@/lib/services/redis.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import { nanoid } from 'nanoid';

// Validation schemas
const CreateWatchlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  symbols: z.array(z.string()).min(1).max(100),
  isPublic: z.boolean().default(false),
});

const UpdateWatchlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  symbols: z.array(z.string()).min(1).max(100).optional(),
  isPublic: z.boolean().optional(),
});

const AddSymbolSchema = z.object({
  watchlistId: z.string(),
  symbol: z.string(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/v2/market/watchlist
 * Get user's watchlists
 */
export async function GET(request: NextRequest) {
  const operationId = `watchlist-get-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw AppErrors.UNAUTHORIZED;
    }

    const userId = session.user.id;

    // Check cache
    const cacheKey = `watchlists:${userId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      PerformanceMonitor.end(operationId, { cached: true });
      return NextResponse.json({
        success: true,
        data: cached,
        meta: { cached: true },
      });
    }

    // Fetch watchlists
    const watchlists = await prisma.watchlists.findMany({
      where: {
        userId: userId,
      },
      include: {
        watchlist_symbols: {
          select: {
            symbol: true,
            addedAt: true,
            metadata: true,
          },
        },
        _count: {
          select: {
            watchlist_symbols: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform watchlists
    const transformedWatchlists = watchlists.map(watchlist => ({
      id: watchlist.id,
      name: watchlist.name,
      description: watchlist.description,
      isPublic: watchlist.isPublic,
      symbolCount: watchlist._count.watchlist_symbols,
      symbols: watchlist.watchlist_symbols.map(ws => ({
        symbol: ws.symbol,
        addedAt: ws.addedAt,
        metadata: ws.metadata,
      })),
      createdAt: watchlist.createdAt,
      updatedAt: watchlist.updatedAt,
    }));

    // Cache result
    await CacheService.set(cacheKey, transformedWatchlists, CacheTTL.SHORT);

    const duration = PerformanceMonitor.end(operationId, {
      userId: userId,
      count: watchlists.length,
    });

    LoggingService.info('Watchlists fetched', {
      userId: userId,
      count: watchlists.length,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: transformedWatchlists,
      meta: {
        total: watchlists.length,
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Watchlist fetch failed', error as Error);

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
        error: 'Failed to fetch watchlists',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/market/watchlist
 * Create a new watchlist
 */
export async function POST(request: NextRequest) {
  const operationId = `watchlist-create-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw AppErrors.UNAUTHORIZED;
    }

    const userId = session.user.id;

    // Parse and validate request
    const body = await request.json();
    const validated = CreateWatchlistSchema.parse(body);

    // Check watchlist limit
    const watchlistCount = await prisma.watchlists.count({
      where: { userId: userId },
    });

    if (watchlistCount >= 10) {
      throw new AppErrors.BAD_REQUEST('Maximum watchlist limit (10) reached');
    }

    // Create watchlist
    const watchlist = await prisma.watchlists.create({
      data: {
        id: nanoid(),
        userId: userId,
        name: validated.name,
        description: validated.description,
        isPublic: validated.isPublic,
        metadata: {},
      },
    });

    // Add symbols
    if (validated.symbols.length > 0) {
      await prisma.watchlist_symbols.createMany({
        data: validated.symbols.map(symbol => ({
          id: nanoid(),
          watchlistId: watchlist.id,
          symbol: symbol.toUpperCase(),
          metadata: {},
        })),
      });
    }

    // Clear cache
    await CacheService.del(`watchlists:${userId}`);

    const duration = PerformanceMonitor.end(operationId, {
      userId: userId,
      watchlistId: watchlist.id,
      symbolCount: validated.symbols.length,
    });

    LoggingService.info('Watchlist created', {
      userId: userId,
      watchlistId: watchlist.id,
      name: watchlist.name,
      symbolCount: validated.symbols.length,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: watchlist.id,
        name: watchlist.name,
        description: watchlist.description,
        isPublic: watchlist.isPublic,
        symbols: validated.symbols,
        createdAt: watchlist.createdAt,
      },
      meta: {
        processingTime: duration,
      },
    }, { status: 201 });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Watchlist creation failed', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid watchlist data',
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
        error: 'Failed to create watchlist',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/market/watchlist
 * Update a watchlist
 */
export async function PATCH(request: NextRequest) {
  const operationId = `watchlist-update-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw AppErrors.UNAUTHORIZED;
    }

    const userId = session.user.id;

    // Get watchlist ID from query
    const watchlistId = request.nextUrl.searchParams.get('id');
    if (!watchlistId) {
      throw new AppErrors.BAD_REQUEST('Watchlist ID is required');
    }

    // Parse and validate request
    const body = await request.json();
    const validated = UpdateWatchlistSchema.parse(body);

    // Verify ownership
    const watchlist = await prisma.watchlists.findFirst({
      where: {
        id: watchlistId,
        userId: userId,
      },
    });

    if (!watchlist) {
      throw new AppErrors.NOT_FOUND('Watchlist not found');
    }

    // Update watchlist
    const updated = await prisma.watchlists.update({
      where: { id: watchlistId },
      data: {
        name: validated.name || watchlist.name,
        description: validated.description !== undefined ? validated.description : watchlist.description,
        isPublic: validated.isPublic !== undefined ? validated.isPublic : watchlist.isPublic,
        updatedAt: new Date(),
      },
    });

    // Update symbols if provided
    if (validated.symbols) {
      // Delete existing symbols
      await prisma.watchlist_symbols.deleteMany({
        where: { watchlistId },
      });

      // Add new symbols
      if (validated.symbols.length > 0) {
        await prisma.watchlist_symbols.createMany({
          data: validated.symbols.map(symbol => ({
            id: nanoid(),
            watchlistId,
            symbol: symbol.toUpperCase(),
            metadata: {},
          })),
        });
      }
    }

    // Clear cache
    await CacheService.del(`watchlists:${userId}`);

    const duration = PerformanceMonitor.end(operationId, {
      userId: userId,
      watchlistId,
    });

    LoggingService.info('Watchlist updated', {
      userId: userId,
      watchlistId,
      changes: Object.keys(validated),
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        isPublic: updated.isPublic,
        updatedAt: updated.updatedAt,
      },
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Watchlist update failed', error as Error);

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
        error: 'Failed to update watchlist',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/market/watchlist
 * Delete a watchlist
 */
export async function DELETE(request: NextRequest) {
  const operationId = `watchlist-delete-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw AppErrors.UNAUTHORIZED;
    }

    const userId = session.user.id;

    // Get watchlist ID from query
    const watchlistId = request.nextUrl.searchParams.get('id');
    if (!watchlistId) {
      throw new AppErrors.BAD_REQUEST('Watchlist ID is required');
    }

    // Verify ownership
    const watchlist = await prisma.watchlists.findFirst({
      where: {
        id: watchlistId,
        userId: userId,
      },
    });

    if (!watchlist) {
      throw new AppErrors.NOT_FOUND('Watchlist not found');
    }

    // Delete watchlist (cascades to symbols)
    await prisma.watchlists.delete({
      where: { id: watchlistId },
    });

    // Clear cache
    await CacheService.del(`watchlists:${userId}`);

    const duration = PerformanceMonitor.end(operationId, {
      userId: userId,
      watchlistId,
    });

    LoggingService.info('Watchlist deleted', {
      userId: userId,
      watchlistId,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Watchlist deleted successfully',
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Watchlist deletion failed', error as Error);

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
        error: 'Failed to delete watchlist',
      },
      { status: 500 }
    );
  }
}