import { connectToDatabase } from '../lib/db/mongodb';
import Template from '../lib/db/models/Template';

const sampleTemplates = [
  {
    userId: 'system',
    name: 'Quarterly Earnings Report',
    description: 'Comprehensive quarterly financial report with revenue breakdown, expense analysis, and performance metrics',
    category: 'Financial Analysis',
    tags: ['quarterly', 'earnings', 'revenue', 'financial-statements'],
    icon: 'DollarSign',
    isPremium: false,
    tier: 'free',
    isPublic: true,
    rating: 4.8,
    ratingCount: 156,
    usageCount: 1247,
    structure: [
      {
        type: 'text',
        title: 'Executive Summary',
        description: 'High-level overview of quarterly performance',
        required: true,
        order: 1,
      },
      {
        type: 'metric',
        title: 'Key Financial Metrics',
        description: 'Revenue, profit, and growth metrics',
        required: true,
        order: 2,
      },
      {
        type: 'chart',
        title: 'Revenue Breakdown',
        description: 'Quarterly revenue by category',
        required: true,
        order: 3,
        defaultConfig: { chartType: 'bar' },
      },
      {
        type: 'table',
        title: 'Financial Statements',
        description: 'Detailed income statement',
        required: true,
        order: 4,
      },
      {
        type: 'insight',
        title: 'Key Insights & Recommendations',
        description: 'AI-generated insights from the data',
        required: false,
        order: 5,
      },
    ],
    basePrompt: 'Generate a comprehensive quarterly earnings report including revenue breakdown, expense analysis, key metrics, and actionable insights based on the provided financial data.',
  },
  {
    userId: 'system',
    name: 'Cash Flow Analysis',
    description: 'Track money movement in and out of your business with detailed cash flow analysis',
    category: 'Financial Analysis',
    tags: ['cash-flow', 'liquidity', 'operations', 'working-capital'],
    icon: 'TrendingUp',
    isPremium: true,
    tier: 'pro',
    isPublic: true,
    rating: 4.9,
    ratingCount: 203,
    usageCount: 2341,
    structure: [
      {
        type: 'text',
        title: 'Executive Summary',
        description: 'Overview of cash position and trends',
        required: true,
        order: 1,
      },
      {
        type: 'chart',
        title: 'Operating Cash Flow',
        description: 'Monthly operating cash flow trends',
        required: true,
        order: 2,
        defaultConfig: { chartType: 'line' },
      },
      {
        type: 'table',
        title: 'Investing Activities',
        description: 'Capital expenditures and investments',
        required: true,
        order: 3,
      },
      {
        type: 'table',
        title: 'Financing Activities',
        description: 'Debt and equity transactions',
        required: true,
        order: 4,
      },
      {
        type: 'chart',
        title: 'Net Cash Position Trends',
        description: '12-month cash position analysis',
        required: true,
        order: 5,
        defaultConfig: { chartType: 'area' },
      },
      {
        type: 'insight',
        title: 'Cash Flow Insights',
        description: 'Key findings and recommendations',
        required: true,
        order: 6,
      },
    ],
    basePrompt: 'Generate a detailed cash flow analysis report covering operating, investing, and financing activities. Include trend analysis, working capital metrics, and recommendations for improving cash position.',
  },
  {
    userId: 'system',
    name: 'Revenue Forecast',
    description: 'Project future revenue trends with AI-powered forecasting and scenario analysis',
    category: 'Forecasting',
    tags: ['forecast', 'revenue', 'projection', 'planning'],
    icon: 'TrendingUp',
    isPremium: false,
    tier: 'free',
    isPublic: true,
    rating: 4.6,
    ratingCount: 89,
    usageCount: 876,
    structure: [
      {
        type: 'text',
        title: 'Forecast Overview',
        description: 'Summary of forecast methodology and assumptions',
        required: true,
        order: 1,
      },
      {
        type: 'chart',
        title: 'Revenue Projections',
        description: '12-month revenue forecast',
        required: true,
        order: 2,
        defaultConfig: { chartType: 'line' },
      },
      {
        type: 'table',
        title: 'Monthly Breakdown',
        description: 'Detailed monthly revenue projections',
        required: true,
        order: 3,
      },
      {
        type: 'chart',
        title: 'Scenario Analysis',
        description: 'Best, base, and worst case scenarios',
        required: false,
        order: 4,
        defaultConfig: { chartType: 'line' },
      },
    ],
    basePrompt: 'Create a revenue forecast report with 12-month projections based on historical trends and provided assumptions. Include scenario analysis and key drivers.',
  },
  {
    userId: 'system',
    name: 'Expense Breakdown',
    description: 'Detailed expense categorization and analysis with cost-saving opportunities',
    category: 'Cost Analysis',
    tags: ['expenses', 'costs', 'budget', 'optimization'],
    icon: 'PieChart',
    isPremium: false,
    tier: 'free',
    isPublic: true,
    rating: 4.7,
    ratingCount: 124,
    usageCount: 1543,
    structure: [
      {
        type: 'text',
        title: 'Expense Overview',
        description: 'Summary of total expenses and trends',
        required: true,
        order: 1,
      },
      {
        type: 'chart',
        title: 'Expense by Category',
        description: 'Pie chart of expense distribution',
        required: true,
        order: 2,
        defaultConfig: { chartType: 'pie' },
      },
      {
        type: 'table',
        title: 'Detailed Expense Table',
        description: 'Line-by-line expense breakdown',
        required: true,
        order: 3,
      },
      {
        type: 'chart',
        title: 'Month-over-Month Trends',
        description: 'Expense trends over time',
        required: true,
        order: 4,
        defaultConfig: { chartType: 'bar' },
      },
      {
        type: 'insight',
        title: 'Cost Optimization Opportunities',
        description: 'AI-identified savings opportunities',
        required: false,
        order: 5,
      },
    ],
    basePrompt: 'Analyze expense data and generate a comprehensive breakdown by category with trends, comparisons, and recommendations for cost optimization.',
  },
  {
    userId: 'system',
    name: 'Year-over-Year Comparison',
    description: 'Compare performance metrics across years to identify growth trends and opportunities',
    category: 'Performance Metrics',
    tags: ['yoy', 'comparison', 'growth', 'trends'],
    icon: 'BarChart3',
    isPremium: true,
    tier: 'pro',
    isPublic: true,
    rating: 4.8,
    ratingCount: 167,
    usageCount: 1876,
    structure: [
      {
        type: 'text',
        title: 'YoY Performance Summary',
        description: 'Overview of year-over-year changes',
        required: true,
        order: 1,
      },
      {
        type: 'metric',
        title: 'Key Growth Metrics',
        description: 'Revenue, profit, and efficiency metrics',
        required: true,
        order: 2,
      },
      {
        type: 'chart',
        title: 'Revenue Comparison',
        description: 'Side-by-side revenue comparison',
        required: true,
        order: 3,
        defaultConfig: { chartType: 'bar' },
      },
      {
        type: 'chart',
        title: 'Profitability Trends',
        description: 'Margin analysis across periods',
        required: true,
        order: 4,
        defaultConfig: { chartType: 'line' },
      },
      {
        type: 'table',
        title: 'Detailed Comparison',
        description: 'Line-by-line YoY comparison',
        required: true,
        order: 5,
      },
      {
        type: 'insight',
        title: 'Growth Analysis',
        description: 'Key drivers and improvement areas',
        required: true,
        order: 6,
      },
    ],
    basePrompt: 'Generate a year-over-year comparison report analyzing revenue, expenses, profitability, and key performance indicators. Identify growth trends and areas for improvement.',
  },
  {
    userId: 'system',
    name: 'Market Overview & Analysis',
    description: 'Comprehensive market trends analysis with competitive insights and opportunities',
    category: 'Market Intelligence',
    tags: ['market', 'trends', 'competition', 'analysis'],
    icon: 'TrendingUp',
    isPremium: true,
    tier: 'enterprise',
    isPublic: true,
    rating: 4.9,
    ratingCount: 78,
    usageCount: 542,
    structure: [
      {
        type: 'text',
        title: 'Market Overview',
        description: 'Current market state and trends',
        required: true,
        order: 1,
      },
      {
        type: 'chart',
        title: 'Market Size & Growth',
        description: 'Historical and projected market growth',
        required: true,
        order: 2,
        defaultConfig: { chartType: 'area' },
      },
      {
        type: 'table',
        title: 'Competitive Landscape',
        description: 'Key competitors and market share',
        required: true,
        order: 3,
      },
      {
        type: 'chart',
        title: 'Trend Analysis',
        description: 'Emerging trends and patterns',
        required: true,
        order: 4,
        defaultConfig: { chartType: 'line' },
      },
      {
        type: 'insight',
        title: 'Strategic Opportunities',
        description: 'Market gaps and growth opportunities',
        required: true,
        order: 5,
      },
    ],
    basePrompt: 'Create a comprehensive market overview report including market size, growth trends, competitive analysis, and strategic opportunities based on provided market data.',
  },
];

async function seedTemplates() {
  try {
    console.log('🌱 Starting template seeding...');

    await connectToDatabase();
    console.log('✅ Connected to database');

    // Clear existing templates (optional - comment out if you want to keep existing)
    const deleteResult = await Template.deleteMany({ userId: 'system' });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing system templates`);

    // Insert new templates
    const result = await Template.insertMany(sampleTemplates);
    console.log(`✅ Successfully seeded ${result.length} templates`);

    // Print summary
    console.log('\n📊 Template Summary:');
    const freeCount = result.filter(t => t.tier === 'free').length;
    const proCount = result.filter(t => t.tier === 'pro').length;
    const enterpriseCount = result.filter(t => t.tier === 'enterprise').length;

    console.log(`   Free: ${freeCount}`);
    console.log(`   Pro: ${proCount}`);
    console.log(`   Enterprise: ${enterpriseCount}`);
    console.log(`   Total: ${result.length}`);

    console.log('\n✨ Template seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTemplates();
