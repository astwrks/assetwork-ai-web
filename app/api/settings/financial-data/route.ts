import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import ApiKey from '@/lib/db/models/ApiKey';
import { connectDB } from '@/lib/db/mongodb';
import { decryptApiKey } from '@/lib/db/models/ApiKey';
import { alphaVantageService } from '@/lib/services/financial-data/alpha-vantage.service';
import { coinGeckoService } from '@/lib/services/financial-data/coingecko.service';

/**
 * GET /api/settings/financial-data
 * Fetches all financial data API keys for the current user with connection status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch all financial data API keys (including encrypted keys for testing)
    const apiKeys = await ApiKey.find({
      userId: session.user.id,
      category: { $in: ['financial_data', 'crypto'] },
      isActive: true,
    }).select('+encryptedKey').lean();

    // Return formatted data for settings page
    const formattedKeys = apiKeys.map((key: any) => ({
      id: key._id.toString(),
      name: key.name,
      provider: key.provider,
      category: key.category,
      keyPreview: key.keyPreview,
      connectionStatus: key.connectionStatus || 'unknown',
      lastChecked: key.lastChecked,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount || 0,
      isActive: key.isActive,
      metadata: key.metadata,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      keys: formattedKeys,
      summary: {
        total: formattedKeys.length,
        connected: formattedKeys.filter((k: any) => k.connectionStatus === 'connected').length,
        error: formattedKeys.filter((k: any) => k.connectionStatus === 'error').length,
        unknown: formattedKeys.filter((k: any) => k.connectionStatus === 'unknown').length,
      },
    });
  } catch (error) {
    console.error('Error fetching financial data API keys:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/financial-data/check
 * Checks connection status for a specific API key or all keys
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { keyId, checkAll } = body;

    await connectDB();

    let keysToCheck;

    if (checkAll) {
      // Check all financial data API keys
      keysToCheck = await ApiKey.find({
        userId: session.user.id,
        category: { $in: ['financial_data', 'crypto'] },
        isActive: true,
      }).select('+encryptedKey');
    } else if (keyId) {
      // Check specific key
      keysToCheck = await ApiKey.find({
        _id: keyId,
        userId: session.user.id,
      }).select('+encryptedKey');
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing keyId or checkAll parameter' },
        { status: 400 }
      );
    }

    const results = [];

    for (const apiKey of keysToCheck) {
      let connectionStatus: 'connected' | 'error' | 'unknown' = 'unknown';
      let errorMessage = '';

      try {
        const decryptedKey = decryptApiKey(apiKey.encryptedKey);

        // Test connection based on provider
        if (apiKey.provider === 'alpha_vantage') {
          // Test Alpha Vantage connection with a simple quote request
          const testService = new (alphaVantageService.constructor as any)(decryptedKey);
          const testResult = await testService.getStockQuote('IBM');

          if (testResult.success && testResult.data) {
            connectionStatus = 'connected';
          } else {
            connectionStatus = 'error';
            errorMessage = testResult.error || 'Failed to connect to Alpha Vantage';
          }
        } else if (apiKey.provider === 'coingecko') {
          // Test CoinGecko connection
          const testService = new (coinGeckoService.constructor as any)(decryptedKey);
          const testResult = await testService.getCryptoQuote('bitcoin');

          if (testResult.success && testResult.data) {
            connectionStatus = 'connected';
          } else {
            connectionStatus = 'error';
            errorMessage = testResult.error || 'Failed to connect to CoinGecko';
          }
        } else if (apiKey.provider === 'polygon') {
          // Test Polygon.io connection
          const testUrl = `https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apiKey=${decryptedKey}`;
          const response = await fetch(testUrl);

          if (response.ok) {
            connectionStatus = 'connected';
          } else {
            connectionStatus = 'error';
            errorMessage = 'Failed to connect to Polygon.io';
          }
        } else if (apiKey.provider === 'finnhub') {
          // Test Finnhub connection
          const testUrl = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${decryptedKey}`;
          const response = await fetch(testUrl);

          if (response.ok) {
            connectionStatus = 'connected';
          } else {
            connectionStatus = 'error';
            errorMessage = 'Failed to connect to Finnhub';
          }
        } else if (apiKey.provider === 'coinmarketcap') {
          // Test CoinMarketCap connection
          const testUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=1';
          const response = await fetch(testUrl, {
            headers: {
              'X-CMC_PRO_API_KEY': decryptedKey,
            },
          });

          if (response.ok) {
            connectionStatus = 'connected';
          } else {
            connectionStatus = 'error';
            errorMessage = 'Failed to connect to CoinMarketCap';
          }
        }

        // Update the database with connection status
        apiKey.connectionStatus = connectionStatus;
        apiKey.lastChecked = new Date();
        await apiKey.save();

        results.push({
          id: apiKey._id.toString(),
          provider: apiKey.provider,
          name: apiKey.name,
          connectionStatus,
          errorMessage,
          lastChecked: apiKey.lastChecked,
        });
      } catch (error: any) {
        connectionStatus = 'error';
        errorMessage = error.message || 'Connection test failed';

        // Update the database with error status
        apiKey.connectionStatus = connectionStatus;
        apiKey.lastChecked = new Date();
        await apiKey.save();

        results.push({
          id: apiKey._id.toString(),
          provider: apiKey.provider,
          name: apiKey.name,
          connectionStatus,
          errorMessage,
          lastChecked: apiKey.lastChecked,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        connected: results.filter((r) => r.connectionStatus === 'connected').length,
        error: results.filter((r) => r.connectionStatus === 'error').length,
      },
    });
  } catch (error) {
    console.error('Error checking API connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check API connection' },
      { status: 500 }
    );
  }
}
