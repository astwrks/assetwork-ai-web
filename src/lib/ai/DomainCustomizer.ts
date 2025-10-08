export interface DomainConfig {
  id: string;
  name: string;
  description: string;
  industry: string;
  prompts: {
    dataAnalysis: string;
    reportGeneration: string;
    riskAssessment: string;
    compliance: string;
    performance: string;
  };
  terminology: Record<string, string>;
  metrics: string[];
  regulations: string[];
  templates: string[];
}

export const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    id: 'investment-banking',
    name: 'Investment Banking',
    description: 'Specialized for investment banking operations and M&A analysis',
    industry: 'Financial Services',
    prompts: {
      dataAnalysis: `As an investment banking analyst, analyze the provided financial data focusing on:
      - M&A transaction metrics and multiples
      - Capital structure analysis
      - Valuation methodologies (DCF, Comparable Company Analysis, Precedent Transactions)
      - Risk assessment for debt and equity offerings
      - Market positioning and competitive analysis
      
      Provide insights on deal feasibility, pricing recommendations, and strategic implications.`,
      
      reportGeneration: `Generate a comprehensive investment banking report including:
      - Executive summary with key findings
      - Financial analysis with industry benchmarks
      - Valuation summary with multiple methodologies
      - Risk factors and mitigation strategies
      - Strategic recommendations
      - Appendices with detailed financial models`,
      
      riskAssessment: `Conduct a thorough risk assessment for investment banking operations:
      - Credit risk analysis for lending activities
      - Market risk exposure and hedging strategies
      - Operational risk in trading and settlement
      - Regulatory compliance risk
      - Reputation risk management
      
      Provide risk ratings and mitigation recommendations.`,
      
      compliance: `Ensure compliance with investment banking regulations:
      - SEC regulations (Regulation M, Regulation FD)
      - FINRA rules and guidelines
      - Anti-money laundering (AML) requirements
      - Know Your Customer (KYC) procedures
      - Insider trading prevention
      
      Document compliance status and required actions.`,
      
      performance: `Analyze investment banking performance metrics:
      - Revenue by product line (M&A, ECM, DCM, Trading)
      - Client relationship metrics
      - Market share analysis
      - Cost efficiency ratios
      - Return on capital employed
      
      Provide performance benchmarks and improvement recommendations.`
    },
    terminology: {
      'DCF': 'Discounted Cash Flow',
      'LBO': 'Leveraged Buyout',
      'IPO': 'Initial Public Offering',
      'ECM': 'Equity Capital Markets',
      'DCM': 'Debt Capital Markets',
      'M&A': 'Mergers and Acquisitions',
      'EBITDA': 'Earnings Before Interest, Taxes, Depreciation, and Amortization',
      'EV': 'Enterprise Value',
      'TEV': 'Total Enterprise Value',
      'WACC': 'Weighted Average Cost of Capital'
    },
    metrics: [
      'Revenue per employee',
      'Deal completion rate',
      'Client retention rate',
      'Market share by product',
      'ROE (Return on Equity)',
      'ROA (Return on Assets)',
      'Net interest margin',
      'Trading revenue',
      'Advisory fees',
      'Underwriting fees'
    ],
    regulations: [
      'SEC Regulation M',
      'SEC Regulation FD',
      'FINRA Rule 2111',
      'FINRA Rule 2241',
      'Dodd-Frank Act',
      'Volcker Rule',
      'Basel III',
      'MiFID II'
    ],
    templates: [
      'M&A Pitch Book',
      'IPO Prospectus',
      'Credit Analysis Report',
      'Market Research Report',
      'Due Diligence Report'
    ]
  },
  {
    id: 'asset-management',
    name: 'Asset Management',
    description: 'Tailored for asset management firms and portfolio analysis',
    industry: 'Financial Services',
    prompts: {
      dataAnalysis: `As an asset management analyst, analyze the provided data focusing on:
      - Portfolio performance attribution
      - Risk-adjusted returns (Sharpe ratio, Sortino ratio)
      - Asset allocation optimization
      - Factor exposure analysis
      - ESG integration metrics
      
      Provide insights on portfolio construction, risk management, and performance enhancement opportunities.`,
      
      reportGeneration: `Generate a comprehensive asset management report including:
      - Executive summary with key performance metrics
      - Portfolio performance analysis with benchmarks
      - Risk analysis and stress testing results
      - Asset allocation and rebalancing recommendations
      - ESG impact assessment
      - Client communication and reporting`,
      
      riskAssessment: `Conduct a comprehensive risk assessment for asset management:
      - Market risk exposure and VaR analysis
      - Credit risk in fixed income holdings
      - Liquidity risk assessment
      - Operational risk in portfolio management
      - Regulatory risk and compliance
      
      Provide risk metrics and mitigation strategies.`,
      
      compliance: `Ensure compliance with asset management regulations:
      - SEC Investment Advisers Act
      - ERISA fiduciary requirements
      - MiFID II best execution
      - UCITS regulations
      - ESG disclosure requirements
      
      Document compliance status and regulatory reporting requirements.`,
      
      performance: `Analyze asset management performance metrics:
      - AUM (Assets Under Management) growth
      - Net flows and redemptions
      - Fee revenue and margins
      - Client retention rates
      - Performance vs. benchmarks
      - Risk-adjusted returns
      
      Provide performance attribution and improvement recommendations.`
    },
    terminology: {
      'AUM': 'Assets Under Management',
      'NAV': 'Net Asset Value',
      'TER': 'Total Expense Ratio',
      'ESG': 'Environmental, Social, and Governance',
      'SRI': 'Socially Responsible Investing',
      'ETF': 'Exchange-Traded Fund',
      'REIT': 'Real Estate Investment Trust',
      'Hedge Fund': 'Alternative Investment Fund',
      'PE': 'Private Equity',
      'VC': 'Venture Capital'
    },
    metrics: [
      'AUM growth rate',
      'Net flows',
      'Fee revenue',
      'Expense ratio',
      'Sharpe ratio',
      'Information ratio',
      'Tracking error',
      'Maximum drawdown',
      'Calmar ratio',
      'Sortino ratio'
    ],
    regulations: [
      'SEC Investment Advisers Act',
      'ERISA fiduciary requirements',
      'MiFID II',
      'UCITS Directive',
      'AIFMD',
      'SFDR (Sustainable Finance Disclosure Regulation)',
      'CFTC regulations',
      'NFA requirements'
    ],
    templates: [
      'Portfolio Performance Report',
      'Risk Assessment Report',
      'ESG Impact Report',
      'Client Investment Policy Statement',
      'Due Diligence Questionnaire'
    ]
  },
  {
    id: 'insurance',
    name: 'Insurance',
    description: 'Specialized for insurance companies and risk assessment',
    industry: 'Insurance',
    prompts: {
      dataAnalysis: `As an insurance analyst, analyze the provided data focusing on:
      - Underwriting profitability and loss ratios
      - Claims frequency and severity analysis
      - Risk exposure assessment
      - Reinsurance optimization
      - Catastrophe risk modeling
      
      Provide insights on pricing strategies, risk selection, and portfolio optimization.`,
      
      reportGeneration: `Generate a comprehensive insurance report including:
      - Executive summary with key financial metrics
      - Underwriting performance analysis
      - Claims analysis and trends
      - Risk assessment and mitigation strategies
      - Regulatory compliance status
      - Strategic recommendations`,
      
      riskAssessment: `Conduct a thorough risk assessment for insurance operations:
      - Underwriting risk exposure
      - Catastrophe risk and natural disasters
      - Credit risk in investments
      - Operational risk in claims processing
      - Regulatory and compliance risk
      
      Provide risk ratings and mitigation strategies.`,
      
      compliance: `Ensure compliance with insurance regulations:
      - State insurance regulations
      - NAIC guidelines and standards
      - Solvency II requirements
      - IFRS 17 insurance contracts
      - Anti-fraud measures
      
      Document compliance status and regulatory reporting requirements.`,
      
      performance: `Analyze insurance performance metrics:
      - Combined ratio and profitability
      - Loss ratio and expense ratio
      - Premium growth and retention
      - Claims settlement efficiency
      - Investment returns
      - Capital adequacy ratios
      
      Provide performance benchmarks and improvement recommendations.`
    },
    terminology: {
      'Combined Ratio': 'Loss Ratio + Expense Ratio',
      'Loss Ratio': 'Incurred Losses / Earned Premiums',
      'Expense Ratio': 'Underwriting Expenses / Written Premiums',
      'CAT': 'Catastrophe',
      'Reinsurance': 'Insurance for insurance companies',
      'Cedant': 'Insurance company that transfers risk',
      'Cession': 'Amount of risk transferred',
      'Retention': 'Amount of risk kept by insurer',
      'Deductible': 'Amount policyholder pays before coverage',
      'Coinsurance': 'Sharing of risk between insurer and policyholder'
    },
    metrics: [
      'Combined ratio',
      'Loss ratio',
      'Expense ratio',
      'Net written premium',
      'Net earned premium',
      'Claims frequency',
      'Claims severity',
      'Loss adjustment expenses',
      'Underwriting profit',
      'Investment income'
    ],
    regulations: [
      'NAIC Model Laws',
      'Solvency II',
      'IFRS 17',
      'State insurance regulations',
      'Anti-fraud regulations',
      'Privacy regulations',
      'Market conduct regulations',
      'Financial reporting requirements'
    ],
    templates: [
      'Underwriting Report',
      'Claims Analysis Report',
      'Risk Assessment Report',
      'Regulatory Compliance Report',
      'Catastrophe Risk Report'
    ]
  }
];

