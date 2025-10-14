'use client';

import { Lightbulb, TrendingUp, AlertTriangle, Target, BarChart3, Users } from 'lucide-react';

interface Insight {
  id: string;
  type: string;
  title: string;
  content: string;
  confidence: number | null;
  createdAt: Date;
  sourceReportIds: string[];
}

interface EntityInsightsProps {
  insights: Insight[];
}

const insightIcons: Record<string, React.ReactNode> = {
  SUMMARY: <Lightbulb className="w-5 h-5" />,
  TREND: <TrendingUp className="w-5 h-5" />,
  COMPARISON: <Users className="w-5 h-5" />,
  PREDICTION: <Target className="w-5 h-5" />,
  RISK: <AlertTriangle className="w-5 h-5" />,
  OPPORTUNITY: <BarChart3 className="w-5 h-5" />,
};

const insightColors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  SUMMARY: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-600',
  },
  TREND: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-600',
  },
  COMPARISON: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
    iconBg: 'bg-indigo-600',
  },
  PREDICTION: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-700 dark:text-cyan-300',
    iconBg: 'bg-cyan-600',
  },
  RISK: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-red-600',
  },
  OPPORTUNITY: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    iconBg: 'bg-green-600',
  },
};

export function EntityInsights({ insights }: EntityInsightsProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  // Sort insights: SUMMARY first, then by date
  const sortedInsights = [...insights].sort((a, b) => {
    if (a.type === 'SUMMARY' && b.type !== 'SUMMARY') return -1;
    if (a.type !== 'SUMMARY' && b.type === 'SUMMARY') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Lightbulb className="w-6 h-6 text-yellow-500" />
        AI-Generated Insights
      </h2>

      <div className="space-y-4">
        {sortedInsights.map((insight) => {
          const colors = insightColors[insight.type] || insightColors.SUMMARY;
          const icon = insightIcons[insight.type] || insightIcons.SUMMARY;

          return (
            <div
              key={insight.id}
              className={`${colors.bg} border ${colors.border} rounded-lg p-5 transition-all hover:shadow-md`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`${colors.iconBg} p-2 rounded-lg text-white`}>
                    {icon}
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${colors.text}`}>
                      {insight.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {insight.type.charAt(0) + insight.type.slice(1).toLowerCase()}
                      </span>
                      {insight.confidence !== null && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          •
                        </span>
                      )}
                      {insight.confidence !== null && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Confidence: {(insight.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        •
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(insight.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Source reports badge */}
                {insight.sourceReportIds && insight.sourceReportIds.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
                    <BarChart3 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {insight.sourceReportIds.length} {insight.sourceReportIds.length === 1 ? 'report' : 'reports'}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {insight.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary count */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Showing {insights.length} {insights.length === 1 ? 'insight' : 'insights'} generated from AI analysis
        </p>
      </div>
    </div>
  );
}
