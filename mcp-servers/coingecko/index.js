#!/usr/bin/env node

/**
 * CoinGecko MCP Server
 * Provides cryptocurrency market data and analysis tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// CoinGecko API configuration
const BASE_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.COINGECKO_API_KEY || '';

// Rate limiting
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 1200; // 1.2 seconds between requests (50 per minute)

async function makeRequest(endpoint, params = {}) {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  lastRequestTime = Date.now();

  try {
    const headers = {};

    // Add API key to headers if available (Pro tier)
    if (API_KEY) {
      headers['x-cg-pro-api-key'] = API_KEY;
    }

    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params,
      headers,
      timeout: 30000,
    });

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
    name: 'coingecko-mcp',
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
        name: 'get_crypto_price',
        description: 'Get current price of one or multiple cryptocurrencies in any currency. Returns real-time prices with market cap and volume.',
        inputSchema: {
          type: 'object',
          properties: {
            ids: {
              type: 'string',
              description: 'Comma-separated list of coin IDs (e.g., bitcoin,ethereum,binancecoin)',
            },
            vs_currencies: {
              type: 'string',
              description: 'Comma-separated list of currencies (e.g., usd,eur,gbp)',
              default: 'usd',
            },
            include_market_cap: {
              type: 'boolean',
              description: 'Include market cap data',
              default: true,
            },
            include_24hr_vol: {
              type: 'boolean',
              description: 'Include 24h volume',
              default: true,
            },
            include_24hr_change: {
              type: 'boolean',
              description: 'Include 24h price change percentage',
              default: true,
            },
          },
          required: ['ids'],
        },
      },
      {
        name: 'get_crypto_details',
        description: 'Get comprehensive details about a cryptocurrency including price, market data, description, links, and community stats.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Coin ID (e.g., bitcoin, ethereum)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_crypto_market_data',
        description: 'Get detailed market data for a cryptocurrency including ATH, ATL, price change percentages, supply data, and more.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Coin ID (e.g., bitcoin, ethereum)',
            },
            vs_currency: {
              type: 'string',
              description: 'Currency to display data in',
              default: 'usd',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_top_cryptos',
        description: 'Get top cryptocurrencies by market cap with price, volume, and change data. Useful for market overview.',
        inputSchema: {
          type: 'object',
          properties: {
            vs_currency: {
              type: 'string',
              description: 'Currency to display prices in',
              default: 'usd',
            },
            per_page: {
              type: 'integer',
              description: 'Number of results per page (1-250)',
              default: 10,
              minimum: 1,
              maximum: 250,
            },
            page: {
              type: 'integer',
              description: 'Page number',
              default: 1,
            },
            order: {
              type: 'string',
              enum: ['market_cap_desc', 'market_cap_asc', 'volume_desc', 'volume_asc', 'id_asc', 'id_desc'],
              description: 'Sort order',
              default: 'market_cap_desc',
            },
          },
        },
      },
      {
        name: 'get_crypto_history',
        description: 'Get historical market data (price, market cap, volume) for a cryptocurrency. Returns daily data points.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Coin ID (e.g., bitcoin, ethereum)',
            },
            vs_currency: {
              type: 'string',
              description: 'Currency to display data in',
              default: 'usd',
            },
            days: {
              type: 'string',
              description: 'Number of days: 1, 7, 14, 30, 90, 180, 365, max',
              default: '30',
            },
            interval: {
              type: 'string',
              enum: ['daily', 'hourly'],
              description: 'Data interval (daily for days > 90)',
              default: 'daily',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_crypto_ohlc',
        description: 'Get OHLC (Open, High, Low, Close) chart data for a cryptocurrency. Useful for candlestick charts.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Coin ID (e.g., bitcoin, ethereum)',
            },
            vs_currency: {
              type: 'string',
              description: 'Currency to display data in',
              default: 'usd',
            },
            days: {
              type: 'string',
              enum: ['1', '7', '14', '30', '90', '180', '365'],
              description: 'Number of days',
              default: '7',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'search_crypto',
        description: 'Search for cryptocurrencies by name or symbol. Returns matches with coin ID, name, symbol, and market cap rank.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (coin name or symbol)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_trending_cryptos',
        description: 'Get trending cryptocurrencies based on search activity. Returns top 7 trending coins on CoinGecko.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_global_market_data',
        description: 'Get global cryptocurrency market data including total market cap, volume, BTC/ETH dominance, and market cap change.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_defi_data',
        description: 'Get global DeFi market data including DeFi market cap, ETH market cap, trading volume, and top DeFi coins.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_exchange_rates',
        description: 'Get BTC exchange rates in various currencies and cryptocurrencies.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_nft_market_data',
        description: 'Get NFT collection data including floor price, market cap, volume, and owners.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'NFT collection ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'compare_cryptos',
        description: 'Compare multiple cryptocurrencies side by side with price, market cap, volume, and change data.',
        inputSchema: {
          type: 'object',
          properties: {
            ids: {
              type: 'string',
              description: 'Comma-separated list of coin IDs to compare (e.g., bitcoin,ethereum,cardano)',
            },
            vs_currency: {
              type: 'string',
              description: 'Currency to display data in',
              default: 'usd',
            },
          },
          required: ['ids'],
        },
      },
      {
        name: 'get_category_market_data',
        description: 'Get market data for a specific cryptocurrency category (DeFi, NFT, Gaming, etc.).',
        inputSchema: {
          type: 'object',
          properties: {
            category_id: {
              type: 'string',
              description: 'Category ID (e.g., decentralized-finance-defi, non-fungible-tokens-nft, gaming)',
            },
          },
          required: ['category_id'],
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
      case 'get_crypto_price': {
        const data = await makeRequest('/simple/price', {
          ids: args.ids.toLowerCase(),
          vs_currencies: args.vs_currencies || 'usd',
          include_market_cap: args.include_market_cap !== false,
          include_24hr_vol: args.include_24hr_vol !== false,
          include_24hr_change: args.include_24hr_change !== false,
        });

        result = data;
        break;
      }

      case 'get_crypto_details': {
        const data = await makeRequest(`/coins/${args.id.toLowerCase()}`, {
          localization: false,
          tickers: false,
          community_data: true,
          developer_data: true,
        });

        result = {
          id: data.id,
          symbol: data.symbol.toUpperCase(),
          name: data.name,
          description: data.description?.en?.substring(0, 500) || 'No description available',
          categories: data.categories,
          links: {
            homepage: data.links?.homepage?.[0],
            blockchain_site: data.links?.blockchain_site?.[0],
            official_forum_url: data.links?.official_forum_url?.[0],
            twitter_screen_name: data.links?.twitter_screen_name,
            subreddit_url: data.links?.subreddit_url,
          },
          marketData: {
            currentPrice: data.market_data?.current_price?.usd,
            marketCap: data.market_data?.market_cap?.usd,
            totalVolume: data.market_data?.total_volume?.usd,
            high24h: data.market_data?.high_24h?.usd,
            low24h: data.market_data?.low_24h?.usd,
            priceChange24h: data.market_data?.price_change_24h,
            priceChangePercentage24h: data.market_data?.price_change_percentage_24h,
            marketCapRank: data.market_data?.market_cap_rank,
            circulatingSupply: data.market_data?.circulating_supply,
            totalSupply: data.market_data?.total_supply,
            maxSupply: data.market_data?.max_supply,
            ath: data.market_data?.ath?.usd,
            athDate: data.market_data?.ath_date?.usd,
            atl: data.market_data?.atl?.usd,
            atlDate: data.market_data?.atl_date?.usd,
          },
          communityData: {
            twitterFollowers: data.community_data?.twitter_followers,
            redditSubscribers: data.community_data?.reddit_subscribers,
            redditAveragePosts48h: data.community_data?.reddit_average_posts_48h,
          },
        };
        break;
      }

      case 'get_crypto_market_data': {
        const data = await makeRequest(`/coins/${args.id.toLowerCase()}`, {
          localization: false,
          tickers: false,
          market_data: true,
        });

        const currency = args.vs_currency || 'usd';
        const md = data.market_data;

        result = {
          id: data.id,
          symbol: data.symbol.toUpperCase(),
          name: data.name,
          marketCapRank: md?.market_cap_rank,
          currentPrice: md?.current_price?.[currency],
          marketCap: md?.market_cap?.[currency],
          fullyDilutedValuation: md?.fully_diluted_valuation?.[currency],
          totalVolume: md?.total_volume?.[currency],
          high24h: md?.high_24h?.[currency],
          low24h: md?.low_24h?.[currency],
          priceChange24h: md?.price_change_24h,
          priceChangePercentage24h: md?.price_change_percentage_24h,
          priceChangePercentage7d: md?.price_change_percentage_7d,
          priceChangePercentage14d: md?.price_change_percentage_14d,
          priceChangePercentage30d: md?.price_change_percentage_30d,
          priceChangePercentage60d: md?.price_change_percentage_60d,
          priceChangePercentage200d: md?.price_change_percentage_200d,
          priceChangePercentage1y: md?.price_change_percentage_1y,
          ath: md?.ath?.[currency],
          athChangePercentage: md?.ath_change_percentage?.[currency],
          athDate: md?.ath_date?.[currency],
          atl: md?.atl?.[currency],
          atlChangePercentage: md?.atl_change_percentage?.[currency],
          atlDate: md?.atl_date?.[currency],
          circulatingSupply: md?.circulating_supply,
          totalSupply: md?.total_supply,
          maxSupply: md?.max_supply,
        };
        break;
      }

      case 'get_top_cryptos': {
        const data = await makeRequest('/coins/markets', {
          vs_currency: args.vs_currency || 'usd',
          order: args.order || 'market_cap_desc',
          per_page: args.per_page || 10,
          page: args.page || 1,
          sparkline: false,
          price_change_percentage: '24h',
        });

        result = data.map((coin) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          image: coin.image,
          currentPrice: coin.current_price,
          marketCap: coin.market_cap,
          marketCapRank: coin.market_cap_rank,
          fullyDilutedValuation: coin.fully_diluted_valuation,
          totalVolume: coin.total_volume,
          high24h: coin.high_24h,
          low24h: coin.low_24h,
          priceChange24h: coin.price_change_24h,
          priceChangePercentage24h: coin.price_change_percentage_24h,
          circulatingSupply: coin.circulating_supply,
          totalSupply: coin.total_supply,
          maxSupply: coin.max_supply,
          ath: coin.ath,
          athChangePercentage: coin.ath_change_percentage,
          athDate: coin.ath_date,
          atl: coin.atl,
          atlChangePercentage: coin.atl_change_percentage,
          atlDate: coin.atl_date,
        }));
        break;
      }

      case 'get_crypto_history': {
        const data = await makeRequest(`/coins/${args.id.toLowerCase()}/market_chart`, {
          vs_currency: args.vs_currency || 'usd',
          days: args.days || '30',
          interval: args.interval || 'daily',
        });

        result = {
          id: args.id,
          prices: data.prices.map(([timestamp, price]) => ({
            timestamp: new Date(timestamp).toISOString(),
            price,
          })),
          marketCaps: data.market_caps.map(([timestamp, marketCap]) => ({
            timestamp: new Date(timestamp).toISOString(),
            marketCap,
          })),
          totalVolumes: data.total_volumes.map(([timestamp, volume]) => ({
            timestamp: new Date(timestamp).toISOString(),
            volume,
          })),
        };
        break;
      }

      case 'get_crypto_ohlc': {
        const data = await makeRequest(`/coins/${args.id.toLowerCase()}/ohlc`, {
          vs_currency: args.vs_currency || 'usd',
          days: args.days || '7',
        });

        result = {
          id: args.id,
          data: data.map(([timestamp, open, high, low, close]) => ({
            timestamp: new Date(timestamp).toISOString(),
            open,
            high,
            low,
            close,
          })),
        };
        break;
      }

      case 'search_crypto': {
        const data = await makeRequest('/search', {
          query: args.query,
        });

        result = {
          coins: data.coins.slice(0, 10).map((coin) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            marketCapRank: coin.market_cap_rank,
            thumb: coin.thumb,
            large: coin.large,
          })),
          exchanges: data.exchanges.slice(0, 5).map((exchange) => ({
            id: exchange.id,
            name: exchange.name,
            marketType: exchange.market_type,
            thumb: exchange.thumb,
          })),
        };
        break;
      }

      case 'get_trending_cryptos': {
        const data = await makeRequest('/search/trending');

        result = {
          coins: data.coins.map((item) => ({
            id: item.item.id,
            coinId: item.item.coin_id,
            name: item.item.name,
            symbol: item.item.symbol,
            marketCapRank: item.item.market_cap_rank,
            thumb: item.item.thumb,
            small: item.item.small,
            large: item.item.large,
            score: item.item.score,
            priceBtc: item.item.price_btc,
          })),
        };
        break;
      }

      case 'get_global_market_data': {
        const data = await makeRequest('/global');

        result = {
          activeCryptocurrencies: data.data.active_cryptocurrencies,
          upcomingIcos: data.data.upcoming_icos,
          ongoingIcos: data.data.ongoing_icos,
          endedIcos: data.data.ended_icos,
          markets: data.data.markets,
          totalMarketCap: data.data.total_market_cap?.usd,
          totalVolume: data.data.total_volume?.usd,
          marketCapPercentage: {
            btc: data.data.market_cap_percentage?.btc,
            eth: data.data.market_cap_percentage?.eth,
          },
          marketCapChangePercentage24hUsd: data.data.market_cap_change_percentage_24h_usd,
          updatedAt: data.data.updated_at,
        };
        break;
      }

      case 'get_defi_data': {
        const data = await makeRequest('/global/decentralized_finance_defi');

        result = {
          defiMarketCap: data.data.defi_market_cap,
          ethMarketCap: data.data.eth_market_cap,
          defiToEthRatio: data.data.defi_to_eth_ratio,
          tradingVolume24h: data.data.trading_volume_24h,
          defiDominance: data.data.defi_dominance,
          topCoinName: data.data.top_coin_name,
          topCoinDefiDominance: data.data.top_coin_defi_dominance,
        };
        break;
      }

      case 'get_exchange_rates': {
        const data = await makeRequest('/exchange_rates');

        const rates = data.rates;
        result = {
          btc: {
            name: rates.btc.name,
            unit: rates.btc.unit,
            value: rates.btc.value,
            type: rates.btc.type,
          },
          usd: rates.usd,
          eur: rates.eur,
          gbp: rates.gbp,
          jpy: rates.jpy,
          eth: rates.eth,
          // Add more as needed
        };
        break;
      }

      case 'compare_cryptos': {
        const ids = args.ids.toLowerCase().split(',').map((id) => id.trim());
        const vs_currency = args.vs_currency || 'usd';

        const data = await makeRequest('/coins/markets', {
          vs_currency,
          ids: ids.join(','),
          order: 'market_cap_desc',
          per_page: ids.length,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h,7d,30d',
        });

        result = {
          comparison: data.map((coin) => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            currentPrice: coin.current_price,
            marketCap: coin.market_cap,
            marketCapRank: coin.market_cap_rank,
            totalVolume: coin.total_volume,
            priceChangePercentage24h: coin.price_change_percentage_24h,
            priceChangePercentage7d: coin.price_change_percentage_7d_in_currency,
            priceChangePercentage30d: coin.price_change_percentage_30d_in_currency,
            circulatingSupply: coin.circulating_supply,
            totalSupply: coin.total_supply,
            maxSupply: coin.max_supply,
            ath: coin.ath,
            atl: coin.atl,
          })),
        };
        break;
      }

      case 'get_category_market_data': {
        const data = await makeRequest(`/coins/markets`, {
          vs_currency: 'usd',
          category: args.category_id,
          order: 'market_cap_desc',
          per_page: 20,
          page: 1,
        });

        result = {
          category: args.category_id,
          coins: data.map((coin) => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            currentPrice: coin.current_price,
            marketCap: coin.market_cap,
            marketCapRank: coin.market_cap_rank,
            priceChangePercentage24h: coin.price_change_percentage_24h,
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
  console.error('CoinGecko MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
