/**
 * Entity Intelligence API Endpoints
 * Manages financial entities, relationships, and insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheKeys, CacheTTL } from '@/lib/services/redis.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import { RateLimitService } from '@/lib/services/redis.service';
import { nanoid } from 'nanoid';

// Entity validation schemas
const EntityFilterSchema = z.object({
  type: z.enum(['COMPANY', 'STOCK', 'PERSON', 'PRODUCT', 'SECTOR', 'CRYPTOCURRENCY', 'COMMODITY', 'INDEX', 'ETF', 'MUTUAL_FUND', 'COUNTRY', 'CURRENCY']).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['mentionCount', 'lastMentioned', 'name', 'createdAt']).default('mentionCount'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const CreateEntitySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['COMPANY', 'STOCK', 'PERSON', 'PRODUCT', 'SECTOR', 'CRYPTOCURRENCY', 'COMMODITY', 'INDEX', 'ETF', 'MUTUAL_FUND', 'COUNTRY', 'CURRENCY']),
  ticker: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  sector: z.string().optional(),
  headquarters: z.string().optional(),
});

/**
 * GET /api/v2/entities
 * List entities with filtering and pagination
 */
export async function GET(request: NextRequest) {
  const operationId = `entity-list-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = EntityFilterSchema.parse({
      type: searchParams.get('type') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: searchParams.get('sortBy') || 'mentionCount',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    // Check cache
    const cacheKey = `entities:${JSON.stringify(filters)}`;
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
    const where: any = {};
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { ticker: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Fetch entities
    const [entities, total] = await Promise.all([
      prisma.entities.findMany({
        where,
        take: filters.limit,
        skip: filters.offset,
        orderBy: {
          [filters.sortBy]: filters.sortOrder,
        },
        include: {
          _count: {
            select: {
              entity_mentions: true,
              entity_insights: true,
            },
          },
        },
      }),
      prisma.entities.count({ where }),
    ]);

    // Transform data
    const transformedEntities = entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      type: entity.type,
      ticker: entity.ticker,
      description: entity.description,
      logo: entity.logo,
      website: entity.website,
      industry: entity.industry,
      sector: entity.sector,
      headquarters: entity.headquarters,
      stats: {
        mentionCount: entity.mentionCount,
        reportCount: entity._count.entity_mentions,
        insightCount: entity._count.entity_insights,
        lastMentioned: entity.lastMentioned,
        firstMentioned: entity.firstMentioned,
      },
      createdAt: entity.createdAt,
    }));

    // Cache result
    await CacheService.set(cacheKey, transformedEntities, CacheTTL.MEDIUM);

    const duration = PerformanceMonitor.end(operationId, {
      userId: session.user.email,
      count: entities.length,
      total,
    });

    LoggingService.info('Entities fetched', {
      userId: session.user.email,
      filters,
      count: entities.length,
      total,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: transformedEntities,
      meta: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total,
        cached: false,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Entity fetch failed', error as Error);

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
        error: 'Failed to fetch entities',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/entities
 * Create a new entity
 */
export async function POST(request: NextRequest) {
  const operationId = `entity-create-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // Rate limiting
    const rateLimitKey = `entity-create:${session.user.email}`;
    const { limited, remaining } = await RateLimitService.isLimited(
      rateLimitKey,
      20, // 20 entity creations per hour
      3600
    );

    if (limited) {
      throw AppErrors.RATE_LIMIT_EXCEEDED;
    }

    // Parse and validate request
    const body = await request.json();
    const validated = CreateEntitySchema.parse(body);

    // Check for duplicate
    const existing = await prisma.entities.findUnique({
      where: {
        slug: validated.name.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    if (existing) {
      throw new AppErrors.OPERATION_NOT_ALLOWED('Entity with this name already exists');
    }

    // Create entity
    const entity = await prisma.entities.create({
      data: {
        id: nanoid(),
        name: validated.name,
        slug: validated.name.toLowerCase().replace(/\s+/g, '-'),
        type: validated.type,
        ticker: validated.ticker,
        description: validated.description,
        website: validated.website,
        industry: validated.industry,
        sector: validated.sector,
        headquarters: validated.headquarters,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Clear cache
    await CacheService.clearPattern('entities:*');

    const duration = PerformanceMonitor.end(operationId, {
      userId: session.user.email,
      entityId: entity.id,
      entityName: entity.name,
    });

    LoggingService.info('Entity created', {
      userId: session.user.email,
      entityId: entity.id,
      entityName: entity.name,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: entity,
      meta: {
        rateLimitRemaining: remaining,
        processingTime: duration,
      },
    }, { status: 201 });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Entity creation failed', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid entity data',
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
        error: 'Failed to create entity',
      },
      { status: 500 }
    );
  }
}