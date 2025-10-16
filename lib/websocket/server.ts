/**
 * WebSocket Server Configuration
 * Handles real-time communication for report generation, market data, and thread updates
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db/prisma';
import { LoggingService } from '@/lib/services/error-logging.service';
import { CacheService } from '@/lib/services/redis.service';

// WebSocket events
export enum WSEvents {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  AUTHENTICATE = 'authenticate',

  // Thread events
  THREAD_JOIN = 'thread:join',
  THREAD_LEAVE = 'thread:leave',
  THREAD_MESSAGE = 'thread:message',
  THREAD_TYPING = 'thread:typing',

  // Report events
  REPORT_START = 'report:start',
  REPORT_CHUNK = 'report:chunk',
  REPORT_COMPLETE = 'report:complete',
  REPORT_ERROR = 'report:error',

  // Market data events
  MARKET_SUBSCRIBE = 'market:subscribe',
  MARKET_UNSUBSCRIBE = 'market:unsubscribe',
  MARKET_UPDATE = 'market:update',

  // Entity events
  ENTITY_EXTRACTED = 'entity:extracted',
  ENTITY_UPDATED = 'entity:updated',
}

// Socket authentication middleware
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  threadIds?: Set<string>;
  marketSymbols?: Set<string>;
}

class WebSocketServer {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private marketSubscriptions: Map<string, Set<string>> = new Map(); // symbol -> Set of socketIds

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;

        // Get user from database
        const user = await prisma.users.findUnique({
          where: { id: decoded.userId || decoded.email },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        // Attach user info to socket
        socket.userId = user.id;
        socket.userEmail = user.email;
        socket.threadIds = new Set();
        socket.marketSymbols = new Set();

        // Track connection
        this.trackUserConnection(user.id, socket.id);

        LoggingService.info('WebSocket authenticated', {
          userId: user.id,
          socketId: socket.id,
        });

        next();
      } catch (error) {
        LoggingService.error('WebSocket authentication failed', error as Error);
        next(new Error('Authentication failed'));
      }
    });

    // Set up event handlers
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    LoggingService.info('WebSocket server initialized');
  }

  /**
   * Handle socket connection
   */
  private handleConnection(socket: AuthenticatedSocket) {
    LoggingService.info('WebSocket client connected', {
      socketId: socket.id,
      userId: socket.userId,
    });

    // Join user's personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Thread events
    socket.on(WSEvents.THREAD_JOIN, async (threadId: string) => {
      await this.handleThreadJoin(socket, threadId);
    });

    socket.on(WSEvents.THREAD_LEAVE, (threadId: string) => {
      this.handleThreadLeave(socket, threadId);
    });

    socket.on(WSEvents.THREAD_TYPING, (data: { threadId: string; isTyping: boolean }) => {
      this.handleThreadTyping(socket, data);
    });

    // Market data events
    socket.on(WSEvents.MARKET_SUBSCRIBE, (symbols: string[]) => {
      this.handleMarketSubscribe(socket, symbols);
    });

    socket.on(WSEvents.MARKET_UNSUBSCRIBE, (symbols: string[]) => {
      this.handleMarketUnsubscribe(socket, symbols);
    });

    // Handle disconnection
    socket.on(WSEvents.DISCONNECT, () => {
      this.handleDisconnect(socket);
    });

    // Handle errors
    socket.on(WSEvents.ERROR, (error: Error) => {
      LoggingService.error('WebSocket error', error, {
        socketId: socket.id,
        userId: socket.userId,
      });
    });
  }

  /**
   * Handle thread join
   */
  private async handleThreadJoin(socket: AuthenticatedSocket, threadId: string) {
    try {
      // Verify thread ownership
      const thread = await prisma.threads.findFirst({
        where: {
          id: threadId,
          userId: socket.userId,
        },
      });

      if (!thread) {
        socket.emit(WSEvents.ERROR, { message: 'Thread not found or access denied' });
        return;
      }

      // Join thread room
      socket.join(`thread:${threadId}`);
      socket.threadIds?.add(threadId);

      // Notify other users in thread
      socket.to(`thread:${threadId}`).emit('user:joined', {
        userId: socket.userId,
        threadId,
      });

      LoggingService.info('User joined thread', {
        userId: socket.userId,
        threadId,
        socketId: socket.id,
      });
    } catch (error) {
      LoggingService.error('Thread join failed', error as Error);
      socket.emit(WSEvents.ERROR, { message: 'Failed to join thread' });
    }
  }

  /**
   * Handle thread leave
   */
  private handleThreadLeave(socket: AuthenticatedSocket, threadId: string) {
    socket.leave(`thread:${threadId}`);
    socket.threadIds?.delete(threadId);

    // Notify other users
    socket.to(`thread:${threadId}`).emit('user:left', {
      userId: socket.userId,
      threadId,
    });

    LoggingService.info('User left thread', {
      userId: socket.userId,
      threadId,
      socketId: socket.id,
    });
  }

  /**
   * Handle typing indicator
   */
  private handleThreadTyping(socket: AuthenticatedSocket, data: { threadId: string; isTyping: boolean }) {
    if (!socket.threadIds?.has(data.threadId)) {
      socket.emit(WSEvents.ERROR, { message: 'Not in this thread' });
      return;
    }

    // Broadcast to other users in thread
    socket.to(`thread:${data.threadId}`).emit(WSEvents.THREAD_TYPING, {
      userId: socket.userId,
      isTyping: data.isTyping,
    });
  }

  /**
   * Handle market data subscription
   */
  private handleMarketSubscribe(socket: AuthenticatedSocket, symbols: string[]) {
    symbols.forEach(symbol => {
      const upperSymbol = symbol.toUpperCase();

      // Add to socket's subscriptions
      socket.marketSymbols?.add(upperSymbol);

      // Join market room
      socket.join(`market:${upperSymbol}`);

      // Track subscription
      if (!this.marketSubscriptions.has(upperSymbol)) {
        this.marketSubscriptions.set(upperSymbol, new Set());
      }
      this.marketSubscriptions.get(upperSymbol)?.add(socket.id);
    });

    LoggingService.info('Market subscription added', {
      userId: socket.userId,
      symbols,
      socketId: socket.id,
    });
  }

  /**
   * Handle market data unsubscription
   */
  private handleMarketUnsubscribe(socket: AuthenticatedSocket, symbols: string[]) {
    symbols.forEach(symbol => {
      const upperSymbol = symbol.toUpperCase();

      // Remove from socket's subscriptions
      socket.marketSymbols?.delete(upperSymbol);

      // Leave market room
      socket.leave(`market:${upperSymbol}`);

      // Update tracking
      this.marketSubscriptions.get(upperSymbol)?.delete(socket.id);

      // Clean up empty sets
      if (this.marketSubscriptions.get(upperSymbol)?.size === 0) {
        this.marketSubscriptions.delete(upperSymbol);
      }
    });

    LoggingService.info('Market subscription removed', {
      userId: socket.userId,
      symbols,
      socketId: socket.id,
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(socket: AuthenticatedSocket) {
    // Clean up user tracking
    if (socket.userId) {
      this.untrackUserConnection(socket.userId, socket.id);
    }

    // Clean up market subscriptions
    socket.marketSymbols?.forEach(symbol => {
      this.marketSubscriptions.get(symbol)?.delete(socket.id);
      if (this.marketSubscriptions.get(symbol)?.size === 0) {
        this.marketSubscriptions.delete(symbol);
      }
    });

    LoggingService.info('WebSocket client disconnected', {
      socketId: socket.id,
      userId: socket.userId,
    });
  }

  /**
   * Track user connection
   */
  private trackUserConnection(userId: string, socketId: string) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)?.add(socketId);
  }

  /**
   * Untrack user connection
   */
  private untrackUserConnection(userId: string, socketId: string) {
    this.connectedUsers.get(userId)?.delete(socketId);
    if (this.connectedUsers.get(userId)?.size === 0) {
      this.connectedUsers.delete(userId);
    }
  }

  /**
   * Broadcast to user
   */
  broadcastToUser(userId: string, event: string, data: any) {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Broadcast to thread
   */
  broadcastToThread(threadId: string, event: string, data: any) {
    this.io?.to(`thread:${threadId}`).emit(event, data);
  }

  /**
   * Broadcast market update
   */
  broadcastMarketUpdate(symbol: string, data: any) {
    this.io?.to(`market:${symbol.toUpperCase()}`).emit(WSEvents.MARKET_UPDATE, data);
  }

  /**
   * Stream report generation
   */
  async streamReportGeneration(userId: string, threadId: string, reportId: string) {
    const room = `thread:${threadId}`;

    // Send start event
    this.io?.to(room).emit(WSEvents.REPORT_START, {
      reportId,
      threadId,
      timestamp: new Date(),
    });

    return {
      sendChunk: (content: string) => {
        this.io?.to(room).emit(WSEvents.REPORT_CHUNK, {
          reportId,
          content,
          timestamp: new Date(),
        });
      },
      complete: (data: any) => {
        this.io?.to(room).emit(WSEvents.REPORT_COMPLETE, {
          reportId,
          ...data,
          timestamp: new Date(),
        });
      },
      error: (error: string) => {
        this.io?.to(room).emit(WSEvents.REPORT_ERROR, {
          reportId,
          error,
          timestamp: new Date(),
        });
      },
    };
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalConnections: Array.from(this.connectedUsers.values()).reduce((sum, set) => sum + set.size, 0),
      marketSubscriptions: this.marketSubscriptions.size,
      rooms: this.io?.sockets.adapter.rooms.size || 0,
    };
  }

  /**
   * Get instance
   */
  getInstance(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton instance
export const wsServer = new WebSocketServer();

// Export for use in API routes
export function getWebSocketServer(): SocketIOServer | null {
  return wsServer.getInstance();
}