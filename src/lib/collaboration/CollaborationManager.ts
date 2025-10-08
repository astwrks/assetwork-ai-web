import { EventEmitter } from 'events';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  permissions: string[];
}

export interface CollaborationSession {
  id: string;
  reportId: string;
  users: User[];
  activeUsers: string[];
  lastActivity: Date;
  isActive: boolean;
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'cursor_moved' | 'content_changed' | 'selection_changed';
  userId: string;
  timestamp: Date;
  data: any;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

export interface Selection {
  userId: string;
  userName: string;
  start: number;
  end: number;
  color: string;
}

export class CollaborationManager extends EventEmitter {
  private sessions: Map<string, CollaborationSession> = new Map();
  private activeCursors: Map<string, CursorPosition> = new Map();
  private selections: Map<string, Selection> = new Map();
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  constructor(private serverUrl: string) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.serverUrl);

        this.websocket.onopen = () => {
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse collaboration message:', error);
          }
        };

        this.websocket.onclose = (event) => {
          this.emit('disconnected', event);
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.websocket.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'user_joined':
        this.emit('userJoined', message.data);
        break;
      case 'user_left':
        this.emit('userLeft', message.data);
        break;
      case 'cursor_moved':
        this.updateCursor(message.data);
        break;
      case 'content_changed':
        this.emit('contentChanged', message.data);
        break;
      case 'selection_changed':
        this.updateSelection(message.data);
        break;
      case 'typing_started':
        this.emit('typingStarted', message.data);
        break;
      case 'typing_stopped':
        this.emit('typingStopped', message.data);
        break;
    }
  }

  private scheduleReconnect(): void {
    setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnecting', this.reconnectAttempts);
      this.connect().catch(console.error);
    }, this.reconnectInterval);
  }

  joinSession(sessionId: string, user: User): void {
    this.send({
      type: 'join_session',
      sessionId,
      user,
    });
  }

  leaveSession(sessionId: string, userId: string): void {
    this.send({
      type: 'leave_session',
      sessionId,
      userId,
    });
  }

  updateCursor(position: CursorPosition): void {
    this.activeCursors.set(position.userId, position);
    this.send({
      type: 'cursor_moved',
      data: position,
    });
    this.emit('cursorUpdated', position);
  }

  updateSelection(selection: Selection): void {
    this.selections.set(selection.userId, selection);
    this.send({
      type: 'selection_changed',
      data: selection,
    });
    this.emit('selectionUpdated', selection);
  }

  sendContentChange(change: any): void {
    this.send({
      type: 'content_changed',
      data: change,
    });
  }

  startTyping(userId: string, userName: string): void {
    this.send({
      type: 'typing_started',
      data: { userId, userName },
    });
  }

  stopTyping(userId: string): void {
    this.send({
      type: 'typing_stopped',
      data: { userId },
    });
  }

  private send(message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  getActiveCursors(): CursorPosition[] {
    return Array.from(this.activeCursors.values());
  }

  getSelections(): Selection[] {
    return Array.from(this.selections.values());
  }

  removeUser(userId: string): void {
    this.activeCursors.delete(userId);
    this.selections.delete(userId);
    this.emit('userRemoved', userId);
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  get isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }
}
