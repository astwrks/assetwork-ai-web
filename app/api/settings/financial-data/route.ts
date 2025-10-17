import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { ApiKeyConnectionTestService } from '@/lib/services/api-key-connection-test.service';

// GET /api/settings/financial-data - Get financial data API keys and status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all financial data API keys for this user
    const keys = await prisma.api_keys.findMany({
      where: {
        userId: session.user.id,
      },
    });

    // Filter for financial data keys
    const financialKeys = keys.filter(key => {
      const category = getKeyCategory(key.provider);
      return ['financial_data', 'crypto', 'other'].includes(category);
    });

    // Transform keys for frontend
    const transformedKeys = financialKeys.map(key => ({
      id: key.id,
      name: key.keyName,
      provider: key.provider,
      category: getKeyCategory(key.provider),
      keyPreview: key.encryptedKey ? `****${key.encryptedKey.slice(-4)}` : '****',
      connectionStatus: 'unknown', // Will be updated by connection check
      lastChecked: null,
      lastUsed: key.lastUsedAt,
      usageCount: key.usageCount,
      createdAt: key.createdAt,
    }));

    // Calculate summary
    const summary = {
      total: transformedKeys.length,
      connected: 0,
      error: 0,
      unknown: transformedKeys.length,
    };

    return NextResponse.json({
      success: true,
      keys: transformedKeys,
      summary,
    });
  } catch (error) {
    console.error('Failed to fetch financial data keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data keys' },
      { status: 500 }
    );
  }
}

// POST /api/settings/financial-data - Check connection status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { keyId, checkAll } = body;

    // Get keys to check
    const keys = await prisma.api_keys.findMany({
      where: {
        userId: session.user.id,
      },
    });

    // Filter keys to check (support both financial data and AI keys)
    const allKeys = keys.filter(key => {
      const category = getKeyCategory(key.provider);
      return ['financial_data', 'crypto', 'other', 'ai'].includes(category);
    });

    let keysToCheck = allKeys;
    if (keyId) {
      keysToCheck = allKeys.filter(key => key.id === keyId);
    }

    // Check connections with real API tests
    const results = await Promise.all(
      keysToCheck.map(async (key) => {
        try {
          // Test real API connection
          const testResult = await ApiKeyConnectionTestService.testConnection(
            key.provider,
            key.encryptedKey
          );

          // Update last checked time if successful
          if (testResult.success) {
            await prisma.api_keys.updateMany({
              where: {
                userId: session.user.id,
                provider: key.provider,
              },
              data: {
                lastUsedAt: new Date(),
              },
            });
          }

          return {
            id: key.id,
            name: key.keyName,
            provider: key.provider,
            status: testResult.status,
            message: testResult.message,
            errorType: testResult.errorType,
            errorDetails: testResult.errorDetails,
            suggestedFix: testResult.suggestedFix,
            providerDocUrl: testResult.providerDocUrl,
          };
        } catch (error: any) {
          return {
            id: key.id,
            name: key.keyName,
            provider: key.provider,
            status: 'error' as const,
            message: 'Connection test failed',
            errorType: 'unknown' as const,
            errorDetails: error.message || 'Unknown error occurred',
          };
        }
      })
    );

    // Calculate summary
    const summary = {
      total: results.length,
      connected: results.filter(r => r.status === 'connected').length,
      error: results.filter(r => r.status === 'error').length,
      unknown: 0,
    };

    return NextResponse.json({
      success: true,
      results,
      summary,
    });
  } catch (error) {
    console.error('Failed to check connections:', error);
    return NextResponse.json(
      { error: 'Failed to check connections' },
      { status: 500 }
    );
  }
}

// Helper function to get category from provider
function getKeyCategory(provider: string): string {
  const lowerProvider = provider.toLowerCase();

  if (['openai', 'anthropic', 'google', 'groq'].includes(lowerProvider)) {
    return 'ai';
  }

  if (['coingecko', 'coinmarketcap', 'binance'].includes(lowerProvider)) {
    return 'crypto';
  }

  if (['alpha_vantage', 'polygon', 'finnhub'].includes(lowerProvider)) {
    return 'financial_data';
  }

  return 'other';
}