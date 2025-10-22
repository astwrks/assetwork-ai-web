import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

// GET /api/user/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id)
      .select('preferences notificationSettings theme')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        theme: user.theme || user.preferences?.theme || 'system',
        language: user.preferences?.language || 'en',
        timezone: user.preferences?.timezone || 'UTC',
        notifications: {
          email: user.preferences?.notifications?.email ?? user.notificationSettings?.email ?? true,
          push: user.preferences?.notifications?.push ?? user.notificationSettings?.push ?? true,
          marketing: user.preferences?.notifications?.marketing ?? false,
          updates: user.notificationSettings?.updates ?? true,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { theme, language, timezone, notifications } = body;

    await connectToDatabase();

    // Build update object
    const updateData: any = {};

    if (theme) {
      updateData.theme = theme;
      updateData['preferences.theme'] = theme;
    }

    if (language) {
      updateData['preferences.language'] = language;
    }

    if (timezone) {
      updateData['preferences.timezone'] = timezone;
    }

    if (notifications) {
      if (notifications.email !== undefined) {
        updateData['preferences.notifications.email'] = notifications.email;
        updateData['notificationSettings.email'] = notifications.email;
      }
      if (notifications.push !== undefined) {
        updateData['preferences.notifications.push'] = notifications.push;
        updateData['notificationSettings.push'] = notifications.push;
      }
      if (notifications.marketing !== undefined) {
        updateData['preferences.notifications.marketing'] = notifications.marketing;
      }
      if (notifications.updates !== undefined) {
        updateData['notificationSettings.updates'] = notifications.updates;
      }
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('preferences notificationSettings theme');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        theme: user.theme,
        language: user.preferences?.language,
        timezone: user.preferences?.timezone,
        notifications: {
          email: user.preferences?.notifications?.email,
          push: user.preferences?.notifications?.push,
          marketing: user.preferences?.notifications?.marketing,
          updates: user.notificationSettings?.updates,
        },
      },
    });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
