'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  TrendingUp,
  Building2,
  Hash,
  DollarSign,
  Globe,
  Cpu,
  Bot,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight,
  Zap,
  Shield,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Predefined demo queries for different asset classes
const DEMO_QUERIES = [
  {
    id: 'tech-giants',
    title: 'Tech Giants Analysis',
    subtitle: 'FAANG stocks performance & outlook',
    icon: Cpu,
    color: 'from-blue-500 to-cyan-500',
    entities: ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta'],
    query: 'Analyze FAANG stocks performance, competitive positioning, and growth outlook for 2024',
  },
  {
    id: 'crypto-market',
    title: 'Crypto Market Trends',
    subtitle: 'Bitcoin, Ethereum & DeFi analysis',
    icon: Hash,
    color: 'from-orange-500 to-red-500',
    entities: ['Bitcoin', 'Ethereum', 'Solana', 'DeFi Protocols', 'Stablecoins'],
    query: 'Analyze cryptocurrency market trends, Bitcoin dominance, and DeFi ecosystem growth',
  },
  {
    id: 'emerging-markets',
    title: 'Emerging Markets',
    subtitle: 'BRICS economies & opportunities',
    icon: Globe,
    color: 'from-green-500 to-emerald-500',
    entities: ['India', 'China', 'Brazil', 'Southeast Asia', 'Africa'],
    query: 'Evaluate emerging market opportunities in BRICS nations and frontier markets',
  },
  {
    id: 'commodities',
    title: 'Commodities Outlook',
    subtitle: 'Gold, Oil & Agricultural futures',
    icon: DollarSign,
    color: 'from-yellow-500 to-orange-500',
    entities: ['Gold', 'Crude Oil', 'Natural Gas', 'Wheat', 'Silver'],
    query: 'Analyze commodity markets including precious metals, energy, and agricultural futures',
  },
  {
    id: 'real-estate',
    title: 'Real Estate REITs',
    subtitle: 'Property markets & REIT analysis',
    icon: Building2,
    color: 'from-purple-500 to-pink-500',
    entities: ['Commercial REITs', 'Residential', 'Industrial', 'Data Centers', 'Healthcare'],
    query: 'Examine real estate investment trusts, property market trends, and sector rotation',
  },
  {
    id: 'ai-semiconductors',
    title: 'AI & Semiconductors',
    subtitle: 'NVIDIA, AMD & chip industry',
    icon: Brain,
    color: 'from-indigo-500 to-purple-500',
    entities: ['NVIDIA', 'AMD', 'Intel', 'Taiwan Semi', 'Broadcom'],
    query: 'Analyze AI chip makers and semiconductor industry including NVIDIA, AMD, Intel, and emerging players',
  },
];

// Sample chart data
const generateChartData = () => ({
  performance: [
    { month: 'Jan', value: 100 },
    { month: 'Feb', value: 105 },
    { month: 'Mar', value: 103 },
    { month: 'Apr', value: 108 },
    { month: 'May', value: 115 },
    { month: 'Jun', value: 118 },
    { month: 'Jul', value: 122 },
    { month: 'Aug', value: 119 },
    { month: 'Sep', value: 125 },
    { month: 'Oct', value: 132 },
    { month: 'Nov', value: 138 },
    { month: 'Dec', value: 145 },
  ],
  allocation: [
    { name: 'Large Cap', value: 45, color: 'bg-blue-500' },
    { name: 'Mid Cap', value: 25, color: 'bg-green-500' },
    { name: 'Small Cap', value: 15, color: 'bg-orange-500' },
    { name: 'International', value: 10, color: 'bg-purple-500' },
    { name: 'Bonds', value: 5, color: 'bg-gray-500' },
  ],
  metrics: [
    { label: 'Total Return', value: '+45.2%', change: 'positive' },
    { label: 'Sharpe Ratio', value: '1.82', change: 'positive' },
    { label: 'Max Drawdown', value: '-8.3%', change: 'neutral' },
    { label: 'Alpha', value: '12.4%', change: 'positive' },
  ],
});

interface DemoSectionProps {
  className?: string;
}

