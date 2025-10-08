export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'portfolio' | 'risk' | 'compliance' | 'custom';
  sections: TemplateSection[];
  metadata: {
    author: string;
    version: string;
    lastUpdated: string;
    tags: string[];
  };
}

export interface TemplateSection {
  id: string;
  type: 'text' | 'chart' | 'table' | 'custom';
  title: string;
  content: string;
  aiPrompt: string;
  editable: boolean;
  order: number;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'quarterly-earnings',
    name: 'Quarterly Earnings Report',
    description: 'Comprehensive quarterly earnings analysis with financial metrics, charts, and insights',
    category: 'financial',
    sections: [
      {
        id: 'executive-summary',
        type: 'text',
        title: 'Executive Summary',
        content: '<h2>Executive Summary</h2><p>Key highlights and financial performance overview for the quarter.</p>',
        aiPrompt: 'Generate an executive summary for Q{quarter} {year} earnings, highlighting key financial metrics, revenue growth, and strategic initiatives.',
        editable: true,
        order: 1,
      },
      {
        id: 'revenue-analysis',
        type: 'chart',
        title: 'Revenue Analysis',
        content: '<h3>Revenue Trends</h3><div id="revenue-chart"></div>',
        aiPrompt: 'Create a comprehensive revenue analysis chart showing quarterly revenue trends, year-over-year growth, and revenue breakdown by segment.',
        editable: true,
        order: 2,
      },
      {
        id: 'profitability-metrics',
        type: 'table',
        title: 'Profitability Metrics',
        content: '<h3>Key Profitability Metrics</h3><div id="profitability-table"></div>',
        aiPrompt: 'Generate a detailed profitability analysis table including gross margin, operating margin, net margin, and EBITDA with historical comparisons.',
        editable: true,
        order: 3,
      },
      {
        id: 'cash-flow-analysis',
        type: 'chart',
        title: 'Cash Flow Analysis',
        content: '<h3>Cash Flow Trends</h3><div id="cashflow-chart"></div>',
        aiPrompt: 'Create a cash flow analysis showing operating, investing, and financing cash flows with trend analysis and key insights.',
        editable: true,
        order: 4,
      },
      {
        id: 'outlook',
        type: 'text',
        title: 'Forward Outlook',
        content: '<h2>Forward Outlook</h2><p>Strategic initiatives and future expectations.</p>',
        aiPrompt: 'Provide forward-looking analysis including guidance, strategic initiatives, market outlook, and key risks and opportunities.',
        editable: true,
        order: 5,
      },
    ],
    metadata: {
      author: 'AssetWorks AI',
      version: '1.0.0',
      lastUpdated: '2024-01-15',
      tags: ['earnings', 'quarterly', 'financial', 'analysis'],
    },
  },
  {
    id: 'portfolio-performance',
    name: 'Portfolio Performance Report',
    description: 'Detailed portfolio analysis with performance metrics, risk analysis, and attribution',
    category: 'portfolio',
    sections: [
      {
        id: 'performance-overview',
        type: 'chart',
        title: 'Performance Overview',
        content: '<h2>Portfolio Performance</h2><div id="performance-chart"></div>',
        aiPrompt: 'Create a comprehensive portfolio performance chart showing cumulative returns, benchmark comparison, and key performance metrics.',
        editable: true,
        order: 1,
      },
      {
        id: 'asset-allocation',
        type: 'chart',
        title: 'Asset Allocation',
        content: '<h3>Current Asset Allocation</h3><div id="allocation-chart"></div>',
        aiPrompt: 'Generate an asset allocation analysis with pie charts showing current allocation, target allocation, and drift analysis.',
        editable: true,
        order: 2,
      },
      {
        id: 'risk-metrics',
        type: 'table',
        title: 'Risk Metrics',
        content: '<h3>Risk Analysis</h3><div id="risk-table"></div>',
        aiPrompt: 'Provide detailed risk metrics including volatility, Sharpe ratio, maximum drawdown, VaR, and other risk-adjusted returns.',
        editable: true,
        order: 3,
      },
      {
        id: 'attribution-analysis',
        type: 'chart',
        title: 'Performance Attribution',
        content: '<h3>Performance Attribution</h3><div id="attribution-chart"></div>',
        aiPrompt: 'Create a performance attribution analysis showing contribution by asset class, sector, and individual holdings.',
        editable: true,
        order: 4,
      },
    ],
    metadata: {
      author: 'AssetWorks AI',
      version: '1.0.0',
      lastUpdated: '2024-01-15',
      tags: ['portfolio', 'performance', 'risk', 'attribution'],
    },
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment Report',
    description: 'Comprehensive risk analysis with stress testing, scenario analysis, and risk metrics',
    category: 'risk',
    sections: [
      {
        id: 'risk-overview',
        type: 'text',
        title: 'Risk Overview',
        content: '<h2>Risk Assessment Summary</h2><p>Overall risk profile and key risk factors.</p>',
        aiPrompt: 'Provide a comprehensive risk overview including key risk factors, risk appetite, and overall risk profile assessment.',
        editable: true,
        order: 1,
      },
      {
        id: 'var-analysis',
        type: 'chart',
        title: 'Value at Risk Analysis',
        content: '<h3>VaR Analysis</h3><div id="var-chart"></div>',
        aiPrompt: 'Create a Value at Risk analysis showing VaR at different confidence levels, historical VaR, and stress testing results.',
        editable: true,
        order: 2,
      },
      {
        id: 'stress-testing',
        type: 'chart',
        title: 'Stress Testing',
        content: '<h3>Stress Test Results</h3><div id="stress-chart"></div>',
        aiPrompt: 'Generate stress testing analysis with various scenarios including market crashes, interest rate shocks, and sector-specific stress tests.',
        editable: true,
        order: 3,
      },
      {
        id: 'correlation-analysis',
        type: 'chart',
        title: 'Correlation Analysis',
        content: '<h3>Asset Correlation Matrix</h3><div id="correlation-chart"></div>',
        aiPrompt: 'Create a correlation heatmap showing relationships between different assets, sectors, and risk factors.',
        editable: true,
        order: 4,
      },
    ],
    metadata: {
      author: 'AssetWorks AI',
      version: '1.0.0',
      lastUpdated: '2024-01-15',
      tags: ['risk', 'var', 'stress-testing', 'correlation'],
    },
  },
  {
    id: 'compliance-report',
    name: 'Compliance Report',
    description: 'Regulatory compliance analysis with audit trails, policy adherence, and regulatory updates',
    category: 'compliance',
    sections: [
      {
        id: 'compliance-summary',
        type: 'text',
        title: 'Compliance Summary',
        content: '<h2>Compliance Status</h2><p>Overall compliance status and key regulatory requirements.</p>',
        aiPrompt: 'Provide a comprehensive compliance summary including regulatory status, key requirements, and any compliance issues or concerns.',
        editable: true,
        order: 1,
      },
      {
        id: 'regulatory-updates',
        type: 'table',
        title: 'Regulatory Updates',
        content: '<h3>Recent Regulatory Changes</h3><div id="regulatory-table"></div>',
        aiPrompt: 'Generate a summary of recent regulatory updates, policy changes, and their impact on business operations.',
        editable: true,
        order: 2,
      },
      {
        id: 'audit-trail',
        type: 'table',
        title: 'Audit Trail',
        content: '<h3>Audit Trail</h3><div id="audit-table"></div>',
        aiPrompt: 'Create a detailed audit trail showing compliance activities, policy adherence, and regulatory reporting requirements.',
        editable: true,
        order: 3,
      },
      {
        id: 'action-items',
        type: 'text',
        title: 'Action Items',
        content: '<h3>Compliance Action Items</h3><p>Outstanding compliance requirements and deadlines.</p>',
        aiPrompt: 'Identify and prioritize compliance action items, deadlines, and required actions to maintain regulatory compliance.',
        editable: true,
        order: 4,
      },
    ],
    metadata: {
      author: 'AssetWorks AI',
      version: '1.0.0',
      lastUpdated: '2024-01-15',
      tags: ['compliance', 'regulatory', 'audit', 'policy'],
    },
  },
];

export function getTemplateById(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): ReportTemplate[] {
  return REPORT_TEMPLATES.filter(template => template.category === category);
}

export function searchTemplates(query: string): ReportTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return REPORT_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}
