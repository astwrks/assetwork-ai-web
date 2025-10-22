/**
 * Token Refresh API Endpoint
 * Refreshes access token using refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import { RateLimitService } from '@/lib/services/redis.service';

export async function POST(request: NextRequest) {
  const operationId = `auth-refresh-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Get refresh token from cookie or body
    const refreshToken = request.cookies.get('refresh-token')?.value ||
                        (await request.json().catch(() => ({}))).refreshToken;

    if (!refreshToken) {
      throw new AppErrors.UNAUTHORIZED('Refresh token not provided');
    }

    // Rate limiting by token
    const rateLimitKey = `refresh:${refreshToken.substring(0, 20)}`;
    const { limited } = await RateLimitService.isLimited(
      rateLimitKey,
      10, // 10 refresh attempts per minute
      60
    );

    if (limited) {
      LoggingService.warn('Token refresh rate limit exceeded');
      throw AppErrors.RATE_LIMIT_EXCEEDED;
    }

    // Refresh the access token
    const tokens = await AuthService.refreshAccessToken(refreshToken);

    // Set new refresh token as HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      message: 'Token refreshed successfully',
    });

    response.cookies.set({
      name: 'refresh-token',
      value: tokens.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    const duration = PerformanceMonitor.end(operationId);

    LoggingService.info('Token refreshed successfully', {
      duration,
    });

    return response;
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Token refresh failed', error as Error);

    if (error instanceof Error && error.message.includes('expired')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh token expired',
          code: 'TOKEN_EXPIRED',
        },
        { status: 401 }
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
        error: 'Token refresh failed',
      },
      { status: 500 }
    );
  }
}