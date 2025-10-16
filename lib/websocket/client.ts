/**
 * WebSocket Client Utilities
 * React hooks and utilities for WebSocket communication
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

// WebSocket events (matching server)
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

// Connection status
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Main WebSocket hook
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [error, setError] = useState<Error | null>(null);
  const reconnectAttempts = useRef(0);

  const {
    autoConnect = true,
    reconnection = true,
    reconnectionDelay = 1000,
    reconnectionAttempts = 5,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!session?.user) {
      setError(new Error('Authentication required'));
      setStatus(ConnectionStatus.ERROR);
      return;
    }

    setStatus(ConnectionStatus.CONNECTING);

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3002', {
      auth: {
        token: (session as any).accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionDelay,
      reconnectionAttempts,
    });

    // Connection handlers
    newSocket.on(WSEvents.CONNECT, () => {
      setStatus(ConnectionStatus.CONNECTED);
      setError(null);
      reconnectAttempts.current = 0;
      onConnect?.();
      console.log('WebSocket connected');
    });

    newSocket.on(WSEvents.DISCONNECT, (reason) => {
      setStatus(ConnectionStatus.DISCONNECTED);
      onDisconnect?.();
      console.log('WebSocket disconnected:', reason);

      // Handle reconnection
      if (reconnection && reconnectAttempts.current < reconnectionAttempts) {
        reconnectAttempts.current++;
        setTimeout(() => {
          setStatus(ConnectionStatus.CONNECTING);
          newSocket.connect();
        }, reconnectionDelay * Math.pow(2, reconnectAttempts.current));
      }
    });

    newSocket.on(WSEvents.ERROR, (err) => {
      setError(err);
      setStatus(ConnectionStatus.ERROR);
      onError?.(err);
      console.error('WebSocket error:', err);
    });

    setSocket(newSocket);

    return newSocket;
  }, [session, reconnection, reconnectionDelay, reconnectionAttempts, onConnect, onDisconnect, onError]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [socket]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && session?.user && !socket) {
      connect();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [autoConnect, session, connect]);

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    if (socket && status === ConnectionStatus.CONNECTED) {
      socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: WebSocket not connected`);
    }
  }, [socket, status]);

  // Subscribe to event
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
    return () => {};
  }, [socket]);

  // Unsubscribe from event
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socket) {
      if (handler) {
        socket.off(event, handler);
      } else {
        socket.off(event);
      }
    }
  }, [socket]);

  return {
    socket,
    status,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
    isConnected: status === ConnectionStatus.CONNECTED,
    isConnecting: status === ConnectionStatus.CONNECTING,
  };
}

/**
 * Hook for thread real-time updates
 */
export function useThreadWebSocket(threadId: string | null) {
  const { emit, on, off } = useWebSocket();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!threadId) return;

    // Join thread
    emit(WSEvents.THREAD_JOIN, threadId);

    // Subscribe to thread events
    const unsubscribeMessage = on(WSEvents.THREAD_MESSAGE, (message) => {
      setMessages(prev => [...prev, message]);
    });

    const unsubscribeTyping = on(WSEvents.THREAD_TYPING, ({ userId, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Cleanup
    return () => {
      emit(WSEvents.THREAD_LEAVE, threadId);
      unsubscribeMessage();
      unsubscribeTyping();
    };
  }, [threadId, emit, on, off]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (threadId) {
      emit(WSEvents.THREAD_TYPING, { threadId, isTyping });
    }
  }, [threadId, emit]);

  return {
    messages,
    typingUsers,
    sendTyping,
  };
}

/**
 * Hook for report generation streaming
 */
export function useReportStream(reportId: string | null) {
  const { on, off } = useWebSocket();
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    if (!reportId) return;

    const unsubscribeStart = on(WSEvents.REPORT_START, (data) => {
      if (data.reportId === reportId) {
        setIsGenerating(true);
        setError(null);
        setContent('');
      }
    });

    const unsubscribeChunk = on(WSEvents.REPORT_CHUNK, (data) => {
      if (data.reportId === reportId) {
        setContent(prev => prev + data.content);
      }
    });

    const unsubscribeComplete = on(WSEvents.REPORT_COMPLETE, (data) => {
      if (data.reportId === reportId) {
        setIsGenerating(false);
        setMetadata(data);
      }
    });

    const unsubscribeError = on(WSEvents.REPORT_ERROR, (data) => {
      if (data.reportId === reportId) {
        setIsGenerating(false);
        setError(data.error);
      }
    });

    return () => {
      unsubscribeStart();
      unsubscribeChunk();
      unsubscribeComplete();
      unsubscribeError();
    };
  }, [reportId, on, off]);

  return {
    content,
    isGenerating,
    error,
    metadata,
  };
}

/**
 * Hook for market data updates
 */
export function useMarketData(symbols: string[]) {
  const { emit, on, off, isConnected } = useWebSocket();
  const [quotes, setQuotes] = useState<Map<string, any>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isConnected || symbols.length === 0) return;

    // Subscribe to symbols
    emit(WSEvents.MARKET_SUBSCRIBE, symbols);

    // Handle market updates
    const unsubscribe = on(WSEvents.MARKET_UPDATE, (data) => {
      setQuotes(prev => {
        const newQuotes = new Map(prev);
        newQuotes.set(data.symbol, data);
        return newQuotes;
      });
      setLastUpdate(new Date());
    });

    // Cleanup
    return () => {
      emit(WSEvents.MARKET_UNSUBSCRIBE, symbols);
      unsubscribe();
    };
  }, [symbols, isConnected, emit, on, off]);

  return {
    quotes: Array.from(quotes.values()),
    lastUpdate,
  };
}

/**
 * Hook for entity updates
 */
export function useEntityUpdates(reportId: string | null) {
  const { on, off } = useWebSocket();
  const [entities, setEntities] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (!reportId) return;

    const unsubscribeExtracted = on(WSEvents.ENTITY_EXTRACTED, (data) => {
      if (data.reportId === reportId) {
        setEntities(prev => [...prev, ...data.entities]);
        setIsExtracting(false);
      }
    });

    const unsubscribeUpdated = on(WSEvents.ENTITY_UPDATED, (data) => {
      if (data.reportId === reportId) {
        setEntities(prev =>
          prev.map(e => e.id === data.entity.id ? data.entity : e)
        );
      }
    });

    return () => {
      unsubscribeExtracted();
      unsubscribeUpdated();
    };
  }, [reportId, on, off]);

  return {
    entities,
    isExtracting,
  };
}

/**
 * Singleton WebSocket manager for non-React contexts
 */
class WebSocketManager {
  private socket: Socket | null = null;
  private static instance: WebSocketManager;

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3002', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const wsManager = WebSocketManager.getInstance();