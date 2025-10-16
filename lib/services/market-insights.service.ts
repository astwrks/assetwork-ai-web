import { ActivitySummary } from './context-aggregation.service';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

export interface MarketData {
  stocks: StockMover[];
  crypto: CryptoTrending[];
  timestamp: Date;
}

export interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface CryptoTrending {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
  marketCap: number;
}

export interface MarketInsight {
  id: string;
  type: 'stock' | 'crypto' | 'news' | 'suggestion';
  title: string;
  description: string;
  actionText: string;
  actionPrompt: string; // Prompt to use when creating a thread
  relevance: number; // 0-100, how relevant to user's history
  isPersonalized: boolean;
  metadata?: {
    symbol?: string;
    price?: number;
    change?: number;
    entity?: string;
  };
}

export class MarketInsightsService {

  /**
   * Fetch real-time market data
   */
  async fetchMarketData(): Promise<MarketData> {
    try {
      const [stocks, crypto] = await Promise.all([
        this.fetchTopStockMovers(),
        this.fetchTrendingCrypto(),
      ]);

      return {
        stocks,
        crypto,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return {
        stocks: [],
        crypto: [],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Fetch top stock movers from Alpha Vantage
   */
  private async fetchTopStockMovers(): Promise<StockMover[]> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
      console.warn('Alpha Vantage API key not configured, using cached data');
      return this.getCachedStockData();
    }

    try {
      // Alpha Vantage doesn't have a "top movers" endpoint in free tier
      // We'll use a predefined list of popular stocks and fetch their data
      const popularStocks = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL', 'AMZN'];

      const stockData = await Promise.all(
        popularStocks.slice(0, 3).map(async (symbol) => {
          try {
            const response = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
              { next: { revalidate: 3600 } } // Cache for 1 hour
            );

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const quote = data['Global Quote'];

            if (!quote || Object.keys(quote).length === 0) {
              throw new Error('No quote data available');
            }

            const stockMover: StockMover = {
              symbol: quote['01. symbol'],
              name: symbol, // Alpha Vantage doesn't provide company name in GLOBAL_QUOTE
              price: parseFloat(quote['05. price']),
              change: parseFloat(quote['09. change']),
              changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
              volume: parseInt(quote['06. volume']),
            };

            // Cache the stock data
            await this.cacheStockData(stockMover);

            return stockMover;
          } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
            // Try to get cached data for this symbol
            const cached = await this.getCachedStockBySymbol(symbol);
            return cached;
          }
        })
      );

      const validStocks = stockData.filter((stock): stock is StockMover => stock !== null);

      // If no valid stocks from API, try to get all cached data
      return validStocks.length > 0 ? validStocks : this.getCachedStockData();
    } catch (error) {
      console.error('Error fetching stock movers:', error);
      return this.getCachedStockData();
    }
  }

  /**
   * Fetch trending crypto from CoinGecko
   */
  private async fetchTrendingCrypto(): Promise<CryptoTrending[]> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/search/trending',
        { next: { revalidate: 3600 } } // Cache for 1 hour
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const trending = data.coins.slice(0, 3).map((item: any) => {
        const crypto: CryptoTrending = {
          id: item.item.id,
          symbol: item.item.symbol.toUpperCase(),
          name: item.item.name,
          price: item.item.data?.price || 0,
          changePercent24h: item.item.data?.price_change_percentage_24h?.usd || 0,
          marketCap: item.item.data?.market_cap || 0,
        };

        // Cache crypto data in background
        this.cacheCryptoData(crypto).catch(console.error);

        return crypto;
      });

