import axios from 'axios';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  pe?: number;
  timestamp: Date;
}

export interface TimeSeriesData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketOverview {
  indices: {
    name: string;
    value: number;
    change: number;
    changePercent: number;
  }[];
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  mostActive: StockQuote[];
}

class MarketDataService {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
  }

  private getCacheKey(endpoint: string, params: any): string {
    return `${endpoint}-${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    const cacheKey = this.getCacheKey('quote', { symbol });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: this.apiKey,
        },
      });

      const quote = response.data['Global Quote'];
      if (!quote) {
        throw new Error('Invalid response from API');
      }

      const stockQuote: StockQuote = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previousClose: parseFloat(quote['08. previous close']),
        timestamp: new Date(),
      };

      this.setCache(cacheKey, stockQuote);
      return stockQuote;
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Return mock data for demo
      return this.getMockQuote(symbol);
    }
  }

  async getTimeSeries(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    outputSize: 'compact' | 'full' = 'compact'
  ): Promise<TimeSeriesData[]> {
    const cacheKey = this.getCacheKey('timeseries', { symbol, interval, outputSize });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const functionMap = {
        daily: 'TIME_SERIES_DAILY',
        weekly: 'TIME_SERIES_WEEKLY',
        monthly: 'TIME_SERIES_MONTHLY',
      };

      const response = await axios.get(this.baseUrl, {
        params: {
          function: functionMap[interval],
          symbol,
          outputsize: outputSize,
          apikey: this.apiKey,
        },
      });

      const timeSeriesKey = Object.keys(response.data).find(key => 
        key.includes('Time Series')
      );

      if (!timeSeriesKey) {
        throw new Error('Invalid response from API');
      }

      const timeSeries = response.data[timeSeriesKey];
      const data: TimeSeriesData[] = Object.entries(timeSeries)
        .map(([date, values]: [string, any]) => ({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        }))
        .slice(0, 30); // Limit to 30 data points

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching time series:', error);
      // Return mock data for demo
      return this.getMockTimeSeries(symbol);
    }
  }

  async searchSymbol(keywords: string): Promise<any[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords,
          apikey: this.apiKey,
        },
      });

      return response.data.bestMatches || [];
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }

  async getMarketOverview(): Promise<MarketOverview> {
    // This would typically aggregate data from multiple sources
    // For now, return mock data
    return {
      indices: [
        { name: 'S&P 500', value: 4783.45, change: 15.92, changePercent: 0.33 },
        { name: 'Dow Jones', value: 37545.33, change: 122.50, changePercent: 0.33 },
        { name: 'NASDAQ', value: 15003.22, change: 89.12, changePercent: 0.60 },
      ],
      topGainers: await Promise.all(
        ['TSLA', 'NVDA', 'AMD'].map(symbol => this.getQuote(symbol))
      ),
      topLosers: await Promise.all(
        ['META', 'NFLX', 'DIS'].map(symbol => this.getQuote(symbol))
      ),
      mostActive: await Promise.all(
        ['AAPL', 'MSFT', 'GOOGL'].map(symbol => this.getQuote(symbol))
      ),
    };
  }

  // Mock data generators for demo purposes
  private getMockQuote(symbol: string): StockQuote {
    const basePrice = Math.random() * 500 + 50;
    const change = (Math.random() - 0.5) * 10;
    
    return {
      symbol,
      price: basePrice,
      change,
      changePercent: (change / basePrice) * 100,
      volume: Math.floor(Math.random() * 10000000),
      high: basePrice + Math.random() * 5,
      low: basePrice - Math.random() * 5,
      open: basePrice - change,
      previousClose: basePrice - change,
      marketCap: basePrice * Math.floor(Math.random() * 1000000000),
      pe: Math.random() * 30 + 10,
      timestamp: new Date(),
    };
  }

  private getMockTimeSeries(symbol: string): TimeSeriesData[] {
    const data: TimeSeriesData[] = [];
    const today = new Date();
    let basePrice = Math.random() * 200 + 100;

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const change = (Math.random() - 0.5) * 10;
      const close = basePrice + change;
      const high = close + Math.random() * 5;
      const low = close - Math.random() * 5;
      const open = basePrice;

      data.push({
        date: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 10000000),
      });

      basePrice = close;
    }

    return data.reverse();
  }
}

export const marketDataService = new MarketDataService();