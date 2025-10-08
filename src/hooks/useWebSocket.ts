import { useEffect, useRef, useState } from 'react';
import { WebSocketManager, WebSocketConfig, WebSocketMessage, MarketData } from '@/lib/websocket/WebSocketManager';

export interface UseWebSocketOptions extends WebSocketConfig {
  autoConnect?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onMarketData?: (data: MarketData) => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [error, setError] = useState<Event | null>(null);
  
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    const manager = new WebSocketManager(options);
    wsManagerRef.current = manager;

    // Set up event listeners
    manager.on('connected', () => {
      setIsConnected(true);
      setConnectionState('connected');
      setError(null);
      reconnectAttemptsRef.current = 0;
    });

    manager.on('disconnected', () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    });

    manager.on('reconnecting', (attempts) => {
      setConnectionState('reconnecting');
      reconnectAttemptsRef.current = attempts;
    });

    manager.on('message', (message: WebSocketMessage) => {
      setLastMessage(message);
      options.onMessage?.(message);
    });

    manager.on('message:market_data', (data: MarketData) => {
      setMarketData(prev => {
        const newMap = new Map(prev);
        newMap.set(data.symbol, data);
        return newMap;
      });
      options.onMarketData?.(data);
    });

    manager.on('error', (err) => {
      setError(err);
      options.onError?.(err);
    });

    // Auto-connect if enabled
    if (options.autoConnect !== false) {
      manager.connect().catch(console.error);
    }

    return () => {
      manager.disconnect();
    };
  }, [options.url, options.autoConnect]);

  const connect = async () => {
    if (wsManagerRef.current) {
      try {
        await wsManagerRef.current.connect();
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    }
  };

  const disconnect = () => {
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
    }
  };

  const send = (data: any) => {
    if (wsManagerRef.current) {
      wsManagerRef.current.send(data);
    }
  };

  const subscribe = (symbols: string[]) => {
    if (wsManagerRef.current) {
      wsManagerRef.current.subscribe(symbols);
    }
  };

  const unsubscribe = (symbols: string[]) => {
    if (wsManagerRef.current) {
      wsManagerRef.current.unsubscribe(symbols);
    }
  };

  return {
    isConnected,
    connectionState,
    lastMessage,
    marketData,
    error,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
}
