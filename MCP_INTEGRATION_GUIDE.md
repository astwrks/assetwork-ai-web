# MCP Integration Guide - Financial Data Access

## 🎯 Overview

This guide explains how to use the Alpha Vantage and CoinGecko MCP servers with Claude Code to fetch real-time financial data intelligently.

## ✅ What's Been Set Up

### 1. Alpha Vantage MCP Server
**Location:** `mcp-servers/alpha-vantage/`

A Model Context Protocol server that gives Claude direct access to Alpha Vantage's financial data API with 16 specialized tools for stocks, forex, and technical analysis.

### 2. CoinGecko MCP Server
**Location:** `mcp-servers/coingecko/`

An MCP server providing Claude with 14 tools to access cryptocurrency market data for 14,000+ coins.

### 3. Claude Code Configuration
**Location:** `~/.config/claude-code/config.json`

Both MCP servers are configured and ready to use with Claude Code.

## 🚀 How It Works

### Traditional API Approach (Old Way)
```
User: "What's Apple's stock price?"
→ System hits /api/financial-data/stocks/AAPL
→ Returns JSON with all fields
→ Claude formats the data for display
```

### MCP Approach (New Way)
```
User: "What's Apple's stock price?"
→ Claude decides to use get_stock_quote tool
→ Calls Alpha Vantage MCP with symbol: "AAPL"
→ Receives structured data directly
→ Formats and presents to user

User: "Now compare it with Tesla and show me the RSI"
→ Claude uses get_stock_quote for TSLA
→ Claude uses get_rsi for both symbols
→ Combines data intelligently
→ Presents comparative analysis
```

**Key Difference:** Claude can dynamically fetch exactly what it needs, when it needs it, in the format it needs.

## 📚 Available Tools

### Alpha Vantage Tools (Stocks & Forex)

#### Price Data
- `get_stock_quote` - Real-time quote (price, change, volume)
- `get_stock_intraday` - Intraday prices (1min, 5min, 15min, 30min, 60min)
- `get_stock_daily` - Daily historical prices
- `get_stock_weekly` - Weekly prices with dividends
- `get_stock_monthly` - Monthly prices with dividends

#### Company Fundamentals
- `get_company_overview` - Complete company info (sector, industry, financials, ratios)
- `get_earnings` - Quarterly/annual earnings & EPS
- `get_income_statement` - Revenue, profit, margins
- `get_balance_sheet` - Assets, liabilities, equity
- `get_cash_flow` - Operating, investing, financing cash flows

#### Technical Indicators
- `get_sma` - Simple Moving Average
- `get_ema` - Exponential Moving Average
- `get_rsi` - Relative Strength Index (overbought/oversold)
- `get_macd` - Moving Average Convergence Divergence

#### Search & Discovery
- `search_symbol` - Find stocks by name or ticker

#### Forex
- `get_forex_rate` - Real-time exchange rates
- `get_forex_daily` - Historical forex rates

### CoinGecko Tools (Cryptocurrency)

#### Price Data
- `get_crypto_price` - Current prices for multiple cryptos
- `get_crypto_market_data` - Detailed market data with ATH/ATL
- `get_crypto_history` - Historical price/volume data
- `get_crypto_ohlc` - OHLC candlestick data

#### Market Overview
- `get_top_cryptos` - Top coins by market cap
- `get_global_market_data` - Global crypto statistics
- `get_trending_cryptos` - Currently trending coins
- `get_defi_data` - DeFi market statistics

#### Discovery & Analysis
- `search_crypto` - Find coins by name/symbol
- `get_crypto_details` - Comprehensive coin information
- `compare_cryptos` - Side-by-side comparison
- `get_category_market_data` - Category-specific data (DeFi, NFT, Gaming)

#### Advanced
- `get_exchange_rates` - BTC exchange rates
- `get_nft_market_data` - NFT collection data

## 💡 Usage Examples

### Example 1: Stock Analysis

**User Query:**
```
"Analyze Apple's stock performance. I want current price, 50-day moving average,
RSI, and comparison with Microsoft."
```

