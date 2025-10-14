'use client';

import { TrendingUp, TrendingDown, MessageSquare, FileText } from 'lucide-react';

interface EntityStatsProps {
  entity: {
    name: string;
    mentionCount: number;
  };
  statistics: {
    avgSentiment: number | null;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    mentionsByMonth: Record<string, number>;
    totalMentions: number;
    uniqueReports: number;
  };
}

export function EntityStats({ entity, statistics }: EntityStatsProps) {
  const { avgSentiment, sentimentDistribution, mentionsByMonth, totalMentions, uniqueReports } =
    statistics;

  // Get sentiment color and label
  const getSentimentInfo = (sentiment: number | null) => {
    if (sentiment === null) return { color: 'text-gray-500', label: 'No Data', icon: null };
    if (sentiment > 0.3)
      return { color: 'text-green-600', label: 'Positive', icon: <TrendingUp className="w-5 h-5" /> };
    if (sentiment < -0.3)
      return { color: 'text-red-600', label: 'Negative', icon: <TrendingDown className="w-5 h-5" /> };
    return { color: 'text-yellow-600', label: 'Neutral', icon: null };
  };

  const sentimentInfo = getSentimentInfo(avgSentiment);

  // Calculate percentages for sentiment distribution
  const total = sentimentDistribution.positive + sentimentDistribution.neutral + sentimentDistribution.negative;
  const positivePercent = total > 0 ? (sentimentDistribution.positive / total) * 100 : 0;
  const neutralPercent = total > 0 ? (sentimentDistribution.neutral / total) * 100 : 0;
  const negativePercent = total > 0 ? (sentimentDistribution.negative / total) * 100 : 0;

  // Get recent months for chart
  const monthEntries = Object.entries(mentionsByMonth).sort(([a], [b]) => a.localeCompare(b));
  const recentMonths = monthEntries.slice(-6); // Last 6 months

  const maxMentions = Math.max(...recentMonths.map(([, count]) => count), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        Statistics Overview
      </h2>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Mentions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Mentions</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalMentions}</p>
            </div>
          </div>
        </div>

        {/* Unique Reports */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unique Reports</p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{uniqueReports}</p>
            </div>
          </div>
        </div>

        {/* Average Sentiment */}
        <div className={`bg-gradient-to-br ${
          avgSentiment !== null && avgSentiment > 0.3
            ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
            : avgSentiment !== null && avgSentiment < -0.3
            ? 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
            : 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800'
        } rounded-lg p-4 border`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              avgSentiment !== null && avgSentiment > 0.3
                ? 'bg-green-600'
                : avgSentiment !== null && avgSentiment < -0.3
                ? 'bg-red-600'
                : 'bg-yellow-600'
            }`}>
              {sentimentInfo.icon || <TrendingUp className="w-6 h-6 text-white" />}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Sentiment</p>
              <p className={`text-3xl font-bold ${sentimentInfo.color}`}>
                {avgSentiment !== null ? avgSentiment.toFixed(2) : 'N/A'}
              </p>
              <p className={`text-xs font-medium ${sentimentInfo.color}`}>{sentimentInfo.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Distribution Bar */}
      {total > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Sentiment Distribution</h3>
          <div className="space-y-3">
            {/* Visual Bar */}
            <div className="h-8 flex rounded-lg overflow-hidden shadow-inner">
              {positivePercent > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-bold transition-all"
                  style={{ width: `${positivePercent}%` }}
                  title={`Positive: ${sentimentDistribution.positive} (${positivePercent.toFixed(1)}%)`}
                >
                  {positivePercent > 15 && `${positivePercent.toFixed(0)}%`}
                </div>
              )}
              {neutralPercent > 0 && (
                <div
                  className="bg-yellow-500 flex items-center justify-center text-white text-xs font-bold transition-all"
                  style={{ width: `${neutralPercent}%` }}
                  title={`Neutral: ${sentimentDistribution.neutral} (${neutralPercent.toFixed(1)}%)`}
                >
                  {neutralPercent > 15 && `${neutralPercent.toFixed(0)}%`}
                </div>
              )}
              {negativePercent > 0 && (
                <div
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-bold transition-all"
                  style={{ width: `${negativePercent}%` }}
                  title={`Negative: ${sentimentDistribution.negative} (${negativePercent.toFixed(1)}%)`}
                >
                  {negativePercent > 15 && `${negativePercent.toFixed(0)}%`}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Positive: {sentimentDistribution.positive} ({positivePercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Neutral: {sentimentDistribution.neutral} ({neutralPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Negative: {sentimentDistribution.negative} ({negativePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mentions Over Time Chart */}
      {recentMonths.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Mentions Over Time</h3>
          <div className="space-y-2">
            {recentMonths.map(([month, count]) => {
              const barWidth = (count / maxMentions) * 100;
              const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              });

              return (
                <div key={month} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {monthLabel}
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full flex items-center justify-end px-2 text-white text-xs font-bold transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    >
                      {barWidth > 15 && count}
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-700 dark:text-gray-300 font-semibold text-right">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
