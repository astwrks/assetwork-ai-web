/**
 * Report Sharing API Endpoint
 * Handles sharing reports with external users via secure links
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import { CacheService } from '@/lib/services/redis.service';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Validation schemas
const CreateShareSchema = z.object({
  expiresIn: z.enum(['1h', '24h', '7d', '30d', 'never']).default('7d'),
  password: z.string().min(6).optional(),
  maxViews: z.number().min(1).max(1000).optional(),
  allowDownload: z.boolean().default(false),
  allowComments: z.boolean().default(false),
  recipientEmail: z.string().email().optional(),
});

const AccessShareSchema = z.object({
  password: z.string().optional(),
});

/**
 * POST /api/v2/reports/[reportId]/share
 * Create a shareable link for a report
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const operationId = `report-share-create-${Date.now()}`;
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
      select: { id: true, name: true },
    });

    if (!user) {
      throw new AppErrors.NOT_FOUND('User not found');
    }

    const reportId = params.reportId;

    // Parse and validate request
    const body = await request.json().catch(() => ({}));
    const validated = CreateShareSchema.parse(body);

    // Verify report ownership
    const report = await prisma.playground_reports.findFirst({
      where: {
        id: reportId,
        threads: {
          userId: user.id,
        },
      },
      include: {
        threads: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    if (!report) {
      throw new AppErrors.NOT_FOUND('Report not found');
    }

    // Generate share ID and token
    const shareId = nanoid();
    const shareToken = nanoid(32);

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (validated.expiresIn !== 'never') {
      const durations: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      expiresAt = new Date(Date.now() + durations[validated.expiresIn]);
    }

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (validated.password) {
      hashedPassword = await bcrypt.hash(validated.password, 10);
    }

    // Create share record
    const share = await prisma.report_shares.create({
      data: {
        id: shareId,
        reportId,
        shareToken,
        createdBy: user.id,
        expiresAt,
        passwordHash: hashedPassword,
        maxViews: validated.maxViews,
        currentViews: 0,
        allowDownload: validated.allowDownload,
        allowComments: validated.allowComments,
        recipientEmail: validated.recipientEmail,
        metadata: {
          reportTitle: report.threads.title,
          reportDescription: report.threads.description,
          sharedBy: user.name || user.email,
        },
      },
    });

    // Generate JWT for the share link
    const jwtToken = jwt.sign(
      {
        shareId,
        reportId,
        expiresAt: expiresAt?.toISOString(),
      },
      process.env.JWT_SECRET || 'default-secret',
      {
        expiresIn: validated.expiresIn === 'never' ? '100y' : validated.expiresIn,
      }
    );

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const shareUrl = `${baseUrl}/shared/report/${shareId}?token=${jwtToken}`;

    // Send email notification if recipient provided
    if (validated.recipientEmail) {
      // Queue email sending (implement email service)
      LoggingService.info('Share email queued', {
        shareId,
        recipientEmail: validated.recipientEmail,
        reportTitle: report.threads.title,
      });
    }

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      reportId,
      shareId,
    });

    LoggingService.info('Report share created', {
      userId: user.id,
      reportId,
      shareId,
      expiresIn: validated.expiresIn,
      hasPassword: !!validated.password,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        shareId,
        shareUrl,
        expiresAt,
        maxViews: validated.maxViews,
        allowDownload: validated.allowDownload,
        allowComments: validated.allowComments,
        passwordProtected: !!validated.password,
      },
      meta: {
        processingTime: duration,
      },
    }, { status: 201 });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Report share creation failed', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid share parameters',
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
        error: 'Failed to create share link',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/reports/[reportId]/share
 * List all share links for a report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const operationId = `report-share-list-${Date.now()}`;
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

    const reportId = params.reportId;

    // Verify report ownership
    const report = await prisma.playground_reports.findFirst({
      where: {
        id: reportId,
        threads: {
          userId: user.id,
        },
      },
    });

    if (!report) {
      throw new AppErrors.NOT_FOUND('Report not found');
    }

    // Fetch all shares for the report
    const shares = await prisma.report_shares.findMany({
      where: {
        reportId,
        createdBy: user.id,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shareToken: true,
        expiresAt: true,
        maxViews: true,
        currentViews: true,
        allowDownload: true,
        allowComments: true,
        recipientEmail: true,
        lastAccessedAt: true,
        createdAt: true,
        metadata: true,
      },
    });

    // Build share URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const sharesWithUrls = shares.map(share => ({
      ...share,
      shareUrl: `${baseUrl}/shared/report/${share.id}`,
      isExpired: share.expiresAt ? new Date(share.expiresAt) < new Date() : false,
      viewsExhausted: share.maxViews ? share.currentViews >= share.maxViews : false,
      passwordProtected: !!share.metadata?.passwordHash,
    }));

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      reportId,
      shareCount: shares.length,
    });

    LoggingService.info('Report shares fetched', {
      userId: user.id,
      reportId,
      shareCount: shares.length,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: sharesWithUrls,
      meta: {
        total: shares.length,
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Report share list failed', error as Error);

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
        error: 'Failed to fetch share links',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/reports/[reportId]/share
 * Revoke a share link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const operationId = `report-share-revoke-${Date.now()}`;
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

    const reportId = params.reportId;
    const shareId = request.nextUrl.searchParams.get('shareId');

    if (!shareId) {
      throw new AppErrors.BAD_REQUEST('Share ID is required');
    }

    // Verify ownership and delete
    const share = await prisma.report_shares.findFirst({
      where: {
        id: shareId,
        reportId,
        createdBy: user.id,
      },
    });

    if (!share) {
      throw new AppErrors.NOT_FOUND('Share link not found');
    }

    // Delete the share
    await prisma.report_shares.delete({
      where: { id: shareId },
    });

    // Clear cache
    await CacheService.del(`share:${shareId}`);

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      reportId,
      shareId,
    });

    LoggingService.info('Report share revoked', {
      userId: user.id,
      reportId,
      shareId,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Share link revoked successfully',
      meta: {
        processingTime: duration,
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Report share revoke failed', error as Error);

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
        error: 'Failed to revoke share link',
      },
      { status: 500 }
    );
  }
}