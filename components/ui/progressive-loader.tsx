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
  stages: Stage[];
  currentStage: number;
  variant?: 'simple' | 'detailed';
  showElapsedTime?: boolean;
  showEstimatedTime?: boolean;
  message?: string;
}

export function ProgressiveLoader({
  isLoading,
  stages,
  currentStage,
  variant = 'simple',
  showElapsedTime = false,
  showEstimatedTime = false,
  message,
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

  const progress = Math.min((currentStage / stages.length) * 100, 100);
  const currentStageName = stages[currentStage]?.name || 'Loading...';

  return (
    <div className="w-full space-y-4">
      {message && (
        <p className="text-sm font-medium text-center">{message}</p>
      )}

      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{currentStageName}</p>
            {variant === 'detailed' && (
              <span className="text-xs text-muted-foreground">
                {currentStage + 1} / {stages.length}
              </span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {variant === 'detailed' && (showElapsedTime || showEstimatedTime) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {showElapsedTime && (
            <span>Elapsed: {(elapsed / 1000).toFixed(1)}s</span>
          )}
          {showEstimatedTime && (
            <span>
              Est: ~{(stages.reduce((sum, s) => sum + s.estimatedDuration, 0) / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      )}
    </div>
  );
}
