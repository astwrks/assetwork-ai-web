/**
 * Unified Data Sources Integration
 * Supports: Stocks, Crypto, Forex, Economic Data
 */

export interface DataSourceProvider {
  id: string;
  name: string;
  category: 'stocks' | 'crypto' | 'forex' | 'economic';
  requiresApiKey: boolean;
  freeQuota?: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export const DATA_SOURCES: Record<string, DataSourceProvider> = {
  // Stock Market Data
  alpha_vantage: {
    id: 'alpha_vantage',
    name: 'Alpha Vantage',
    category: 'stocks',
    requiresApiKey: true,
    freeQuota: 500, // requests per day
    rateLimit: {
      requestsPerMinute: 5,
      requestsPerDay: 500,
    },
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon.io',
    category: 'stocks',
    requiresApiKey: true,
    freeQuota: 5,
    rateLimit: {
      requestsPerMinute: 5,
      requestsPerDay: 5,
    },
  },
  finnhub: {
    id: 'finnhub',
    name: 'Finnhub',
    category: 'stocks',
    requiresApiKey: true,
    freeQuota: 60,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 60000,
    },
  },

  // Cryptocurrency Data
  coinmarketcap: {
    id: 'coinmarketcap',
    name: 'CoinMarketCap',
    category: 'crypto',
    requiresApiKey: true,
    freeQuota: 333,
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerDay: 333,
    },
  },
  coingecko: {
    id: 'coingecko',
    name: 'CoinGecko',
    category: 'crypto',
    requiresApiKey: false, // Free tier doesn't require key
    freeQuota: 50,
    rateLimit: {
      requestsPerMinute: 50,
      requestsPerDay: 50000,
    },
  },
};

export interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  timestamp: Date;
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h?: number;
  marketCap?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  high24h?: number;
  low24h?: number;
  timestamp: Date;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Alpha Vantage Client
 */
export class AlphaVantageClient {
  constructor(private apiKey: string) {}

  async getQuote(symbol: string): Promise<StockQuote> {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message']) {
      throw new Error(`AlphaVantage: ${data['Error Message']}`);
    }

    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      throw new Error(`No data found for symbol: ${symbol}`);
    }

    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      timestamp: new Date(quote['07. latest trading day']),
    };
  }

  async getHistoricalData(symbol: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<HistoricalData[]> {
    const functionMap = {
      daily: 'TIME_SERIES_DAILY',
      weekly: 'TIME_SERIES_WEEKLY',
      monthly: 'TIME_SERIES_MONTHLY',
    };

    const url = `https://www.alphavantage.co/query?function=${functionMap[period]}&symbol=${symbol}&apikey=${this.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    const seriesKey = `Time Series (${period.charAt(0).toUpperCase() + period.slice(1)})`;
    const timeSeries = data[seriesKey];

    if (!timeSeries) {
      throw new Error(`No historical data found for symbol: ${symbol}`);
    }

    return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
    }));
  }

  async searchSymbol(keywords: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${this.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.bestMatches) {
      return [];
    }

    return data.bestMatches.map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
    }));
  }
}

/**
 * Polygon.io Client
 */
export class PolygonClient {
  constructor(private apiKey: string) {}

  async getQuote(symbol: string): Promise<StockQuote> {
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${this.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'ERROR') {
      throw new Error(`Polygon: ${data.error}`);
    }

    const result = data.results[0];
    const change = result.c - result.o;
    const changePercent = (change / result.o) * 100;

    return {
      symbol,
      price: result.c,
      change,
      changePercent,
      volume: result.v,
      high: result.h,
      low: result.l,
      open: result.o,
      timestamp: new Date(result.t),
    };
  }
}

/**
 * CoinMarketCap Client
 */
export class CoinMarketCapClient {
  constructor(private apiKey: string) {}

  async getQuote(symbol: string): Promise<CryptoQuote> {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`;
    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': this.apiKey,
      },
    });
    const data = await response.json();

    if (data.status.error_code !== 0) {
      throw new Error(`CoinMarketCap: ${data.status.error_message}`);
    }

    const crypto = data.data[symbol];
    const quote = crypto.quote.USD;

    return {
      symbol: crypto.symbol,
      name: crypto.name,
      price: quote.price,
      change24h: quote.price - (quote.price / (1 + quote.percent_change_24h / 100)),
      changePercent24h: quote.percent_change_24h,
      volume24h: quote.volume_24h,
      marketCap: quote.market_cap,
      circulatingSupply: crypto.circulating_supply,
      totalSupply: crypto.total_supply,
      timestamp: new Date(quote.last_updated),
    };
  }

  async getTopCryptos(limit: number = 100): Promise<CryptoQuote[]> {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': this.apiKey,
      },
    });
    const data = await response.json();

    return data.data.map((crypto: any) => {
      const quote = crypto.quote.USD;
      return {
        symbol: crypto.symbol,
        name: crypto.name,
        price: quote.price,
        change24h: quote.price - (quote.price / (1 + quote.percent_change_24h / 100)),
        changePercent24h: quote.percent_change_24h,
        volume24h: quote.volume_24h,
        marketCap: quote.market_cap,
        circulatingSupply: crypto.circulating_supply,
        totalSupply: crypto.total_supply,
        timestamp: new Date(quote.last_updated),
      };
    });
  }
}

/**
 * CoinGecko Client (Free, no API key required)
 */
export class CoinGeckoClient {
  private baseUrl = 'https://api.coingecko.com/api/v3';

  async getQuote(coinId: string): Promise<CryptoQuote> {
    const url = `${this.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data[coinId]) {
      throw new Error(`CoinGecko: No data found for ${coinId}`);
    }

    const coin = data[coinId];

    return {
      symbol: coinId.toUpperCase(),
      name: coinId,
      price: coin.usd,
      change24h: coin.usd * (coin.usd_24h_change / 100),
      changePercent24h: coin.usd_24h_change || 0,
      volume24h: coin.usd_24h_vol,
      marketCap: coin.usd_market_cap,
      timestamp: new Date(),
    };
  }

  async getMarketData(coinId: string, days: number = 30): Promise<HistoricalData[]> {
    const url = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    const response = await fetch(url);
    const data = await response.json();

    return data.prices.map(([timestamp, price]: [number, number]) => ({
      date: new Date(timestamp).toISOString().split('T')[0],
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
    }));
  }
}

/**
 * Data Source Factory
 */
export function createDataSourceClient(provider: string, apiKey?: string) {
  switch (provider) {
    case 'alpha_vantage':
      if (!apiKey) throw new Error('Alpha Vantage requires an API key');
      return new AlphaVantageClient(apiKey);

    case 'polygon':
      if (!apiKey) throw new Error('Polygon requires an API key');
      return new PolygonClient(apiKey);

    case 'coinmarketcap':
      if (!apiKey) throw new Error('CoinMarketCap requires an API key');
      return new CoinMarketCapClient(apiKey);

    case 'coingecko':
      return new CoinGeckoClient();

    default:
      throw new Error(`Unknown data source provider: ${provider}`);
  }
}
