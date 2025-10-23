/**
 * Type definitions for Financial Playground Classic
 * Based on Prisma schema models
 */

import { LucideIcon } from 'lucide-react';

// Re-export Prisma types that are used directly
export type {
  entities as Entity,
  messages as Message,
  reports as Report,
  threads as Thread,
  system_prompts as SystemPrompt,
} from '@prisma/client';

// Extended types with icon support
export interface SystemPromptWithIcon {
  id: string;
  name: string;
  description: string | null;
  content: string;
  icon: LucideIcon;
  isDefault: boolean;
  isActive: boolean;
  category: string | null;
  metadata: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// WebSocket event types
export interface WSMessageCreatedEvent {
  message: {
    id: string;
    threadId: string;
    userId: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
    reportId: string | null;
    metadata: any;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
}

export interface WSThreadUpdatedEvent {
  threadId: string;
  changes: {
    title?: string;
    description?: string;
    status?: 'ACTIVE' | 'ARCHIVED';
    updatedAt?: Date | string;
  };
}

export interface WSEntityExtractedEvent {
  reportId: string;
  entities: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
    ticker: string | null;
    sentiment?: number;
  }>;
}
