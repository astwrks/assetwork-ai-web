import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { claudeService } from '@/lib/ai/claude.service';
import { openaiService } from '@/lib/ai/openai.service';
import { marketDataService } from '@/lib/finance/market-data.service';
import { connectToDatabase } from '@/lib/db/mongodb';
import Widget from '@/lib/db/models/Widget';
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

    const { query, widgetType, customConfig } = await request.json();

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

    // Analyze the query to understand intent
    const analysis = await claudeService.analyzeFinancialQuery(query);
    
    // Extract entities and fetch relevant data
    const stockSymbols = extractStockSymbols(query);
    let marketData = {};
    let timeSeriesData = {};

    if (stockSymbols.length > 0) {
      // Fetch quotes for all symbols
      const quotes = await Promise.all(
        stockSymbols.map(symbol => marketDataService.getQuote(symbol))
      );
      
      quotes.forEach(quote => {
        marketData[quote.symbol] = quote;
      });

      // Fetch time series data if needed for charts
      if (analysis.widgetType === 'chart' || widgetType === 'chart') {
        const seriesPromises = stockSymbols.map(symbol => 
          marketDataService.getTimeSeries(symbol, 'daily', 'compact')
        );
        
        const series = await Promise.all(seriesPromises);
        stockSymbols.forEach((symbol, index) => {
          timeSeriesData[symbol] = series[index];
        });
      }
    }

    // Generate widget configuration using AI
    const widgetConfig = await openaiService.generateWidgetConfig(query, {
      marketData,
      timeSeriesData,
      analysis,
    });

    // Create the widget data structure
    const widgetData = {
      userId: session.user.id,
      title: widgetConfig.title || generateTitle(query),
      description: `Generated from: "${query}"`,
      query,
      type: widgetConfig.type || widgetType || 'chart',
      subType: widgetConfig.chartType,
      data: {
        marketData,
        timeSeriesData,
        processed: widgetConfig.data,
      },
      chartConfig: {
        chartType: widgetConfig.chartType || 'line',
        colors: widgetConfig.colors || generateColors(stockSymbols.length),
        showLegend: true,
        showGrid: true,
        animated: true,
        ...widgetConfig.config,
      },
      settings: {
        width: customConfig?.width,
        height: customConfig?.height,
        refreshInterval: customConfig?.refreshInterval || 60000, // 1 minute
        theme: customConfig?.theme || 'auto',
      },
      tags: [...stockSymbols, analysis.intent].filter(Boolean),
      isPublic: false,
    };

    // Save the widget
    const widget = await Widget.create(widgetData);

    // Save the query record
    await Query.create({
      userId: session.user.id,
      query,
      response: JSON.stringify(widgetConfig),
      widgetId: widget._id,
      credits: 2, // Widget generation costs more
      status: 'completed',
    });

    // Deduct credits for free users
    if (user.plan === 'free') {
      await User.findByIdAndUpdate(session.user.id, {
        $inc: { aiCredits: -2 },
      });
    }

    return NextResponse.json({
      success: true,
      widget: {
        id: widget._id,
        title: widget.title,
        type: widget.type,
        data: widget.data,
        chartConfig: widget.chartConfig,
        settings: widget.settings,
      },
      creditsRemaining: user.plan === 'free' ? Math.max(0, user.aiCredits - 2) : 'unlimited',
    });
  } catch (error) {
    console.error('Widget generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate widget' },
      { status: 500 }
    );
  }
}

function extractStockSymbols(query: string): string[] {
  const matches = query.match(/\b[A-Z]{1,5}\b/g) || [];
  const knownSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'NFLX', 'DIS', 'SPY', 'QQQ'];
  return [...new Set(matches.filter(symbol => knownSymbols.includes(symbol)))];
}

function generateTitle(query: string): string {
  const words = query.split(' ').slice(0, 5);
  return words.join(' ') + (words.length < query.split(' ').length ? '...' : '');
}

function generateColors(count: number): string[] {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];
  
  return colors.slice(0, count);
}