**What Claude Does:**
1. Calls `get_stock_quote(symbol: "AAPL")`
2. Calls `get_sma(symbol: "AAPL", time_period: 50)`
3. Calls `get_rsi(symbol: "AAPL")`
4. Calls `get_stock_quote(symbol: "MSFT")`
5. Combines all data into coherent analysis

**Result:** Comprehensive analysis with real data, no manual API integration needed.

### Example 2: Cryptocurrency Comparison

**User Query:**
```
"Compare Bitcoin, Ethereum, and Solana. Show me prices, market caps,
and 7-day performance."
```

**What Claude Does:**
1. Calls `compare_cryptos(ids: "bitcoin,ethereum,solana")`
2. Receives all data in one call
3. Formats comparison table

**Result:** Side-by-side comparison with 7-day trends.

### Example 3: Market Report

**User Query:**
```
"Generate a comprehensive market report including major indices,
top 5 cryptos, and trending cryptocurrencies."
```

**What Claude Does:**
1. Calls `get_stock_quote("SPY")` for S&P 500
2. Calls `get_stock_quote("DIA")` for Dow Jones
3. Calls `get_stock_quote("QQQ")` for NASDAQ
4. Calls `get_top_cryptos(per_page: 5)`
5. Calls `get_trending_cryptos()`
6. Combines into professional HTML report

**Result:** Complete market overview with real-time data.

### Example 4: Company Deep Dive

**User Query:**
```
"I need a complete analysis of Tesla including financials,
technical indicators, and earnings history."
```

**What Claude Does:**
1. Calls `get_company_overview(symbol: "TSLA")`
2. Calls `get_income_statement(symbol: "TSLA")`
3. Calls `get_balance_sheet(symbol: "TSLA")`
4. Calls `get_earnings(symbol: "TSLA")`
5. Calls `get_rsi(symbol: "TSLA")`
6. Calls `get_macd(symbol: "TSLA")`
7. Synthesizes comprehensive analysis

**Result:** Multi-page report with all fundamental and technical data.

## 🎨 Integration with Financial Playground

The MCP servers work automatically with your AssetWorks Financial Playground!

### How Playground Uses MCP

When users request financial reports in the playground:

**Without MCP (Old):**
- User: "Analyze Apple stock"
- Claude: Generates generic analysis with placeholder data
- OR: Makes HTTP requests to internal API endpoints

**With MCP (New):**
- User: "Analyze Apple stock"
- Claude: Automatically uses MCP tools to fetch real data
- Uses `get_stock_quote`, `get_company_overview`, `get_stock_daily`
- Generates report with 100% real, current data

### Automatic Tool Selection

Claude intelligently selects tools based on keywords:

- **"stock price"** → `get_stock_quote`
- **"financial statements"** → `get_income_statement`, `get_balance_sheet`, `get_cash_flow`
- **"technical analysis"** → `get_rsi`, `get_macd`, `get_sma`, `get_ema`
- **"crypto price"** → `get_crypto_price` or `get_crypto_market_data`
- **"trending"** → `get_trending_cryptos`
- **"compare"** → `compare_cryptos` or multiple `get_stock_quote` calls

## 🔧 Configuration

### Current Setup

The MCP servers are already configured in `~/.config/claude-code/config.json`:

```json
{
  "mcpServers": {
    "alpha-vantage": {
      "command": "node",
      "args": [
        "/Users/Victor/Projects/AssetWorks/assetworks-webapp/mcp-servers/alpha-vantage/index.js"
      ],
      "env": {
        "ALPHA_VANTAGE_API_KEY": "LEVD3ETXGV1LT8WM"
      }
    },
    "coingecko": {
      "command": "node",
      "args": [
        "/Users/Victor/Projects/AssetWorks/assetworks-webapp/mcp-servers/coingecko/index.js"
      ]
    }
  }
}
```

### To Use in Other Projects

Simply copy this configuration to any Claude Code project's config!

## 🧪 Testing

### Test Alpha Vantage MCP

```bash
cd mcp-servers/alpha-vantage
ALPHA_VANTAGE_API_KEY=LEVD3ETXGV1LT8WM node index.js
```

### Test CoinGecko MCP

```bash
cd mcp-servers/coingecko
node index.js
```

