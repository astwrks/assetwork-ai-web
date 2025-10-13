# AssetWorks MCP Servers

Model Context Protocol (MCP) servers for financial data integration with Claude Code.

## 📦 Available MCP Servers

### 1. Alpha Vantage MCP Server
**Location:** `mcp-servers/alpha-vantage/`

Provides comprehensive stock market data and technical analysis tools.

**Tools Available:**
- `get_stock_quote` - Real-time stock quotes
- `get_stock_intraday` - Intraday time series (1min to 60min intervals)
- `get_stock_daily` - Daily historical prices
- `get_stock_weekly` - Weekly adjusted prices
- `get_stock_monthly` - Monthly adjusted prices
- `search_symbol` - Search for stock symbols
- `get_company_overview` - Comprehensive company information
- `get_earnings` - Quarterly and annual earnings data
- `get_income_statement` - Income statements
- `get_balance_sheet` - Balance sheets
- `get_cash_flow` - Cash flow statements
- `get_sma` - Simple Moving Average indicator
- `get_ema` - Exponential Moving Average indicator
- `get_rsi` - Relative Strength Index indicator
- `get_macd` - MACD indicator
- `get_forex_rate` - Real-time forex rates
- `get_forex_daily` - Daily historical forex rates

**API Key:** Required - Set `ALPHA_VANTAGE_API_KEY` environment variable

### 2. CoinGecko MCP Server
**Location:** `mcp-servers/coingecko/`

Provides cryptocurrency market data and analysis tools.

**Tools Available:**
- `get_crypto_price` - Current prices for multiple cryptos
- `get_crypto_details` - Comprehensive cryptocurrency details
- `get_crypto_market_data` - Detailed market data with ATH/ATL
- `get_top_cryptos` - Top cryptocurrencies by market cap
- `get_crypto_history` - Historical price, market cap, volume data
- `get_crypto_ohlc` - OHLC chart data for candlestick charts
- `search_crypto` - Search cryptocurrencies by name/symbol
- `get_trending_cryptos` - Currently trending cryptocurrencies
- `get_global_market_data` - Global crypto market statistics
- `get_defi_data` - DeFi market data
- `get_exchange_rates` - BTC exchange rates
- `compare_cryptos` - Side-by-side comparison of multiple cryptos
- `get_category_market_data` - Category-specific market data

**API Key:** Not required (free tier)

## 🚀 Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Install Dependencies

```bash
# Install Alpha Vantage MCP dependencies
cd mcp-servers/alpha-vantage
npm install

# Install CoinGecko MCP dependencies
cd ../coingecko
npm install
```

## ⚙️ Configuration for Claude Code

To use these MCP servers with Claude Code, add them to your Claude Code configuration file.

### macOS/Linux Configuration

Edit `~/.config/claude-code/config.json`:

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

### Windows Configuration

Edit `%APPDATA%\claude-code\config.json`:

```json
{
  "mcpServers": {
    "alpha-vantage": {
      "command": "node",
      "args": [
        "C:\\Users\\YourUsername\\Projects\\AssetWorks\\assetworks-webapp\\mcp-servers\\alpha-vantage\\index.js"
      ],
      "env": {
        "ALPHA_VANTAGE_API_KEY": "LEVD3ETXGV1LT8WM"
      }
    },
    "coingecko": {
      "command": "node",
      "args": [
        "C:\\Users\\YourUsername\\Projects\\AssetWorks\\assetworks-webapp\\mcp-servers\\coingecko\\index.js"
      ]
    }
  }
}
```

**Important:** Replace the paths with your actual project location.

## 🧪 Testing MCP Servers

### Test Alpha Vantage MCP

```bash
cd mcp-servers/alpha-vantage
export ALPHA_VANTAGE_API_KEY=LEVD3ETXGV1LT8WM
node index.js
```

### Test CoinGecko MCP

```bash
cd mcp-servers/coingecko
node index.js
```

