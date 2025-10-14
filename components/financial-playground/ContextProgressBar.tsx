'use client';

import { useMemo } from 'react';
import { formatTokens } from '@/lib/ai/pricing';

interface ContextProgressBarProps {
  currentTokens: number;
  maxTokens?: number; // Default to Claude's 200k
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
}

export default function ContextProgressBar({
  currentTokens,
  maxTokens = 200000, // Claude Sonnet 3.5 context window
  size = 'md',
  showLabel = true,
  showTooltip = true,
}: ContextProgressBarProps) {
  const percentage = useMemo(() => {
    return Math.min((currentTokens / maxTokens) * 100, 100);
  }, [currentTokens, maxTokens]);

  const strokeColor = useMemo(() => {
    if (percentage >= 90) return '#EF4444'; // Red
    if (percentage >= 75) return '#F59E0B'; // Orange
    if (percentage >= 50) return '#3B82F6'; // Blue
    return '#10B981'; // Green
  }, [percentage]);

  const sizeConfig = {
    sm: {
      radius: 12,
      stroke: 2.5,
      fontSize: 'text-[7px]',
      labelSize: 'text-xs',
    },
    md: {
      radius: 16,
      stroke: 3,
      fontSize: 'text-[9px]',
      labelSize: 'text-sm',
    },
    lg: {
      radius: 22,
      stroke: 4,
      fontSize: 'text-[10px]',
      labelSize: 'text-base',
    },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const offset = circumference - (percentage / 100) * circumference;
  const svgSize = (config.radius + config.stroke) * 2;

  return (
    <div className="flex items-center gap-2" title={showTooltip ? `${formatTokens(currentTokens)} / ${formatTokens(maxTokens)} tokens used` : undefined}>
      {/* Circular Progress */}
      <div className="relative flex items-center justify-center">
        <svg
          width={svgSize}
          height={svgSize}
          className="transform -rotate-90"
        >
          {/* Background Circle */}
          <circle
            cx={config.radius + config.stroke}
            cy={config.radius + config.stroke}
            r={config.radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={config.stroke}
          />
          {/* Progress Circle */}
          <circle
            cx={config.radius + config.stroke}
            cy={config.radius + config.stroke}
            r={config.radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        {/* Percentage Text */}
        <div className={`absolute inset-0 flex items-center justify-center ${config.fontSize} font-bold text-gray-700`}>
          {Math.round(percentage)}%
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex flex-col">
          <span className={`${config.labelSize} font-medium text-gray-700`}>
            {formatTokens(currentTokens)}
          </span>
          <span className="text-[10px] text-gray-500">
            of {formatTokens(maxTokens)}
          </span>
        </div>
      )}
    </div>
  );
}
