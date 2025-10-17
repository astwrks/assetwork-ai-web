'use client';

/**
 * Usage Analytics Dashboard
 * Comprehensive visualization of usage statistics, costs, and insights
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Zap,
  FileText,
  MessageSquare,
  Target,
  Sparkles,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalReports: number;
    totalThreads: number;
    totalTokens: number;
    totalCost: number;
    avgTokensPerReport: number;
    avgCostPerReport: number;
    totalCompressions: number;
    tokensSavedByCompression: number;
    compressionSavingsPercentage: number;
  };
  timeSeries: Array<{
    date: string;
    reports: number;
    tokens: number;
    cost: number;
  }>;
  modelBreakdown: Array<{
    model: string;
    messageCount: number;
    tokens: number;
    percentage: number;
  }>;
  topTemplates: Array<{
    id: string;
    name: string;
    category: string | null;
    usageCount: number;
  }>;
  threadMetrics: {
    total: number;
    byStatus: {
      active: number;
      archived: number;
    };
    avgReportsPerThread: number;
  };
  qualityMetrics: {
    totalFeedback: number;
    positive: number;
    negative: number;
    satisfactionRate: number;
  };
  insights: string[];
}

interface UsageAnalyticsDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  onTimeRangeChange?: (range: string) => void;
}

export function UsageAnalyticsDashboard({
  timeRange = '30d',
  onTimeRangeChange,
}: UsageAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(timeRange);

  useEffect(() => {
    fetchAnalytics(selectedRange);
  }, [selectedRange]);

  const fetchAnalytics = async (range: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v2/analytics?timeRange=${range}&groupBy=day`);
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (range: '7d' | '30d' | '90d' | '1y' | 'all') => {
    setSelectedRange(range);
    onTimeRangeChange?.(range);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center text-gray-400 py-12">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Usage Analytics</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => handleRangeChange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<FileText className="w-5 h-5" />}
          label="Total Reports"
          value={analytics.overview.totalReports.toLocaleString()}
          subtitle={`${analytics.overview.avgTokensPerReport.toLocaleString()} avg tokens`}
          color="blue"
        />
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Cost"
          value={`$${analytics.overview.totalCost.toFixed(2)}`}
          subtitle={`$${analytics.overview.avgCostPerReport.toFixed(3)} per report`}
          color="green"
        />
        <MetricCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Total Tokens"
          value={analytics.overview.totalTokens.toLocaleString()}
          subtitle={`${analytics.overview.totalCompressions} compressions`}
          color="purple"
        />
        <MetricCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Active Threads"
          value={analytics.threadMetrics.byStatus.active.toLocaleString()}
          subtitle={`${analytics.threadMetrics.avgReportsPerThread.toFixed(1)} reports/thread`}
          color="orange"
        />
      </div>

      {/* Compression Savings */}
      {analytics.overview.totalCompressions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Compression Savings
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {analytics.overview.tokensSavedByCompression.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">Tokens Saved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {analytics.overview.compressionSavingsPercentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-400">Reduction</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${((analytics.overview.tokensSavedByCompression / 1000000) * 15).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400">Estimated Savings</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Model Breakdown */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Model Usage Breakdown
        </h3>
        <div className="space-y-3">
          {analytics.modelBreakdown.map((model, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300 font-medium">{model.model}</span>
                <span className="text-gray-400">
                  {model.tokens.toLocaleString()} tokens ({model.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${model.percentage}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Quality & Feedback
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ThumbsUp className="w-5 h-5 text-green-400" />
              <p className="text-3xl font-bold text-green-400">
                {analytics.qualityMetrics.positive}
              </p>
            </div>
            <p className="text-sm text-gray-400">Positive</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ThumbsDown className="w-5 h-5 text-red-400" />
              <p className="text-3xl font-bold text-red-400">
                {analytics.qualityMetrics.negative}
              </p>
            </div>
            <p className="text-sm text-gray-400">Negative</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <p className="text-3xl font-bold text-purple-400">
                {analytics.qualityMetrics.satisfactionRate.toFixed(1)}%
              </p>
            </div>
            <p className="text-sm text-gray-400">Satisfaction</p>
          </div>
        </div>
      </div>

      {/* Top Templates */}
      {analytics.topTemplates.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Most Used Templates
          </h3>
          <div className="space-y-3">
            {analytics.topTemplates.slice(0, 5).map((template, idx) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-purple-400">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {template.name}
                    </p>
                    {template.category && (
                      <p className="text-xs text-gray-400">{template.category}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-300">
                    {template.usageCount} uses
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {analytics.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI-Powered Insights
          </h3>
          <ul className="space-y-2">
            {analytics.insights.map((insight, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 text-sm text-gray-300"
              >
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                <span>{insight}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Usage Timeline */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Usage Timeline
        </h3>
        <SimpleLineChart data={analytics.timeSeries} />
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 bg-white/10 rounded-lg ${colorClasses[color].split(' ')[3]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </motion.div>
  );
}

/**
 * Simple Line Chart Component (CSS-based)
 */
function SimpleLineChart({
  data,
}: {
  data: Array<{ date: string; reports: number; tokens: number; cost: number }>;
}) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-400">No data available</p>;
  }

  const maxReports = Math.max(...data.map((d) => d.reports), 1);

  return (
    <div className="space-y-2">
      {data.slice(-14).map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-20 text-xs text-gray-400 text-right">
            {new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.reports / maxReports) * 100}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-end pr-2"
                >
                  {item.reports > 0 && (
                    <span className="text-xs font-semibold text-white">
                      {item.reports}
                    </span>
                  )}
                </motion.div>
              </div>
              <div className="w-24 text-xs text-gray-400 text-right">
                {item.tokens.toLocaleString()} tokens
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
