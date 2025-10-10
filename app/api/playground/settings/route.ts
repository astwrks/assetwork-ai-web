import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlaygroundSettings from '@/lib/db/models/PlaygroundSettings';

// GET /api/playground/settings - Get settings for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Try to find user-specific settings first
    let settings = await PlaygroundSettings.findOne({
      userId: session.user.email,
      isGlobal: false,
    });

    // If no user settings, try to find organization settings
    if (!settings) {
      settings = await PlaygroundSettings.findOne({
        isGlobal: true,
      });
    }

    // If still no settings, create default settings for user
    if (!settings) {
      settings = new PlaygroundSettings({
        userId: session.user.email,
        isGlobal: false,
        lastModifiedBy: session.user.email,
      });
      await settings.save();
    }

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching playground settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/playground/settings - Create new settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();

    // Check if settings already exist
    const existingSettings = await PlaygroundSettings.findOne({
      userId: session.user.email,
      isGlobal: body.isGlobal || false,
    });

    if (existingSettings) {
      return NextResponse.json(
        { error: 'Settings already exist. Use PATCH to update.' },
        { status: 400 }
      );
    }

    const settings = new PlaygroundSettings({
      ...body,
      userId: session.user.email,
      lastModifiedBy: session.user.email,
    });

    await settings.save();

    return NextResponse.json({ settings }, { status: 201 });
  } catch (error) {
    console.error('Error creating playground settings:', error);
    return NextResponse.json(
      { error: 'Failed to create settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/playground/settings - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();

    // Find user's settings
    let settings = await PlaygroundSettings.findOne({
      userId: session.user.email,
      isGlobal: false,
    });

    if (!settings) {
      // Create new settings if they don't exist
      settings = new PlaygroundSettings({
        userId: session.user.email,
        isGlobal: false,
        lastModifiedBy: session.user.email,
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'systemPrompt',
      'systemPrompts',
      'activeSystemPromptId',
      'providers',
      'defaultProvider',
      'defaultModel',
      'defaultTemperature',
      'defaultMaxTokens',
      'defaultTopP',
      'allowCustomPrompts',
      'allowProviderSelection',
      'allowModelSelection',
      'allowParameterOverride',
      'brandColors',
    ];

    Object.keys(body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        (settings as any)[key] = body[key];
      }
    });

    settings.lastModifiedBy = session.user.email;
    settings.systemPromptVersion += 1;

    await settings.save();

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Error updating playground settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
