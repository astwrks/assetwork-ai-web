/**
 * Alpha Vantage API Service
 * Provides stock market data, forex, and crypto data
 * Free tier: 25 API calls per day
 * Docs: https://www.alphavantage.co/documentation/
 */

import {
  StockQuote,
  StockHistoricalData,
  StockCompanyInfo,
  ApiResponse,
  SearchResult,
  TimeInterval
} from './types';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

export class AlphaVantageService {
  private apiKey: string;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 12000; // 12 seconds between requests (5 per minute)

  constructor(apiKey: string) {
    this.apiKey = apiKey || process.env.ALPHA_VANTAGE_API_KEY || 'demo';
  }

  /**
   * Rate limiting: Wait between requests to avoid hitting API limits
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const waitTime = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Make API request to Alpha Vantage
   */
  private async makeRequest<T>(params: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      await this.rateLimit();

      const url = new URL(ALPHA_VANTAGE_BASE_URL);
      url.searchParams.append('apikey', this.apiKey);

      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      console.log(`[Alpha Vantage] Request ${this.requestCount}: ${params.function}`);

      const response = await fetch(url.toString());
      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      if (data['Note']) {
        throw new Error('API call frequency limit reached. Please try again later.');
      }

      return {
        success: true,
        data: data as T,
        timestamp: Date.now(),
        source: 'alpha-vantage'
      };
    } catch (error) {
      console.error('[Alpha Vantage] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        source: 'alpha-vantage'
      };
    }
  }

  /**
   * Get real-time stock quote
   */
  async getStockQuote(symbol: string): Promise<ApiResponse<StockQuote>> {
    const response = await this.makeRequest({
      function: 'GLOBAL_QUOTE',
      symbol: symbol.toUpperCase()
    });

    if (!response.success || !response.data) {
      return response as ApiResponse<StockQuote>;
    }

    const data = response.data as any;
    const quote = data['Global Quote'];

    if (!quote || Object.keys(quote).length === 0) {
      return {
        success: false,
        error: 'No data found for symbol: ' + symbol,
        timestamp: Date.now(),
        source: 'alpha-vantage'
      };
    }

    const stockQuote: StockQuote = {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      timestamp: Date.now()
    };

    return {
      success: true,
      data: stockQuote,
      timestamp: Date.now(),
      source: 'alpha-vantage'
    };
  }

  /**
   * Get historical stock data
   */
  async getStockHistory(
    symbol: string,
    interval: TimeInterval = 'daily'
  ): Promise<ApiResponse<StockHistoricalData>> {
    const functionMap: Record<string, string> = {
      '1min': 'TIME_SERIES_INTRADAY',
      '5min': 'TIME_SERIES_INTRADAY',
      '15min': 'TIME_SERIES_INTRADAY',
      '30min': 'TIME_SERIES_INTRADAY',
      '60min': 'TIME_SERIES_INTRADAY',
      'daily': 'TIME_SERIES_DAILY',
      'weekly': 'TIME_SERIES_WEEKLY',
      'monthly': 'TIME_SERIES_MONTHLY'
    };

    const params: Record<string, string> = {
      function: functionMap[interval] || 'TIME_SERIES_DAILY',
      symbol: symbol.toUpperCase(),
      outputsize: 'compact' // compact = last 100 data points, full = 20+ years
    };

    // Add interval parameter for intraday data
    if (interval.includes('min')) {
      params.interval = interval;
    }

    const response = await this.makeRequest(params);

    if (!response.success || !response.data) {
      return response as ApiResponse<StockHistoricalData>;
    }

    const data = response.data as any;

    // Find the time series key (varies by function)
    const timeSeriesKey = Object.keys(data).find(key =>
      key.includes('Time Series')
    );

    if (!timeSeriesKey) {
      return {
        success: false,
        error: 'Invalid response format from Alpha Vantage',
        timestamp: Date.now(),
        source: 'alpha-vantage'
      };
    }

    const timeSeries = data[timeSeriesKey];
    const historicalData: StockHistoricalData = {
      symbol: symbol.toUpperCase(),
      data: Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      }))
    };

    return {
      success: true,
      data: historicalData,
      timestamp: Date.now(),
      source: 'alpha-vantage'
    };
  }

  /**
   * Get company information
   */
  async getCompanyInfo(symbol: string): Promise<ApiResponse<StockCompanyInfo>> {
    const response = await this.makeRequest({
      function: 'OVERVIEW',
      symbol: symbol.toUpperCase()
    });

    if (!response.success || !response.data) {
      return response as ApiResponse<StockCompanyInfo>;
    }

    const data = response.data as any;

    if (!data.Symbol) {
      return {
        success: false,
        error: 'No company information found for symbol: ' + symbol,
        timestamp: Date.now(),
        source: 'alpha-vantage'
      };
    }

    const companyInfo: StockCompanyInfo = {
      symbol: data.Symbol,
      name: data.Name,
      description: data.Description,
      sector: data.Sector,
      industry: data.Industry,
      marketCap: parseFloat(data.MarketCapitalization),
      peRatio: parseFloat(data.PERatio),
      dividendYield: parseFloat(data.DividendYield) * 100,
      fiftyTwoWeekHigh: parseFloat(data['52WeekHigh']),
      fiftyTwoWeekLow: parseFloat(data['52WeekLow']),
      country: data.Country,
      website: data.Website
    };

    return {
      success: true,
      data: companyInfo,
      timestamp: Date.now(),
      source: 'alpha-vantage'
    };
  }

  /**
   * Search for stocks
   */
  async searchSymbols(keywords: string): Promise<ApiResponse<SearchResult[]>> {
    const response = await this.makeRequest({
      function: 'SYMBOL_SEARCH',
      keywords
    });

    if (!response.success || !response.data) {
      return response as ApiResponse<SearchResult[]>;
    }

    const data = response.data as any;
    const matches = data.bestMatches || [];

    const searchResults: SearchResult[] = matches.map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'].toLowerCase().includes('equity') ? 'stock' as const : 'etf' as const,
      exchange: match['4. region'],
      currency: match['8. currency'],
      matchScore: parseFloat(match['9. matchScore'])
    }));

    return {
      success: true,
      data: searchResults,
      timestamp: Date.now(),
      source: 'alpha-vantage'
    };
  }

  /**
   * Get current request count (for debugging)
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Reset request counter (useful for testing)
   */
  resetRequestCount(): void {
    this.requestCount = 0;
  }
}

// Export singleton instance
export const alphaVantageService = new AlphaVantageService(
  process.env.ALPHA_VANTAGE_API_KEY || 'demo'
);
