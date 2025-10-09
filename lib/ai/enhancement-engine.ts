// Enhancement Engine - Intelligently enhances reports based on context
// Handles incremental updates and smart HTML generation

import { reportContextManager, ReportContext, Enhancement } from './report-context-manager';
import { MARKET_DATA } from '../instant-report-engine';

export interface EnhancementRequest {
  threadId: string;
  prompt: string;
  currentHTML?: string;
}

export interface EnhancementResponse {
  html: string;
  context: ReportContext;
  tokens: number;
  sections: SectionUpdate[];
}

export interface SectionUpdate {
  id: string;
  action: 'add' | 'update' | 'replace' | 'remove';
  content: string;
  order?: number;
}

export class EnhancementEngine {
  // Process enhancement request
  async enhance(request: EnhancementRequest): Promise<EnhancementResponse> {
    // Get or create context
    let context = reportContextManager.getContext(request.threadId);
    
    if (!context) {
      // First request - create new context
      context = reportContextManager.createContext(request.threadId, request.prompt);
      return this.generateInitialReport(context, request.prompt);
    } else {
      // Enhancement request - build on existing
      return this.enhanceReport(context, request.prompt, request.currentHTML);
    }
  }
  
  // Generate initial comprehensive report
  private async generateInitialReport(context: ReportContext, prompt: string): Promise<EnhancementResponse> {
    // Parse the prompt to understand intent
    const intent = this.parseIntent(prompt);
    
    // Extract assets from prompt
    const assets = this.extractAssets(prompt);
    context.currentState.assets = assets;
    context.currentState.reportType = intent.type;
    
    // Generate comprehensive HTML based on intent
    let html = '';
    const sections: SectionUpdate[] = [];
    
    switch (intent.type) {
      case 'single':
        html = this.generateSingleStockReport(assets[0], intent);
        sections.push({
          id: 'main-analysis',
          action: 'add',
          content: html,
          order: 1
        });
        break;
        
      case 'comparison':
        html = this.generateComparisonReport(assets, intent);
        sections.push({
          id: 'comparison-table',
          action: 'add',
          content: html,
          order: 1
        });
        break;
        
      case 'portfolio':
        html = this.generatePortfolioReport(assets, intent);
        sections.push({
          id: 'portfolio-overview',
          action: 'add',
          content: html,
          order: 1
        });
        break;
        
      default:
        html = this.generateMarketOverview(intent);
        sections.push({
          id: 'market-overview',
          action: 'add',
          content: html,
          order: 1
        });
    }
    
    // Update context
    const enhancement: Enhancement = {
      id: this.generateId(),
      prompt,
      changes: ['Initial report generated'],
      timestamp: new Date(),
      tokensUsed: prompt.length * 2, // Estimate
      sections: sections.map(s => s.id)
    };
    
    reportContextManager.updateContext(context.threadId, enhancement, {
      sections: sections.map(s => ({
        id: s.id,
        type: s.id,
        title: this.getSectionTitle(s.id),
        data: {},
        visible: true,
        order: s.order || 1
      }))
    });
    
    return {
      html,
      context: context!,
      tokens: enhancement.tokensUsed,
      sections
    };
  }
  
