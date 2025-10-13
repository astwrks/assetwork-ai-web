/**
 * Financial Data Search API Endpoint
 * GET /api/financial-data/search?q=query&type=stocks|crypto|all
 * Search for stocks and cryptocurrencies
 */

import { NextRequest, NextResponse } from 'next/server';
import { alphaVantageService } from '@/lib/services/financial-data/alpha-vantage.service';
import { coinGeckoService } from '@/lib/services/financial-data/coingecko.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query parameter (q) is required' },
        { status: 400 }
      );
    }

    let stockResults: any[] = [];
    let cryptoResults: any[] = [];

    // Search stocks if requested
    if (type === 'stocks' || type === 'all') {
      const stockResponse = await alphaVantageService.searchSymbols(query);
      if (stockResponse.success && stockResponse.data) {
        stockResults = stockResponse.data;
      }
    }

    // Search crypto if requested
    if (type === 'crypto' || type === 'all') {
      const cryptoResponse = await coinGeckoService.searchCryptos(query);
      if (cryptoResponse.success && cryptoResponse.data) {
        cryptoResults = cryptoResponse.data;
      }
    }

    // Combine and sort results by match score
    const allResults = [...stockResults, ...cryptoResults].sort(
      (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
    );

    return NextResponse.json({
      success: true,
      data: {
        results: allResults,
        stocks: stockResults,
        crypto: cryptoResults
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
