// Master Prompt System - Combines all context for one-shot complete results
// No mock data - real web search integration

export interface UserContext {
  persona: UserPersona;
  interactionHistory: InteractionData[];
  preferences: UserPreferences;
  searchCapabilities: SearchConfig;
}

export interface UserPersona {
  role: string;
  expertise: string[];
  goals: string[];
  dataNeeds: string[];
  outputFormat: string;
}

export interface InteractionData {
  timestamp: Date;
  query: string;
  context: string;
  satisfaction: number;
}

export interface UserPreferences {
  detailLevel: 'executive' | 'detailed' | 'comprehensive';
  visualizations: boolean;
  dataSource: 'realtime' | 'cached';
  outputLength: 'concise' | 'standard' | 'extensive';
}

export interface SearchConfig {
  providers: string[];
  maxResults: number;
  timeRange: string;
  regions: string[];
}

export class MasterPromptSystem {
  // Build the complete prompt that gets full results in one shot
  buildMasterPrompt(
    userPrompt: string,
    context: UserContext
  ): string {
    return `
CRITICAL DIRECTIVES:
1. Generate COMPLETE, COMPREHENSIVE report immediately
2. Use REAL data from web search - NO mock data
3. Include ALL relevant information in FIRST response
4. Output professional HTML with embedded data
5. NO follow-up questions - deliver everything NOW

USER CONTEXT:
- Role: ${context.persona.role}
- Expertise: ${context.persona.expertise.join(', ')}
- Goals: ${context.persona.goals.join(', ')}
- Detail Level: ${context.preferences.detailLevel}
- Data Needs: ${context.persona.dataNeeds.join(', ')}

SEARCH DIRECTIVE:
Search for real-time data about: ${userPrompt}
Include: current prices, latest news, market data, analyst opinions, technical indicators, fundamental metrics
Time range: ${context.searchCapabilities.timeRange}
Sources: Financial APIs, news sites, market data providers

OUTPUT REQUIREMENTS:
1. Start with <!DOCTYPE html>
2. Include inline CSS for professional styling
3. Embed all data directly - no external dependencies
4. Minimum 1500 lines of detailed content
5. Use actual searched data, not placeholders

REPORT STRUCTURE:
1. Executive Summary with key findings
2. Real-time Market Data (from search)
3. Comprehensive Analysis
4. Technical Indicators
5. Fundamental Metrics
6. News & Sentiment (from web search)
7. Competitive Landscape
8. Risk Assessment
9. Opportunities & Catalysts
10. Recommendations & Actions

USER QUERY: ${userPrompt}

SEARCH AND GENERATE COMPLETE REPORT NOW:`;
  }

  // Build user persona from interaction history
  buildUserPersona(history: InteractionData[]): UserPersona {
    // Analyze history to determine user type
    const isInstitutional = history.some(h => 
      h.query.includes('portfolio') || 
      h.query.includes('risk') ||
      h.query.includes('allocation')
    );

    const isTechnical = history.some(h =>
      h.query.includes('chart') ||
      h.query.includes('indicator') ||
      h.query.includes('pattern')
    );

    const isFundamental = history.some(h =>
      h.query.includes('earnings') ||
      h.query.includes('revenue') ||
      h.query.includes('valuation')
    );

    return {
      role: isInstitutional ? 'Institutional Investor' : 'Individual Investor',
      expertise: [
        ...(isTechnical ? ['Technical Analysis'] : []),
        ...(isFundamental ? ['Fundamental Analysis'] : []),
        'Market Research',
        'Risk Management'
      ],
      goals: [
        'Maximize returns',
        'Minimize risk',
        'Identify opportunities',
        'Make informed decisions'
      ],
      dataNeeds: [
        'Real-time prices',
        'Latest news',
        'Analyst opinions',
        'Technical indicators',
        'Financial metrics',
        'Market sentiment'
      ],
      outputFormat: 'Comprehensive HTML Report'
    };
  }

  // Generate search queries for real data
  generateSearchQueries(userPrompt: string): string[] {
    const baseQuery = this.extractMainTopic(userPrompt);
    
    return [
      `${baseQuery} stock price real time`,
      `${baseQuery} latest news today`,
      `${baseQuery} analyst ratings price target`,
      `${baseQuery} technical analysis indicators`,
      `${baseQuery} earnings revenue financial metrics`,
      `${baseQuery} market sentiment social media`,
      `${baseQuery} competitors comparison`,
      `${baseQuery} risks opportunities catalysts`
    ];
  }

  // Extract main topic from user prompt
  private extractMainTopic(prompt: string): string {
    // Extract company names or tickers
    const tickerMatch = prompt.match(/\b[A-Z]{1,5}\b/g);
    if (tickerMatch) return tickerMatch[0];

    // Extract company names
    const companies = ['Apple', 'Microsoft', 'Google', 'Amazon', 'Tesla', 'Meta', 'Netflix'];
    for (const company of companies) {
      if (prompt.toLowerCase().includes(company.toLowerCase())) {
        return company;
      }
    }

    return prompt.slice(0, 50); // Fallback to first part of prompt
  }

  // Build interaction context from history
  buildInteractionContext(history: InteractionData[]): string {
    if (history.length === 0) return 'First interaction';

    const recentInteractions = history.slice(-5);
    const avgSatisfaction = recentInteractions.reduce((acc, h) => acc + h.satisfaction, 0) / recentInteractions.length;

    return `
Previous interactions: ${history.length}
Average satisfaction: ${avgSatisfaction.toFixed(1)}/5
Recent queries: ${recentInteractions.map(h => h.query).join(', ')}
Preferred detail level: ${avgSatisfaction > 4 ? 'comprehensive' : 'standard'}
    `;
  }
}

// Export singleton instance
export const masterPromptSystem = new MasterPromptSystem();

// Default user context for new users
export const DEFAULT_USER_CONTEXT: UserContext = {
  persona: {
    role: 'Professional Investor',
    expertise: ['Financial Analysis', 'Market Research', 'Risk Management'],
    goals: ['Maximize returns', 'Minimize risk', 'Identify opportunities'],
    dataNeeds: ['Real-time data', 'Comprehensive analysis', 'Actionable insights'],
    outputFormat: 'Detailed HTML Report'
  },
  interactionHistory: [],
  preferences: {
    detailLevel: 'comprehensive',
    visualizations: true,
    dataSource: 'realtime',
    outputLength: 'extensive'
  },
  searchCapabilities: {
    providers: ['web', 'news', 'financial'],
    maxResults: 50,
    timeRange: 'latest',
    regions: ['global']
  }
};