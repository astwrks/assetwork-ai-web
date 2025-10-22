/**
 * Dashboard Statistics API Endpoint
 * Provides aggregated statistics for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheKeys, CacheTTL } from '@/lib/services/redis.service';
import { MarketDataService } from '@/lib/services/market-data.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';

export async function GET(request: NextRequest) {
  const operationId = `dashboard-stats-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw AppErrors.UNAUTHORIZED;
    }

    const userId = session.user.id;

    // Check cache
    const cacheKey = `dashboard:stats:${userId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      PerformanceMonitor.end(operationId, { cached: true });
      return NextResponse.json({
        success: true,
        data: cached,
        meta: { cached: true },
      });
    }

    // Get user plan and credits
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, plan: true, aiCredits: true },
    });

    if (!user) {
      throw new AppErrors.NOT_FOUND('User not found');
    }

    // Fetch statistics in parallel
    const [
      totalReports,
      reportsThisMonth,
      totalEntities,
      recentActivities,
      savedReportsCount,
    ] = await Promise.all([
      // Total reports
      prisma.reports.count({
        where: { userId: user.id },
      }),

      // Reports this month
      prisma.reports.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // Total entities tracked
      prisma.entities.count(),

      // Recent activities
      prisma.user_activities.findMany({
        where: { userId: user.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),

      // Saved reports count
      prisma.savedReports.count({
        where: { userId: user.id },
      }),
    ]);

    // Set activeAlerts to 0 for now (notifications table doesn't exist yet)
    const activeAlerts = 0;

    // Get API usage
    const apiLimit = user.plan === 'FREE' ? 100 : user.plan === 'PRO' ? 1000 : 10000;
    const apiUsage = {
      used: apiLimit - user.aiCredits,
      limit: apiLimit,
      percentage: Math.round(((apiLimit - user.aiCredits) / apiLimit) * 100),
    };

    // Get trending market data
    const trendingSymbols = ['AAPL', 'GOOGL', 'MSFT', 'BTC', 'ETH'];
    const marketData = await Promise.all(
      trendingSymbols.map(async (symbol) => {
        const quote = await MarketDataService.getQuote(symbol);
        return quote ? {
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
        } : null;
      })
    );

    const stats = {
      totalReports,
      reportsThisMonth,
      totalEntities,
      activeAlerts,
      savedReports: savedReportsCount,
      apiUsage,
      marketOverview: {
        trending: marketData.filter(Boolean),
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        type: activity.eventType,
        entityType: activity.entityType,
        entityId: activity.entityId,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
      })),
      userPlan: {
        current: user.plan,
        features: user.plan === 'ENTERPRISE' ? [
          'unlimited-reports',
          'advanced-analytics',
          'real-time-market-data',
          'api-access',
          'priority-support',
          'custom-integrations',
        ] : user.plan === 'PRO' ? [
          '1000-reports',
          'advanced-analytics',
          'real-time-market-data',
          'api-access',
          'email-support',
        ] : [
          '100-reports',
          'basic-analytics',
          'delayed-market-data',
          'community-support',
        ],
      },
    };

    // Cache the stats
    await CacheService.set(cacheKey, stats, CacheTTL.SHORT);

    const duration = PerformanceMonitor.end(operationId, {
      userId: userId,
    });

    LoggingService.info('Dashboard stats fetched', {
      userId: userId,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        processingTime: duration,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Dashboard stats fetch failed', error as Error);

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
        error: 'Failed to fetch dashboard statistics',
      },
      { status: 500 }
    );
  }
}