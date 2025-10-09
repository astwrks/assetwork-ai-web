import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { claudeService } from '@/lib/ai/claude.service';
import { marketDataService } from '@/lib/finance/market-data.service';
import { connectToDatabase } from '@/lib/db/mongodb';
import Query from '@/lib/db/models/Query';
import User from '@/lib/db/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { query, streamResponse = false } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check user credits
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.aiCredits <= 0 && user.plan === 'free') {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Analyze the query
    const analysis = await claudeService.analyzeFinancialQuery(query);

    // Extract stock symbols from the query
    const stockSymbols = extractStockSymbols(query);
    
    // Fetch market data if needed
    let marketData = null;
    if (stockSymbols.length > 0) {
      marketData = await Promise.all(
        stockSymbols.map(symbol => marketDataService.getQuote(symbol))
      );
    }

    // Generate response with context
    const systemPrompt = `You are a financial analysis assistant. The user has asked: "${query}"
    
    Analysis: ${JSON.stringify(analysis)}
    ${marketData ? `Market Data: ${JSON.stringify(marketData)}` : ''}
    
    Provide a helpful response with insights and recommendations.`;

    const response = await claudeService.generateResponse(query, systemPrompt);

    // Save query to database
    const savedQuery = await Query.create({
      userId: session.user.id,
      query,
      response,
      credits: 1,
      status: 'completed',
      metadata: {
        model: 'claude-3-sonnet',
        dataSource: 'alpha-vantage',
      },
    });

    // Deduct credits for free users
    if (user.plan === 'free') {
      await User.findByIdAndUpdate(session.user.id, {
        $inc: { aiCredits: -1 },
      });
    }

    return NextResponse.json({
      success: true,
      queryId: savedQuery._id,
      response,
      analysis,
      marketData,
      creditsRemaining: user.plan === 'free' ? user.aiCredits - 1 : 'unlimited',
    });
  } catch (error) {
    console.error('AI query error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}

function extractStockSymbols(query: string): string[] {
  // Simple regex to extract potential stock symbols (uppercase letters, 1-5 chars)
  const matches = query.match(/\b[A-Z]{1,5}\b/g) || [];
  
  // Filter to known stock symbols (you could expand this list)
  const knownSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'NFLX', 'DIS'];
  
  return matches.filter(symbol => knownSymbols.includes(symbol));
}