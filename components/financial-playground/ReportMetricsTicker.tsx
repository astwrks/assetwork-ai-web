'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Zap, TrendingUp, Activity } from 'lucide-react';
import { formatCost, formatTokens } from '@/lib/ai/pricing';
import ContextProgressBar from './ContextProgressBar';

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
  streamingUsage?: { inputTokens: number; outputTokens: number } | null; // Real-time streaming usage
  isStreaming?: boolean; // Whether generation is in progress
  onContextClick?: () => void; // Callback when context progress bar is clicked
}

export default function ReportMetricsTicker({
  reportId,
  initialUsage,
  onUsageUpdate,
  streamingUsage,
  isStreaming = false,
  onContextClick,
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
    <div className="sticky top-0 z-50 bg-[#0A0E1A] border-b border-[#1E2432] shadow-xl">
      <div className="max-w-full px-3 py-1.5">
        <div className="flex items-center justify-between gap-3 text-xs">
          {/* Left: Compact Metrics */}
          <div className="flex items-center gap-3 font-mono">
            {/* Tokens */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
                isStreaming
                  ? 'bg-yellow-500/10 border border-yellow-500/30'
                  : 'border border-transparent'
              }`}
            >
              <Zap className={`w-3 h-3 ${isStreaming ? 'text-yellow-400' : 'text-blue-400'}`} />
              <div className="flex items-center gap-1">
                <span className="text-gray-500 uppercase text-[10px] tracking-wider">TKN</span>
                <span className={`font-bold ${isStreaming ? 'text-yellow-300' : 'text-white'}`}>
                  {isStreaming && streamingUsage
                    ? formatTokens(streamingUsage.inputTokens + streamingUsage.outputTokens)
                    : formatTokens(usage.totalTokens)}
                </span>
                {isStreaming && streamingUsage && (
                  <span className="text-[9px] text-yellow-400 font-bold">●</span>
                )}
              </div>
            </div>

            <div className="h-4 w-px bg-gray-700"></div>

            {/* Cost */}
            <div className="flex items-center gap-1.5 px-2 py-1">
              <DollarSign className="w-3 h-3 text-green-400" />
              <div className="flex items-center gap-1">
                <span className="text-gray-500 uppercase text-[10px] tracking-wider">COST</span>
                <span className="font-bold text-green-300">{formatCost(usage.totalCost)}</span>
              </div>
            </div>

            <div className="h-4 w-px bg-gray-700"></div>

            {/* Operations */}
            <div className="flex items-center gap-1.5 px-2 py-1">
              <TrendingUp className="w-3 h-3 text-purple-400" />
              <div className="flex items-center gap-1">
                <span className="text-gray-500 uppercase text-[10px] tracking-wider">OPS</span>
                <span className="font-bold text-white">{operationCount}</span>
              </div>
            </div>

            {operationCount > 0 && (
              <>
                <div className="h-4 w-px bg-gray-700"></div>
                <div className="flex items-center gap-1 px-2 py-1">
                  <span className="text-gray-500 uppercase text-[10px] tracking-wider">AVG</span>
                  <span className="font-bold text-blue-300">{formatCost(avgCostPerOperation)}</span>
                </div>
              </>
            )}
          </div>

          {/* Center: Breakdown */}
          {usage.operations && usage.operations.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
              <span>
                SEC <span className="text-white font-bold">{usage.operations.filter((op) => op.type === 'section_add').length}</span>
              </span>
              <span>
                EDT <span className="text-white font-bold">{usage.operations.filter((op) => op.type === 'edit').length}</span>
              </span>
              <span>
                SUG <span className="text-white font-bold">{usage.operations.filter((op) => op.type === 'suggestion').length}</span>
              </span>
            </div>
          )}

          {/* Right: Context & Status */}
          <div className="flex items-center gap-3">
            {/* Context Progress Bar - Clickable */}
            <button
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors"
              onClick={onContextClick}
              title="Click to view context details"
            >
              <ContextProgressBar
                currentTokens={
                  isStreaming && streamingUsage
                    ? streamingUsage.inputTokens + streamingUsage.outputTokens
                    : usage.totalTokens
                }
                size="sm"
                showLabel={false}
                showTooltip={false}
              />
              <span className="text-gray-400 uppercase text-[10px] tracking-wider font-mono">CTX</span>
            </button>

            <div className="h-4 w-px bg-gray-700"></div>

            {/* Live Status */}
            <div className="flex items-center gap-1.5 px-2 py-1">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                {isStreaming && (
                  <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                )}
              </div>
              <span className="text-gray-400 uppercase text-[10px] tracking-wider font-mono">LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
