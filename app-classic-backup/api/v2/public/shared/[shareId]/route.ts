/**
 * Public Share Access API Endpoint
 * Handles accessing shared reports without authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheTTL } from '@/lib/services/redis.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Validation schema
const AccessShareSchema = z.object({
  token: z.string(),
  password: z.string().optional(),
});

/**
 * POST /api/v2/public/shared/[shareId]
 * Access a shared report (public endpoint - no auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  const operationId = `share-access-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    const shareId = params.shareId;

    // Parse and validate request
    const body = await request.json();
    const validated = AccessShareSchema.parse(body);

    // Verify JWT token
    let tokenPayload: any;
    try {
      tokenPayload = jwt.verify(
        validated.token,
        process.env.JWT_SECRET || 'default-secret'
      );
    } catch (error) {
      throw new AppErrors.UNAUTHORIZED('Invalid or expired share link');
    }

    // Verify token matches share ID
    if (tokenPayload.shareId !== shareId) {
      throw new AppErrors.UNAUTHORIZED('Invalid share link');
    }

    // Check cache for share data
    const cacheKey = `share:${shareId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached && !validated.password) {
      // Only use cache if no password verification needed
      PerformanceMonitor.end(operationId, { cached: true });
      return NextResponse.json({
        success: true,
        data: cached,
        meta: { cached: true },
      });
    }

    // Fetch share record
    const share = await prisma.report_shares.findUnique({
      where: { id: shareId },
      include: {
        playground_reports: {
          include: {
            threads: {
              select: {
                title: true,
                description: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!share) {
      throw new AppErrors.NOT_FOUND('Share link not found');
    }

    // Check if share is expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      throw new AppErrors.FORBIDDEN('This share link has expired');
    }

    // Check view limit
    if (share.maxViews && share.currentViews >= share.maxViews) {
      throw new AppErrors.FORBIDDEN('This share link has reached its view limit');
    }

    // Verify password if protected
    if (share.passwordHash) {
      if (!validated.password) {
        return NextResponse.json(
          {
            success: false,
            error: 'Password required',
            passwordRequired: true,
          },
          { status: 401 }
        );
      }

      const isValidPassword = await bcrypt.compare(
        validated.password,
        share.passwordHash
      );

      if (!isValidPassword) {
        throw new AppErrors.UNAUTHORIZED('Invalid password');
      }
    }

    // Increment view count and update last accessed
    await prisma.report_shares.update({
      where: { id: shareId },
      data: {
        currentViews: share.currentViews + 1,
        lastAccessedAt: new Date(),
      },
    });

    // Get entities if available
    const entities = await prisma.entity_mentions.findMany({
      where: { reportId: share.reportId },
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
      take: 10,
    });

    // Prepare response data
    const responseData = {
      report: {
        id: share.playground_reports.id,
        title: share.playground_reports.threads.title,
        description: share.playground_reports.threads.description,
        content: share.playground_reports.htmlContent,
        format: 'html',
        sections: share.playground_reports.sections || [],
        insights: share.playground_reports.insights || [],
        entities: entities.map(em => ({
          id: em.entities.id,
          name: em.entities.name,
          type: em.entities.type,
          ticker: em.entities.ticker,
          description: em.entities.description,
          sentiment: em.sentiment,
          relevance: em.relevance,
        })),
        metadata: {
          model: share.playground_reports.model || 'claude-3-opus-20240229',
          tokens: share.playground_reports.totalTokens,
          generatedAt: share.playground_reports.createdAt,
        },
      },
      share: {
        id: share.id,
        allowDownload: share.allowDownload,
        allowComments: share.allowComments,
        sharedBy: share.metadata?.sharedBy || 'AssetWorks User',
        sharedAt: share.createdAt,
        viewsRemaining: share.maxViews ? Math.max(0, share.maxViews - share.currentViews - 1) : null,
      },
    };

    // Cache the response (without sensitive data)
    await CacheService.set(cacheKey, responseData, CacheTTL.MEDIUM);

    // Log access
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const duration = PerformanceMonitor.end(operationId, {
      shareId,
      reportId: share.reportId,
    });

    LoggingService.info('Shared report accessed', {
      shareId,
      reportId: share.reportId,
      ipAddress,
      currentViews: share.currentViews + 1,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Share access failed', error as Error);

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
        error: 'Failed to access shared report',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/public/shared/[shareId]
 * Get share metadata (for preview without accessing content)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  const operationId = `share-preview-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    const shareId = params.shareId;

    // Get token from query params
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      throw new AppErrors.UNAUTHORIZED('Share token required');
    }

    // Verify JWT token
    let tokenPayload: any;
    try {
      tokenPayload = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret'
      );
    } catch (error) {
      throw new AppErrors.UNAUTHORIZED('Invalid or expired share link');
    }

    // Verify token matches share ID
    if (tokenPayload.shareId !== shareId) {
      throw new AppErrors.UNAUTHORIZED('Invalid share link');
    }

    // Fetch share metadata
    const share = await prisma.report_shares.findUnique({
      where: { id: shareId },
      select: {
        id: true,
        expiresAt: true,
        passwordHash: true,
        maxViews: true,
        currentViews: true,
        allowDownload: true,
        allowComments: true,
        createdAt: true,
        metadata: true,
        playground_reports: {
          select: {
            threads: {
              select: {
                title: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!share) {
      throw new AppErrors.NOT_FOUND('Share link not found');
    }

    // Check if share is expired
    const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date();
    const viewsExhausted = share.maxViews && share.currentViews >= share.maxViews;

    const duration = PerformanceMonitor.end(operationId, { shareId });

    return NextResponse.json({
      success: true,
      data: {
        id: share.id,
        title: share.playground_reports.threads.title,
        description: share.playground_reports.threads.description,
        passwordProtected: !!share.passwordHash,
        isExpired,
        viewsExhausted,
        viewsRemaining: share.maxViews ? Math.max(0, share.maxViews - share.currentViews) : null,
        allowDownload: share.allowDownload,
        allowComments: share.allowComments,
        sharedBy: share.metadata?.sharedBy || 'AssetWorks User',
        sharedAt: share.createdAt,
        accessible: !isExpired && !viewsExhausted,
      },
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Share preview failed', error as Error);

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
        error: 'Failed to get share preview',
      },
      { status: 500 }
    );
  }
}