/**
 * Historical Market Data API Endpoint
 * Provides historical price data and technical analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { MarketDataService } from '@/lib/services/market-data.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import { RateLimitService } from '@/lib/services/redis.service';

// Request validation schema
const HistoricalDataSchema = z.object({
  symbol: z.string().min(1).max(10),
  range: z.enum(['1D', '1W', '1M', '3M', '1Y', 'ALL']).default('1M'),
  indicators: z.boolean().optional().default(false),
});

/**
 * GET /api/v2/market/historical
 * Get historical price data for a symbol
 */
export async function GET(request: NextRequest) {
  const operationId = `historical-data-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || '';
    const range = searchParams.get('range') || '1M';
    const indicators = searchParams.get('indicators') === 'true';

    // Validate request
    const validated = HistoricalDataSchema.parse({
      symbol,
      range,
      indicators,
    });

    // Rate limiting
    const rateLimitKey = `historical:${session.user.email}`;
    const { limited, remaining } = await RateLimitService.isLimited(
      rateLimitKey,
      50, // 50 requests per hour
      3600
    );

    if (limited) {
      throw AppErrors.RATE_LIMIT_EXCEEDED;
    }

    // Fetch historical data
    const historicalData = await MarketDataService.getHistoricalData(
      validated.symbol,
      validated.range as any
    );

    // Calculate technical indicators if requested
    let technicalIndicators = null;
    if (validated.indicators && historicalData.length > 0) {
      technicalIndicators = await MarketDataService.calculateIndicators(validated.symbol);
    }

    const duration = PerformanceMonitor.end(operationId, {
      userId: session.user.email,
      symbol: validated.symbol,
      range: validated.range,
    });

    LoggingService.info('Historical data fetched', {
      userId: session.user.email,
      symbol: validated.symbol,
      range: validated.range,
      dataPoints: historicalData.length,
      duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        symbol: validated.symbol,
        range: validated.range,
        historical: historicalData,
        indicators: technicalIndicators,
      },
      meta: {
        dataPoints: historicalData.length,
        rateLimitRemaining: remaining,
        processingTime: duration,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Historical data fetch failed', error as Error);

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
        error: 'Failed to fetch historical data',
      },
      { status: 500 }
    );
  }
}