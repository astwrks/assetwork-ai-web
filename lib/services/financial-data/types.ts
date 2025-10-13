/**
 * Financial Data Types
 * Common interfaces for stock, crypto, and forex data
 */

// ============================================================================
// Stock Data Types
// ============================================================================

export interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface StockHistoricalData {
  symbol: string;
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export interface StockCompanyInfo {
  symbol: string;
  name: string;
  description?: string;
  sector?: string;
  industry?: string;
  ceo?: string;
  employees?: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  website?: string;
  country?: string;
}

// ============================================================================
// Crypto Data Types
// ============================================================================

export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply?: number;
  maxSupply?: number;
  high24h: number;
  low24h: number;
  ath: number; // All-time high
  athChangePercent: number;
  timestamp: number;
}

export interface CryptoHistoricalData {
  id: string;
  symbol: string;
  data: {
    timestamp: number;
    price: number;
    volume: number;
    marketCap: number;
  }[];
}

export interface CryptoMarketData {
  activeCryptocurrencies: number;
  markets: number;
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChangePercentage24h: number;
}

// ============================================================================
// Forex Data Types
// ============================================================================

export interface ForexQuote {
  pair: string;
  base: string;
  quote: string;
  rate: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  timestamp: number;
}

// ============================================================================
// Technical Indicators
// ============================================================================

export interface TechnicalIndicator {
  timestamp: number;
  value: number;
}

export interface RSIData {
  symbol: string;
  period: number;
  data: TechnicalIndicator[];
}

export interface MACDData {
  symbol: string;
  data: {
    timestamp: number;
    macd: number;
    signal: number;
    histogram: number;
  }[];
}

export interface MovingAverageData {
  symbol: string;
  type: 'SMA' | 'EMA';
  period: number;
  data: TechnicalIndicator[];
}

// ============================================================================
// Search & Discovery
// ============================================================================

export interface SearchResult {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'etf';
  exchange?: string;
  currency?: string;
  matchScore?: number;
}

// ============================================================================
// Market Status
// ============================================================================

export interface MarketStatus {
  market: string;
  isOpen: boolean;
  nextOpen?: string;
  nextClose?: string;
  timezone: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  source: 'alpha-vantage' | 'coingecko' | 'twelve-data' | 'cache';
}

export interface CacheMetadata {
  key: string;
  ttl: number; // Time to live in seconds
  createdAt: number;
  expiresAt: number;
}

// ============================================================================
// Configuration
// ============================================================================

export interface DataProviderConfig {
  provider: 'alpha-vantage' | 'coingecko' | 'twelve-data';
  apiKey?: string;
  baseUrl: string;
  rateLimit: {
    requests: number;
    period: number; // in seconds
  };
}

// ============================================================================
// Portfolio & Watchlist Types
// ============================================================================

export interface PortfolioAsset {
  symbol: string;
  type: 'stock' | 'crypto';
  quantity: number;
  averageCost: number;
  currentPrice: number;
  value: number;
  gain: number;
  gainPercent: number;
}

export interface WatchlistItem {
  symbol: string;
  type: 'stock' | 'crypto';
  name: string;
  addedAt: number;
}

// ============================================================================
// Time Series Intervals
// ============================================================================

export type TimeInterval = '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' | 'weekly' | 'monthly';
export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';
