/**
 * Market Data API Endpoint
 * Provides real-time quotes and historical data for stocks and cryptocurrencies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { MarketDataService } from '@/lib/services/market-data.service';
import { CacheService, CacheKeys, CacheTTL } from '@/lib/services/redis.service';
import { ErrorHandler, AppErrors, LoggingService } from '@/lib/services/error-logging.service';
import { RateLimitService } from '@/lib/services/redis.service';

// Request validation schemas
const GetQuoteSchema = z.object({
  symbols: z.array(z.string()).min(1).max(50),
  includeIndicators: z.boolean().optional().default(false),
});

const GetHistoricalSchema = z.object({
  symbol: z.string(),
  range: z.enum(['1D', '1W', '1M', '3M', '1Y', 'ALL']).default('1M'),
});

/**
 * GET /api/v2/market/quotes
 * Get real-time quotes for multiple symbols
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols')?.split(',') || [];
    const includeIndicators = searchParams.get('includeIndicators') === 'true';

    // Validate request
    const validated = GetQuoteSchema.parse({
      symbols,
      includeIndicators,
    });

    // Rate limiting
    const rateLimitKey = `market:${session.user.email}`;
    const { limited, remaining } = await RateLimitService.isLimited(
      rateLimitKey,
      100, // 100 requests per hour
      3600
    );

    if (limited) {
      throw AppErrors.RATE_LIMIT_EXCEEDED;
    }

    // Fetch quotes
    const quotes = await Promise.all(
      validated.symbols.map(async (symbol) => {
        const quote = await MarketDataService.getQuote(symbol);

        if (validated.includeIndicators && quote) {
          const indicators = await MarketDataService.calculateIndicators(symbol);
          return { ...quote, indicators };
        }

        return quote;
      })
    );

    // Filter out null results
    const validQuotes = quotes.filter(q => q !== null);

    LoggingService.info('Market quotes fetched', {
      userId: session.user.email,
      symbols: validated.symbols,
      count: validQuotes.length,
    });

    return NextResponse.json({
      success: true,
      data: validQuotes,
      meta: {
        requestedSymbols: validated.symbols,
        returnedQuotes: validQuotes.length,
        rateLimitRemaining: remaining,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    LoggingService.error('Market quotes fetch failed', error as Error);

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
        error: 'Failed to fetch market quotes',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/market/quotes
 * Subscribe to real-time market data updates
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    const body = await request.json();
    const { symbols, action } = z.object({
      symbols: z.array(z.string()).min(1).max(50),
      action: z.enum(['subscribe', 'unsubscribe']),
    }).parse(body);

    // Rate limiting
    const rateLimitKey = `market-sub:${session.user.email}`;
    const { limited } = await RateLimitService.isLimited(
      rateLimitKey,
      20, // 20 subscription changes per hour
      3600
    );

    if (limited) {
      throw AppErrors.RATE_LIMIT_EXCEEDED;
    }

    // Update watched symbols
    if (action === 'subscribe') {
      symbols.forEach(symbol => MarketDataService.watchSymbol(symbol));
    } else {
      symbols.forEach(symbol => MarketDataService.unwatchSymbol(symbol));
    }

    LoggingService.info('Market subscription updated', {
      userId: session.user.email,
      action,
      symbols,
    });

    return NextResponse.json({
      success: true,
      message: `${action === 'subscribe' ? 'Subscribed to' : 'Unsubscribed from'} ${symbols.length} symbols`,
      symbols,
    });
  } catch (error) {
    LoggingService.error('Market subscription failed', error as Error);

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
        error: 'Failed to update subscription',
      },
      { status: 500 }
    );
  }
}