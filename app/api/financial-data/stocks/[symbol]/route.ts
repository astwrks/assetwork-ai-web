/**
 * Stock Data API Endpoint
 * GET /api/financial-data/stocks/[symbol]
 * Returns real-time stock quote and optional historical data
 */

import { NextRequest, NextResponse } from 'next/server';
import { alphaVantageService } from '@/lib/services/financial-data/alpha-vantage.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const searchParams = request.nextUrl.searchParams;
    const includeHistory = searchParams.get('history') === 'true';
    const includeCompanyInfo = searchParams.get('company') === 'true';
    const interval = searchParams.get('interval') as any || 'daily';

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Get stock quote
    const quoteResponse = await alphaVantageService.getStockQuote(symbol);

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
      const historyResponse = await alphaVantageService.getStockHistory(symbol, interval);
      if (historyResponse.success) {
        result.history = historyResponse.data;
      }
    }

    // Optionally include company information
    if (includeCompanyInfo) {
      const companyResponse = await alphaVantageService.getCompanyInfo(symbol);
      if (companyResponse.success) {
        result.company = companyResponse.data;
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now(),
      source: 'alpha-vantage'
    });

  } catch (error) {
    console.error('[Stock API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