  // Enhance existing report
  private async enhanceReport(
    context: ReportContext, 
    prompt: string, 
    currentHTML?: string
  ): Promise<EnhancementResponse> {
    // Analyze enhancement request
    const enhancementType = this.analyzeEnhancement(prompt, context);
    
    // Generate smart context for AI
    const smartPrompt = reportContextManager.buildSmartPrompt(context, prompt);
    
    // Generate enhancement based on type
    let sections: SectionUpdate[] = [];
    
    switch (enhancementType) {
      case 'add_technical':
        sections = this.addTechnicalAnalysis(context);
        break;
        
      case 'add_comparison':
        const newAssets = this.extractAssets(prompt);
        sections = this.addComparison(context, newAssets);
        break;
        
      case 'add_timeframe':
        const timeframe = this.extractTimeframe(prompt);
        sections = this.addHistoricalAnalysis(context, timeframe);
        break;
        
      case 'add_predictions':
        sections = this.addPredictions(context);
        break;
        
      case 'add_risks':
        sections = this.addRiskAnalysis(context);
        break;
        
      case 'modify_layout':
        sections = this.modifyLayout(context, prompt);
        break;
        
      default:
        // Generic enhancement
        sections = this.genericEnhancement(context, prompt);
    }
    
    // Build complete HTML with all sections
    const html = this.buildCompleteHTML(context, sections, currentHTML);
    
    // Update context with enhancement
    const enhancement: Enhancement = {
      id: this.generateId(),
      prompt,
      changes: sections.map(s => `${s.action}: ${s.id}`),
      timestamp: new Date(),
      tokensUsed: smartPrompt.length + html.length / 10, // Estimate
      sections: sections.map(s => s.id)
    };
    
    reportContextManager.updateContext(context.threadId, enhancement, {
      sections: [
        ...context.currentState.sections,
        ...sections.filter(s => s.action === 'add').map(s => ({
          id: s.id,
          type: s.id,
          title: this.getSectionTitle(s.id),
          data: {},
          visible: true,
          order: context.currentState.sections.length + 1
        }))
      ]
    });
    
    return {
      html,
      context,
      tokens: enhancement.tokensUsed,
      sections
    };
  }
  
  // Parse user intent from prompt
  private parseIntent(prompt: string): { type: any; focus: string[] } {
    const lower = prompt.toLowerCase();
    
    if (lower.includes('compare') || lower.includes('vs')) {
      return { type: 'comparison', focus: ['metrics', 'performance'] };
    } else if (lower.includes('portfolio') || lower.includes('holdings')) {
      return { type: 'portfolio', focus: ['allocation', 'performance'] };
    } else if (lower.includes('sector') || lower.includes('industry')) {
      return { type: 'sector', focus: ['leaders', 'trends'] };
    } else if (lower.includes('market') || lower.includes('overview')) {
      return { type: 'market', focus: ['indices', 'movers'] };
    } else {
      return { type: 'single', focus: ['analysis', 'metrics'] };
    }
  }
  
  // Extract stock symbols from prompt
  private extractAssets(prompt: string): string[] {
    const assets: string[] = [];
    const upper = prompt.toUpperCase();
    
    // Check for known symbols
    Object.keys(MARKET_DATA.stocks).forEach(symbol => {
      if (upper.includes(symbol)) {
        assets.push(symbol);
      }
    });
    
    // If no assets found, use defaults based on context
    if (assets.length === 0) {
      if (prompt.toLowerCase().includes('tech')) {
        assets.push('AAPL', 'MSFT', 'GOOGL');
      } else {
        assets.push('AAPL'); // Default
      }
    }
    
    return assets;
  }
  
  // Analyze what type of enhancement is requested
  private analyzeEnhancement(prompt: string, context: ReportContext): string {
    const lower = prompt.toLowerCase();
    
    if (lower.includes('technical') || lower.includes('indicators') || lower.includes('rsi') || lower.includes('macd')) {
      return 'add_technical';
    } else if (lower.includes('compare') || lower.includes('vs') || lower.includes('versus')) {
      return 'add_comparison';
    } else if (lower.includes('history') || lower.includes('year') || lower.includes('trend')) {
      return 'add_timeframe';
    } else if (lower.includes('predict') || lower.includes('forecast') || lower.includes('future')) {
      return 'add_predictions';
    } else if (lower.includes('risk') || lower.includes('volatility')) {
      return 'add_risks';
    } else if (lower.includes('layout') || lower.includes('dashboard') || lower.includes('view')) {
      return 'modify_layout';
    }
    
    return 'generic';
  }
  
