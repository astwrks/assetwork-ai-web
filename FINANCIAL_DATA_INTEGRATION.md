# Financial Data Integration - Setup Guide

## 🎉 Integration Complete!

Your AssetWorks application now has real-time financial data integration with stock markets and cryptocurrency data.

## 📁 Files Created

### Services Layer
```
lib/services/financial-data/
├── types.ts                          # TypeScript interfaces for all financial data
├── alpha-vantage.service.ts          # Stock market data service
└── coingecko.service.ts              # Cryptocurrency data service
```

### API Endpoints
```
app/api/financial-data/
├── stocks/[symbol]/route.ts          # GET /api/financial-data/stocks/AAPL
├── crypto/[coinId]/route.ts          # GET /api/financial-data/crypto/bitcoin
├── market-overview/route.ts          # GET /api/financial-data/market-overview
└── search/route.ts                   # GET /api/financial-data/search?q=apple
```

## 🔑 API Keys Setup

### 1. Alpha Vantage (Stock Data)
1. Visit: https://www.alphavantage.co/support/#api-key
2. Get your free API key
3. Add to `.env.local`:
```bash
ALPHA_VANTAGE_API_KEY=your_key_here
```

**Free Tier**: 25 API calls per day (500 with registration)

### 2. CoinGecko (Crypto Data)
1. **Free Tier**: Works without API key (10-50 calls per minute)
2. **Pro Tier** (Recommended): Get your API key from https://www.coingecko.com/en/api/pricing
3. Add to `.env.local`:
```bash
COINGECKO_API_KEY=your_key_here
```

**Pro Tier Benefits**:
- 500 calls per minute (vs 10-50 on free tier)
- Higher stability and priority support
- Access to additional endpoints

## 📊 API Endpoints Usage

### Stock Quote
```typescript
// GET /api/financial-data/stocks/AAPL
{
  "success": true,
  "data": {
    "quote": {
      "symbol": "AAPL",
      "price": 175.43,
      "change": 2.15,
      "changePercent": 1.24,
      "volume": 52847392,
      "high": 176.82,
      "low": 174.21,
      "open": 175.00,
      "previousClose": 173.28
    }
  },
  "timestamp": 1697123456789,
  "source": "alpha-vantage"
}
```

### Stock Quote with History
```typescript
// GET /api/financial-data/stocks/AAPL?history=true&interval=daily
{
  "success": true,
  "data": {
    "quote": { /* ... */ },
    "history": {
      "symbol": "AAPL",
      "data": [
        {
          "date": "2025-10-12",
          "open": 175.00,
          "high": 176.82,
          "low": 174.21,
          "close": 175.43,
          "volume": 52847392
        }
        // ... more data points
      ]
    }
  }
}
```

### Cryptocurrency Quote
```typescript
// GET /api/financial-data/crypto/bitcoin
{
  "success": true,
  "data": {
    "quote": {
      "id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin",
      "price": 43250.50,
      "priceChange24h": 1250.30,
      "priceChangePercent24h": 2.98,
      "marketCap": 845000000000,
      "volume24h": 28500000000,
      "high24h": 43800.00,
      "low24h": 41900.00
    }
  },
  "timestamp": 1697123456789,
  "source": "coingecko"
}
```

### Market Overview
```typescript
// GET /api/financial-data/market-overview
{
  "success": true,
  "data": {
    "stocks": {
      "indices": {
        "sp500": { /* SPY quote */ },
        "dow": { /* DIA quote */ },
        "nasdaq": { /* QQQ quote */ }
      }
    },
    "crypto": {
      "top": [
        { /* Bitcoin */ },
        { /* Ethereum */ },
        // ... top 10 cryptos
      ],
      "global": {
        "totalMarketCap": 1750000000000,
        "totalVolume24h": 85000000000,
        "btcDominance": 48.5,
        "ethDominance": 18.2
      }
    }
  }
}
```

### Search
```typescript
// GET /api/financial-data/search?q=apple&type=stocks
{
  "success": true,
  "data": {
    "results": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "type": "stock",
        "exchange": "NASDAQ",
        "matchScore": 1.0
      }
    ],
    "stocks": [ /* ... */ ],
    "crypto": [ /* ... */ ]
  }
}
```

## 🚀 Quick Start - Frontend Integration

### Example: Fetch Stock Quote
```typescript
'use client';
import { useEffect, useState } from 'react';

export default function StockWidget() {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStock() {
      const response = await fetch('/api/financial-data/stocks/AAPL');
      const data = await response.json();

      if (data.success) {
        setStock(data.data.quote);
      }
      setLoading(false);
    }

    fetchStock();

    // Refresh every 15 seconds
    const interval = setInterval(fetchStock, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stock) return <div>Error loading stock data</div>;

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold">{stock.symbol}</h3>
      <p className="text-2xl font-semibold">${stock.price.toFixed(2)}</p>
      <p className={stock.change >= 0 ? 'text-green-600' : 'text-red-600'}>
        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
        ({stock.changePercent.toFixed(2)}%)
      </p>
    </div>
  );
}
```

