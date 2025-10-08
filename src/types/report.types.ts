export interface Report {
  id: string;
  title: string;
  description?: string;
  sections: ReportSection[];
  metadata: ReportMetadata;
  shareLink?: string;
  dataSources: DataSource[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
}

export interface ReportSection {
  id: string;
  type: 'text' | 'chart' | 'table' | 'custom';
  title: string;
  content: string; // HTML content
  aiPrompt: string; // Original prompt that generated this section
  editable: boolean;
  order: number;
  metadata?: {
    chartType?: string;
    dataSource?: string;
    lastModified?: Date;
  };
}

export interface ReportMetadata {
  author: string;
  version: string;
  tags: string[];
  template?: string;
  exportSettings?: {
    format: 'html' | 'pdf' | 'json';
    includeCharts: boolean;
    includeData: boolean;
  };
}

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'websocket';
  connectionString?: string;
  credentials?: Record<string, any>;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
}

export interface AIAgent {
  id: string;
  name: string;
  type: 'data' | 'analysis' | 'visualization' | 'writer' | 'review';
  status: 'idle' | 'working' | 'error';
  lastActivity?: Date;
  capabilities: string[];
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    agentType?: string;
    reportSection?: string;
    dataSource?: string;
  };
}
