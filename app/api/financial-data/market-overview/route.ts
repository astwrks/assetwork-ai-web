/**
 * Market Overview API Endpoint
 * GET /api/financial-data/market-overview
 * Returns overview of stock and crypto markets
 */

import { NextResponse } from 'next/server';
import { alphaVantageService } from '@/lib/services/financial-data/alpha-vantage.service';
import { coinGeckoService } from '@/lib/services/financial-data/coingecko.service';

export async function GET() {
  try {
    // Fetch major indices and crypto data in parallel
    const [
      spyQuote,
      diaQuote,
      qqqQuote,
      topCryptos,
      cryptoGlobal
    ] = await Promise.all([
      alphaVantageService.getStockQuote('SPY'),  // S&P 500 ETF
      alphaVantageService.getStockQuote('DIA'),  // Dow Jones ETF
      alphaVantageService.getStockQuote('QQQ'),  // NASDAQ ETF
      coinGeckoService.getTopCryptos(10),
      coinGeckoService.getGlobalMarketData()
    ]);

    const result = {
      stocks: {
        indices: {
          sp500: spyQuote.success ? spyQuote.data : null,
          dow: diaQuote.success ? diaQuote.data : null,
          nasdaq: qqqQuote.success ? qqqQuote.data : null
        }
      },
      crypto: {
        top: topCryptos.success ? topCryptos.data : [],
        global: cryptoGlobal.success ? cryptoGlobal.data : null
      }
    };

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('[Market Overview API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
