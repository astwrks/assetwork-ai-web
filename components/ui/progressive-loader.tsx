import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Stage {
  name: string;
  estimatedDuration: number;
  weight: number;
}

interface ProgressiveLoaderProps {
  isLoading: boolean;
  stages?: Stage[];
  currentStage?: number;
  variant?: 'simple' | 'detailed' | 'default';
  showElapsedTime?: boolean;
  showEstimatedTime?: boolean;
  message?: string;
  estimatedDuration?: number;
}

export function ProgressiveLoader({
  isLoading,
  stages = [],
  currentStage = 0,
  variant = 'simple',
  showElapsedTime = false,
  showEstimatedTime = false,
  message,
  estimatedDuration,
}: ProgressiveLoaderProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  // Calculate progress
  const hasStages = stages && stages.length > 0;
  const progress = hasStages 
    ? Math.min((currentStage / stages.length) * 100, 100)
    : estimatedDuration 
      ? Math.min((elapsed / estimatedDuration) * 100, 95) 
      : 50;

  const currentStageName = hasStages 
    ? stages[currentStage]?.name || message || 'Loading...'
    : message || 'Loading...';

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{currentStageName}</p>
            {variant === 'detailed' && hasStages && (
              <span className="text-xs text-muted-foreground">
                {currentStage + 1} / {stages.length}
              </span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {(variant === 'detailed' || variant === 'default') && (showElapsedTime || showEstimatedTime) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {showElapsedTime && (
            <span>Elapsed: {(elapsed / 1000).toFixed(1)}s</span>
          )}
          {showEstimatedTime && estimatedDuration && (
            <span>Est: ~{(estimatedDuration / 1000).toFixed(1)}s</span>
          )}
          {showEstimatedTime && hasStages && !estimatedDuration && (
            <span>
              Est: ~{(stages.reduce((sum, s) => sum + s.estimatedDuration, 0) / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for managing progressive loading states
export function useProgressiveLoader(totalStages: number = 1) {
  const [currentStage, setCurrentStage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const start = () => {
    setIsLoading(true);
    setCurrentStage(0);
  };

  const nextStage = () => {
    setCurrentStage((prev) => Math.min(prev + 1, totalStages - 1));
  };

  const complete = () => {
    setCurrentStage(totalStages);
    setIsLoading(false);
  };

  const reset = () => {
    setCurrentStage(0);
    setIsLoading(false);
  };

  return {
    currentStage,
    isLoading,
    start,
    nextStage,
    complete,
    reset,
    setCurrentStage,
    setIsLoading,
  };
}
