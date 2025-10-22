/**
 * Logout API Endpoint
 * Handles user logout and token revocation
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { LoggingService } from '@/lib/services/error-logging.service';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (refreshToken) {
      // Revoke the refresh token
      await AuthService.revokeRefreshToken(refreshToken);
    }

    // Get authorization header for additional cleanup
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      try {
        const payload = await AuthService.verifyAccessToken(accessToken);
        // Revoke all user tokens for complete logout
        await AuthService.revokeAllUserTokens(payload.userId);
      } catch (error) {
        // Token might be expired, continue with logout
      }
    }

    // Clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

    response.cookies.set({
      name: 'refresh-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    LoggingService.info('User logout successful');

    return response;
  } catch (error) {
    LoggingService.error('Logout failed', error as Error);

    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
      },
      { status: 500 }
    );
  }
}