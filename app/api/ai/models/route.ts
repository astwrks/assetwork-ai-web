import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/db/prisma';
import { decryptApiKey } from '@/lib/utils/encryption';
import { AI_MODELS, UnifiedAIClient, AIProvider } from '@/lib/ai/unified-client';

// GET /api/ai/models - Get available AI models based on user's API keys
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all AI provider API keys for this user using Prisma
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: session.user.id,
        category: 'ai',
        isActive: true,
      },
    });

    // Build provider map
    const providerKeys: Record<AIProvider, string | null> = {
      openai: null,
      anthropic: null,
      google: null,
      groq: null,
    };

    for (const key of apiKeys) {
      if (key.provider === 'openai' || key.provider === 'anthropic' || key.provider === 'google' || key.provider === 'groq') {
        providerKeys[key.provider as AIProvider] = decryptApiKey(key.encryptedKey);
      }
    }

    // Create unified client to get available models
    const client = new UnifiedAIClient(providerKeys);
    const availableModels = client.getAvailableModels();

    // Group models by provider
    const modelsByProvider = availableModels.reduce((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<string, typeof availableModels>);

    // Get all models (including unavailable ones)
    const allModels = Object.entries(AI_MODELS).map(([key, model]) => ({
      key,
      ...model,
      available: availableModels.some(m => m.id === model.id),
    }));

    return NextResponse.json({
      success: true,
      models: allModels,
      available: availableModels,
      byProvider: modelsByProvider,
      configuredProviders: Object.entries(providerKeys)
        .filter(([_, key]) => key !== null)
        .map(([provider]) => provider),
    });
  } catch (error) {
    console.error('Failed to fetch AI models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI models' },
      { status: 500 }
    );
  }
}

// POST /api/ai/models/test - Test AI model with a sample query
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
    const { modelKey, message } = body;

    if (!modelKey || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: modelKey, message' },
        { status: 400 }
      );
    }

    // Fetch all AI provider API keys using Prisma
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: session.user.id,
        category: 'ai',
        isActive: true,
      },
    });

    const providerKeys: Record<AIProvider, string | null> = {
      openai: null,
      anthropic: null,
      google: null,
      groq: null,
    };

    for (const key of apiKeys) {
      if (key.provider === 'openai' || key.provider === 'anthropic' || key.provider === 'google' || key.provider === 'groq') {
        providerKeys[key.provider as AIProvider] = decryptApiKey(key.encryptedKey);
      }
    }

    // Create client and test
    const client = new UnifiedAIClient(providerKeys);

    const response = await client.chat(modelKey, [
      {
        role: 'user',
        content: message,
      },
    ], {
      temperature: 0.7,
      maxTokens: 500,
    });

    // Update usage count for the provider using Prisma
    const model = AI_MODELS[modelKey];
    if (model) {
      await prisma.apiKey.updateMany({
        where: {
          userId: session.user.id,
          provider: model.provider,
          isActive: true,
        },
        data: {
          lastUsed: new Date(),
          usageCount: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('Failed to test AI model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test AI model' },
      { status: 500 }
    );
  }
}
