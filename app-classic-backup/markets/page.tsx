'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  RefreshCw,
  Bitcoin,
  BarChart3,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface MarketData {
  stocks: {
    indices: {
      sp500: StockQuote | null;
      dow: StockQuote | null;
      nasdaq: StockQuote | null;
    };
  };
  crypto: {
    top: CryptoQuote[];
    global: {
      totalMarketCap: number;
      totalVolume24h: number;
      btcDominance: number;
      ethDominance: number;
    } | null;
  };
}

export default function MarketsPage() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMarketData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/financial-data/market-overview');
      const data = await response.json();

      if (data.success) {
        setMarketData(data.data);
        setLastUpdate(new Date());
      } else {
        setError(data.error || 'Failed to fetch market data');
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMarketData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const PriceChange = ({ change, changePercent }: { change: number; changePercent: number }) => {
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="font-medium">
          {isPositive ? '+' : ''}{change.toFixed(2)}
        </span>
        <span className="text-sm">
          ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    );
  };

  const StockIndexCard = ({ index, data }: { index: string; data: StockQuote | null }) => {
    if (!data) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-24 text-gray-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>Data unavailable</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">{index}</p>
              <h3 className="text-2xl font-bold">{data.symbol}</h3>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(data.price)}
            </p>
          </div>
          <PriceChange change={data.change} changePercent={data.changePercent} />
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t text-sm">
            <div>
              <p className="text-gray-600">Open</p>
              <p className="font-medium">{formatPrice(data.open)}</p>
            </div>
            <div>
              <p className="text-gray-600">Volume</p>
              <p className="font-medium">{(data.volume / 1e6).toFixed(1)}M</p>
            </div>
            <div>
              <p className="text-gray-600">High</p>
              <p className="font-medium text-green-600">{formatPrice(data.high)}</p>
            </div>
            <div>
              <p className="text-gray-600">Low</p>
              <p className="font-medium text-red-600">{formatPrice(data.low)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CryptoCard = ({ crypto }: { crypto: CryptoQuote }) => {
    const isPositive = crypto.priceChangePercent24h >= 0;
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <Bitcoin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{crypto.name}</h3>
                <p className="text-sm text-gray-600">{crypto.symbol}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={isPositive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}
            >
              {isPositive ? '+' : ''}{crypto.priceChangePercent24h.toFixed(2)}%
            </Badge>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(crypto.price)}
            </p>
          </div>
          <PriceChange
            change={crypto.priceChange24h}
            changePercent={crypto.priceChangePercent24h}
          />
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t text-sm">
            <div>
              <p className="text-gray-600">Market Cap</p>
              <p className="font-medium">{formatLargeNumber(crypto.marketCap)}</p>
            </div>
            <div>
              <p className="text-gray-600">24h Volume</p>
              <p className="font-medium">{formatLargeNumber(crypto.volume24h)}</p>
            </div>
            <div>
              <p className="text-gray-600">24h High</p>
              <p className="font-medium text-green-600">{formatPrice(crypto.high24h)}</p>
            </div>
            <div>
              <p className="text-gray-600">24h Low</p>
              <p className="font-medium text-red-600">{formatPrice(crypto.low24h)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading market data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <Card className="max-w-md">
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={() => fetchMarketData()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <BarChart3 className="w-10 h-10 text-primary" />
                Live Markets
              </h1>
              <p className="text-gray-600">
                Real-time stock and cryptocurrency market data
              </p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Last updated</p>
                  <p className="text-sm font-medium">
                    {lastUpdate.toLocaleTimeString()}
                  </p>
                </div>
              )}
              <button
                onClick={() => fetchMarketData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="stocks" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="stocks" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Stock Markets
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center gap-2">
              <Bitcoin className="w-4 h-4" />
              Cryptocurrencies
            </TabsTrigger>
          </TabsList>

          {/* Stock Markets Tab */}
          <TabsContent value="stocks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Major Indices
                </CardTitle>
                <CardDescription>
                  Real-time quotes for major U.S. stock market indices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StockIndexCard
                    index="S&P 500"
                    data={marketData?.stocks.indices.sp500 || null}
                  />
                  <StockIndexCard
                    index="Dow Jones"
                    data={marketData?.stocks.indices.dow || null}
                  />
                  <StockIndexCard
                    index="NASDAQ"
                    data={marketData?.stocks.indices.nasdaq || null}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Stock Market Data</h3>
                    <p className="text-gray-700 text-sm">
                      Data provided by Alpha Vantage. Quotes may be delayed up to 15 minutes on the free tier.
                      Indices are represented by their respective ETFs (SPY, DIA, QQQ).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cryptocurrencies Tab */}
          <TabsContent value="crypto" className="space-y-6">
            {/* Global Crypto Stats */}
            {marketData?.crypto.global && (
              <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Global Crypto Market
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/60 backdrop-blur rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Market Cap</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatLargeNumber(marketData.crypto.global.totalMarketCap)}
                      </p>
                    </div>
                    <div className="bg-white/60 backdrop-blur rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">24h Volume</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatLargeNumber(marketData.crypto.global.totalVolume24h)}
                      </p>
                    </div>
                    <div className="bg-white/60 backdrop-blur rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">BTC Dominance</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {marketData.crypto.global.btcDominance.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-white/60 backdrop-blur rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">ETH Dominance</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {marketData.crypto.global.ethDominance.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Cryptocurrencies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="w-5 h-5" />
                  Top Cryptocurrencies
                </CardTitle>
                <CardDescription>
                  Top 10 cryptocurrencies by market capitalization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketData?.crypto.top.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketData.crypto.top.map((crypto) => (
                      <CryptoCard key={crypto.id} crypto={crypto} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Bitcoin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No cryptocurrency data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-100">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bitcoin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Cryptocurrency Data</h3>
                    <p className="text-gray-700 text-sm">
                      Data provided by CoinGecko. All cryptocurrency prices are real-time and update automatically.
                      Market data includes 14,000+ cryptocurrencies with no rate limits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
