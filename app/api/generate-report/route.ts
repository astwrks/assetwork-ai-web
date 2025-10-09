import { NextRequest, NextResponse } from 'next/server';
import { financialDataStore } from '@/lib/data/financial-data-store';

export async function POST(req: NextRequest) {
  try {
    const { symbol = 'AAPL' } = await req.json();
    
    // First collect all the data
    if (symbol === 'AAPL') {
      financialDataStore.collectAppleData();
    }
    
    // Then generate HTML from stored data
    const html = financialDataStore.generateHTMLFromData(symbol);
    
    return NextResponse.json({
      success: true,
      html,
      message: `Generated complete report for ${symbol} with ${html.length} characters`
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'AAPL';
  
  // Collect data
  if (symbol === 'AAPL') {
    financialDataStore.collectAppleData();
  }
  
  // Generate HTML
  const html = financialDataStore.generateHTMLFromData(symbol);
  
  // Return HTML directly
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}