'use client';

import { AIAgent, Report, ReportSection } from '@/types/report.types';

export interface AgentTask {
  id: string;
  agentId: string;
  type: 'data' | 'analysis' | 'visualization' | 'writer' | 'review';
  prompt: string;
  context: any;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime: number;
    tokensUsed?: number;
    model?: string;
  };
}

class AgentOrchestrator {
  private agents: Map<string, AIAgent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private listeners: Map<string, (task: AgentTask) => void> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    const agentConfigs: Omit<AIAgent, 'status' | 'lastActivity'>[] = [
      {
        id: 'data-agent',
        name: 'Data Agent',
        type: 'data',
        capabilities: ['Data fetching', 'Data validation', 'Data transformation', 'Data cleaning'],
      },
      {
        id: 'analysis-agent',
        name: 'Analysis Agent',
        type: 'analysis',
        capabilities: ['Financial analysis', 'Risk assessment', 'Trend analysis', 'Statistical modeling'],
      },
      {
        id: 'visualization-agent',
        name: 'Visualization Agent',
        type: 'visualization',
        capabilities: ['Chart generation', 'Interactive visualizations', 'Dashboard creation', 'Data mapping'],
      },
      {
        id: 'writer-agent',
        name: 'Writer Agent',
        type: 'writer',
        capabilities: ['Report writing', 'Content generation', 'Narrative creation', 'Summary generation'],
      },
      {
        id: 'review-agent',
        name: 'Review Agent',
        type: 'review',
        capabilities: ['Quality assurance', 'Compliance checking', 'Accuracy validation', 'Fact checking'],
      },
    ];

    agentConfigs.forEach(config => {
      this.agents.set(config.id, {
        ...config,
        status: 'idle',
        lastActivity: new Date(),
      });
    });
  }

  public getAgents(): AIAgent[] {
    return Array.from(this.agents.values());
  }

  public getAgent(id: string): AIAgent | undefined {
    return this.agents.get(id);
  }

  public async executeTask(
    agentId: string,
    prompt: string,
    context: any = {}
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const task: AgentTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      type: agent.type,
      prompt,
      context,
      status: 'pending',
      createdAt: new Date(),
    };

    this.tasks.set(task.id, task);
    this.updateAgentStatus(agentId, 'working');

    try {
      // Simulate AI processing
      const result = await this.processTask(task);
      
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
      
      this.updateAgentStatus(agentId, 'idle');
      this.notifyListeners(task);
      
      return {
        success: true,
        data: result,
        metadata: {
          processingTime: Date.now() - task.createdAt.getTime(),
          tokensUsed: Math.floor(Math.random() * 1000) + 100,
          model: 'gpt-4',
        },
      };
    } catch (error) {
      task.status = 'error';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
      
      this.updateAgentStatus(agentId, 'idle');
      this.notifyListeners(task);
      
      return {
        success: false,
        error: task.error,
        metadata: {
          processingTime: Date.now() - task.createdAt.getTime(),
        },
      };
    }
  }

  private async processTask(task: AgentTask): Promise<any> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    switch (task.type) {
      case 'data':
        return this.processDataTask(task);
      case 'analysis':
        return this.processAnalysisTask(task);
      case 'visualization':
        return this.processVisualizationTask(task);
      case 'writer':
        return this.processWriterTask(task);
      case 'review':
        return this.processReviewTask(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async processDataTask(task: AgentTask): Promise<any> {
    return {
      type: 'data',
      data: {
        source: 'mock-database',
        records: Math.floor(Math.random() * 1000) + 100,
        fields: ['date', 'value', 'category', 'region'],
        sample: [
          { date: '2024-01-01', value: 1000, category: 'revenue', region: 'US' },
          { date: '2024-01-02', value: 1200, category: 'revenue', region: 'EU' },
        ],
      },
      metadata: {
        query: task.prompt,
        executionTime: '0.5s',
        cacheHit: false,
      },
    };
  }

  private async processAnalysisTask(task: AgentTask): Promise<any> {
    return {
      type: 'analysis',
      insights: [
        'Revenue increased by 15% compared to last quarter',
        'Strong growth in European markets',
        'Seasonal patterns detected in Q4 data',
      ],
      metrics: {
        totalRevenue: 1250000,
        growthRate: 0.15,
        marketShare: 0.23,
        riskScore: 0.3,
      },
      recommendations: [
        'Consider expanding European operations',
        'Monitor seasonal trends for inventory planning',
        'Review risk mitigation strategies',
      ],
    };
  }

  private async processVisualizationTask(task: AgentTask): Promise<any> {
    return {
      type: 'visualization',
      chartConfig: {
        type: 'line',
        title: 'Revenue Trends',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Revenue',
              data: [1000, 1200, 1100, 1300, 1400, 1500],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
          },
        },
      },
    };
  }

  private async processWriterTask(task: AgentTask): Promise<any> {
    return {
      type: 'writer',
      content: `
        <h2>Executive Summary</h2>
        <p>Based on the analysis of the financial data, we have identified several key trends and opportunities for growth. The revenue has shown consistent growth over the past quarter, with particular strength in European markets.</p>
        
        <h3>Key Findings</h3>
        <ul>
          <li>Revenue increased by 15% compared to the previous quarter</li>
          <li>European markets showed the strongest performance</li>
          <li>Seasonal patterns indicate potential for strategic planning</li>
        </ul>
        
        <h3>Recommendations</h3>
        <p>Based on these findings, we recommend focusing on European market expansion and implementing seasonal inventory management strategies.</p>
      `,
      metadata: {
        wordCount: 150,
        readingTime: '1 min',
        sentiment: 'positive',
      },
    };
  }

  private async processReviewTask(task: AgentTask): Promise<any> {
    return {
      type: 'review',
      qualityScore: 0.92,
      issues: [
        {
          type: 'warning',
          message: 'Consider adding more recent data points',
          section: 'data-analysis',
        },
      ],
      suggestions: [
        'Add confidence intervals to statistical analysis',
        'Include comparison with industry benchmarks',
        'Expand on risk assessment methodology',
      ],
      compliance: {
        gdpr: true,
        sox: true,
        ifrs: true,
      },
    };
  }

  private updateAgentStatus(agentId: string, status: AIAgent['status']) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastActivity = new Date();
      this.agents.set(agentId, agent);
    }
  }

  private notifyListeners(task: AgentTask) {
    this.listeners.forEach(listener => {
      try {
        listener(task);
      } catch (error) {
        console.error('Error in task listener:', error);
      }
    });
  }

  public subscribeToTasks(listener: (task: AgentTask) => void): string {
    const id = `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.set(id, listener);
    return id;
  }

  public unsubscribeFromTasks(listenerId: string) {
    this.listeners.delete(listenerId);
  }

  public getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  public getTasksByAgent(agentId: string): AgentTask[] {
    return Array.from(this.tasks.values()).filter(task => task.agentId === agentId);
  }

  public getRecentTasks(limit: number = 10): AgentTask[] {
    return Array.from(this.tasks.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

// Singleton instance
export const agentOrchestrator = new AgentOrchestrator();
export default agentOrchestrator;
