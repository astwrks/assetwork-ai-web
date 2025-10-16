/**
 * Dashboard Activities API Endpoint
 * Provides user activity feed for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheTTL } from '@/lib/services/redis.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import {
  FileText,
  Globe,
  Bell,
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  Download,
  Share2,
  Edit,
  Eye,
  MessageSquare
} from 'lucide-react';

// Activity type icons mapping
const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'REPORT_CREATED': return 'FileText';
    case 'REPORT_UPDATED': return 'Edit';
    case 'REPORT_PUBLISHED': return 'Share2';
    case 'THREAD_STARTED': return 'MessageSquare';
    case 'ENTITY_TRACKED': return 'Globe';
    case 'TEMPLATE_USED': return 'Zap';
    case 'PDF_EXPORTED': return 'Download';
    case 'DASHBOARD_VIEWED': return 'Eye';
    default: return 'Bell';
  }
};

// Activity type descriptions
const getActivityDescription = (activity: any): string => {
  const metadata = activity.metadata as any || {};

  switch (activity.eventType) {
    case 'REPORT_CREATED':
      return `Generated a new report: "${metadata.title || 'Untitled Report'}"`;
    case 'REPORT_UPDATED':
      return `Updated report: "${metadata.title || 'Report'}"`;
    case 'REPORT_PUBLISHED':
      return `Published report to ${metadata.platform || 'the platform'}`;
    case 'THREAD_STARTED':
      return `Started a new conversation thread`;
    case 'ENTITY_TRACKED':
      return `Started tracking ${metadata.entityName || 'an entity'}`;
    case 'TEMPLATE_USED':
      return `Used template: "${metadata.templateName || 'Template'}"`;
    case 'PDF_EXPORTED':
      return `Exported report as PDF`;
    case 'DASHBOARD_VIEWED':
      return `Viewed the dashboard`;
    case 'SECTION_EDITED':
      return `Edited section in "${metadata.reportTitle || 'a report'}"`;
    default:
      return 'Performed an action';
  }
};

export async function GET(request: NextRequest) {
  const operationId = `dashboard-activities-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check cache
    const cacheKey = `dashboard:activities:${session.user.email}:${limit}:${offset}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      PerformanceMonitor.end(operationId, { cached: true });
      return NextResponse.json({
        success: true,
        data: cached,
        meta: { cached: true },
      });
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      throw new AppErrors.NOT_FOUND('User not found');
    }

    // Fetch activities
    const activities = await prisma.user_activities.findMany({
      where: { userId: user.id },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Get related entities for context
    const reportIds = activities
      .filter(a => a.entityType === 'report' && a.entityId)
      .map(a => a.entityId!);

    const reports = reportIds.length > 0 ? await prisma.reports.findMany({
      where: { id: { in: reportIds } },
      select: {
        id: true,
        title: true,
        status: true,
      },
    }) : [];

    const reportMap = new Map(reports.map(r => [r.id, r]));

    // Transform activities
    const transformedActivities = activities.map(activity => {
      const report = activity.entityType === 'report' && activity.entityId
        ? reportMap.get(activity.entityId)
        : null;

      return {
        id: activity.id,
        type: activity.eventType.toLowerCase(),
        title: activity.eventType.replace(/_/g, ' ').toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase()),
        description: getActivityDescription(activity),
        timestamp: activity.createdAt,
        icon: getActivityIcon(activity.eventType),
        status: activity.eventType === 'REPORT_PUBLISHED' ? 'success' :
                activity.eventType === 'PDF_EXPORTED' ? 'info' :
                activity.eventType === 'ENTITY_TRACKED' ? 'warning' :
                'info',
        metadata: {
          ...activity.metadata,
          entityType: activity.entityType,
          entityId: activity.entityId,
          reportTitle: report?.title,
          reportStatus: report?.status,
        },
        user: {
          name: activity.users.name,
          email: activity.users.email,
          avatar: activity.users.avatar,
        },
      };
    });

    // Get activity summary
    const [totalActivities, todayActivities] = await Promise.all([
      prisma.user_activities.count({
        where: { userId: user.id },
      }),
      prisma.user_activities.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const result = {
      activities: transformedActivities,
      summary: {
        total: totalActivities,
        today: todayActivities,
        hasMore: offset + limit < totalActivities,
      },
    };

    // Cache the activities
    await CacheService.set(cacheKey, result, CacheTTL.SHORT);

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      count: activities.length,
    });

    LoggingService.info('Dashboard activities fetched', {
      userId: user.id,
      email: session.user.email,
      count: activities.length,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: transformedActivities,
      meta: {
        total: totalActivities,
        limit,
        offset,
        hasMore: offset + limit < totalActivities,
        processingTime: duration,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Dashboard activities fetch failed', error as Error);

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
        error: 'Failed to fetch activities',
      },
      { status: 500 }
    );
  }
}