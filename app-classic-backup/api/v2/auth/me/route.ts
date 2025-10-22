/**
 * User Profile API Endpoint
 * Get and update current user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/services/auth.service';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler, AppErrors, LoggingService } from '@/lib/services/error-logging.service';
import { CacheService, CacheKeys, CacheTTL } from '@/lib/services/redis.service';

// Update profile schema
const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      inApp: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

/**
 * GET /api/v2/auth/me
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get access token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppErrors.UNAUTHORIZED;
    }

    const accessToken = authHeader.substring(7);
    const tokenPayload = await AuthService.verifyAccessToken(accessToken);

    // Check cache first
    const cacheKey = `profile:${tokenPayload.userId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        meta: { cached: true },
      });
    }

    // Get user profile
    const user = await prisma.users.findUnique({
      where: { id: tokenPayload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        role: true,
        emailVerified: true,
        twoFactorEnabled: true,
        preferences: true,
        createdAt: true,
        lastLogin: true,
        isActive: true,
        _count: {
          select: {
            reports: true,
            savedReports: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppErrors.NOT_FOUND('User not found');
    }

    // Get user permissions
    const permissions = await AuthService.getUserPermissions(user.id);

    // Get user stats
    const stats = {
      reportsGenerated: user._count.reports,
      reportsSaved: user._count.savedReports,
      unreadNotifications: user._count.notifications,
    };

    const profile = {
      ...user,
      permissions,
      stats,
      subscription: {
        plan: user.role === 'PREMIUM' ? 'premium' : 'free',
        features: user.role === 'PREMIUM' ? [
          'unlimited-reports',
          'advanced-analytics',
          'real-time-market-data',
          'api-access',
          'priority-support',
        ] : [
          'basic-reports',
          'limited-analytics',
          'delayed-market-data',
        ],
      },
    };

    // Cache profile
    await CacheService.set(cacheKey, profile, CacheTTL.SHORT);

    LoggingService.info('User profile fetched', {
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    LoggingService.error('Profile fetch failed', error as Error);

    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: (error as any).statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch profile',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/auth/me
 * Update current user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get access token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppErrors.UNAUTHORIZED;
    }

    const accessToken = authHeader.substring(7);
    const tokenPayload = await AuthService.verifyAccessToken(accessToken);

    // Parse and validate request
    const body = await request.json();
    const validated = UpdateProfileSchema.parse(body);

    // Update user profile
    const updated = await prisma.users.update({
      where: { id: tokenPayload.userId },
      data: {
        name: validated.name,
        bio: validated.bio,
        avatar: validated.avatar,
        preferences: validated.preferences as any,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        role: true,
        preferences: true,
        updatedAt: true,
      },
    });

    // Clear cache
    await CacheService.del(`profile:${tokenPayload.userId}`);

    LoggingService.info('User profile updated', {
      userId: updated.id,
      email: updated.email,
      fields: Object.keys(validated),
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    LoggingService.error('Profile update failed', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid profile data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: (error as any).statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}