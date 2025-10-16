/**
 * Authentication Service
 * Handles JWT tokens, refresh tokens, and permission management
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheKeys, CacheTTL } from './redis.service';
import { LoggingService } from './error-logging.service';
import { nanoid } from 'nanoid';
import { z } from 'zod';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const WEBSOCKET_TOKEN_EXPIRY = '1h';

// Validation schemas
const TokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'PREMIUM']).default('USER'),
  permissions: z.array(z.string()).optional(),
});

const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.string(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PermissionSet {
  market: string[];
  reports: string[];
  entities: string[];
  admin: string[];
}

export class AuthService {
  /**
   * Generate access and refresh tokens
   */
  static async generateTokens(payload: TokenPayload): Promise<AuthTokens> {
    try {
      const validatedPayload = TokenPayloadSchema.parse(payload);

      // Generate access token
      const accessToken = jwt.sign(
        {
          ...validatedPayload,
          type: 'access',
          iat: Date.now(),
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        {
          userId: validatedPayload.userId,
          type: 'refresh',
          iat: Date.now(),
        },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      // Store refresh token in database
      await prisma.refreshTokens.create({
        data: {
          id: nanoid(),
          token: refreshToken,
          userId: validatedPayload.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdAt: new Date(),
        },
      });

      // Cache user session
      await CacheService.set(
        `session:${validatedPayload.userId}`,
        {
          ...validatedPayload,
          lastActivity: Date.now(),
        },
        CacheTTL.LONG
      );

      LoggingService.info('Auth tokens generated', {
        userId: validatedPayload.userId,
        email: validatedPayload.email,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      };
    } catch (error) {
      LoggingService.error('Token generation failed', error as Error);
      throw new Error('Failed to generate authentication tokens');
    }
  }

  /**
   * Verify and decode access token
   */
  static async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Check if user session exists in cache
      const cached = await CacheService.get(`session:${decoded.userId}`);
      if (cached) {
        // Update last activity
        await CacheService.set(
          `session:${decoded.userId}`,
          {
            ...cached,
            lastActivity: Date.now(),
          },
          CacheTTL.LONG
        );
      }

      return TokenPayloadSchema.parse({
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        permissions: decoded.permissions,
      });
    } catch (error) {
      LoggingService.error('Token verification failed', error as Error);
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshTokens.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          expiresAt: {
            gt: new Date(),
          },
          revokedAt: null,
        },
      });

      if (!storedToken) {
        throw new Error('Invalid or expired refresh token');
      }

      // Get user details
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get user permissions
      const permissions = await AuthService.getUserPermissions(user.id);

      // Generate new tokens
      const newTokens = await AuthService.generateTokens({
        userId: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role as 'USER' | 'ADMIN' | 'PREMIUM',
        permissions,
      });

      // Revoke old refresh token
      await prisma.refreshTokens.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      LoggingService.info('Access token refreshed', {
        userId: user.id,
        email: user.email,
      });

      return newTokens;
    } catch (error) {
      LoggingService.error('Token refresh failed', error as Error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Generate WebSocket authentication token
   */
  static async generateWebSocketToken(payload: {
    userId: string;
    email: string;
    permissions: string[];
  }): Promise<string> {
    try {
      const token = jwt.sign(
        {
          ...payload,
          type: 'websocket',
          iat: Date.now(),
        },
        JWT_SECRET,
        { expiresIn: WEBSOCKET_TOKEN_EXPIRY }
      );

      // Store WebSocket session
      await CacheService.set(
        `ws:${payload.userId}`,
        {
          connected: false,
          permissions: payload.permissions,
          createdAt: Date.now(),
        },
        3600 // 1 hour
      );

      return token;
    } catch (error) {
      LoggingService.error('WebSocket token generation failed', error as Error);
      throw new Error('Failed to generate WebSocket token');
    }
  }

  /**
   * Verify WebSocket token
   */
  static async verifyWebSocketToken(token: string): Promise<{
    userId: string;
    email: string;
    permissions: string[];
  }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (decoded.type !== 'websocket') {
        throw new Error('Invalid token type');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        permissions: decoded.permissions || [],
      };
    } catch (error) {
      LoggingService.error('WebSocket token verification failed', error as Error);
      throw new Error('Invalid or expired WebSocket token');
    }
  }

  /**
   * Revoke refresh token
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshTokens.updateMany({
        where: {
          token,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      LoggingService.info('Refresh token revoked', { token: token.substring(0, 20) + '...' });
    } catch (error) {
      LoggingService.error('Token revocation failed', error as Error);
      throw new Error('Failed to revoke refresh token');
    }
  }

  /**
   * Revoke all user refresh tokens
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await prisma.refreshTokens.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // Clear user session from cache
      await CacheService.del(`session:${userId}`);
      await CacheService.del(`ws:${userId}`);

      LoggingService.info('All user tokens revoked', { userId });
    } catch (error) {
      LoggingService.error('Token revocation failed', error as Error);
      throw new Error('Failed to revoke user tokens');
    }
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Check cache first
      const cached = await CacheService.get(`permissions:${userId}`);
      if (cached) return cached as string[];

      // Get user with role
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          role: true,
        },
      });

      if (!user) return [];

      // Define permissions based on role
      const permissions: string[] = [];

      switch (user.role) {
        case 'ADMIN':
          permissions.push(
            'admin:*',
            'market:*',
            'reports:*',
            'entities:*',
            'users:*',
            'analytics:*'
          );
          break;
        case 'PREMIUM':
          permissions.push(
            'market:read',
            'market:stream',
            'reports:read',
            'reports:write',
            'reports:generate',
            'entities:read',
            'entities:write',
            'analytics:read'
          );
          break;
        default: // USER
          permissions.push(
            'market:read',
            'reports:read',
            'reports:generate',
            'entities:read'
          );
      }

      // Cache permissions
      await CacheService.set(`permissions:${userId}`, permissions, CacheTTL.MEDIUM);

      return permissions;
    } catch (error) {
      LoggingService.error('Failed to get user permissions', error as Error);
      return [];
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const permissions = await AuthService.getUserPermissions(userId);

      // Check exact match
      if (permissions.includes(permission)) return true;

      // Check wildcard permissions
      const [resource, action] = permission.split(':');
      if (permissions.includes(`${resource}:*`)) return true;
      if (permissions.includes('*:*') || permissions.includes('admin:*')) return true;

      return false;
    } catch (error) {
      LoggingService.error('Permission check failed', error as Error);
      return false;
    }
  }

  /**
   * Check if user is admin
   */
  static async checkAdminPermission(email: string): Promise<boolean> {
    try {
      const user = await prisma.users.findUnique({
        where: { email },
        select: { role: true },
      });

      return user?.role === 'ADMIN';
    } catch (error) {
      LoggingService.error('Admin check failed', error as Error);
      return false;
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await prisma.refreshTokens.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        LoggingService.info('Expired tokens cleaned up', { count: result.count });
      }
    } catch (error) {
      LoggingService.error('Token cleanup failed', error as Error);
    }
  }
}