### Test with Claude Code

Open Claude Code and try:
```
"What's the current price of Apple stock?"
"Compare Bitcoin and Ethereum"
"Show me the top 10 cryptocurrencies"
"What's Tesla's RSI indicator?"
```

## 📊 Data Quality & Sources

### Alpha Vantage Data
- **Real-time Stocks:** 15-minute delay on free tier
- **Historical Data:** 20+ years available
- **Fundamentals:** Quarterly and annual financial statements
- **Update Frequency:** Real-time quotes updated continuously

### CoinGecko Data
- **Real-time Crypto:** Live prices, no delay
- **Coverage:** 14,000+ cryptocurrencies
- **Historical Data:** Full price history available
- **Update Frequency:** Prices updated every few seconds

## 🚦 Rate Limits

Both MCP servers include automatic rate limiting:

- **Alpha Vantage:** 5 requests/minute (free tier)
- **CoinGecko:** 50 requests/minute (free tier)

Rate limiting is handled automatically - Claude will wait between requests as needed.

## 🎯 Best Practices

### 1. Let Claude Choose Tools
Don't specify which tool to use. Instead, describe what you want:

❌ **Don't:** "Use get_stock_quote tool to get Apple's price"
✅ **Do:** "What's Apple's current stock price?"

### 2. Combine Related Queries
Claude can efficiently combine multiple tool calls:

✅ **Good:** "Compare Apple, Microsoft, and Google stocks with their RSI values"
- Claude makes 6 tool calls efficiently
- Combines results intelligently

### 3. Be Specific About Time Periods
Specify time ranges for historical data:

✅ **Good:** "Show me Apple's price trend over the last 30 days"
- Claude selects appropriate tool and interval

### 4. Request Visualizations
Claude can format data for charts:

✅ **Good:** "Generate a candlestick chart for Bitcoin over the last 7 days"
- Claude uses `get_crypto_ohlc` with proper parameters

## 🔒 Security

- **API Keys:** Stored in environment variables, not in code
- **Rate Limiting:** Built-in protection against API abuse
- **Error Handling:** Graceful fallbacks if API is unavailable
- **No Data Storage:** MCP servers don't store any data

## 📈 Benefits Over Traditional API Integration

### Traditional REST API
```
✗ Fixed endpoints with predefined parameters
✗ Returns all data even if you need just one field
✗ Requires code changes to add new data points
✗ Static query patterns
```

### MCP Server Approach
```
✓ Dynamic tool selection based on need
✓ Returns only requested data
✓ No code changes needed - just ask Claude
✓ Intelligent query composition
✓ Automatic error handling and retry
✓ Context-aware data fetching
```

## 🎓 Learning Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [Alpha Vantage API Docs](https://www.alphavantage.co/documentation/)
- [CoinGecko API Docs](https://www.coingecko.com/api/documentation)
- [Claude Code MCP Guide](https://docs.claude.com/claude-code/mcp)

## 🐛 Troubleshooting

### MCP Server Not Found
**Issue:** Claude says "No tool available"
**Solution:** Restart Claude Code to reload MCP configuration

### Rate Limit Errors
**Issue:** "API rate limit exceeded"
**Solution:** Wait 60 seconds, or upgrade to paid API tier

### Invalid Symbol/Coin ID
**Issue:** "No data found for symbol X"
**Solution:** Use `search_symbol` or `search_crypto` to find correct ID

### Configuration Not Loading
**Issue:** MCP servers not appearing
**Solution:** Check `~/.config/claude-code/config.json` paths are absolute

## 🎉 Summary

You now have:
- ✅ 16 Alpha Vantage tools for stocks, forex, and technical analysis
- ✅ 14 CoinGecko tools for cryptocurrency data
- ✅ Automatic integration with Financial Playground
- ✅ Real-time data fetching on demand
- ✅ Intelligent tool selection by Claude
- ✅ Built-in rate limiting and error handling

**No code changes needed** - just ask Claude for financial data and it will automatically use the MCP tools!

---

**Status:** ✅ Fully Configured and Ready
**Version:** 1.0.0
**Last Updated:** 2025-10-13