export class DomainCustomizer {
  private currentDomain: DomainConfig | null = null;

  constructor(domainId?: string) {
    if (domainId) {
      this.setDomain(domainId);
    }
  }

  setDomain(domainId: string): void {
    this.currentDomain = DOMAIN_CONFIGS.find(d => d.id === domainId) || null;
  }

  getCurrentDomain(): DomainConfig | null {
    return this.currentDomain;
  }

  getAvailableDomains(): DomainConfig[] {
    return DOMAIN_CONFIGS;
  }

  customizePrompt(basePrompt: string, context: string): string {
    if (!this.currentDomain) {
      return basePrompt;
    }

    const domainContext = `
    Industry: ${this.currentDomain.industry}
    Domain: ${this.currentDomain.name}
    Key Terminology: ${Object.keys(this.currentDomain.terminology).join(', ')}
    Key Metrics: ${this.currentDomain.metrics.join(', ')}
    `;

    return `${domainContext}\n\n${basePrompt}\n\nContext: ${context}`;
  }

  getDomainPrompt(type: keyof DomainConfig['prompts']): string {
    if (!this.currentDomain) {
      return '';
    }
    return this.currentDomain.prompts[type];
  }

  translateTerminology(term: string): string {
    if (!this.currentDomain) {
      return term;
    }
    return this.currentDomain.terminology[term] || term;
  }

  getRelevantMetrics(): string[] {
    if (!this.currentDomain) {
      return [];
    }
    return this.currentDomain.metrics;
  }

  getRelevantRegulations(): string[] {
    if (!this.currentDomain) {
      return [];
    }
    return this.currentDomain.regulations;
  }

  getRelevantTemplates(): string[] {
    if (!this.currentDomain) {
      return [];
    }
    return this.currentDomain.templates;
  }

  generateDomainSpecificReport(reportType: string, data: any): string {
    if (!this.currentDomain) {
      return 'No domain configuration selected.';
    }

    const prompt = this.getDomainPrompt(reportType as keyof DomainConfig['prompts']);
    if (!prompt) {
      return 'No domain-specific prompt available for this report type.';
    }

    return this.customizePrompt(prompt, JSON.stringify(data));
  }
}