Both servers should start and output: `"[Server Name] MCP Server running on stdio"`

## 📘 Usage Examples

### Example 1: Get Real-Time Stock Quote

When Claude Code is configured with these MCP servers, you can ask:

```
"Get me the current stock price for Apple (AAPL)"
```

Claude will use the `get_stock_quote` tool from Alpha Vantage MCP:
- Fetches real-time price: $245.27
- Returns change: -$8.77 (-3.45%)
- Includes volume, high, low, open, previous close

### Example 2: Compare Cryptocurrencies

```
"Compare Bitcoin, Ethereum, and Cardano"
```

Claude will use the `compare_cryptos` tool from CoinGecko MCP:
- Fetches current prices for all three
- Compares market caps
- Shows 24h, 7d, 30d price changes
- Displays supply and volume data

### Example 3: Technical Analysis

```
"What's the RSI for Tesla stock?"
```

Claude will use the `get_rsi` tool from Alpha Vantage MCP:
- Calculates RSI indicator
- Returns values for last 100 periods
- Identifies overbought/oversold conditions

### Example 4: Market Overview

```
"Give me an overview of the global crypto market"
```

Claude will use the `get_global_market_data` tool from CoinGecko MCP:
- Total market cap
- Trading volume
- BTC/ETH dominance
- Market cap change percentage

## 🎯 Integration with Financial Playground

The MCP servers are designed to work seamlessly with the AssetWorks Financial Playground:

1. **Automatic Tool Selection:** Claude automatically selects the right tools based on user queries
2. **Real-Time Data:** All financial reports use live market data
3. **Flexible Format:** Claude can format data exactly as needed for reports
4. **Multi-Source:** Combines stock and crypto data from both sources

### Example Report Generation

User asks: *"Generate a comprehensive market report for Apple stock including technical indicators"*

Claude will automatically:
1. Use `get_stock_quote` for current price
2. Use `get_company_overview` for fundamentals
3. Use `get_stock_daily` for historical data
4. Use `get_rsi`, `get_macd`, `get_sma` for technical analysis
5. Format everything into a professional HTML report

## 🔒 Rate Limiting

Both MCP servers include built-in rate limiting:

- **Alpha Vantage:** 5 requests per minute (12 second delay between requests)
- **CoinGecko:** 50 requests per minute (1.2 second delay between requests)

The rate limiting is automatic and transparent to Claude.

## 📊 Data Sources

- **Alpha Vantage:** Real-time and historical stock, forex, and fundamental data
- **CoinGecko:** Real-time cryptocurrency prices and market data for 14,000+ coins

## 🐛 Troubleshooting

### MCP Server Not Connecting

1. Check the paths in `config.json` are correct
2. Ensure Node.js is in your PATH
3. Verify API key is set correctly (Alpha Vantage only)
4. Check server logs in Claude Code console

### Rate Limit Errors

- Wait 12+ seconds between Alpha Vantage requests
- Wait 1.2+ seconds between CoinGecko requests
- Consider upgrading to paid API tiers for higher limits

### No Data Returned

- Verify the symbol/coin ID is correct
- Check API key is valid (Alpha Vantage)
- Ensure internet connection is active
- Try testing the endpoint directly via curl

## 📚 Additional Resources

- [Alpha Vantage Documentation](https://www.alphavantage.co/documentation/)
- [CoinGecko API Documentation](https://www.coingecko.com/api/documentation)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

## 🎉 Benefits of MCP Integration

1. **Dynamic Queries:** Claude can fetch exactly the data needed for each query
2. **Real-Time Data:** Always uses current market data
3. **Flexible Formatting:** Data is formatted specifically for user needs
4. **Tool Composition:** Claude can combine multiple tools intelligently
5. **Error Handling:** Built-in retry and fallback mechanisms
6. **No Code Changes:** Financial playground automatically benefits from MCP tools

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2025-10-13