  // Add technical analysis section
  private addTechnicalAnalysis(context: ReportContext): SectionUpdate[] {
    const asset = context.currentState.assets[0];
    const data = MARKET_DATA.stocks[asset] || MARKET_DATA.stocks.AAPL;
    
    const html = `
      <div class="technical-analysis-section bg-background rounded-xl p-6 mt-6">
        <h2 class="text-2xl font-bold text-primary-foreground mb-6">📊 Technical Analysis</h2>
        <div class="grid grid-cols-4 gap-4">
          <div class="bg-secondary rounded-lg p-4">
            <div class="text-muted-foreground text-sm mb-1">RSI (14)</div>
            <div class="text-2xl font-bold text-primary-foreground">65.4</div>
            <div class="text-green-400 text-sm">Bullish</div>
          </div>
          <div class="bg-secondary rounded-lg p-4">
            <div class="text-muted-foreground text-sm mb-1">MACD</div>
            <div class="text-2xl font-bold text-primary-foreground">12.5</div>
            <div class="text-green-400 text-sm">Buy Signal</div>
          </div>
          <div class="bg-secondary rounded-lg p-4">
            <div class="text-muted-foreground text-sm mb-1">Bollinger</div>
            <div class="text-2xl font-bold text-primary-foreground">Upper</div>
            <div class="text-yellow-400 text-sm">Overbought</div>
          </div>
          <div class="bg-secondary rounded-lg p-4">
            <div class="text-muted-foreground text-sm mb-1">Volume</div>
            <div class="text-2xl font-bold text-primary-foreground">+45%</div>
            <div class="text-green-400 text-sm">Above Avg</div>
          </div>
        </div>
        <div class="mt-6">
          <canvas id="technical-chart-${Date.now()}"></canvas>
        </div>
      </div>
    `;
    
    return [{
      id: 'technical-analysis',
      action: 'add',
      content: html
    }];
  }
  
