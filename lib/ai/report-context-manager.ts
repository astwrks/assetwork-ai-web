// Report Context Manager - Efficient context preservation for incremental updates
// Minimizes token usage while maintaining report state

export interface ReportContext {
  id: string;
  threadId: string;
  baseQuery: string;
  currentState: ReportState;
  enhancements: Enhancement[];
  dataCache: DataCache;
  metadata: ContextMetadata;
}

export interface ReportState {
  assets: string[];
  metrics: string[];
  timeframe: string;
  reportType: 'single' | 'comparison' | 'portfolio' | 'sector' | 'market';
  sections: ReportSection[];
  theme: 'light' | 'dark';
  layout: 'standard' | 'dashboard' | 'presentation';
}

export interface ReportSection {
  id: string;
  type: string;
  title: string;
  data: any;
  visible: boolean;
  order: number;
}

export interface Enhancement {
  id: string;
  prompt: string;
  changes: string[];
  timestamp: Date;
  tokensUsed: number;
  sections: string[];
}

export interface DataCache {
  prices: Record<string, number>;
  metrics: Record<string, any>;
  charts: Record<string, any>;
  computed: Record<string, any>;
}

export interface ContextMetadata {
  version: number;
  totalTokens: number;
  lastUpdate: Date;
  htmlSize: number;
  compressed: boolean;
}

export class ReportContextManager {
  private contexts: Map<string, ReportContext> = new Map();
  private maxContextSize = 5000; // Maximum characters for context
  
  createContext(threadId: string, baseQuery: string): ReportContext {
    const context: ReportContext = {
      id: this.generateId(),
      threadId,
      baseQuery,
      currentState: {
        assets: [],
        metrics: ['price', 'change', 'volume', 'marketCap'],
        timeframe: '1D',
        reportType: 'single',
        sections: [],
        theme: 'dark',
        layout: 'standard',
      },
      enhancements: [],
      dataCache: {
        prices: {},
        metrics: {},
        charts: {},
        computed: {},
      },
      metadata: {
        version: 1,
        totalTokens: 0,
        lastUpdate: new Date(),
        htmlSize: 0,
        compressed: false,
      },
    };
    
    this.contexts.set(threadId, context);
    return context;
  }
  
  getContext(threadId: string): ReportContext | undefined {
    return this.contexts.get(threadId);
  }
  
  updateContext(threadId: string, enhancement: Enhancement, newData: Partial<ReportState>): ReportContext | null {
    const context = this.contexts.get(threadId);
    if (!context) return null;
    
    // Update state
    context.currentState = {
      ...context.currentState,
      ...newData,
    };
    
    // Add enhancement
    context.enhancements.push(enhancement);
    
    // Update metadata
    context.metadata.version++;
    context.metadata.lastUpdate = new Date();
    context.metadata.totalTokens += enhancement.tokensUsed;
    
    // Compress if needed
    if (this.shouldCompress(context)) {
      this.compressContext(context);
    }
    
    this.contexts.set(threadId, context);
    return context;
  }
  
  // Generate minified context for AI prompt
  generateMinifiedContext(context: ReportContext): string {
    const minified = {
      assets: context.currentState.assets,
      type: context.currentState.reportType,
      sections: context.currentState.sections.map(s => s.type),
      lastEnhancement: context.enhancements[context.enhancements.length - 1]?.prompt,
      key_data: this.extractKeyData(context),
    };
    
    return JSON.stringify(minified);
  }
  
  // Build smart prompt with context
  buildSmartPrompt(context: ReportContext, newPrompt: string): string {
    const minifiedContext = this.generateMinifiedContext(context);
    
    return `
Current Report Context:
${minifiedContext}

Previous Enhancements:
${context.enhancements.slice(-3).map(e => `- ${e.prompt}`).join('\n')}

New Request: ${newPrompt}

Instructions:
1. Build upon the existing report
2. Add new sections or enhance existing ones
3. Maintain consistency with previous data
4. Return only the new/updated sections
5. Use this format for response:

[ENHANCEMENT_START]
{
  "action": "add" | "update" | "replace",
  "section": "section_name",
  "content": "HTML content for section"
}
[ENHANCEMENT_END]
`;
  }
  
  // Extract key data points for context
  private extractKeyData(context: ReportContext): any {
    const keyData: any = {};
    
    // Extract prices
    if (context.currentState.assets.length > 0) {
      keyData.prices = {};
      context.currentState.assets.forEach(asset => {
        if (context.dataCache.prices[asset]) {
          keyData.prices[asset] = context.dataCache.prices[asset];
        }
      });
    }
    
    // Extract key metrics
    if (context.currentState.metrics.length > 0) {
      keyData.metrics = {};
      context.currentState.metrics.slice(0, 5).forEach(metric => {
        if (context.dataCache.metrics[metric]) {
          keyData.metrics[metric] = context.dataCache.metrics[metric];
        }
      });
    }
    
    return keyData;
  }
  
  // Check if context needs compression
  private shouldCompress(context: ReportContext): boolean {
    const contextSize = JSON.stringify(context).length;
    return contextSize > this.maxContextSize;
  }
  
  // Compress context to reduce size
  private compressContext(context: ReportContext): void {
    // Keep only last 5 enhancements
    if (context.enhancements.length > 5) {
      context.enhancements = context.enhancements.slice(-5);
    }
    
    // Clear old cache data
    const assetsToKeep = new Set(context.currentState.assets);
    Object.keys(context.dataCache.prices).forEach(asset => {
      if (!assetsToKeep.has(asset)) {
        delete context.dataCache.prices[asset];
      }
    });
    
    // Mark as compressed
    context.metadata.compressed = true;
  }
  
  // Parse enhancement response from AI
  parseEnhancementResponse(response: string): {
    action: 'add' | 'update' | 'replace';
    section: string;
    content: string;
  }[] {
    const enhancements = [];
    const regex = /\[ENHANCEMENT_START\]([\s\S]*?)\[ENHANCEMENT_END\]/g;
    let match;
    
    while ((match = regex.exec(response)) !== null) {
      try {
        const enhancement = JSON.parse(match[1]);
        enhancements.push(enhancement);
      } catch (e) {
        console.error('Failed to parse enhancement:', e);
      }
    }
    
    return enhancements;
  }
  
  // Generate unique ID
  private generateId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Clear old contexts
  clearOldContexts(maxAge: number = 3600000): void {
    const now = Date.now();
    this.contexts.forEach((context, threadId) => {
      if (now - context.metadata.lastUpdate.getTime() > maxAge) {
        this.contexts.delete(threadId);
      }
    });
  }
  
  // Export context for persistence
  exportContext(threadId: string): string | null {
    const context = this.contexts.get(threadId);
    if (!context) return null;
    
    return JSON.stringify(context);
  }
  
  // Import context from storage
  importContext(contextData: string): ReportContext | null {
    try {
      const context = JSON.parse(contextData);
      context.metadata.lastUpdate = new Date(context.metadata.lastUpdate);
      context.enhancements.forEach((e: any) => {
        e.timestamp = new Date(e.timestamp);
      });
      
      this.contexts.set(context.threadId, context);
      return context;
    } catch (e) {
      console.error('Failed to import context:', e);
      return null;
    }
  }
}

// Singleton instance
export const reportContextManager = new ReportContextManager();