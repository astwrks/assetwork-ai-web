/**
 * WebSocket Initialization API Endpoint
 * Manages WebSocket server initialization and connection authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createServer } from 'http';
import { WebSocketService } from '@/lib/services/websocket.service';
import { ErrorHandler, AppErrors, LoggingService } from '@/lib/services/error-logging.service';
import { AuthService } from '@/lib/services/auth.service';
import { RateLimitService } from '@/lib/services/redis.service';

let wsServer: any = null;

/**
 * GET /api/v2/ws
 * Get WebSocket connection details and authentication token
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // Rate limiting for WS token generation (more lenient in development)
    const rateLimitKey = `ws-token:${session.user.email}`;
    const limit = process.env.NODE_ENV === 'development' ? 100 : 10; // 100 in dev, 10 in prod
    const ttl = process.env.NODE_ENV === 'development' ? 60 : 3600; // 1 minute in dev, 1 hour in prod

    const { limited, remaining } = await RateLimitService.isLimited(
      rateLimitKey,
      limit,
      ttl
    );

    if (limited) {
      // In development, just log and continue
      if (process.env.NODE_ENV === 'development') {
        LoggingService.debug('WebSocket rate limit hit in development, allowing anyway');
      } else {
        throw AppErrors.RATE_LIMIT_EXCEEDED;
      }
    }

    // Generate WebSocket authentication token
    const wsToken = await AuthService.generateWebSocketToken({
      userId: session.user.id || session.user.email!,
      email: session.user.email!,
      permissions: ['market:read', 'reports:write', 'notifications:receive'],
    });

    // Get WebSocket server URL based on environment
    const wsUrl = process.env.WEBSOCKET_URL || 'ws://localhost:3003';

    LoggingService.info('WebSocket token generated', {
      userId: session.user.email,
      permissions: ['market:read', 'reports:write', 'notifications:receive'],
    });

    return NextResponse.json({
      success: true,
      data: {
        url: wsUrl,
        token: wsToken,
        namespaces: {
          market: '/market',
          reports: '/reports',
          notifications: '/notifications',
          analytics: '/analytics',
        },
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
      },
      meta: {
        rateLimitRemaining: remaining,
        expiresIn: 3600, // 1 hour
      },
    });
  } catch (error) {
    LoggingService.error('WebSocket token generation failed', error as Error);

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
        error: 'Failed to generate WebSocket token',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/ws
 * Initialize WebSocket server (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // Check admin permissions
    const isAdmin = await AuthService.checkAdminPermission(session.user.email);
    if (!isAdmin) {
      throw AppErrors.FORBIDDEN;
    }

    // Initialize WebSocket server if not already running
    if (!wsServer) {
      const httpServer = createServer();
      wsServer = WebSocketService.initialize(httpServer);

      const port = process.env.WEBSOCKET_PORT || 3003;
      httpServer.listen(port);

      LoggingService.info('WebSocket server initialized', {
        port,
        initiatedBy: session.user.email,
      });

      return NextResponse.json({
        success: true,
        message: 'WebSocket server initialized',
        port,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'WebSocket server already running',
    });
  } catch (error) {
    LoggingService.error('WebSocket initialization failed', error as Error);

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
        error: 'Failed to initialize WebSocket server',
      },
      { status: 500 }
    );
  }
}