export default function DemoSection({ className }: DemoSectionProps) {
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [extractedEntities, setExtractedEntities] = useState<any[]>([]);

  const handleQuerySelect = async (query: typeof DEMO_QUERIES[0]) => {
    setSelectedQuery(query.id);
    setIsLoading(true);
    setReportData(null);
    setExtractedEntities([]);

    try {
      // Fetch real data from the API
      const response = await fetch(`/api/demo/reports?assetClass=${query.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const data = await response.json();

      // Set report data with real API response
      setReportData({
        performance: data.performance,
        allocation: data.allocation,
        metrics: [
          { label: 'Total Return', value: data.performance[11].value > 100 ? `+${((data.performance[11].value - 100) / 100 * 100).toFixed(1)}%` : `${((data.performance[11].value - 100) / 100 * 100).toFixed(1)}%`, change: data.performance[11].value > 100 ? 'positive' : 'negative' },
          { label: 'Market Cap', value: data.metrics.totalMarketCap || data.metrics.marketSize || 'N/A', change: 'positive' },
          { label: 'Growth Rate', value: data.metrics.gdpGrowth || data.metrics.growthRate || data.metrics.revenueGrowth || 'N/A', change: 'positive' },
          { label: 'Key Metric', value: data.metrics.avgPERatio ? `P/E ${data.metrics.avgPERatio}` : data.metrics.btcDominance || data.metrics.avgYield || 'N/A', change: 'neutral' },
        ],
        query: query,
        generatedAt: data.report?.generatedAt || new Date().toISOString(),
        insights: data.insights,
        htmlContent: data.report?.htmlContent
      });

      // Set real extracted entities from the API
      setExtractedEntities(data.entities || []);
      setIsLoading(false);

    } catch (error) {
      console.error('Error fetching demo report:', error);

      // Fallback to mock data if API fails
      const data = generateChartData();
      setReportData({
        ...data,
        query: query,
        generatedAt: new Date().toISOString(),
      });

      // Mock entity extraction as fallback
      const entities = query.entities.map(name => ({
        id: Math.random().toString(36),
        name,
        type: query.id === 'crypto-market' ? 'CRYPTOCURRENCY' :
              query.id === 'commodities' ? 'COMMODITY' : 'COMPANY',
        sentiment: Math.random() > 0.3 ? Math.random() * 0.6 + 0.4 : -Math.random() * 0.4,
        relevance: Math.random() * 0.5 + 0.5,
        mentions: Math.floor(Math.random() * 50) + 10,
        ticker: name.substring(0, 4).toUpperCase(),
      }));

      setExtractedEntities(entities);
      setIsLoading(false);
    }
  };

  return (
    <section className={cn("py-20 bg-muted/30 relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-6">
            <Cpu className="w-3 h-3 mr-2" />
            Live Demo
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            See the Magic in{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Real-Time
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Click any asset class below to generate an AI-powered financial report with real-time analysis
          </p>
        </div>

        {/* Query Selection Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-5xl mx-auto">
          {DEMO_QUERIES.map((query) => (
            <motion.button
              key={query.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuerySelect(query)}
              disabled={isLoading}
              className={cn(
                "text-left p-4 rounded-xl border-2 transition-all",
                "hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                selectedQuery === query.id
                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                  : "border-border hover:border-blue-500/50 bg-background/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                  query.color
                )}>
                  <query.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{query.title}</p>
                  <p className="text-sm text-muted-foreground">{query.subtitle}</p>
                </div>
                {selectedQuery === query.id && isLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                )}
                {selectedQuery === query.id && !isLoading && reportData && (
                  <Sparkles className="w-4 h-4 text-blue-500" />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Report Display */}
        <AnimatePresence mode="wait">
          {(isLoading || reportData) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <Card className="border-2 shadow-2xl overflow-hidden bg-background/50 backdrop-blur">
                <div className="bg-muted/50 border-b px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">assetworks-report.ai</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Bot className="w-3 h-3" />
                      Claude 3.5
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Live Analysis
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-8">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <Brain className="w-16 h-16 text-blue-500 animate-pulse" />
                        <div className="absolute inset-0 animate-spin">
                          <Sparkles className="w-16 h-16 text-blue-400" />
                        </div>
                      </div>
                      <p className="mt-4 text-lg font-medium">Generating AI Financial Report...</p>
                      <p className="text-sm text-muted-foreground mt-2">Analyzing markets • Extracting entities • Building visualizations</p>
                    </div>
                  ) : reportData && (
                    <div className="space-y-6">
                      {/* Report Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold">{reportData.query.title} Report</h3>
                          <p className="text-muted-foreground mt-1">Generated {new Date(reportData.generatedAt).toLocaleTimeString()}</p>
                        </div>
                        <Button className="gap-2">
                          View Full Report
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-4 gap-4">
                        {reportData.metrics.map((metric: any, idx: number) => (
                          <div key={idx} className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-sm text-muted-foreground">{metric.label}</p>
                            <p className={cn(
                              "text-2xl font-bold mt-1",
                              metric.change === 'positive' ? 'text-green-500' :
                              metric.change === 'negative' ? 'text-red-500' :
                              'text-foreground'
                            )}>
                              {metric.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Charts Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Performance Chart */}
                        <div className="p-6 bg-muted/30 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <LineChart className="w-4 h-4" />
                              Performance Trend
                            </h4>
                            <Badge variant="secondary">+45.2% YTD</Badge>
                          </div>
                          <div className="h-48 flex items-end justify-between gap-1">
                            {reportData.performance.map((point: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-sm hover:opacity-80 transition-opacity"
                                style={{ height: `${(point.value / 145) * 100}%` }}
                                title={`${point.month}: ${point.value}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Allocation Chart */}
                        <div className="p-6 bg-muted/30 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <PieChart className="w-4 h-4" />
                              Sector Allocation
                            </h4>
                            <Badge variant="secondary">Diversified</Badge>
                          </div>
                          <div className="space-y-3">
                            {reportData.allocation.map((sector: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: sector.color }}
                                />
                                <span className="text-sm flex-1">{sector.name}</span>
                                <span className="text-sm font-semibold">{sector.value}%</span>
                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full transition-all"
                                    style={{
                                      width: `${sector.value}%`,
                                      backgroundColor: sector.color
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Extracted Entities */}
                      <div className="p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-500" />
                            Extracted Financial Entities
                          </h4>
                          <Badge variant="outline">{extractedEntities.length} entities</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {extractedEntities.map((entity) => (
                            <motion.div
                              key={entity.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={cn(
                                "px-3 py-1.5 rounded-full border bg-background/50",
                                "flex items-center gap-2 hover:shadow-md transition-all cursor-pointer"
                              )}
                            >
                              {entity.type === 'CRYPTOCURRENCY' && <Hash className="w-3 h-3 text-orange-500" />}
                              {entity.type === 'COMPANY' && <Building2 className="w-3 h-3 text-blue-500" />}
                              {entity.type === 'COMMODITY' && <DollarSign className="w-3 h-3 text-yellow-500" />}
                              <span className="text-sm font-medium">{entity.name}</span>
                              <span className="text-xs text-muted-foreground">({entity.ticker})</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs h-5",
                                  entity.sentiment > 0 ? "border-green-500 text-green-600" : "border-red-500 text-red-600"
                                )}
                              >
                                {entity.sentiment > 0 ? '+' : ''}{(entity.sentiment * 100).toFixed(0)}%
                              </Badge>
                              <span className="text-xs text-muted-foreground">{entity.mentions} refs</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2">AI Analysis Summary</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {reportData.query.title} shows strong momentum with {reportData.metrics[0].value} total return.
                              Key drivers include technological innovation, market expansion, and favorable regulatory environment.
                              Risk factors remain manageable with volatility within expected ranges. Recommend overweight position
                              with focus on quality names in the sector.
                            </p>
                            <div className="flex items-center gap-4 mt-4">
                              <Badge variant="secondary" className="gap-1">
                                <Shield className="w-3 h-3" />
                                Low Risk
                              </Badge>
                              <Badge variant="secondary" className="gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Bullish Outlook
                              </Badge>
                              <Badge variant="secondary" className="gap-1">
                                <Activity className="w-3 h-3" />
                                High Activity
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        {!selectedQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground mb-4 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Select any asset class above to see AI-powered analysis in action
              <Sparkles className="w-4 h-4 text-blue-500" />
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}