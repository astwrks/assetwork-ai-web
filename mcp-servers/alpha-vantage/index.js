#!/usr/bin/env node

/**
 * Alpha Vantage MCP Server
 * Provides financial market data tools for stocks, forex, and cryptocurrencies
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Alpha Vantage API configuration
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'LEVD3ETXGV1LT8WM';
const BASE_URL = 'https://www.alphavantage.co/query';

// Rate limiting
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 12000; // 12 seconds between requests

async function makeRequest(params) {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  lastRequestTime = Date.now();

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        ...params,
        apikey: API_KEY,
      },
      timeout: 30000,
    });

    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }

    if (response.data['Note']) {
      throw new Error('API rate limit exceeded. Please wait and try again.');
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
    }
    throw error;
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'alpha-vantage-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_stock_quote',
        description: 'Get real-time stock quote for a given symbol. Returns current price, change, volume, high, low, open, and previous close.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol (e.g., AAPL, TSLA, MSFT)',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_stock_intraday',
        description: 'Get intraday time series data for a stock with 1min, 5min, 15min, 30min, or 60min intervals. Returns detailed price and volume data throughout the trading day.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
            interval: {
              type: 'string',
              enum: ['1min', '5min', '15min', '30min', '60min'],
              description: 'Time interval between data points',
              default: '5min',
            },
            outputsize: {
              type: 'string',
              enum: ['compact', 'full'],
              description: 'compact returns latest 100 data points, full returns trailing 30 days',
              default: 'compact',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_stock_daily',
        description: 'Get daily historical stock prices. Returns open, high, low, close, and volume for each trading day.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
            outputsize: {
              type: 'string',
              enum: ['compact', 'full'],
              description: 'compact returns latest 100 data points, full returns 20+ years of historical data',
              default: 'compact',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_stock_weekly',
        description: 'Get weekly adjusted stock prices. Returns open, high, low, close, adjusted close, volume, and dividend amount for each week.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_stock_monthly',
        description: 'Get monthly adjusted stock prices. Returns open, high, low, close, adjusted close, volume, and dividend amount for each month.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'search_symbol',
        description: 'Search for stock symbols by company name or ticker. Returns best matches with symbol, name, type, region, and currency.',
        inputSchema: {
          type: 'object',
          properties: {
            keywords: {
              type: 'string',
              description: 'Search query (company name or ticker symbol)',
            },
          },
          required: ['keywords'],
        },
      },
      {
        name: 'get_company_overview',
        description: 'Get comprehensive company information including financials, sector, industry, market cap, P/E ratio, dividend yield, 52-week high/low, and more.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_earnings',
        description: 'Get quarterly and annual earnings data for a company. Returns EPS estimates and reported earnings.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_income_statement',
        description: 'Get annual and quarterly income statements. Returns revenue, gross profit, operating income, net income, EPS, and more.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_balance_sheet',
        description: 'Get annual and quarterly balance sheets. Returns total assets, liabilities, equity, cash, debt, and more.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_cash_flow',
        description: 'Get annual and quarterly cash flow statements. Returns operating cash flow, investing cash flow, financing cash flow, and more.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_sma',
        description: 'Get Simple Moving Average (SMA) technical indicator. Useful for trend analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
            interval: {
              type: 'string',
              enum: ['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'],
              description: 'Time interval',
              default: 'daily',
            },
            time_period: {
              type: 'integer',
              description: 'Number of data points used to calculate SMA',
              default: 50,
            },
            series_type: {
              type: 'string',
              enum: ['close', 'open', 'high', 'low'],
              description: 'Price type to use for calculation',
              default: 'close',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_ema',
        description: 'Get Exponential Moving Average (EMA) technical indicator. More responsive to recent price changes than SMA.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
            interval: {
              type: 'string',
              enum: ['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'],
              description: 'Time interval',
              default: 'daily',
            },
            time_period: {
              type: 'integer',
              description: 'Number of data points used to calculate EMA',
              default: 50,
            },
            series_type: {
              type: 'string',
              enum: ['close', 'open', 'high', 'low'],
              description: 'Price type to use for calculation',
              default: 'close',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_rsi',
        description: 'Get Relative Strength Index (RSI) technical indicator. Values above 70 indicate overbought, below 30 indicate oversold.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
            interval: {
              type: 'string',
              enum: ['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'],
              description: 'Time interval',
              default: 'daily',
            },
            time_period: {
              type: 'integer',
              description: 'Number of data points used to calculate RSI',
              default: 14,
            },
            series_type: {
              type: 'string',
              enum: ['close', 'open', 'high', 'low'],
              description: 'Price type to use for calculation',
              default: 'close',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_macd',
        description: 'Get Moving Average Convergence Divergence (MACD) technical indicator. Shows relationship between two moving averages.',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
            interval: {
              type: 'string',
              enum: ['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'],
              description: 'Time interval',
              default: 'daily',
            },
            series_type: {
              type: 'string',
              enum: ['close', 'open', 'high', 'low'],
              description: 'Price type to use for calculation',
              default: 'close',
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'get_forex_rate',
        description: 'Get real-time exchange rate between two currencies.',
        inputSchema: {
          type: 'object',
          properties: {
            from_currency: {
              type: 'string',
              description: 'From currency code (e.g., USD, EUR, GBP)',
            },
            to_currency: {
              type: 'string',
              description: 'To currency code (e.g., USD, EUR, GBP)',
            },
          },
          required: ['from_currency', 'to_currency'],
        },
      },
      {
        name: 'get_forex_daily',
        description: 'Get daily historical forex rates between two currencies.',
        inputSchema: {
          type: 'object',
          properties: {
            from_symbol: {
              type: 'string',
              description: 'From currency code (e.g., USD, EUR, GBP)',
            },
            to_symbol: {
              type: 'string',
              description: 'To currency code (e.g., USD, EUR, GBP)',
            },
            outputsize: {
              type: 'string',
              enum: ['compact', 'full'],
              description: 'compact returns latest 100 data points, full returns full historical data',
              default: 'compact',
            },
          },
          required: ['from_symbol', 'to_symbol'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'get_stock_quote': {
        const data = await makeRequest({
          function: 'GLOBAL_QUOTE',
          symbol: args.symbol.toUpperCase(),
        });

        const quote = data['Global Quote'];
        if (!quote || Object.keys(quote).length === 0) {
          throw new Error(`No data found for symbol: ${args.symbol}`);
        }

        result = {
          symbol: quote['01. symbol'],
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          high: parseFloat(quote['03. high']),
          low: parseFloat(quote['04. low']),
          open: parseFloat(quote['02. open']),
          previousClose: parseFloat(quote['08. previous close']),
          latestTradingDay: quote['07. latest trading day'],
        };
        break;
      }

      case 'get_stock_intraday': {
        const data = await makeRequest({
          function: 'TIME_SERIES_INTRADAY',
          symbol: args.symbol.toUpperCase(),
          interval: args.interval || '5min',
          outputsize: args.outputsize || 'compact',
        });

        const timeSeriesKey = `Time Series (${args.interval || '5min'})`;
        const timeSeries = data[timeSeriesKey];

        if (!timeSeries) {
          throw new Error(`No intraday data found for symbol: ${args.symbol}`);
        }

        result = {
          symbol: data['Meta Data']['2. Symbol'],
          interval: args.interval || '5min',
          lastRefreshed: data['Meta Data']['3. Last Refreshed'],
          data: Object.entries(timeSeries).map(([timestamp, values]) => ({
            timestamp,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume']),
          })),
        };
        break;
      }

      case 'get_stock_daily': {
        const data = await makeRequest({
          function: 'TIME_SERIES_DAILY',
          symbol: args.symbol.toUpperCase(),
          outputsize: args.outputsize || 'compact',
        });

        const timeSeries = data['Time Series (Daily)'];
        if (!timeSeries) {
          throw new Error(`No daily data found for symbol: ${args.symbol}`);
        }

        result = {
          symbol: data['Meta Data']['2. Symbol'],
          lastRefreshed: data['Meta Data']['3. Last Refreshed'],
          data: Object.entries(timeSeries).map(([date, values]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume']),
          })),
        };
        break;
      }

      case 'get_stock_weekly': {
        const data = await makeRequest({
          function: 'TIME_SERIES_WEEKLY_ADJUSTED',
          symbol: args.symbol.toUpperCase(),
        });

        const timeSeries = data['Weekly Adjusted Time Series'];
        if (!timeSeries) {
          throw new Error(`No weekly data found for symbol: ${args.symbol}`);
        }

        result = {
          symbol: data['Meta Data']['2. Symbol'],
          lastRefreshed: data['Meta Data']['3. Last Refreshed'],
          data: Object.entries(timeSeries).slice(0, 52).map(([date, values]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            adjustedClose: parseFloat(values['5. adjusted close']),
            volume: parseInt(values['6. volume']),
            dividendAmount: parseFloat(values['7. dividend amount']),
          })),
        };
        break;
      }

      case 'get_stock_monthly': {
        const data = await makeRequest({
          function: 'TIME_SERIES_MONTHLY_ADJUSTED',
          symbol: args.symbol.toUpperCase(),
        });

        const timeSeries = data['Monthly Adjusted Time Series'];
        if (!timeSeries) {
          throw new Error(`No monthly data found for symbol: ${args.symbol}`);
        }

        result = {
          symbol: data['Meta Data']['2. Symbol'],
          lastRefreshed: data['Meta Data']['3. Last Refreshed'],
          data: Object.entries(timeSeries).slice(0, 60).map(([date, values]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            adjustedClose: parseFloat(values['5. adjusted close']),
            volume: parseInt(values['6. volume']),
            dividendAmount: parseFloat(values['7. dividend amount']),
          })),
        };
        break;
      }

      case 'search_symbol': {
        const data = await makeRequest({
          function: 'SYMBOL_SEARCH',
          keywords: args.keywords,
        });

        result = {
          matches: (data.bestMatches || []).map((match) => ({
            symbol: match['1. symbol'],
            name: match['2. name'],
            type: match['3. type'],
            region: match['4. region'],
            marketOpen: match['5. marketOpen'],
            marketClose: match['6. marketClose'],
            timezone: match['7. timezone'],
            currency: match['8. currency'],
            matchScore: parseFloat(match['9. matchScore']),
          })),
        };
        break;
      }

      case 'get_company_overview': {
        const data = await makeRequest({
          function: 'OVERVIEW',
          symbol: args.symbol.toUpperCase(),
        });

        if (!data.Symbol) {
          throw new Error(`No company overview found for symbol: ${args.symbol}`);
        }

        result = {
          symbol: data.Symbol,
          name: data.Name,
          description: data.Description,
          sector: data.Sector,
          industry: data.Industry,
          marketCap: parseInt(data.MarketCapitalization || 0),
          peRatio: parseFloat(data.PERatio || 0),
          pegRatio: parseFloat(data.PEGRatio || 0),
          bookValue: parseFloat(data.BookValue || 0),
          dividendPerShare: parseFloat(data.DividendPerShare || 0),
          dividendYield: parseFloat(data.DividendYield || 0),
          eps: parseFloat(data.EPS || 0),
          revenuePerShareTTM: parseFloat(data.RevenuePerShareTTM || 0),
          profitMargin: parseFloat(data.ProfitMargin || 0),
          operatingMarginTTM: parseFloat(data.OperatingMarginTTM || 0),
          returnOnAssetsTTM: parseFloat(data.ReturnOnAssetsTTM || 0),
          returnOnEquityTTM: parseFloat(data.ReturnOnEquityTTM || 0),
          revenueTTM: parseInt(data.RevenueTTM || 0),
          grossProfitTTM: parseInt(data.GrossProfitTTM || 0),
          dilutedEPSTTM: parseFloat(data.DilutedEPSTTM || 0),
          quarterlyEarningsGrowthYOY: parseFloat(data.QuarterlyEarningsGrowthYOY || 0),
          quarterlyRevenueGrowthYOY: parseFloat(data.QuarterlyRevenueGrowthYOY || 0),
          analystTargetPrice: parseFloat(data.AnalystTargetPrice || 0),
          fiftyTwoWeekHigh: parseFloat(data['52WeekHigh'] || 0),
          fiftyTwoWeekLow: parseFloat(data['52WeekLow'] || 0),
          fiftyDayMovingAverage: parseFloat(data['50DayMovingAverage'] || 0),
          twoHundredDayMovingAverage: parseFloat(data['200DayMovingAverage'] || 0),
          sharesOutstanding: parseInt(data.SharesOutstanding || 0),
        };
        break;
      }

      case 'get_earnings': {
        const data = await makeRequest({
          function: 'EARNINGS',
          symbol: args.symbol.toUpperCase(),
        });

        result = {
          symbol: data.symbol,
          annualEarnings: (data.annualEarnings || []).map((e) => ({
            fiscalDateEnding: e.fiscalDateEnding,
            reportedEPS: parseFloat(e.reportedEPS),
          })),
          quarterlyEarnings: (data.quarterlyEarnings || []).map((e) => ({
            fiscalDateEnding: e.fiscalDateEnding,
            reportedDate: e.reportedDate,
            reportedEPS: parseFloat(e.reportedEPS),
            estimatedEPS: parseFloat(e.estimatedEPS),
            surprise: parseFloat(e.surprise),
            surprisePercentage: parseFloat(e.surprisePercentage),
          })),
        };
        break;
      }

      case 'get_income_statement': {
        const data = await makeRequest({
          function: 'INCOME_STATEMENT',
          symbol: args.symbol.toUpperCase(),
        });

        result = {
          symbol: data.symbol,
          annualReports: (data.annualReports || []).slice(0, 5).map((r) => ({
            fiscalDateEnding: r.fiscalDateEnding,
            totalRevenue: parseInt(r.totalRevenue || 0),
            costOfRevenue: parseInt(r.costOfRevenue || 0),
            grossProfit: parseInt(r.grossProfit || 0),
            operatingIncome: parseInt(r.operatingIncome || 0),
            netIncome: parseInt(r.netIncome || 0),
            ebitda: parseInt(r.ebitda || 0),
            incomeBeforeTax: parseInt(r.incomeBeforeTax || 0),
          })),
          quarterlyReports: (data.quarterlyReports || []).slice(0, 8).map((r) => ({
            fiscalDateEnding: r.fiscalDateEnding,
            totalRevenue: parseInt(r.totalRevenue || 0),
            costOfRevenue: parseInt(r.costOfRevenue || 0),
            grossProfit: parseInt(r.grossProfit || 0),
            operatingIncome: parseInt(r.operatingIncome || 0),
            netIncome: parseInt(r.netIncome || 0),
          })),
        };
        break;
      }

      case 'get_balance_sheet': {
        const data = await makeRequest({
          function: 'BALANCE_SHEET',
          symbol: args.symbol.toUpperCase(),
        });

        result = {
          symbol: data.symbol,
          annualReports: (data.annualReports || []).slice(0, 5).map((r) => ({
            fiscalDateEnding: r.fiscalDateEnding,
            totalAssets: parseInt(r.totalAssets || 0),
            totalCurrentAssets: parseInt(r.totalCurrentAssets || 0),
            totalLiabilities: parseInt(r.totalLiabilities || 0),
            totalCurrentLiabilities: parseInt(r.totalCurrentLiabilities || 0),
            totalShareholderEquity: parseInt(r.totalShareholderEquity || 0),
            cashAndCashEquivalentsAtCarryingValue: parseInt(r.cashAndCashEquivalentsAtCarryingValue || 0),
            shortTermDebt: parseInt(r.shortTermDebt || 0),
            longTermDebt: parseInt(r.longTermDebt || 0),
          })),
          quarterlyReports: (data.quarterlyReports || []).slice(0, 8).map((r) => ({
            fiscalDateEnding: r.fiscalDateEnding,
            totalAssets: parseInt(r.totalAssets || 0),
            totalLiabilities: parseInt(r.totalLiabilities || 0),
            totalShareholderEquity: parseInt(r.totalShareholderEquity || 0),
          })),
        };
        break;
      }

      case 'get_cash_flow': {
        const data = await makeRequest({
          function: 'CASH_FLOW',
          symbol: args.symbol.toUpperCase(),
        });

        result = {
          symbol: data.symbol,
          annualReports: (data.annualReports || []).slice(0, 5).map((r) => ({
            fiscalDateEnding: r.fiscalDateEnding,
            operatingCashflow: parseInt(r.operatingCashflow || 0),
            cashflowFromInvestment: parseInt(r.cashflowFromInvestment || 0),
            cashflowFromFinancing: parseInt(r.cashflowFromFinancing || 0),
            capitalExpenditures: parseInt(r.capitalExpenditures || 0),
          })),
          quarterlyReports: (data.quarterlyReports || []).slice(0, 8).map((r) => ({
            fiscalDateEnding: r.fiscalDateEnding,
            operatingCashflow: parseInt(r.operatingCashflow || 0),
            cashflowFromInvestment: parseInt(r.cashflowFromInvestment || 0),
            cashflowFromFinancing: parseInt(r.cashflowFromFinancing || 0),
          })),
        };
        break;
      }

      case 'get_sma': {
        const data = await makeRequest({
          function: 'SMA',
          symbol: args.symbol.toUpperCase(),
          interval: args.interval || 'daily',
          time_period: args.time_period || 50,
          series_type: args.series_type || 'close',
        });

        const technicalKey = 'Technical Analysis: SMA';
        const technicalData = data[technicalKey];

        if (!technicalData) {
          throw new Error(`No SMA data found for symbol: ${args.symbol}`);
        }

        result = {
          symbol: data['Meta Data']['1: Symbol'],
          indicator: 'SMA',
          interval: args.interval || 'daily',
          timePeriod: args.time_period || 50,
          seriesType: args.series_type || 'close',
          lastRefreshed: data['Meta Data']['3: Last Refreshed'],
          data: Object.entries(technicalData).slice(0, 100).map(([timestamp, values]) => ({
            timestamp,
            sma: parseFloat(values.SMA),
          })),
        };
        break;
      }

      case 'get_ema': {
        const data = await makeRequest({
          function: 'EMA',
          symbol: args.symbol.toUpperCase(),
          interval: args.interval || 'daily',
          time_period: args.time_period || 50,
          series_type: args.series_type || 'close',
        });

        const technicalKey = 'Technical Analysis: EMA';
        const technicalData = data[technicalKey];

        if (!technicalData) {
          throw new Error(`No EMA data found for symbol: ${args.symbol}`);
        }

        result = {
          symbol: data['Meta Data']['1: Symbol'],
          indicator: 'EMA',
          interval: args.interval || 'daily',
          timePeriod: args.time_period || 50,
          seriesType: args.series_type || 'close',
          lastRefreshed: data['Meta Data']['3: Last Refreshed'],
          data: Object.entries(technicalData).slice(0, 100).map(([timestamp, values]) => ({
            timestamp,
            ema: parseFloat(values.EMA),
          })),
        };
        break;
      }

      case 'get_rsi': {
        const data = await makeRequest({
          function: 'RSI',
          symbol: args.symbol.toUpperCase(),
          interval: args.interval || 'daily',
          time_period: args.time_period || 14,
          series_type: args.series_type || 'close',
        });

        const technicalKey = 'Technical Analysis: RSI';
        const technicalData = data[technicalKey];

        if (!technicalData) {
          throw new Error(`No RSI data found for symbol: ${args.symbol}`);
        }

        result = {
          symbol: data['Meta Data']['1: Symbol'],
          indicator: 'RSI',
          interval: args.interval || 'daily',
          timePeriod: args.time_period || 14,
          seriesType: args.series_type || 'close',
          lastRefreshed: data['Meta Data']['3: Last Refreshed'],
          data: Object.entries(technicalData).slice(0, 100).map(([timestamp, values]) => ({
            timestamp,
            rsi: parseFloat(values.RSI),
          })),
        };
        break;
      }

      case 'get_macd': {
        const data = await makeRequest({
          function: 'MACD',
          symbol: args.symbol.toUpperCase(),
          interval: args.interval || 'daily',
          series_type: args.series_type || 'close',
        });

        const technicalKey = 'Technical Analysis: MACD';
        const technicalData = data[technicalKey];

        if (!technicalData) {
          throw new Error(`No MACD data found for symbol: ${args.symbol}`);
        }

        result = {
          symbol: data['Meta Data']['1: Symbol'],
          indicator: 'MACD',
          interval: args.interval || 'daily',
          seriesType: args.series_type || 'close',
          lastRefreshed: data['Meta Data']['3: Last Refreshed'],
          data: Object.entries(technicalData).slice(0, 100).map(([timestamp, values]) => ({
            timestamp,
            macd: parseFloat(values.MACD),
            macdSignal: parseFloat(values.MACD_Signal),
            macdHist: parseFloat(values.MACD_Hist),
          })),
        };
        break;
      }

      case 'get_forex_rate': {
        const data = await makeRequest({
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: args.from_currency.toUpperCase(),
          to_currency: args.to_currency.toUpperCase(),
        });

        const realtimeData = data['Realtime Currency Exchange Rate'];
        if (!realtimeData) {
          throw new Error('No forex data found');
        }

        result = {
          fromCurrency: realtimeData['1. From_Currency Code'],
          fromCurrencyName: realtimeData['2. From_Currency Name'],
          toCurrency: realtimeData['3. To_Currency Code'],
          toCurrencyName: realtimeData['4. To_Currency Name'],
          exchangeRate: parseFloat(realtimeData['5. Exchange Rate']),
          lastRefreshed: realtimeData['6. Last Refreshed'],
          timezone: realtimeData['7. Time Zone'],
          bidPrice: parseFloat(realtimeData['8. Bid Price']),
          askPrice: parseFloat(realtimeData['9. Ask Price']),
        };
        break;
      }

      case 'get_forex_daily': {
        const data = await makeRequest({
          function: 'FX_DAILY',
          from_symbol: args.from_symbol.toUpperCase(),
          to_symbol: args.to_symbol.toUpperCase(),
          outputsize: args.outputsize || 'compact',
        });

        const timeSeriesKey = 'Time Series FX (Daily)';
        const timeSeries = data[timeSeriesKey];

        if (!timeSeries) {
          throw new Error('No forex daily data found');
        }

        result = {
          fromSymbol: data['Meta Data']['2. From Symbol'],
          toSymbol: data['Meta Data']['3. To Symbol'],
          lastRefreshed: data['Meta Data']['4. Last Refreshed'],
          data: Object.entries(timeSeries).map(([date, values]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
          })),
        };
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Alpha Vantage MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
