/**
 * Report Usage Component
 * Displays detailed usage metrics for reports
 * Uses existing /api/playground/reports/[reportId]/usage API
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Hash,
  DollarSign,
  Zap,
  Clock,
  TrendingUp,
  Activity,
  BarChart3,
  Brain,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface UsageMetrics {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  model: string;
  responseTime: number;
  operations: Array<{
    type: string;
    tokens: number;
    cost: number;
    timestamp: string;
  }>;
  efficiency?: {
    tokensPerSecond?: number;
    costPerThousandTokens?: number;
    compressionRatio?: number;
  };
}

interface ReportUsageProps {
  reportId: string | null;
  className?: string;
}

export function ReportUsage({ reportId, className }: ReportUsageProps) {
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportId) {
      fetchUsage();
    }
  }, [reportId]);

  const fetchUsage = async () => {
    if (!reportId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playground/reports/${reportId}/usage`, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Usage API error:', response.status, response.statusText);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const usageData = data.usage || data;

      // Validate required fields
      if (!usageData || typeof usageData.totalTokens === 'undefined') {
        console.error('Invalid usage data structure:', usageData);
        throw new Error('Invalid usage data structure');
      }

      setUsage(usageData);
    } catch (error) {
      console.error('💥 Failed to fetch usage:', error);
      setError('Could not load usage metrics');

      // DON'T set fallback data - let the error state show
      setUsage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCost = (cost: number | undefined) => {
    if (cost === undefined || cost === null) return '$0.0000';
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens: number | undefined) => {
    if (tokens === undefined || tokens === null) return '0';
    return tokens.toLocaleString();
  };

  if (!reportId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsage}
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const tokenPercentage = (usage.outputTokens / usage.totalTokens) * 100;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Usage Metrics</CardTitle>
              <CardDescription className="text-xs">
                Detailed resource consumption analysis
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {usage.model}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-200/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">Total Tokens</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatTokens(usage.totalTokens)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatTokens(usage.inputTokens)} in / {formatTokens(usage.outputTokens)} out
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-200/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">Total Cost</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCost(usage.totalCost)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ${(usage.totalCost / usage.totalTokens * 1000).toFixed(2)}/1K tokens
            </div>
          </motion.div>
        </div>

        {/* Token Distribution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Token Distribution</span>
            <span className="font-mono">
              {tokenPercentage.toFixed(0)}% output
            </span>
          </div>
          <Progress value={tokenPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Input: {formatTokens(usage.inputTokens)}</span>
            <span>Output: {formatTokens(usage.outputTokens)}</span>
          </div>
        </div>

        {/* Efficiency Metrics */}
        {usage.efficiency && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="text-xs font-semibold text-muted-foreground">Performance</h4>

            <div className="space-y-2">
              {usage.efficiency.tokensPerSecond && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-600" />
                    <span className="text-xs">Speed</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {usage.efficiency.tokensPerSecond.toLocaleString()} tok/s
                  </Badge>
                </div>
              )}

              {usage.responseTime && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span className="text-xs">Response Time</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {usage.responseTime.toFixed(1)}s
                  </Badge>
                </div>
              )}

              {usage.efficiency.compressionRatio && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3 h-3 text-purple-600" />
                    <span className="text-xs">Compression</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {usage.efficiency.compressionRatio.toFixed(1)}x
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Operations Breakdown */}
        {usage.operations && usage.operations.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="text-xs font-semibold text-muted-foreground">Operations</h4>
            <div className="space-y-2">
              {usage.operations.map((op, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs capitalize">
                      {op.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-muted-foreground">
                      {formatTokens(op.tokens)}
                    </span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {formatCost(op.cost)}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Trend Indicator */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>Efficiency Rating</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                className={`w-2 h-2 rounded-full ${
                  star <= Math.ceil((usage.efficiency?.tokensPerSecond || 1000) / 400)
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}