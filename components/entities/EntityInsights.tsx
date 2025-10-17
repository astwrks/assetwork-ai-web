'use client';

import { Lightbulb, TrendingUp, AlertTriangle, Target, BarChart3, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  OPPORTUNITY: <Sparkles className="w-5 h-5" />,
};

const insightColors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  SUMMARY: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40',
    border: 'border-blue-200 dark:border-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-600',
  },
  TREND: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40',
    border: 'border-purple-200 dark:border-purple-900',
    text: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-gradient-to-br from-purple-600 to-pink-600',
  },
  COMPARISON: {
    bg: 'bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40',
    border: 'border-indigo-200 dark:border-indigo-900',
    text: 'text-indigo-700 dark:text-indigo-300',
    iconBg: 'bg-gradient-to-br from-indigo-600 to-violet-600',
  },
  PREDICTION: {
    bg: 'bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/40 dark:to-teal-950/40',
    border: 'border-cyan-200 dark:border-cyan-900',
    text: 'text-cyan-700 dark:text-cyan-300',
    iconBg: 'bg-gradient-to-br from-cyan-600 to-teal-600',
  },
  RISK: {
    bg: 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40',
    border: 'border-red-200 dark:border-red-900',
    text: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-gradient-to-br from-red-600 to-orange-600',
  },
  OPPORTUNITY: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40',
    border: 'border-green-200 dark:border-green-900',
    text: 'text-green-700 dark:text-green-300',
    iconBg: 'bg-gradient-to-br from-green-600 to-emerald-600',
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
    <Card className="border-border/40 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          AI-Generated Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedInsights.map((insight, index) => {
            const colors = insightColors[insight.type] || insightColors.SUMMARY;
            const icon = insightIcons[insight.type] || insightIcons.SUMMARY;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${colors.bg} border-2 ${colors.border} transition-all hover:shadow-lg hover:scale-[1.01]`}>
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                          className={`${colors.iconBg} p-2.5 rounded-xl text-white shadow-lg`}
                        >
                          {icon}
                        </motion.div>
                        <div>
                          <h3 className={`text-lg font-semibold ${colors.text}`}>
                            {insight.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {insight.type.charAt(0) + insight.type.slice(1).toLowerCase()}
                            </Badge>
                            {insight.confidence !== null && (
                              <Badge variant="outline" className="text-xs">
                                {(insight.confidence * 100).toFixed(0)}% confidence
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
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
                        <Badge variant="secondary" className="flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5" />
                          {insight.sourceReportIds.length}
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      className="prose prose-sm dark:prose-invert max-w-none"
                    >
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {insight.content}
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Summary count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pt-4 border-t border-border/40"
        >
          <p className="text-sm text-muted-foreground text-center">
            Showing {insights.length} {insights.length === 1 ? 'insight' : 'insights'} generated from AI analysis
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
