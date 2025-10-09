import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { connectToDatabase } from '@/lib/db/mongodb';
import ApiKey, { decryptApiKey } from '@/lib/db/models/ApiKey';
import { createDataSourceClient } from '@/lib/data-sources';

// GET /api/data/quote?symbol=AAPL&provider=alpha_vantage
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const provider = searchParams.get('provider') || 'alpha_vantage';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing symbol parameter' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get user's API key for this provider
    const apiKeyDoc = await ApiKey.findOne({
      userId: session.user.id,
      provider,
      isActive: true,
    }).select('+encryptedKey');

    let apiKey: string | undefined;
    if (apiKeyDoc) {
      apiKey = decryptApiKey(apiKeyDoc.encryptedKey);

      // Update usage stats
      await ApiKey.updateOne(
        { _id: apiKeyDoc._id },
        {
          $set: { lastUsed: new Date() },
          $inc: { usageCount: 1 },
        }
      );
    }

    // Create data source client
    const client = createDataSourceClient(provider, apiKey);

    // Fetch quote based on provider type
    let quote;
    if (provider === 'coinmarketcap' || provider === 'coingecko') {
      quote = await (client as any).getQuote(symbol);
    } else {
      quote = await (client as any).getQuote(symbol);
    }

    return NextResponse.json({
      success: true,
      provider,
      quote,
    });
  } catch (error: any) {
    console.error('Failed to fetch quote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
