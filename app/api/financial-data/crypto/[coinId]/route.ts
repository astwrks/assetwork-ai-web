/**
 * Crypto Data API Endpoint
 * GET /api/financial-data/crypto/[coinId]
 * Returns real-time cryptocurrency quote and optional historical data
 */

import { NextRequest, NextResponse } from 'next/server';
import { coinGeckoService } from '@/lib/services/financial-data/coingecko.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
) {
  try {
    const { coinId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeHistory = searchParams.get('history') === 'true';
    const days = parseInt(searchParams.get('days') || '30');

    if (!coinId) {
      return NextResponse.json(
        { success: false, error: 'Coin ID parameter is required' },
        { status: 400 }
      );
    }

    // Get crypto quote
    const quoteResponse = await coinGeckoService.getCryptoQuote(coinId);

    if (!quoteResponse.success) {
      return NextResponse.json(
        { success: false, error: quoteResponse.error },
        { status: 404 }
      );
    }

    const result: any = {
      quote: quoteResponse.data
    };

    // Optionally include historical data
    if (includeHistory) {
      const historyResponse = await coinGeckoService.getCryptoHistory(coinId, days);
      if (historyResponse.success) {
        result.history = historyResponse.data;
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now(),
      source: 'coingecko'
    });

  } catch (error) {
    console.error('[Crypto API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