      return trending;
    } catch (error) {
      console.error('Error fetching trending crypto:', error);
      return this.getCachedCryptoData();
    }
  }

  /**
   * Generate market insights with AI personalization
   */
  async generateMarketInsights(
    marketData: MarketData,
    userActivity: ActivitySummary
  ): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];

    // Personalized insights from user's tracked entities
    const personalizedInsights = this.generatePersonalizedInsights(
      marketData,
      userActivity
    );
    insights.push(...personalizedInsights);

    // General market insights
    const generalInsights = this.generateGeneralInsights(marketData);
    insights.push(...generalInsights);

    // AI-enhanced suggestions
    try {
      const aiSuggestions = await this.generateAISuggestions(userActivity);
      insights.push(...aiSuggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }

    // Sort by relevance
    return insights.sort((a, b) => b.relevance - a.relevance).slice(0, 6);
  }

  /**
   * Generate personalized insights based on user's tracked entities
   */
  private generatePersonalizedInsights(
    marketData: MarketData,
    userActivity: ActivitySummary
  ): MarketInsight[] {
    const insights: MarketInsight[] = [];

    // Match stocks with user's tracked entities
    const trackedSymbols = userActivity.metrics.topEntities
      .filter((e) => e.symbol)
      .map((e) => e.symbol!);

    marketData.stocks.forEach((stock) => {
      if (trackedSymbols.includes(stock.symbol)) {
        const entity = userActivity.metrics.topEntities.find(
          (e) => e.symbol === stock.symbol
        );

        insights.push({
          id: `stock-${stock.symbol}`,
          type: 'stock',
          title: `${stock.name} (${stock.symbol}) ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`,
          description: `You analyzed ${entity?.name} recently. Current price: $${stock.price.toFixed(2)}`,
          actionText: 'Update Analysis',
          actionPrompt: `Update my analysis of ${stock.name} (${stock.symbol}) with the latest price movement of ${stock.changePercent.toFixed(2)}%. Current price is $${stock.price.toFixed(2)}.`,
          relevance: 95,
          isPersonalized: true,
          metadata: {
            symbol: stock.symbol,
            price: stock.price,
            change: stock.changePercent,
            entity: entity?.name,
          },
        });
      }
    });

    return insights;
  }

  /**
   * Generate general market insights
   */
  private generateGeneralInsights(marketData: MarketData): MarketInsight[] {
    const insights: MarketInsight[] = [];

    // Top stock mover
    const topMover = marketData.stocks.reduce((max, stock) =>
      Math.abs(stock.changePercent) > Math.abs(max.changePercent) ? stock : max
    , marketData.stocks[0]);

    if (topMover) {
      insights.push({
        id: `top-mover-${topMover.symbol}`,
        type: 'stock',
        title: `${topMover.name} ${topMover.changePercent >= 0 ? '📈' : '📉'} ${topMover.changePercent >= 0 ? '+' : ''}${topMover.changePercent.toFixed(2)}%`,
        description: `${topMover.name} is moving significantly today. Current price: $${topMover.price.toFixed(2)}`,
        actionText: 'Analyze Movement',
        actionPrompt: `Analyze why ${topMover.name} (${topMover.symbol}) is ${topMover.changePercent >= 0 ? 'up' : 'down'} ${Math.abs(topMover.changePercent).toFixed(2)}% today. What are the key drivers?`,
        relevance: 70,
        isPersonalized: false,
        metadata: {
          symbol: topMover.symbol,
          price: topMover.price,
          change: topMover.changePercent,
        },
      });
    }

    // Trending crypto
    if (marketData.crypto.length > 0) {
      const topCrypto = marketData.crypto[0];
      insights.push({
        id: `crypto-${topCrypto.id}`,
        type: 'crypto',
        title: `${topCrypto.name} (${topCrypto.symbol}) Trending 🔥`,
        description: `${topCrypto.name} is trending. 24h change: ${topCrypto.changePercent24h >= 0 ? '+' : ''}${topCrypto.changePercent24h.toFixed(2)}%`,
        actionText: 'Create Crypto Report',
        actionPrompt: `Create a comprehensive analysis of ${topCrypto.name} (${topCrypto.symbol}). Include price trends, market sentiment, and future outlook.`,
        relevance: 60,
        isPersonalized: false,
        metadata: {
          symbol: topCrypto.symbol,
          price: topCrypto.price,
          change: topCrypto.changePercent24h,
        },
      });
    }

    return insights;
  }

  /**
   * Generate AI-powered suggestions based on user patterns
   */
  private async generateAISuggestions(
    userActivity: ActivitySummary
  ): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];

    // Analyze user's patterns
    const topTopics = userActivity.metrics.mostActiveTopics.slice(0, 3);
    const topEntities = userActivity.metrics.topEntities.slice(0, 3);

    if (topTopics.length > 0) {
      const topic = topTopics[0].topic;
      insights.push({
        id: `suggestion-topic-${topic}`,
        type: 'suggestion',
        title: `Continue Analyzing ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
        description: `You've shown strong interest in ${topic}. Explore more opportunities in this area.`,
        actionText: 'Explore Topic',
        actionPrompt: `Based on my recent analysis of ${topic}, provide me with emerging trends and investment opportunities in this sector. Include both established players and up-and-coming companies.`,
        relevance: 75,
        isPersonalized: true,
      });
    }

    if (topEntities.length >= 2) {
      const entity1 = topEntities[0];
      const entity2 = topEntities[1];
      insights.push({
        id: `suggestion-compare`,
        type: 'suggestion',
        title: `Compare ${entity1.name} vs ${entity2.name}`,
        description: `You've analyzed both companies. See how they stack up side by side.`,
        actionText: 'Compare',
        actionPrompt: `Create a comprehensive comparison between ${entity1.name} and ${entity2.name}. Include financials, market position, growth prospects, and investment outlook.`,
        relevance: 80,
        isPersonalized: true,
        metadata: {
          entity: `${entity1.name} vs ${entity2.name}`,
        },
      });
    }

    return insights;
  }

  /**
   * Cache stock data in database
   */
  private async cacheStockData(stock: StockMover): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Cache for 1 hour

      await prisma.market_data_cache.upsert({
        where: {
          dataType_symbol: {
            dataType: 'STOCK_QUOTE',
            symbol: stock.symbol,
          },
        },
        create: {
          id: randomUUID(),
          dataType: 'STOCK_QUOTE',
          symbol: stock.symbol,
          data: stock,
          source: 'alpha_vantage',
          lastPrice: stock.price,
          changePercent: stock.changePercent,
          expiresAt,
        },
        update: {
          data: stock,
          lastPrice: stock.price,
          changePercent: stock.changePercent,
          fetchedAt: new Date(),
          expiresAt,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error caching stock data:', error);
    }
  }

  /**
   * Get cached stock data from database
   */
  private async getCachedStockData(): Promise<StockMover[]> {
    try {
      const cached = await prisma.market_data_cache.findMany({
        where: {
          dataType: 'STOCK_QUOTE',
        },
        orderBy: {
          fetchedAt: 'desc',
        },
        take: 6,
      });

      return cached.map((item) => item.data as StockMover);
    } catch (error) {
      console.error('Error retrieving cached stock data:', error);
      return [];
    }
  }

  /**
   * Get cached stock by symbol
   */
  private async getCachedStockBySymbol(symbol: string): Promise<StockMover | null> {
    try {
      const cached = await prisma.market_data_cache.findUnique({
        where: {
          dataType_symbol: {
            dataType: 'STOCK_QUOTE',
            symbol,
          },
        },
      });

      return cached ? (cached.data as StockMover) : null;
    } catch (error) {
      console.error(`Error retrieving cached stock ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Cache crypto data in database
   */
  private async cacheCryptoData(crypto: CryptoTrending): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Cache for 1 hour

      await prisma.market_data_cache.upsert({
        where: {
          dataType_symbol: {
            dataType: 'TRENDING_CRYPTO',
            symbol: crypto.symbol,
          },
        },
        create: {
          id: randomUUID(),
          dataType: 'TRENDING_CRYPTO',
          symbol: crypto.symbol,
          data: crypto,
          source: 'coingecko',
          lastPrice: crypto.price,
          changePercent: crypto.changePercent24h,
          expiresAt,
        },
        update: {
          data: crypto,
          lastPrice: crypto.price,
          changePercent: crypto.changePercent24h,
          fetchedAt: new Date(),
          expiresAt,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error caching crypto data:', error);
    }
  }

  /**
   * Get cached crypto data from database
   */
  private async getCachedCryptoData(): Promise<CryptoTrending[]> {
    try {
      const cached = await prisma.market_data_cache.findMany({
        where: {
          dataType: 'TRENDING_CRYPTO',
        },
        orderBy: {
          fetchedAt: 'desc',
        },
        take: 3,
      });

      return cached.map((item) => item.data as CryptoTrending);
    } catch (error) {
      console.error('Error retrieving cached crypto data:', error);
      return [];
    }
  }
}

export const marketInsightsService = new MarketInsightsService();