### Example: Crypto Dashboard
```typescript
'use client';
import { useEffect, useState } from 'react';

export default function CryptoDashboard() {
  const [cryptos, setCryptos] = useState([]);

  useEffect(() => {
    async function fetchCryptos() {
      const response = await fetch('/api/financial-data/market-overview');
      const data = await response.json();

      if (data.success) {
        setCryptos(data.data.crypto.top);
      }
    }

    fetchCryptos();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cryptos.map((crypto) => (
        <div key={crypto.id} className="p-4 border rounded">
          <div className="font-semibold">{crypto.symbol}</div>
          <div className="text-xl">${crypto.price.toLocaleString()}</div>
          <div className={crypto.priceChangePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}>
            {crypto.priceChangePercent24h.toFixed(2)}%
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 💡 Features Available

### ✅ Stock Market Data
- [x] Real-time stock quotes
- [x] Historical price data (daily, weekly, monthly, intraday)
- [x] Company information
- [x] Search stocks by symbol or name
- [x] Major market indices (S&P 500, Dow, NASDAQ)

### ✅ Cryptocurrency Data
- [x] Real-time crypto prices
- [x] 14,000+ cryptocurrencies
- [x] Historical price data
- [x] Market cap and volume data
- [x] Top cryptocurrencies by market cap
- [x] Global crypto market statistics
- [x] Trending cryptocurrencies

### ⏳ Coming Soon (Ready to Implement)
- [ ] Technical indicators (RSI, MACD, Moving Averages)
- [ ] Forex currency pairs
- [ ] Portfolio tracking
- [ ] Price alerts
- [ ] Real-time WebSocket streaming

## 🎨 UI Components (Next Steps)

### 1. Market Dashboard Page
Create `/app/markets/page.tsx` with:
- Live market indices ticker
- Top gainers/losers
- Crypto market overview
- Trending stocks

### 2. Stock Detail Page
Create `/app/markets/stocks/[symbol]/page.tsx` with:
- Real-time price chart
- Company information
- Historical data visualization
- Buy/sell actions (if implementing trading)

### 3. Crypto Detail Page
Create `/app/markets/crypto/[coinId]/page.tsx` with:
- Price charts
- Market statistics
- Historical performance
- Related cryptocurrencies

### 4. Search Component
Create reusable search component:
- Autocomplete search
- Stock + Crypto results
- Quick add to watchlist

## 🔒 Rate Limiting & Caching

### Current Implementation
Both services include built-in rate limiting:

**Alpha Vantage**:
- 12 seconds between requests (5 per minute)
- Automatic rate limiting in service layer

**CoinGecko**:
- 1.2 seconds between requests (50 per minute)
- Automatic rate limiting in service layer

### Recommended Caching Strategy
Add Redis or MongoDB caching:

```typescript
// Pseudo-code for caching
const cacheKey = `stock:${symbol}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const data = await alphaVantageService.getStockQuote(symbol);
await redis.setex(cacheKey, 15, JSON.stringify(data)); // 15 second cache

return data;
```

## 📈 Integration with Financial Playground

✅ **INTEGRATION COMPLETE!**

The financial playground is now integrated with real-time market data. The AI system prompt has been updated to use our financial data APIs.

### How It Works

When you ask Claude to generate financial reports in the playground, it will:

1. **Automatically fetch real data** from our APIs
2. **Use actual stock/crypto prices** in reports
3. **Include live market context** in analysis
4. **Cite data sources properly** (Alpha Vantage for stocks, CoinGecko for crypto)

### Updated System Prompt

The `/api/playground/threads/[threadId]/messages` endpoint now includes instructions for Claude to:

- Fetch stock data: `GET /api/financial-data/stocks/{SYMBOL}`
- Fetch crypto data: `GET /api/financial-data/crypto/{COIN_ID}`
- Get market overview: `GET /api/financial-data/market-overview`
- Search assets: `GET /api/financial-data/search?q=QUERY`

### Example Usage in Playground

**User Prompt:**
```
"Generate a comprehensive analysis of Apple Inc. stock performance"
```

**Claude Will:**
1. Fetch real-time data: `/api/financial-data/stocks/AAPL?history=true&company=true`
2. Use actual price: $175.43, change: +2.15 (+1.24%)
3. Include historical data in charts
4. Cite source: "Apple Inc. (Technology) - Source: Alpha Vantage API"

**Another Example:**
```
"Compare Bitcoin and Ethereum performance"
```

**Claude Will:**
1. Fetch `/api/financial-data/crypto/bitcoin`
2. Fetch `/api/financial-data/crypto/ethereum`
3. Compare real prices, market caps, 24h changes
4. Generate comparative charts with actual data
5. Cite: "Bitcoin & Ethereum - Source: CoinGecko API"

## 🧪 Testing

### Test Stock Endpoint
```bash
curl http://localhost:3001/api/financial-data/stocks/AAPL
```

### Test Crypto Endpoint
```bash
curl http://localhost:3001/api/financial-data/crypto/bitcoin
```

### Test Market Overview
```bash
curl http://localhost:3001/api/financial-data/market-overview
```

### Test Search
```bash
curl "http://localhost:3001/api/financial-data/search?q=apple&type=stocks"
```

## ⚠️ Important Notes

1. **API Rate Limits**: The free tier has rate limits. Implement caching for production!

2. **Demo API Key**: Alpha Vantage provides a 'demo' key for testing, but get your own for real usage.

3. **Error Handling**: All endpoints return structured error responses:
```typescript
{
  "success": false,
  "error": "Error message",
  "timestamp": 1697123456789
}
```

4. **Data Freshness**:
   - Stock data: 15-minute delay on free tier
   - Crypto data: Real-time on free tier

## 🎯 Next Steps

1. **Get API Keys**: Register for Alpha Vantage API key
2. **Add to .env.local**: Configure your API keys
3. **Create Dashboard**: Build UI components to display data
4. **Test Integration**: Try the API endpoints
5. **Add Caching**: Implement Redis/MongoDB caching for production
6. **Integrate with Playground**: Use real data in financial reports

## 📚 Resources

- Alpha Vantage Docs: https://www.alphavantage.co/documentation/
- CoinGecko API: https://www.coingecko.com/api/documentation
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

**Status**: ✅ Backend Integration Complete
**Ready For**: Frontend Dashboard Development
**Cost**: $0/month (Free Tier)
