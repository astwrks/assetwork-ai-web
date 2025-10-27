'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Zap, StopCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

interface StreamingMessageProps {
  content?: string;
  inputTokens?: number;
  outputTokens?: number;
  progress?: number; // 0-100
  onStop?: () => void;
  className?: string;
}

export function StreamingMessage({
  content,
  inputTokens = 0,
  outputTokens = 0,
  progress = 0,
  onStop,
  className = '',
}: StreamingMessageProps) {
  const totalTokens = inputTokens + outputTokens;
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Time elapsed counter
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 ${className}`}
    >
      <div className="flex gap-3">
        {/* AI Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>

        {/* Message Content */}
        <div className="flex-1 max-w-[85%]">
          <div className="inline-block px-4 py-3 rounded-2xl bg-muted border border-blue-200">
            {/* Header with status */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-medium text-primary">Generating report...</span>
              <div className="flex items-center gap-2">
                {/* Time elapsed */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(timeElapsed)}</span>
                </div>
                {onStop && (
                  <Button
                    onClick={onStop}
                    variant="destructive"
                    size="sm"
                    className="h-6 px-2 text-xs"
                  >
                    <StopCircle className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {progress > 0 && (
              <div className="mb-3">
                <Progress value={progress} className="h-1.5" />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">{Math.round(progress)}% complete</span>
                </div>
              </div>
            )}

            {/* Streaming content preview */}
            {content && (
              <div className="text-sm text-foreground mb-2 max-h-32 overflow-hidden">
                {content.substring(0, 200)}
                {content.length > 200 && '...'}
              </div>
            )}

            {/* Token counter */}
            {totalTokens > 0 && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-blue-500" />
                  <span className="font-medium">{totalTokens.toLocaleString()} tokens</span>
                </div>
                {inputTokens > 0 && outputTokens > 0 && (
                  <>
                    <span className="text-gray-300">|</span>
                    <div>
                      <span className="text-green-600">{inputTokens.toLocaleString()} in</span>
                      <span className="mx-1">·</span>
                      <span className="text-blue-600">{outputTokens.toLocaleString()} out</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Pulsing indicator */}
            <div className="flex items-center gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.2,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
