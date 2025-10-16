import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

// GET /api/playground/settings - Get settings for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to find user-specific settings first
    let settings = await prisma.playground_settings.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    // If still no settings, create default settings for user
    if (!settings) {
      settings = await prisma.playground_settings.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          settings: {},
          updatedAt: new Date(),
        },
      });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if settings already exist
    const existingSettings = await prisma.playground_settings.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (existingSettings) {
      return NextResponse.json(
        { error: 'Settings already exist. Use PATCH to update.' },
        { status: 400 }
      );
    }

    const settings = await prisma.playground_settings.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        defaultModel: body.defaultModel || null,
        defaultProvider: body.defaultProvider || null,
        autoSave: body.autoSave !== undefined ? body.autoSave : true,
        settings: body.settings || {},
        updatedAt: new Date(),
      },
    });

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Find user's settings
    let settings = await prisma.playground_settings.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!settings) {
      // Create new settings if they don't exist (upsert behavior)
      settings = await prisma.playground_settings.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          defaultModel: body.defaultModel || null,
          defaultProvider: body.defaultProvider || null,
          autoSave: body.autoSave !== undefined ? body.autoSave : true,
          settings: body.settings || {},
          updatedAt: new Date(),
        },
      });
    } else {
      // Update existing settings
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (body.defaultModel !== undefined) {
        updateData.defaultModel = body.defaultModel;
      }

      if (body.defaultProvider !== undefined) {
        updateData.defaultProvider = body.defaultProvider;
      }

      if (body.autoSave !== undefined) {
        updateData.autoSave = body.autoSave;
      }

      if (body.settings !== undefined) {
        // Merge settings if it's an object
        updateData.settings = {
          ...(settings.settings as any),
          ...body.settings,
        };
      }

      settings = await prisma.playground_settings.update({
        where: { id: settings.id },
        data: updateData,
      });
    }

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Error updating playground settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