  // Add comparison section
  private addComparison(context: ReportContext, newAssets: string[]): SectionUpdate[] {
    const allAssets = [...new Set([...context.currentState.assets, ...newAssets])];
    
    const html = `
      <div class="comparison-section bg-background rounded-xl p-6 mt-6">
        <h2 class="text-2xl font-bold text-primary-foreground mb-6">📈 Comparison Analysis</h2>
        <table class="w-full text-primary-foreground">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-3">Metric</th>
              ${allAssets.map(a => `<th class="text-center py-3">${a}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${this.generateComparisonRows(allAssets)}
          </tbody>
        </table>
      </div>
    `;
    
    // Update context with new assets
    context.currentState.assets = allAssets;
    
    return [{
      id: 'comparison-analysis',
      action: 'add',
      content: html
    }];
  }
  
  // Generate comparison table rows
  private generateComparisonRows(assets: string[]): string {
    const metrics = ['Price', 'Change %', 'P/E Ratio', 'Market Cap', 'Volume'];
    
    return metrics.map(metric => `
      <tr class="border-b border-border">
        <td class="py-3 font-semibold">${metric}</td>
        ${assets.map(asset => {
          const data = MARKET_DATA.stocks[asset] || MARKET_DATA.stocks.AAPL;
          let value = '';
          
          switch(metric) {
            case 'Price':
              value = `$${data.price.toFixed(2)}`;
              break;
            case 'Change %':
              value = `<span class="${data.changePct >= 0 ? 'text-green-400' : 'text-red-400'}">${data.changePct >= 0 ? '+' : ''}${data.changePct}%</span>`;
              break;
            case 'P/E Ratio':
              value = data.pe.toFixed(1);
              break;
            case 'Market Cap':
              value = `$${(data.marketCap / 1e9).toFixed(0)}B`;
              break;
            case 'Volume':
              value = `${(data.volume / 1e6).toFixed(1)}M`;
              break;
          }
          
          return `<td class="py-3 text-center">${value}</td>`;
        }).join('')}
      </tr>
    `).join('');
  }
  
  // Add historical analysis
  private addHistoricalAnalysis(context: ReportContext, timeframe: string): SectionUpdate[] {
    const html = `
      <div class="historical-section bg-background rounded-xl p-6 mt-6">
        <h2 class="text-2xl font-bold text-primary-foreground mb-6">📅 ${timeframe} Historical Analysis</h2>
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="bg-secondary rounded-lg p-4">
            <div class="text-muted-foreground text-sm">Period Return</div>
            <div class="text-2xl font-bold text-green-400">+34.5%</div>
          </div>
          <div class="bg-secondary rounded-lg p-4">
            <div class="text-muted-foreground text-sm">Volatility</div>
            <div class="text-2xl font-bold text-yellow-400">28.3%</div>
          </div>
          <div class="bg-secondary rounded-lg p-4">
            <div class="text-muted-foreground text-sm">Sharpe Ratio</div>
            <div class="text-2xl font-bold text-primary-foreground">1.22</div>
          </div>
        </div>
        <canvas id="historical-chart-${Date.now()}"></canvas>
      </div>
    `;
    
    return [{
      id: 'historical-analysis',
      action: 'add',
      content: html
    }];
  }
  
  // Add predictions section
  private addPredictions(context: ReportContext): SectionUpdate[] {
    const html = `
      <div class="predictions-section bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-6 mt-6">
        <h2 class="text-2xl font-bold text-primary-foreground mb-6">🔮 AI Predictions & Forecasts</h2>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-semibold text-primary-foreground mb-3">Price Targets</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">3 Month</span>
                <span class="text-green-400 font-bold">$215 (+13%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">6 Month</span>
                <span class="text-green-400 font-bold">$235 (+24%)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">12 Month</span>
                <span class="text-green-400 font-bold">$260 (+37%)</span>
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-primary-foreground mb-3">AI Confidence</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <span class="text-muted-foreground">Bullish Signal</span>
                <div class="flex-1 bg-gray-700 rounded-full h-2">
                  <div class="bg-green-400 h-2 rounded-full" style="width: 78%"></div>
                </div>
                <span class="text-primary-foreground font-bold">78%</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-muted-foreground">Accuracy Score</span>
                <div class="flex-1 bg-gray-700 rounded-full h-2">
                  <div class="bg-blue-400 h-2 rounded-full" style="width: 85%"></div>
                </div>
                <span class="text-primary-foreground font-bold">85%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return [{
      id: 'predictions',
      action: 'add',
      content: html
    }];
  }
  
  // Add risk analysis
  private addRiskAnalysis(context: ReportContext): SectionUpdate[] {
    const html = `
      <div class="risk-section bg-red-900 bg-opacity-20 border border-red-500 rounded-xl p-6 mt-6">
        <h2 class="text-2xl font-bold text-primary-foreground mb-6">⚠️ Risk Analysis</h2>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-semibold text-primary-foreground mb-3">Risk Metrics</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Beta</span>
                <span class="text-yellow-400">1.29</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">VaR (95%)</span>
                <span class="text-red-400">-4.2%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Max Drawdown</span>
                <span class="text-red-400">-18.5%</span>
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-primary-foreground mb-3">Risk Factors</h3>
            <ul class="space-y-1 text-muted-foreground">
              <li>• Market volatility: High</li>
              <li>• Sector rotation risk: Medium</li>
              <li>• Regulatory risk: Low</li>
              <li>• Competition risk: Medium</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    return [{
      id: 'risk-analysis',
      action: 'add',
      content: html
    }];
  }
  
  // Modify layout
  private modifyLayout(context: ReportContext, prompt: string): SectionUpdate[] {
    // This would reorganize existing sections
    return [{
      id: 'layout-change',
      action: 'update',
      content: '<div class="layout-updated">Layout has been updated to dashboard view</div>'
    }];
  }
  
  // Generic enhancement
  private genericEnhancement(context: ReportContext, prompt: string): SectionUpdate[] {
    const html = `
      <div class="enhanced-section bg-background rounded-xl p-6 mt-6">
        <h2 class="text-2xl font-bold text-primary-foreground mb-4">Enhanced Analysis</h2>
        <p class="text-muted-foreground">Enhanced based on: "${prompt}"</p>
        <div class="mt-4 p-4 bg-secondary rounded-lg">
          <p class="text-primary-foreground">AI-generated insights based on your request...</p>
        </div>
      </div>
    `;
    
    return [{
      id: `enhancement-${Date.now()}`,
      action: 'add',
      content: html
    }];
  }
  
  // Build complete HTML document
  private buildCompleteHTML(context: ReportContext, newSections: SectionUpdate[], currentHTML?: string): string {
    // Start with base template
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Financial Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { 
          font-family: 'Inter', sans-serif;
          background: #0A0E1A;
          color: white;
        }
        .section-transition {
          animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="p-6">
    <div class="max-w-7xl mx-auto">
`;
    
    // Add header
    html += this.generateReportHeader(context);
    
    // Add existing sections
    context.currentState.sections
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order)
      .forEach(section => {
        // Find if this section is being updated
        const update = newSections.find(s => s.id === section.id);
        if (update && update.action === 'replace') {
          html += `<div class="section-transition">${update.content}</div>`;
        } else if (update && update.action === 'remove') {
          // Skip removed sections
        } else {
          // Keep existing section (would need to parse from currentHTML in real implementation)
          html += `<div id="${section.id}"><!-- Existing ${section.type} content --></div>`;
        }
      });
    
    // Add new sections
    newSections
      .filter(s => s.action === 'add')
      .forEach(section => {
        html += `<div class="section-transition">${section.content}</div>`;
      });
    
    // Close HTML
    html += `
    </div>
    <script>
        // Initialize any charts or interactive elements
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Report enhanced with ${newSections.length} updates');
        });
    </script>
</body>
</html>`;
    
    return html;
  }
  
