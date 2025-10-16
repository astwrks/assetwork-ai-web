/**
 * Real-Time Market Data Service
 * Fetches and streams financial data from multiple providers
 */

import axios from 'axios';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheKeys, CacheTTL } from './redis.service';
import { WebSocketService } from './websocket.service';
import { PubSubService } from './redis.service';

// Market data schemas
export const QuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number(),
  high: z.number(),
  low: z.number(),
  open: z.number(),
  previousClose: z.number(),
  marketCap: z.number().optional(),
  pe: z.number().optional(),
  eps: z.number().optional(),
  timestamp: z.number(),
  source: z.string(),
});

export const CryptoDataSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  marketCap: z.number(),
  volume24h: z.number(),
  change24h: z.number(),
  changePercent24h: z.number(),
  circulatingSupply: z.number(),
  totalSupply: z.number().optional(),
  rank: z.number(),
  timestamp: z.number(),
});

export const HistoricalDataSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  adjustedClose: z.number().optional(),
});

export const TechnicalIndicatorSchema = z.object({
  rsi: z.number().optional(),
  macd: z.object({
    value: z.number(),
    signal: z.number(),
    histogram: z.number(),
  }).optional(),
  sma: z.record(z.number()).optional(),
  ema: z.record(z.number()).optional(),
  bollingerBands: z.object({
    upper: z.number(),
    middle: z.number(),
    lower: z.number(),
  }).optional(),
  stochastic: z.object({
    k: z.number(),
    d: z.number(),
  }).optional(),
});

export type Quote = z.infer<typeof QuoteSchema>;
export type CryptoData = z.infer<typeof CryptoDataSchema>;
export type HistoricalData = z.infer<typeof HistoricalDataSchema>;
export type TechnicalIndicator = z.infer<typeof TechnicalIndicatorSchema>;

// API configurations
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';
const COINGECKO_KEY = process.env.COINGECKO_API_KEY || '';

/**
 * Market Data Service
 */
export class MarketDataService {
  private static watchedSymbols = new Set<string>();
  private static updateInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize market data streaming
   */
  static initialize() {
    // Subscribe to market data requests
    PubSubService.subscribe('market:request', async ({ symbol, socketId }) => {
      const quote = await this.getQuote(symbol);
      if (quote) {
        await WebSocketService.broadcastMarketUpdate(symbol, quote);
      }
    });

    // Start periodic updates for watched symbols
    this.startPeriodicUpdates();
  }

