/**
 * JSON-First Architecture - Complete Working Example
 *
 * This file demonstrates the full flow from AI JSON generation
 * to beautiful UI rendering with full type safety and control.
 */

import { z } from 'zod';
import React from 'react';

// ============================================================================
// STEP 1: DEFINE SCHEMAS (Type Safety)
// ============================================================================

// Entity Schema
const EntitySchema = z.object({
  name: z.string(),
  ticker: z.string().optional(),
  sector: z.string().optional(),
  description: z.string().optional(),
});

// Financial Metrics Schema
const FinancialMetricsSchema = z.object({
  revenue: z.number(),
  profit: z.number().optional(),
  marketCap: z.number().optional(),
  peRatio: z.number().optional(),
  epsGrowth: z.number().optional(),
});

// Insight Schema
const InsightSchema = z.object({
  text: z.string(),
  severity: z.enum(['info', 'warning', 'critical', 'success']),
  category: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

// Chart Data Schema
const ChartDataSchema = z.object({
  type: z.enum(['line', 'bar', 'pie']),
  title: z.string(),
  data: z.array(z.record(z.union([z.string(), z.number()]))),
  config: z.object({
    xAxisKey: z.string().optional(),
    yAxisKey: z.string().optional(),
    colors: z.array(z.string()).optional(),
  }).optional(),
});

// Complete Report Schema
const ReportSchema = z.object({
  reportType: z.enum(['financial_analysis', 'market_research', 'competitor_analysis']),
  entity: EntitySchema,
  financials: FinancialMetricsSchema.optional(),
  sections: z.array(z.object({
    type: z.string(),
    title: z.string(),
    content: z.string(),
    data: z.record(z.any()).optional(),
  })),
  insights: z.array(InsightSchema),
  charts: z.array(ChartDataSchema),
  metadata: z.object({
    generatedAt: z.string(),
    model: z.string(),
    version: z.number(),
  }),
});

// TypeScript types from schemas
type Entity = z.infer<typeof EntitySchema>;
type FinancialMetrics = z.infer<typeof FinancialMetricsSchema>;
type Insight = z.infer<typeof InsightSchema>;
type ChartData = z.infer<typeof ChartDataSchema>;
type Report = z.infer<typeof ReportSchema>;

// ============================================================================
// STEP 2: AI GENERATION (with validation)
// ============================================================================

/**
 * System prompt for AI - focuses on generating structured data
 */
const AI_SYSTEM_PROMPT = `
You are a financial analyst AI. Generate structured data about companies.

IMPORTANT: Output ONLY valid JSON. No markdown, no explanations, no code blocks.

Schema:
{
  "reportType": "financial_analysis",
  "entity": {
    "name": "Company Name",
    "ticker": "TICK",
    "sector": "Sector Name"
  },
  "financials": {
    "revenue": 1000000000,
    "profit": 100000000,
    "marketCap": 5000000000,
    "peRatio": 25.5
  },
  "sections": [
    {
      "type": "overview",
      "title": "Company Overview",
      "content": "Brief overview...",
      "data": { "founded": 2000, "employees": 10000 }
    }
  ],
  "insights": [
    {
      "text": "Key insight about the company",
      "severity": "info",
      "confidence": 0.85
    }
  ],
  "charts": [
    {
      "type": "line",
      "title": "Revenue Trend",
      "data": [
        { "year": "2021", "revenue": 900000000 },
        { "year": "2022", "revenue": 1000000000 }
      ],
      "config": { "xAxisKey": "year" }
    }
  ],
  "metadata": {
    "generatedAt": "2025-10-14T00:00:00Z",
    "model": "claude-3-5-sonnet",
    "version": 1
  }
}

Rules:
1. All numbers should be actual numbers, not strings
2. Use null for missing data
3. Include confidence scores where applicable
4. Ensure valid JSON syntax
`.trim();

/**
 * Generate report with validation and error handling
 */
async function generateReport(userInput: string): Promise<Report> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Call AI (example - replace with your AI service)
      const aiResponse = await callAI(userInput, AI_SYSTEM_PROMPT);

      // Clean response (remove markdown code blocks if present)
      const cleaned = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Parse JSON
      const parsed = JSON.parse(cleaned);

      // Validate with schema
      const validated = ReportSchema.parse(parsed);

      return validated;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw new Error(
          'AI failed to generate valid data after 3 attempts. Please try again.'
        );
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Unexpected error in generateReport');
}

/**
 * Mock AI call (replace with your actual AI service)
 */
async function callAI(userInput: string, systemPrompt: string): Promise<string> {
  // Example: Call Anthropic Claude
  // const response = await anthropic.messages.create({
  //   model: 'claude-3-5-sonnet-20241022',
  //   system: systemPrompt,
  //   messages: [{ role: 'user', content: userInput }],
  // });
  // return response.content[0].text;

  // Mock response for demonstration
  return JSON.stringify({
    reportType: 'financial_analysis',
    entity: {
      name: 'Apple Inc.',
      ticker: 'AAPL',
      sector: 'Technology',
    },
    financials: {
      revenue: 394328000000,
      profit: 99803000000,
      marketCap: 2800000000000,
      peRatio: 29.5,
    },
    sections: [
      {
        type: 'overview',
        title: 'Company Overview',
        content: 'Apple Inc. is a leading technology company...',
        data: { founded: 1976, employees: 164000 },
      },
    ],
    insights: [
      {
        text: 'Revenue increased 8% year-over-year',
        severity: 'success',
        confidence: 0.95,
      },
      {
        text: 'P/E ratio higher than industry average',
        severity: 'warning',
        confidence: 0.82,
      },
    ],
    charts: [
      {
        type: 'line',
        title: 'Revenue Trend (Last 3 Years)',
        data: [
          { year: '2021', revenue: 365817000000 },
          { year: '2022', revenue: 394328000000 },
          { year: '2023', revenue: 383285000000 },
        ],
        config: { xAxisKey: 'year' },
      },
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      model: 'claude-3-5-sonnet-20241022',
      version: 1,
    },
  });
}

// ============================================================================
// STEP 3: UI COMPONENTS (Presentation Layer)
// ============================================================================

/**
 * Entity Header Component
 */
function EntityHeader({ entity }: { entity: Entity }) {
  return (
    <div className="entity-header">
      <h1 className="text-3xl font-bold text-assetworks-secondary">
        {entity.name}
      </h1>
      <div className="flex gap-4 text-sm text-gray-600 mt-2">
        {entity.ticker && (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
            {entity.ticker}
          </span>
        )}
        {entity.sector && (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
            {entity.sector}
          </span>
        )}
      </div>
      {entity.description && (
        <p className="text-gray-600 mt-4">{entity.description}</p>
      )}
    </div>
  );
}

/**
 * Financial Metrics Component
 */
function FinancialMetrics({ metrics }: { metrics: FinancialMetrics }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const metricCards = [
    { label: 'Revenue', value: metrics.revenue, icon: '💰' },
    { label: 'Profit', value: metrics.profit, icon: '📈' },
    { label: 'Market Cap', value: metrics.marketCap, icon: '🏢' },
    { label: 'P/E Ratio', value: metrics.peRatio, icon: '📊', isRatio: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
      {metricCards.map(
        (metric) =>
          metric.value && (
            <div
              key={metric.label}
              className="bg-gradient-to-br from-assetworks-primary to-assetworks-secondary text-white p-6 rounded-xl shadow-lg"
            >
              <div className="text-3xl mb-2">{metric.icon}</div>
              <div className="text-sm opacity-90 mb-1">{metric.label}</div>
              <div className="text-2xl font-bold">
                {metric.isRatio ? metric.value.toFixed(2) : formatCurrency(metric.value)}
              </div>
            </div>
          )
      )}
    </div>
  );
}

/**
 * Insights Panel Component
 */
function InsightsPanel({ insights }: { insights: Insight[] }) {
  const severityStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  const severityIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
    success: '✅',
  };

  return (
    <div className="my-6">
      <h2 className="text-2xl font-semibold text-assetworks-secondary mb-4">
        Key Insights
      </h2>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 border rounded-lg ${severityStyles[insight.severity]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{severityIcons[insight.severity]}</span>
              <div className="flex-1">
                <p className="font-medium">{insight.text}</p>
                {insight.confidence && (
                  <p className="text-xs mt-1 opacity-70">
                    Confidence: {(insight.confidence * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Chart Renderer Component
 */
function ChartRenderer({ chart }: { chart: ChartData }) {
  // This would use your actual chart library (Recharts, etc.)
  // For demonstration, showing simplified version
  return (
    <div className="my-6 p-6 bg-white border border-gray-200 rounded-xl shadow">
      <h3 className="text-lg font-semibold text-assetworks-secondary mb-4">
        {chart.title}
      </h3>
      <div className="h-64 flex items-end justify-around gap-2">
        {chart.data.map((dataPoint, index) => {
          const values = Object.values(dataPoint).filter(
            (v) => typeof v === 'number'
          ) as number[];
          const maxValue = Math.max(...chart.data.flatMap(d =>
            Object.values(d).filter(v => typeof v === 'number') as number[]
          ));
          const height = (values[0] / maxValue) * 100;

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-gradient-to-t from-assetworks-primary to-assetworks-accent rounded-t"
                style={{ height: `${height}%` }}
              />
              <div className="text-xs mt-2 text-gray-600">
                {Object.values(dataPoint).find((v) => typeof v === 'string')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 4: MIDDLEWARE (Orchestration)
// ============================================================================

/**
 * Report Renderer - The middleware that ties everything together
 */
function ReportRenderer({ report }: { report: Report }) {
  return (
    <div className="report-container max-w-5xl mx-auto p-8">
      {/* Header */}
      <EntityHeader entity={report.entity} />

      {/* Financial Metrics */}
      {report.financials && <FinancialMetrics metrics={report.financials} />}

      {/* Sections */}
      <div className="my-8 space-y-6">
        {report.sections.map((section, index) => (
          <div key={index} className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-assetworks-secondary">
              {section.title}
            </h2>
            <p className="text-gray-700">{section.content}</p>
            {section.data && (
              <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
                {JSON.stringify(section.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Insights */}
      <InsightsPanel insights={report.insights} />

      {/* Charts */}
      {report.charts.map((chart, index) => (
        <ChartRenderer key={index} chart={chart} />
      ))}

      {/* Metadata Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-500">
        <p>Generated: {new Date(report.metadata.generatedAt).toLocaleString()}</p>
        <p>Model: {report.metadata.model}</p>
        <p>Version: {report.metadata.version}</p>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 5: MAIN APP (Putting it all together)
// ============================================================================

/**
 * Main Application Component
 */
export default function FinancialReportApp() {
  const [report, setReport] = React.useState<Report | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const userInput = 'Generate a financial analysis for Apple Inc.';
      const generatedReport = await generateReport(userInput);
      setReport(generatedReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-assetworks-secondary">
          AssetWorks Financial Reports
        </h1>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-8">
        {!report && (
          <div className="text-center py-20">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="px-8 py-4 bg-assetworks-primary text-white rounded-lg font-semibold hover:bg-assetworks-secondary transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating Report...' : 'Generate Sample Report'}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        )}

        {report && <ReportRenderer report={report} />}
      </main>
    </div>
  );
}

// ============================================================================
// BENEFITS DEMONSTRATED
// ============================================================================

/**
 * What this example shows:
 *
 * 1. TYPE SAFETY
 *    - Every field is typed and validated
 *    - Compiler catches errors before runtime
 *
 * 2. SEPARATION OF CONCERNS
 *    - AI generates data (JSON)
 *    - Components handle presentation
 *    - Complete control over UI
 *
 * 3. REUSABILITY
 *    - Components can be used anywhere
 *    - Same data, different layouts
 *
 * 4. TESTABILITY
 *    - Mock data for testing
 *    - No AI calls needed
 *
 * 5. MAINTAINABILITY
 *    - Change UI without touching AI
 *    - Add new components easily
 *
 * 6. FLEXIBILITY
 *    - Swap components
 *    - Change styling
 *    - Add features
 *
 * 7. SCALABILITY
 *    - Same approach works for all report types
 *    - Easy to add new report types
 */

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * In your Next.js page:
 *
 * import FinancialReportApp from '@/components/FinancialReportApp';
 *
 * export default function ReportsPage() {
 *   return <FinancialReportApp />;
 * }
 */