  // Generate report header
  private generateReportHeader(context: ReportContext): string {
    const assets = context.currentState.assets.join(', ');
    const enhancements = context.enhancements.length;
    
    return `
      <div class="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-primary-foreground">
              ${context.currentState.reportType === 'single' ? 'Stock Analysis' : 
                context.currentState.reportType === 'comparison' ? 'Comparison Report' :
                context.currentState.reportType === 'portfolio' ? 'Portfolio Analysis' :
                'Market Report'}
            </h1>
            <p class="text-muted-foreground mt-2">Assets: ${assets}</p>
          </div>
          <div class="text-right">
            <div class="text-sm text-muted-foreground">Version ${context.metadata.version}</div>
            <div class="text-sm text-muted-foreground">${enhancements} enhancements</div>
            <div class="text-xs text-muted-foreground mt-1">
              Updated: ${new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Generate single stock report
  private generateSingleStockReport(asset: string, intent: any): string {
    const data = MARKET_DATA.stocks[asset] || MARKET_DATA.stocks.AAPL;
    
    return `
      <div class="stock-analysis">
        <div class="bg-background rounded-xl p-6">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h2 class="text-3xl font-bold text-primary-foreground">${data.name}</h2>
              <p class="text-muted-foreground">${asset} • ${data.sector}</p>
            </div>
            <div class="text-right">
              <div class="text-4xl font-bold text-primary-foreground">$${data.price.toFixed(2)}</div>
              <div class="${data.changePct >= 0 ? 'text-green-400' : 'text-red-400'} text-xl">
                ${data.changePct >= 0 ? '▲' : '▼'} ${data.changePct}%
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-secondary rounded-lg p-4">
              <div class="text-muted-foreground text-sm">Market Cap</div>
              <div class="text-xl font-bold text-primary-foreground">$${(data.marketCap / 1e9).toFixed(0)}B</div>
            </div>
            <div class="bg-secondary rounded-lg p-4">
              <div class="text-muted-foreground text-sm">P/E Ratio</div>
              <div class="text-xl font-bold text-primary-foreground">${data.pe.toFixed(1)}</div>
            </div>
            <div class="bg-secondary rounded-lg p-4">
              <div class="text-muted-foreground text-sm">Volume</div>
              <div class="text-xl font-bold text-primary-foreground">${(data.volume / 1e6).toFixed(1)}M</div>
            </div>
            <div class="bg-secondary rounded-lg p-4">
              <div class="text-muted-foreground text-sm">Beta</div>
              <div class="text-xl font-bold text-primary-foreground">${data.beta.toFixed(2)}</div>
            </div>
          </div>
          
          <div class="mt-6">
            <canvas id="main-chart"></canvas>
          </div>
        </div>
      </div>
    `;
  }
  
  // Generate comparison report
  private generateComparisonReport(assets: string[], intent: any): string {
    return `
      <div class="comparison-report">
        <div class="bg-background rounded-xl p-6">
          <h2 class="text-2xl font-bold text-primary-foreground mb-6">Stock Comparison</h2>
          ${this.generateComparisonTable(assets)}
        </div>
      </div>
    `;
  }
  
  // Generate comparison table
  private generateComparisonTable(assets: string[]): string {
    return `
      <table class="w-full text-primary-foreground">
        <thead>
          <tr class="border-b border-border">
            <th class="text-left py-3">Metric</th>
            ${assets.map(a => `<th class="text-center py-3">${a}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${this.generateComparisonRows(assets)}
        </tbody>
      </table>
    `;
  }
  
  // Generate portfolio report
  private generatePortfolioReport(assets: string[], intent: any): string {
    return `
      <div class="portfolio-report">
        <div class="bg-background rounded-xl p-6">
          <h2 class="text-2xl font-bold text-primary-foreground mb-6">Portfolio Overview</h2>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-secondary rounded-lg p-4">
              <div class="text-muted-foreground text-sm">Total Value</div>
              <div class="text-2xl font-bold text-primary-foreground">$125,430</div>
            </div>
            <div class="bg-secondary rounded-lg p-4">
              <div class="text-muted-foreground text-sm">Today's Change</div>
              <div class="text-2xl font-bold text-green-400">+$2,340</div>
            </div>
            <div class="bg-secondary rounded-lg p-4">
              <div class="text-muted-foreground text-sm">Total Return</div>
              <div class="text-2xl font-bold text-green-400">+18.5%</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Generate market overview
  private generateMarketOverview(intent: any): string {
    return `
      <div class="market-overview">
        <div class="bg-background rounded-xl p-6">
          <h2 class="text-2xl font-bold text-primary-foreground mb-6">Market Overview</h2>
          <div class="grid grid-cols-3 gap-4">
            ${Object.entries(MARKET_DATA.indices).slice(0, 3).map(([key, index]) => `
              <div class="bg-secondary rounded-lg p-4">
                <div class="text-muted-foreground text-sm">${index.name}</div>
                <div class="text-xl font-bold text-primary-foreground">${index.value.toFixed(2)}</div>
                <div class="${index.changePct >= 0 ? 'text-green-400' : 'text-red-400'}">
                  ${index.changePct >= 0 ? '▲' : '▼'} ${index.changePct}%
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  // Extract timeframe from prompt
  private extractTimeframe(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('5 year') || lower.includes('5y')) return '5 Year';
    if (lower.includes('3 year') || lower.includes('3y')) return '3 Year';
    if (lower.includes('1 year') || lower.includes('1y')) return '1 Year';
    if (lower.includes('6 month') || lower.includes('6m')) return '6 Month';
    if (lower.includes('3 month') || lower.includes('3m')) return '3 Month';
    return '1 Year';
  }
  
  // Get section title
  private getSectionTitle(sectionId: string): string {
    const titles: Record<string, string> = {
      'main-analysis': 'Main Analysis',
      'technical-analysis': 'Technical Analysis',
      'comparison-analysis': 'Comparison',
      'historical-analysis': 'Historical Data',
      'predictions': 'AI Predictions',
      'risk-analysis': 'Risk Assessment',
      'portfolio-overview': 'Portfolio Overview',
      'market-overview': 'Market Overview'
    };
    
    return titles[sectionId] || 'Analysis';
  }
  
  // Generate unique ID
  private generateId(): string {
    return `enh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const enhancementEngine = new EnhancementEngine();