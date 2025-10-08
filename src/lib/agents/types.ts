export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  capabilities: string[];
  isEnabled: boolean;
}

export type AgentType = 'data' | 'analysis' | 'visualization' | 'writer' | 'review';

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: {
    timestamp: Date;
    agentId: string;
    model?: string;
    tokens?: number;
  };
}

export interface AgentContext {
  reportId?: string;
  sectionId?: string;
  dataSource?: string;
  userPreferences?: Record<string, any>;
  reportMetadata?: Record<string, any>;
}

export interface AgentCapability {
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  parameters?: Record<string, any>;
}

export interface AgentPerformance {
  agentId: string;
  tasksCompleted: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  lastActivity: Date;
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  order: number;
  input: any;
  output: any;
  dependencies: string[];
  timeout: number;
  retryCount: number;
}

export interface AgentError {
  code: string;
  message: string;
  agentId: string;
  taskId: string;
  timestamp: Date;
  stack?: string;
}

export interface AgentMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  tokensUsed: number;
  cost: number;
  lastUpdated: Date;
}