  /**
   * Get real-time quote for a symbol
   */
  static async getQuote(symbol: string): Promise<Quote | null> {
    const cacheKey = CacheKeys.MARKET_DATA(symbol);

    // Check cache first
    const cached = await CacheService.get<Quote>(cacheKey, QuoteSchema);
    if (cached) return cached;

    try {
      // Determine if crypto or stock
      const isCrypto = this.isCryptoSymbol(symbol);

      if (isCrypto) {
        return await this.getCryptoQuote(symbol);
      } else {
        return await this.getStockQuote(symbol);
      }
    } catch (error) {
      console.error(`Failed to get quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get stock quote from Alpha Vantage
   */
  private static async getStockQuote(symbol: string): Promise<Quote | null> {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: ALPHA_VANTAGE_KEY,
        },
      });

      const data = response.data['Global Quote'];
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      const quote: Quote = {
        symbol: symbol.toUpperCase(),
        price: parseFloat(data['05. price'] || '0'),
        change: parseFloat(data['09. change'] || '0'),
        changePercent: parseFloat(data['10. change percent']?.replace('%', '') || '0'),
        volume: parseInt(data['06. volume'] || '0'),
        high: parseFloat(data['03. high'] || '0'),
        low: parseFloat(data['04. low'] || '0'),
        open: parseFloat(data['02. open'] || '0'),
        previousClose: parseFloat(data['08. previous close'] || '0'),
        timestamp: Date.now(),
        source: 'alpha_vantage',
      };

      // Cache the quote
      await CacheService.set(CacheKeys.MARKET_DATA(symbol), quote, CacheTTL.MARKET_DATA);

      // Save to database for historical tracking
      await this.saveMarketData(symbol, 'STOCK_QUOTE', quote);

      return quote;
    } catch (error) {
      console.error(`Alpha Vantage API error for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get cryptocurrency quote from CoinGecko
   */
  private static async getCryptoQuote(symbol: string): Promise<Quote | null> {
    try {
      const coinId = this.getCoinGeckoId(symbol);

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: coinId,
            vs_currencies: 'usd',
            include_market_cap: true,
            include_24hr_vol: true,
            include_24hr_change: true,
            include_last_updated_at: true,
          },
          headers: {
            'x-cg-demo-api-key': COINGECKO_KEY,
          },
        }
      );

      const data = response.data[coinId];
      if (!data) return null;

      const quote: Quote = {
        symbol: symbol.toUpperCase(),
        price: data.usd || 0,
        change: data.usd_24h_change || 0,
        changePercent: data.usd_24h_change || 0,
        volume: data.usd_24h_vol || 0,
        marketCap: data.usd_market_cap || 0,
        high: 0, // CoinGecko simple price doesn't provide daily high/low
        low: 0,
        open: 0,
        previousClose: 0,
        timestamp: (data.last_updated_at || Date.now() / 1000) * 1000,
        source: 'coingecko',
      };

      // Cache the quote
      await CacheService.set(CacheKeys.MARKET_DATA(symbol), quote, CacheTTL.MARKET_DATA);

      // Save to database
      await this.saveMarketData(symbol, 'CRYPTO_PRICE', quote);

      return quote;
    } catch (error) {
      console.error(`CoinGecko API error for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get historical data for a symbol
   */
  static async getHistoricalData(
    symbol: string,
    range: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL' = '1M'
  ): Promise<HistoricalData[]> {
    const cacheKey = `${CacheKeys.MARKET_DATA(symbol)}:historical:${range}`;

    // Check cache
    const cached = await CacheService.get<HistoricalData[]>(cacheKey);
    if (cached) return cached;

    try {
      const isCrypto = this.isCryptoSymbol(symbol);

      if (isCrypto) {
        return await this.getCryptoHistoricalData(symbol, range);
      } else {
        return await this.getStockHistoricalData(symbol, range);
      }
    } catch (error) {
      console.error(`Failed to get historical data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get stock historical data from Alpha Vantage
   */
  private static async getStockHistoricalData(
    symbol: string,
    range: string
  ): Promise<HistoricalData[]> {
    try {
      const functionType = range === '1D' ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY';
      const params: any = {
        function: functionType,
        symbol: symbol.toUpperCase(),
        apikey: ALPHA_VANTAGE_KEY,
      };

      if (functionType === 'TIME_SERIES_INTRADAY') {
        params.interval = '5min';
      }

      const response = await axios.get('https://www.alphavantage.co/query', { params });

      const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
      if (!timeSeriesKey) return [];

      const timeSeries = response.data[timeSeriesKey];
      const historicalData: HistoricalData[] = [];

      for (const [date, values] of Object.entries(timeSeries)) {
        historicalData.push({
          date,
          open: parseFloat((values as any)['1. open']),
          high: parseFloat((values as any)['2. high']),
          low: parseFloat((values as any)['3. low']),
          close: parseFloat((values as any)['4. close']),
          volume: parseInt((values as any)['5. volume']),
          adjustedClose: parseFloat((values as any)['5. adjusted close'] || (values as any)['4. close']),
        });
      }

      // Filter based on range
      const filtered = this.filterHistoricalByRange(historicalData, range);

      // Cache the result
      await CacheService.set(
        `${CacheKeys.MARKET_DATA(symbol)}:historical:${range}`,
        filtered,
        CacheTTL.LONG
      );

      return filtered;
    } catch (error) {
      console.error(`Alpha Vantage historical data error for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get crypto historical data from CoinGecko
   */
  private static async getCryptoHistoricalData(
    symbol: string,
    range: string
  ): Promise<HistoricalData[]> {
    try {
      const coinId = this.getCoinGeckoId(symbol);
      const days = this.rangeToDays(range);

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days,
            interval: days <= 7 ? 'hourly' : 'daily',
          },
          headers: {
            'x-cg-demo-api-key': COINGECKO_KEY,
          },
        }
      );

      const { prices, market_caps, total_volumes } = response.data;
      const historicalData: HistoricalData[] = [];

      for (let i = 0; i < prices.length; i++) {
        historicalData.push({
          date: new Date(prices[i][0]).toISOString(),
          open: prices[i][1],
          high: prices[i][1],
          low: prices[i][1],
          close: prices[i][1],
          volume: total_volumes[i] ? total_volumes[i][1] : 0,
        });
      }

      // Cache the result
      await CacheService.set(
        `${CacheKeys.MARKET_DATA(symbol)}:historical:${range}`,
        historicalData,
        CacheTTL.LONG
      );

      return historicalData;
    } catch (error) {
      console.error(`CoinGecko historical data error for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Calculate technical indicators
   */
  static async calculateIndicators(
    symbol: string,
    period: number = 14
  ): Promise<TechnicalIndicator> {
    const historicalData = await this.getHistoricalData(symbol, '3M');
    const closes = historicalData.map(d => d.close);

    if (closes.length < period) {
      return {};
    }

    const indicators: TechnicalIndicator = {
      rsi: this.calculateRSI(closes, period),
      macd: this.calculateMACD(closes),
      sma: {
        20: this.calculateSMA(closes, 20),
        50: this.calculateSMA(closes, 50),
        200: this.calculateSMA(closes, 200),
      },
      ema: {
        12: this.calculateEMA(closes, 12),
        26: this.calculateEMA(closes, 26),
      },
      bollingerBands: this.calculateBollingerBands(closes, 20),
      stochastic: this.calculateStochastic(historicalData, period),
    };

    return indicators;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference > 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Math.round(rsi * 100) / 100;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private static calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    // Calculate signal line (9-day EMA of MACD)
    const macdValues = prices.slice(-26).map((_, i) => {
      const e12 = this.calculateEMA(prices.slice(0, prices.length - 26 + i + 1), 12);
      const e26 = this.calculateEMA(prices.slice(0, prices.length - 26 + i + 1), 26);
      return e12 - e26;
    });

    const signal = this.calculateEMA(macdValues, 9);
    const histogram = macdLine - signal;

    return {
      value: Math.round(macdLine * 100) / 100,
      signal: Math.round(signal * 100) / 100,
      histogram: Math.round(histogram * 100) / 100,
    };
  }

  /**
   * Calculate Simple Moving Average
   */
  private static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const relevantPrices = prices.slice(-period);
    const sum = relevantPrices.reduce((a, b) => a + b, 0);
    return Math.round((sum / period) * 100) / 100;
  }

  /**
   * Calculate Exponential Moving Average
   */
  private static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return Math.round(ema * 100) / 100;
  }

  /**
   * Calculate Bollinger Bands
   */
  private static calculateBollingerBands(
    prices: number[],
    period: number = 20
  ): { upper: number; middle: number; lower: number } {
    const sma = this.calculateSMA(prices, period);
    const relevantPrices = prices.slice(-period);

    // Calculate standard deviation
    const squaredDiffs = relevantPrices.map(price => Math.pow(price - sma, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return {
      upper: Math.round((sma + 2 * stdDev) * 100) / 100,
      middle: sma,
      lower: Math.round((sma - 2 * stdDev) * 100) / 100,
    };
  }

  /**
   * Calculate Stochastic Oscillator
   */
  private static calculateStochastic(
    data: HistoricalData[],
    period: number = 14
  ): { k: number; d: number } {
    if (data.length < period) return { k: 50, d: 50 };

    const relevantData = data.slice(-period);
    const closes = relevantData.map(d => d.close);
    const highs = relevantData.map(d => d.high);
    const lows = relevantData.map(d => d.low);

    const currentClose = closes[closes.length - 1];
    const highestHigh = Math.max(...highs);
    const lowestLow = Math.min(...lows);

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    // Calculate %D (3-period SMA of %K)
    const kValues = [];
    for (let i = 2; i >= 0; i--) {
      const periodData = data.slice(-(period + i), data.length - i);
      const periodCloses = periodData.map(d => d.close);
      const periodHighs = periodData.map(d => d.high);
      const periodLows = periodData.map(d => d.low);

      const close = periodCloses[periodCloses.length - 1];
      const high = Math.max(...periodHighs);
      const low = Math.min(...periodLows);

      kValues.push(((close - low) / (high - low)) * 100);
    }

    const d = kValues.reduce((a, b) => a + b, 0) / kValues.length;

    return {
      k: Math.round(k * 100) / 100,
      d: Math.round(d * 100) / 100,
    };
  }

  /**
   * Watch symbol for real-time updates
   */
  static watchSymbol(symbol: string) {
    this.watchedSymbols.add(symbol.toUpperCase());
  }

  /**
   * Unwatch symbol
   */
  static unwatchSymbol(symbol: string) {
    this.watchedSymbols.delete(symbol.toUpperCase());
  }

  /**
   * Start periodic updates for watched symbols
   */
  private static startPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      for (const symbol of this.watchedSymbols) {
        const quote = await this.getQuote(symbol);
        if (quote) {
          await WebSocketService.broadcastMarketUpdate(symbol, quote);
        }
      }
    }, 10000); // Update every 10 seconds
  }

  /**
   * Save market data to database
   */
  private static async saveMarketData(
    symbol: string,
    dataType: 'STOCK_QUOTE' | 'CRYPTO_PRICE',
    data: Quote
  ) {
    try {
      await prisma.market_data_cache.upsert({
        where: {
          dataType_symbol: {
            dataType,
            symbol: symbol.toUpperCase(),
          },
        },
        create: {
          id: `${dataType}:${symbol}:${Date.now()}`,
          dataType,
          symbol: symbol.toUpperCase(),
          data: data as any,
          source: data.source,
          lastPrice: data.price,
          changePercent: data.changePercent,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + CacheTTL.MARKET_DATA * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          data: data as any,
          lastPrice: data.price,
          changePercent: data.changePercent,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + CacheTTL.MARKET_DATA * 1000),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to save market data:', error);
    }
  }

  /**
   * Helper: Check if symbol is cryptocurrency
   */
  private static isCryptoSymbol(symbol: string): boolean {
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'MATIC', 'AVAX'];
    return cryptoSymbols.includes(symbol.toUpperCase());
  }

  /**
   * Helper: Get CoinGecko ID from symbol
   */
  private static getCoinGeckoId(symbol: string): string {
    const symbolMap: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      BNB: 'binancecoin',
      XRP: 'ripple',
      ADA: 'cardano',
      DOGE: 'dogecoin',
      SOL: 'solana',
      DOT: 'polkadot',
      MATIC: 'matic-network',
      AVAX: 'avalanche-2',
    };
    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  /**
   * Helper: Convert range to days
   */
  private static rangeToDays(range: string): number {
    const rangeMap: Record<string, number> = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '1Y': 365,
      'ALL': 3650, // 10 years
    };
    return rangeMap[range] || 30;
  }

  /**
   * Helper: Filter historical data by range
   */
  private static filterHistoricalByRange(
    data: HistoricalData[],
    range: string
  ): HistoricalData[] {
    const days = this.rangeToDays(range);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return data.filter(d => new Date(d.date) >= cutoffDate);
  }
}

export default MarketDataService;