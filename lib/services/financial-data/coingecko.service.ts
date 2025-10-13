/**
 * CoinGecko API Service
 * Provides cryptocurrency market data
 * Free tier: Generous rate limits, no API key required
 * Docs: https://www.coingecko.com/api/documentation
 */

import {
  CryptoQuote,
  CryptoHistoricalData,
  CryptoMarketData,
  ApiResponse,
  SearchResult
} from './types';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export class CoinGeckoService {
  private apiKey: string;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 1200; // 1.2 seconds between requests (50 per minute)

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COINGECKO_API_KEY || '';
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
   * Make API request to CoinGecko
   */
  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      await this.rateLimit();

      const url = new URL(`${COINGECKO_BASE_URL}${endpoint}`);

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      console.log(`[CoinGecko] Request ${this.requestCount}: ${endpoint}`);

      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      // Add API key to headers if available (premium tier)
      if (this.apiKey) {
        headers['x-cg-pro-api-key'] = this.apiKey;
      }

      const response = await fetch(url.toString(), { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data as T,
        timestamp: Date.now(),
        source: 'coingecko'
      };
    } catch (error) {
      console.error('[CoinGecko] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        source: 'coingecko'
      };
    }
  }

  /**
   * Get current price for a cryptocurrency
   */
  async getCryptoQuote(coinId: string): Promise<ApiResponse<CryptoQuote>> {
    const response = await this.makeRequest<any[]>('/coins/markets', {
      vs_currency: 'usd',
      ids: coinId.toLowerCase(),
      order: 'market_cap_desc',
      per_page: '1',
      page: '1',
      sparkline: 'false',
      price_change_percentage: '24h'
    });

    if (!response.success || !response.data || response.data.length === 0) {
      return {
        success: false,
        error: response.error || 'No data found for coin: ' + coinId,
        timestamp: Date.now(),
        source: 'coingecko'
      };
    }

    const coin = response.data[0];

    const cryptoQuote: CryptoQuote = {
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_24h || 0,
      priceChangePercent24h: coin.price_change_percentage_24h || 0,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      maxSupply: coin.max_supply,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      ath: coin.ath,
      athChangePercent: coin.ath_change_percentage,
      timestamp: Date.now()
    };

    return {
      success: true,
      data: cryptoQuote,
      timestamp: Date.now(),
      source: 'coingecko'
    };
  }

  /**
   * Get multiple cryptocurrency quotes
   */
  async getTopCryptos(limit: number = 100): Promise<ApiResponse<CryptoQuote[]>> {
    const response = await this.makeRequest<any[]>('/coins/markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: limit.toString(),
      page: '1',
      sparkline: 'false',
      price_change_percentage: '24h'
    });

    if (!response.success || !response.data) {
      return response as ApiResponse<CryptoQuote[]>;
    }

    const cryptoQuotes: CryptoQuote[] = response.data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_24h || 0,
      priceChangePercent24h: coin.price_change_percentage_24h || 0,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      maxSupply: coin.max_supply,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      ath: coin.ath,
      athChangePercent: coin.ath_change_percentage,
      timestamp: Date.now()
    }));

    return {
      success: true,
      data: cryptoQuotes,
      timestamp: Date.now(),
      source: 'coingecko'
    };
  }

  /**
   * Get historical price data for a cryptocurrency
   */
  async getCryptoHistory(
    coinId: string,
    days: number = 30
  ): Promise<ApiResponse<CryptoHistoricalData>> {
    const response = await this.makeRequest<any>(`/coins/${coinId}/market_chart`, {
      vs_currency: 'usd',
      days: days.toString(),
      interval: days <= 1 ? 'hourly' : 'daily'
    });

    if (!response.success || !response.data) {
      return response as ApiResponse<CryptoHistoricalData>;
    }

    const data = response.data;

    const historicalData: CryptoHistoricalData = {
      id: coinId,
      symbol: coinId.toUpperCase(),
      data: data.prices.map((point: [number, number], index: number) => ({
        timestamp: point[0],
        price: point[1],
        volume: data.total_volumes[index]?.[1] || 0,
        marketCap: data.market_caps[index]?.[1] || 0
      }))
    };

    return {
      success: true,
      data: historicalData,
      timestamp: Date.now(),
      source: 'coingecko'
    };
  }

  /**
   * Get global cryptocurrency market data
   */
  async getGlobalMarketData(): Promise<ApiResponse<CryptoMarketData>> {
    const response = await this.makeRequest<any>('/global');

    if (!response.success || !response.data) {
      return response as ApiResponse<CryptoMarketData>;
    }

    const globalData = response.data.data;

    const marketData: CryptoMarketData = {
      activeCryptocurrencies: globalData.active_cryptocurrencies,
      markets: globalData.markets,
      totalMarketCap: globalData.total_market_cap.usd,
      totalVolume24h: globalData.total_volume.usd,
      btcDominance: globalData.market_cap_percentage.btc,
      ethDominance: globalData.market_cap_percentage.eth,
      marketCapChangePercentage24h: globalData.market_cap_change_percentage_24h_usd
    };

    return {
      success: true,
      data: marketData,
      timestamp: Date.now(),
      source: 'coingecko'
    };
  }

  /**
   * Search for cryptocurrencies
   */
  async searchCryptos(query: string): Promise<ApiResponse<SearchResult[]>> {
    const response = await this.makeRequest<any>('/search', {
      query: query.toLowerCase()
    });

    if (!response.success || !response.data) {
      return response as ApiResponse<SearchResult[]>;
    }

    const coins = response.data.coins || [];

    const searchResults: SearchResult[] = coins.slice(0, 10).map((coin: any) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      type: 'crypto' as const,
      matchScore: coin.market_cap_rank ? 1 / coin.market_cap_rank : 0
    }));

    return {
      success: true,
      data: searchResults,
      timestamp: Date.now(),
      source: 'coingecko'
    };
  }

  /**
   * Get trending cryptocurrencies
   */
  async getTrendingCryptos(): Promise<ApiResponse<CryptoQuote[]>> {
    const response = await this.makeRequest<any>('/search/trending');

    if (!response.success || !response.data) {
      return response as ApiResponse<CryptoQuote[]>;
    }

    const trending = response.data.coins || [];

    // Get detailed data for trending coins
    const coinIds = trending.slice(0, 10).map((item: any) => item.item.id).join(',');

    return this.makeRequest<any[]>('/coins/markets', {
      vs_currency: 'usd',
      ids: coinIds,
      order: 'market_cap_desc',
      sparkline: 'false'
    }).then(detailResponse => {
      if (!detailResponse.success || !detailResponse.data) {
        return detailResponse as ApiResponse<CryptoQuote[]>;
      }

      const cryptoQuotes: CryptoQuote[] = detailResponse.data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        ath: coin.ath,
        athChangePercent: coin.ath_change_percentage,
        timestamp: Date.now()
      }));

      return {
        success: true,
        data: cryptoQuotes,
        timestamp: Date.now(),
        source: 'coingecko'
      };
    });
  }

  /**
   * Convert coin symbol to CoinGecko ID
   */
  async symbolToCoinId(symbol: string): Promise<string | null> {
    try {
      const response = await this.makeRequest<any>('/search', {
        query: symbol.toLowerCase()
      });

      if (response.success && response.data?.coins?.length > 0) {
        // Return the first match (usually the most relevant)
        return response.data.coins[0].id;
      }

      return null;
    } catch (error) {
      console.error('[CoinGecko] Error converting symbol to ID:', error);
      return null;
    }
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

// Export singleton instance with API key from environment
export const coinGeckoService = new CoinGeckoService(process.env.COINGECKO_API_KEY);
