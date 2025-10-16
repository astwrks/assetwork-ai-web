import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { contextAggregationService, TimeRange } from '@/lib/services/context-aggregation.service';
import prisma from '@/lib/db/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/dashboard/summary?range=week
 *
 * Returns AI-generated activity summary for the current user
 * Includes caching with TTL
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('range') || 'week') as TimeRange;

    // Validate time range
    const validRanges: TimeRange[] = ['day', 'week', 'month', 'year'];
    if (!validRanges.includes(timeRange)) {
      return NextResponse.json(
        { error: 'Invalid time range. Use: day, week, month, or year' },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedSummary = await prisma.dashboard_cache.findUnique({
      where: {
        userId_cacheType_timeRange: {
          userId: user.id,
          cacheType: 'ACTIVITY_SUMMARY',
          timeRange,
        },
      },
    });

    // Return cached data if not expired
    if (cachedSummary && cachedSummary.expiresAt > new Date()) {
      return NextResponse.json({
        ...cachedSummary.data,
        cached: true,
        expiresAt: cachedSummary.expiresAt,
      });
    }

    // Generate fresh summary
    const activitySummary = await contextAggregationService.aggregateUserActivity(
      user.id,
      timeRange
    );

    const projectContext = await contextAggregationService.parseProjectDocs();

    const aiSummary = await contextAggregationService.generateActivitySummary(
      activitySummary,
      projectContext,
      user.name || undefined
    );

    // Determine cache TTL based on time range
    const cacheTTL = {
      day: 1 * 60 * 60 * 1000,       // 1 hour
      week: 6 * 60 * 60 * 1000,      // 6 hours
      month: 24 * 60 * 60 * 1000,    // 24 hours
      year: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const expiresAt = new Date(Date.now() + cacheTTL[timeRange]);

    const responseData = {
      summary: aiSummary,
      activitySummary,
      timeRange,
      generatedAt: new Date(),
    };

    // Update or create cache
    await prisma.dashboard_cache.upsert({
      where: {
        userId_cacheType_timeRange: {
          userId: user.id,
          cacheType: 'ACTIVITY_SUMMARY',
          timeRange,
        },
      },
      create: {
        id: uuidv4(),
        userId: user.id,
        cacheType: 'ACTIVITY_SUMMARY',
        timeRange,
        data: responseData,
        expiresAt,
        updatedAt: new Date(),
      },
      update: {
        data: responseData,
        expiresAt,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      ...responseData,
      cached: false,
      expiresAt,
    });

  } catch (error) {
    console.error('Error generating dashboard summary:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
