/**
 * WebSocket Service for Real-Time Communication
 * Handles market data, collaborative editing, and notifications
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { z } from 'zod';
import { PubSubService } from './redis.service';

// WebSocket event schemas
const MarketEventSchema = z.object({
  type: z.enum(['QUOTE', 'TRADE', 'NEWS']),
  symbol: z.string(),
  data: z.any(),
  timestamp: z.number(),
});

const ReportEventSchema = z.object({
  type: z.enum(['EDIT', 'CREATE', 'DELETE', 'COMMENT']),
  reportId: z.string(),
  userId: z.string(),
  data: z.any(),
  timestamp: z.number(),
});

const NotificationEventSchema = z.object({
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
  title: z.string(),
  message: z.string(),
  userId: z.string(),
  timestamp: z.number(),
});

export type MarketEvent = z.infer<typeof MarketEventSchema>;
export type ReportEvent = z.infer<typeof ReportEventSchema>;
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;

/**
 * WebSocket server configuration
 */
export class WebSocketService {
  private static io: SocketIOServer;
  private static connectedClients = new Map<string, Socket>();
  private static userSockets = new Map<string, Set<string>>();

  /**
   * Initialize WebSocket server
   */
  static initialize(server: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3002',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Setup namespaces
    this.setupMarketNamespace();
    this.setupReportsNamespace();
    this.setupNotificationsNamespace();
    this.setupAnalyticsNamespace();

    // Global connection handler
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.handleDisconnect(socket);
      });

      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });

    return this.io;
  }

  /**
   * Market data namespace
   */
  private static setupMarketNamespace() {
    const marketNamespace = this.io.of('/market');

    marketNamespace.on('connection', (socket) => {
      console.log(`Market client connected: ${socket.id}`);

      // Subscribe to symbols
      socket.on('subscribe', async (symbols: string[]) => {
        if (!Array.isArray(symbols)) return;

        // Join rooms for each symbol
        for (const symbol of symbols) {
          await socket.join(`market:${symbol}`);
        }

        socket.emit('subscribed', { symbols });
      });

      // Unsubscribe from symbols
      socket.on('unsubscribe', async (symbols: string[]) => {
        if (!Array.isArray(symbols)) return;

        for (const symbol of symbols) {
          await socket.leave(`market:${symbol}`);
        }

        socket.emit('unsubscribed', { symbols });
      });

      // Request quote
      socket.on('request_quote', async (symbol: string) => {
        // Emit to market data service
        PubSubService.publish('market:request', { symbol, socketId: socket.id });
      });
    });

    // Subscribe to Redis for market updates
    PubSubService.subscribe('market:update', (data: MarketEvent) => {
      marketNamespace.to(`market:${data.symbol}`).emit('market_update', data);
    });
  }

  /**
   * Reports namespace for collaborative editing
   */
  private static setupReportsNamespace() {
    const reportsNamespace = this.io.of('/reports');

    reportsNamespace.on('connection', (socket) => {
      console.log(`Reports client connected: ${socket.id}`);

      // Join report room
      socket.on('join_report', async (reportId: string) => {
        await socket.join(`report:${reportId}`);

        // Notify others in the room
        socket.to(`report:${reportId}`).emit('user_joined', {
          socketId: socket.id,
          timestamp: Date.now(),
        });
      });

      // Leave report room
      socket.on('leave_report', async (reportId: string) => {
        await socket.leave(`report:${reportId}`);

        socket.to(`report:${reportId}`).emit('user_left', {
          socketId: socket.id,
          timestamp: Date.now(),
        });
      });

      // Handle report edits
      socket.on('edit_report', (event: ReportEvent) => {
        try {
          const validatedEvent = ReportEventSchema.parse(event);

          // Broadcast to others in the room
          socket.to(`report:${validatedEvent.reportId}`).emit('report_edited', validatedEvent);

          // Publish to Redis for persistence
          PubSubService.publish('report:edit', validatedEvent);
        } catch (error) {
          socket.emit('error', { message: 'Invalid event data' });
        }
      });

      // Handle cursor position for collaborative editing
      socket.on('cursor_position', ({ reportId, position, userId }) => {
        socket.to(`report:${reportId}`).emit('cursor_update', {
          socketId: socket.id,
          userId,
          position,
          timestamp: Date.now(),
        });
      });

      // Handle selection for collaborative editing
      socket.on('selection_change', ({ reportId, selection, userId }) => {
        socket.to(`report:${reportId}`).emit('selection_update', {
          socketId: socket.id,
          userId,
          selection,
          timestamp: Date.now(),
        });
      });
    });

    // Subscribe to Redis for report updates
    PubSubService.subscribe('report:update', (data: ReportEvent) => {
      reportsNamespace.to(`report:${data.reportId}`).emit('report_update', data);
    });
  }

  /**
   * Notifications namespace
   */
  private static setupNotificationsNamespace() {
    const notificationsNamespace = this.io.of('/notifications');

    notificationsNamespace.on('connection', (socket) => {
      console.log(`Notifications client connected: ${socket.id}`);

      // Authenticate and join user room
      socket.on('authenticate', async (userId: string) => {
        if (!userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        // Store user-socket mapping
        this.addUserSocket(userId, socket.id);

        // Join user-specific room
        await socket.join(`user:${userId}`);

        socket.emit('authenticated', { userId });
      });

      // Mark notification as read
      socket.on('mark_read', async (notificationId: string) => {
        PubSubService.publish('notification:read', {
          notificationId,
          socketId: socket.id,
        });
      });
    });

    // Subscribe to Redis for notifications
    PubSubService.subscribe('notification:send', (data: NotificationEvent) => {
      notificationsNamespace.to(`user:${data.userId}`).emit('notification', data);
    });
  }

  /**
   * Analytics namespace for dashboard updates
   */
  private static setupAnalyticsNamespace() {
    const analyticsNamespace = this.io.of('/analytics');

    analyticsNamespace.on('connection', (socket) => {
      console.log(`Analytics client connected: ${socket.id}`);

      // Subscribe to dashboard updates
      socket.on('subscribe_dashboard', async (userId: string) => {
        await socket.join(`dashboard:${userId}`);
        socket.emit('subscribed', { dashboard: userId });
      });

      // Request specific metric
      socket.on('request_metric', ({ metric, timeRange }) => {
        PubSubService.publish('analytics:request', {
          metric,
          timeRange,
          socketId: socket.id,
        });
      });
    });

    // Subscribe to Redis for analytics updates
    PubSubService.subscribe('analytics:update', (data) => {
      if (data.userId) {
        analyticsNamespace.to(`dashboard:${data.userId}`).emit('analytics_update', data);
      } else {
        analyticsNamespace.emit('analytics_update', data);
      }
    });
  }

  /**
   * Handle client disconnect
   */
  private static handleDisconnect(socket: Socket) {
    // Remove from connected clients
    this.connectedClients.delete(socket.id);

    // Remove from user sockets
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  /**
   * Add user-socket mapping
   */
  private static addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  /**
   * Send notification to user
   */
  static async sendNotification(userId: string, notification: Omit<NotificationEvent, 'userId' | 'timestamp'>) {
    const event: NotificationEvent = {
      ...notification,
      userId,
      timestamp: Date.now(),
    };

    await PubSubService.publish('notification:send', event);
  }

  /**
   * Broadcast market update
   */
  static async broadcastMarketUpdate(symbol: string, data: any) {
    const event: MarketEvent = {
      type: 'QUOTE',
      symbol,
      data,
      timestamp: Date.now(),
    };

    await PubSubService.publish('market:update', event);
  }

  /**
   * Broadcast report update
   */
  static async broadcastReportUpdate(reportId: string, userId: string, type: ReportEvent['type'], data: any) {
    const event: ReportEvent = {
      type,
      reportId,
      userId,
      data,
      timestamp: Date.now(),
    };

    await PubSubService.publish('report:update', event);
  }

  /**
   * Get connected users for a report
   */
  static async getReportUsers(reportId: string): Promise<string[]> {
    const namespace = this.io.of('/reports');
    const room = namespace.adapter.rooms.get(`report:${reportId}`);
    return room ? Array.from(room) : [];
  }

  /**
   * Get user's active sockets
   */
  static getUserSockets(userId: string): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Disconnect all sockets for a user
   */
  static disconnectUser(userId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        const socket = this.connectedClients.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      });
    }
  }

  /**
   * Get server statistics
   */
  static getStats() {
    return {
      totalConnections: this.connectedClients.size,
      uniqueUsers: this.userSockets.size,
      namespaces: {
        market: this.io.of('/market').sockets.size,
        reports: this.io.of('/reports').sockets.size,
        notifications: this.io.of('/notifications').sockets.size,
        analytics: this.io.of('/analytics').sockets.size,
      },
    };
  }
}

/**
 * Client-side WebSocket hooks (for React components)
 */
export const createWebSocketClient = (namespace: string) => {
  if (typeof window === 'undefined') return null;

  const io = require('socket.io-client');
  const socket = io(`${process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3002'}/${namespace}`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export default WebSocketService;