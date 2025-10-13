import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { connectToDatabase } from '@/lib/db/mongodb';
import ApiKey, { encryptApiKey, getKeyPreview } from '@/lib/db/models/ApiKey';

// GET /api/keys - Fetch all API keys for user
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
    const category = searchParams.get('category');
    const provider = searchParams.get('provider');

    await connectToDatabase();

    const query: any = { userId: session.user.id };
    if (category) query.category = category;
    if (provider) query.provider = provider;

    const keys = await ApiKey.find(query)
      .select('-encryptedKey') // Never return the actual key
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      keys: keys.map((key: any) => ({
        id: key._id.toString(),
        name: key.name,
        provider: key.provider,
        category: key.category,
        keyPreview: key.keyPreview,
        isActive: key.isActive,
        lastUsed: key.lastUsed,
        usageCount: key.usageCount,
        metadata: key.metadata,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/keys - Create new API key
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
    const { name, provider, category, apiKey, metadata } = body;

    // Validation
    if (!name || !provider || !category || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: name, provider, category, apiKey' },
        { status: 400 }
      );
    }

    const validProviders = ['openai', 'anthropic', 'google', 'groq', 'alpha_vantage', 'polygon', 'finnhub', 'coinmarketcap', 'custom'];
    const validCategories = ['ai', 'financial_data', 'crypto', 'other'];

    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if key already exists for this provider
    const existingKey = await ApiKey.findOne({
      userId: session.user.id,
      provider,
      isActive: true,
    });

    if (existingKey) {
      return NextResponse.json(
        { error: `You already have an active ${provider} API key. Please deactivate it first.` },
        { status: 409 }
      );
    }

    // Encrypt the API key
    const encryptedKey = encryptApiKey(apiKey);
    const keyPreview = getKeyPreview(apiKey);

    const newKey = await ApiKey.create({
      userId: session.user.id,
      name,
      provider,
      category,
      encryptedKey,
      keyPreview,
      isActive: true,
      metadata: metadata || {},
    });

    return NextResponse.json({
      success: true,
      key: {
        id: newKey._id.toString(),
        name: newKey.name,
        provider: newKey.provider,
        category: newKey.category,
        keyPreview: newKey.keyPreview,
        isActive: newKey.isActive,
        createdAt: newKey.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

// DELETE /api/keys - Delete API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { error: 'Missing key ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await ApiKey.deleteOne({
      _id: keyId,
      userId: session.user.id, // Security: ensure user owns the key
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
