'use client';

import { TrendingUp, TrendingDown, MessageSquare, FileText, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      return { color: 'text-green-600 dark:text-green-400', label: 'Positive', icon: <TrendingUp className="w-5 h-5" /> };
    if (sentiment < -0.3)
      return { color: 'text-red-600 dark:text-red-400', label: 'Negative', icon: <TrendingDown className="w-5 h-5" /> };
    return { color: 'text-yellow-600 dark:text-yellow-400', label: 'Neutral', icon: <Activity className="w-5 h-5" /> };
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Card className="border-border/40 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Statistics Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Key Metrics Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Total Mentions */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-200 dark:border-blue-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Mentions</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalMentions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Unique Reports */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-purple-200 dark:border-purple-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Reports</p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{uniqueReports}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Average Sentiment */}
          <motion.div variants={itemVariants}>
            <Card className={`bg-gradient-to-br ${
              avgSentiment !== null && avgSentiment > 0.3
                ? 'from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-green-200 dark:border-green-900'
                : avgSentiment !== null && avgSentiment < -0.3
                ? 'from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 border-red-200 dark:border-red-900'
                : 'from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border-yellow-200 dark:border-yellow-900'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl shadow-lg ${
                    avgSentiment !== null && avgSentiment > 0.3
                      ? 'bg-gradient-to-br from-green-600 to-emerald-600'
                      : avgSentiment !== null && avgSentiment < -0.3
                      ? 'bg-gradient-to-br from-red-600 to-orange-600'
                      : 'bg-gradient-to-br from-yellow-600 to-amber-600'
                  }`}>
                    <div className="text-white">
                      {sentimentInfo.icon || <TrendingUp className="w-6 h-6" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Sentiment</p>
                    <p className={`text-3xl font-bold ${sentimentInfo.color}`}>
                      {avgSentiment !== null ? avgSentiment.toFixed(2) : 'N/A'}
                    </p>
                    <Badge variant="outline" className={`mt-1 ${sentimentInfo.color}`}>
                      {sentimentInfo.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Sentiment Distribution Bar */}
        {total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              Sentiment Distribution
            </h3>
            <div className="space-y-3">
              {/* Visual Bar */}
              <div className="h-10 flex rounded-xl overflow-hidden shadow-md border border-border/40">
                {positivePercent > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${positivePercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold"
                    title={`Positive: ${sentimentDistribution.positive} (${positivePercent.toFixed(1)}%)`}
                  >
                    {positivePercent > 15 && `${positivePercent.toFixed(0)}%`}
                  </motion.div>
                )}
                {neutralPercent > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${neutralPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold"
                    title={`Neutral: ${sentimentDistribution.neutral} (${neutralPercent.toFixed(1)}%)`}
                  >
                    {neutralPercent > 15 && `${neutralPercent.toFixed(0)}%`}
                  </motion.div>
                )}
                {negativePercent > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${negativePercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    className="bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold"
                    title={`Negative: ${sentimentDistribution.negative} (${negativePercent.toFixed(1)}%)`}
                  >
                    {negativePercent > 15 && `${negativePercent.toFixed(0)}%`}
                  </motion.div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded"></div>
                  <span className="text-foreground">
                    Positive: {sentimentDistribution.positive} ({positivePercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded"></div>
                  <span className="text-foreground">
                    Neutral: {sentimentDistribution.neutral} ({neutralPercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded"></div>
                  <span className="text-foreground">
                    Negative: {sentimentDistribution.negative} ({negativePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mentions Over Time Chart */}
        {recentMonths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              Mentions Over Time
            </h3>
            <div className="space-y-3">
              {recentMonths.map(([month, count], index) => {
                const barWidth = (count / maxMentions) * 100;
                const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <motion.div
                    key={month}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-24 text-sm text-muted-foreground font-medium">
                      {monthLabel}
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-full h-8 overflow-hidden border border-border/40">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.7 + index * 0.1 }}
                        className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-full flex items-center justify-end px-3 text-white text-sm font-bold shadow-sm"
                      >
                        {barWidth > 20 && count}
                      </motion.div>
                    </div>
                    <div className="w-12 text-sm text-foreground font-semibold text-right">
                      {count}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
