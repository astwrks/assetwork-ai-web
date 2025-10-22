/**
 * Login API Endpoint
 * Handles user authentication and token generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/services/auth.service';
import { prisma } from '@/lib/db/prisma';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import { RateLimitService } from '@/lib/services/redis.service';

// Request validation schema
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const operationId = `auth-login-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // Parse and validate request
    const body = await request.json();
    const validated = LoginSchema.parse(body);

    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `login:${ip}`;
    const { limited } = await RateLimitService.isLimited(
      rateLimitKey,
      5, // 5 login attempts per minute
      60
    );

    if (limited) {
      LoggingService.warn('Login rate limit exceeded', {
        ip,
        email: validated.email,
      });
      throw AppErrors.RATE_LIMIT_EXCEEDED;
    }

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: validated.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        emailVerified: true,
        isActive: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      LoggingService.warn('Login attempt for non-existent user', {
        email: validated.email,
        ip,
      });
      throw new AppErrors.UNAUTHORIZED('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      LoggingService.warn('Login attempt for inactive user', {
        email: validated.email,
        userId: user.id,
      });
      throw new AppErrors.FORBIDDEN('Account is disabled');
    }

    // Verify password
    const isValidPassword = await AuthService.verifyPassword(
      validated.password,
      user.password!
    );

    if (!isValidPassword) {
      // Track failed login attempt
      await prisma.users.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lastFailedLogin: new Date(),
        },
      });

      LoggingService.warn('Invalid password attempt', {
        email: validated.email,
        userId: user.id,
        ip,
      });

      throw new AppErrors.UNAUTHORIZED('Invalid email or password');
    }

    // Get user permissions
    const permissions = await AuthService.getUserPermissions(user.id);

    // Generate tokens
    const tokens = await AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role as 'USER' | 'ADMIN' | 'PREMIUM',
      permissions,
    });

    // Update user login info
    await prisma.users.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        lastFailedLogin: null,
      },
    });

    // Set secure HTTP-only cookies
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      message: 'Login successful',
    });

    // Set refresh token as HTTP-only cookie
    const refreshTokenMaxAge = validated.rememberMe
      ? 7 * 24 * 60 * 60 // 7 days
      : 24 * 60 * 60; // 1 day

    response.cookies.set({
      name: 'refresh-token',
      value: tokens.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/',
    });

    const duration = PerformanceMonitor.end(operationId, {
      userId: user.id,
      email: user.email,
    });

    LoggingService.info('User login successful', {
      userId: user.id,
      email: user.email,
      role: user.role,
      rememberMe: validated.rememberMe,
      duration,
    });

    return response;
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Login failed', error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid login credentials',
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
        error: 'Login failed',
      },
      { status: 500 }
    );
  }
}