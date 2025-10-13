'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Zap, TrendingUp, Activity } from 'lucide-react';
import { formatCost, formatTokens } from '@/lib/ai/pricing';

interface ReportUsage {
  totalTokens: number;
  totalCost: number;
  operations: Array<{
    type: 'generation' | 'edit' | 'section_add' | 'suggestion';
    timestamp: Date;
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>;
}

interface ReportMetricsTickerProps {
  reportId: string;
  initialUsage?: ReportUsage;
  onUsageUpdate?: (usage: ReportUsage) => void; // Callback for parent to know about updates
}

export default function ReportMetricsTicker({
  reportId,
  initialUsage,
  onUsageUpdate,
}: ReportMetricsTickerProps) {
  const [usage, setUsage] = useState<ReportUsage>(
    initialUsage || {
      totalTokens: 0,
      totalCost: 0,
      operations: [],
    }
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [pollInterval, setPollInterval] = useState(2000); // Start with 2 seconds

  // Expose a method to trigger immediate refresh (for external calls)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__refreshReportMetrics = async () => {
        await fetchUsage();
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__refreshReportMetrics;
      }
    };
  }, [reportId]);

  const fetchUsage = async () => {
    try {
      const response = await fetch(
        `/api/playground/reports/${reportId}/usage`
      );
      if (response.ok) {
        const data = await response.json();
        if (
          data.usage &&
          (data.usage.totalTokens !== usage.totalTokens ||
            data.usage.totalCost !== usage.totalCost ||
            data.usage.operations?.length !== usage.operations?.length)
        ) {
          setUsage(data.usage);
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 600);

          // Notify parent component of update
          if (onUsageUpdate) {
            onUsageUpdate(data.usage);
          }

          // Speed up polling temporarily when changes are detected
          setPollInterval(500); // Poll every 500ms for the next 10 seconds
          setTimeout(() => {
            setPollInterval(2000); // Return to normal 2-second polling
          }, 10000);
        }
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  // Poll for usage updates with dynamic interval
  useEffect(() => {
    // Fetch immediately on mount
    fetchUsage();

    // Set up polling
    const interval = setInterval(fetchUsage, pollInterval);
    return () => clearInterval(interval);
  }, [reportId, pollInterval]);

  const operationCount = usage.operations?.length || 0;
  const avgCostPerOperation =
    operationCount > 0 ? usage.totalCost / operationCount : 0;

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-[#1B2951] to-[#405D80] border-b border-blue-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: Report Metrics Title */}
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-300" />
            <span className="text-sm font-semibold text-white">
              Report Usage Metrics
            </span>
          </div>

          {/* Center: Main Metrics */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* Total Tokens */}
            <div
              className={`flex items-center gap-2 transition-all duration-300 ${
                isAnimating ? 'scale-110' : 'scale-100'
              }`}
            >
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                <Zap className="w-4 h-4 text-yellow-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-blue-200 font-medium">
                    Tokens
                  </span>
                  <span className="text-sm font-bold text-white">
                    {formatTokens(usage.totalTokens)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Cost */}
            <div
              className={`flex items-center gap-2 transition-all duration-300 ${
                isAnimating ? 'scale-110' : 'scale-100'
              }`}
            >
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                <DollarSign className="w-4 h-4 text-green-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-blue-200 font-medium">
                    Total Cost
                  </span>
                  <span className="text-sm font-bold text-white">
                    {formatCost(usage.totalCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Operations Count */}
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
              <TrendingUp className="w-4 h-4 text-purple-300" />
              <div className="flex flex-col">
                <span className="text-xs text-blue-200 font-medium">
                  Operations
                </span>
                <span className="text-sm font-bold text-white">
                  {operationCount}
                </span>
              </div>
            </div>

            {/* Avg Cost per Operation */}
            {operationCount > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                <div className="flex flex-col">
                  <span className="text-xs text-blue-200 font-medium">
                    Avg/Op
                  </span>
                  <span className="text-sm font-bold text-white">
                    {formatCost(avgCostPerOperation)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Indicator */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <span className="text-xs text-blue-200 font-medium">
              Live Tracking
            </span>
          </div>
        </div>

        {/* Bottom: Breakdown (Optional) */}
        {usage.operations && usage.operations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-blue-700/30">
            <div className="flex items-center gap-4 text-xs text-blue-200">
              <span>
                Sections:{' '}
                <span className="font-semibold text-white">
                  {
                    usage.operations.filter((op) => op.type === 'section_add')
                      .length
                  }
                </span>
              </span>
              <span>"</span>
              <span>
                Edits:{' '}
                <span className="font-semibold text-white">
                  {usage.operations.filter((op) => op.type === 'edit').length}
                </span>
              </span>
              <span>"</span>
              <span>
                Suggestions:{' '}
                <span className="font-semibold text-white">
                  {
                    usage.operations.filter((op) => op.type === 'suggestion')
                      .length
                  }
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
