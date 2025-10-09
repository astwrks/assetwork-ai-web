interface WidgetData {
  id: string;
  htmlContent: string;
  metadata: {
    model: string;
    tokens: {
      input: number;
      output: number;
    };
    duration: number;
    timestamp: string;
  };
  userPrompt: string;
  parentWidgetId?: string; // For enhanced widgets
  version: number;
  publicUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

class WidgetStorageService {
  private widgets: Map<string, WidgetData> = new Map();
  
  generateWidgetId(): string {
    return `widget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  
  generatePublicUrl(widgetId: string): string {
    // In production, this would be your actual domain
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004';
    return `${baseUrl}/widget/${widgetId}`;
  }
  
  saveWidget(
    htmlContent: string,
    metadata: WidgetData['metadata'],
    userPrompt: string,
    parentWidgetId?: string
  ): WidgetData {
    const widgetId = this.generateWidgetId();
    const parentWidget = parentWidgetId ? this.widgets.get(parentWidgetId) : null;
    
    const widget: WidgetData = {
      id: widgetId,
      htmlContent,
      metadata,
      userPrompt,
      parentWidgetId,
      version: parentWidget ? parentWidget.version + 1 : 1,
      publicUrl: this.generatePublicUrl(widgetId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.widgets.set(widgetId, widget);
    
    // Also save to localStorage for persistence
    this.saveToLocalStorage();
    
    return widget;
  }
  
  getWidget(widgetId: string): WidgetData | undefined {
    return this.widgets.get(widgetId);
  }
  
  getWidgetHistory(widgetId: string): WidgetData[] {
    const history: WidgetData[] = [];
    let currentWidget = this.widgets.get(widgetId);
    
    // Traverse up to find the root
    while (currentWidget?.parentWidgetId) {
      currentWidget = this.widgets.get(currentWidget.parentWidgetId);
    }
    
    // Now traverse down collecting all versions
    if (currentWidget) {
      history.push(currentWidget);
      this.collectDescendants(currentWidget.id, history);
    }
    
    return history.sort((a, b) => a.version - b.version);
  }
  
  private collectDescendants(widgetId: string, history: WidgetData[]): void {
    for (const widget of this.widgets.values()) {
      if (widget.parentWidgetId === widgetId) {
        history.push(widget);
        this.collectDescendants(widget.id, history);
      }
    }
  }
  
  updateWidget(widgetId: string, updates: Partial<WidgetData>): WidgetData | undefined {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      const updated = {
        ...widget,
        ...updates,
        updatedAt: new Date(),
      };
      this.widgets.set(widgetId, updated);
      this.saveToLocalStorage();
      return updated;
    }
    return undefined;
  }
  
  deleteWidget(widgetId: string): boolean {
    const result = this.widgets.delete(widgetId);
    if (result) {
      this.saveToLocalStorage();
    }
    return result;
  }
  
  getAllWidgets(): WidgetData[] {
    return Array.from(this.widgets.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return; // Skip on server
    try {
      const widgetsArray = Array.from(this.widgets.entries());
      localStorage.setItem('ai-widgets', JSON.stringify(widgetsArray));
    } catch (error) {
      console.error('Failed to save widgets to localStorage:', error);
    }
  }
  
  loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return; // Skip on server
    try {
      const stored = localStorage.getItem('ai-widgets');
      if (stored) {
        const widgetsArray = JSON.parse(stored);
        this.widgets = new Map(widgetsArray.map(([id, data]: [string, any]) => [
          id,
          {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          },
        ]));
      }
    } catch (error) {
      console.error('Failed to load widgets from localStorage:', error);
    }
  }
}

export const widgetStorageService = new WidgetStorageService();
export type { WidgetData };