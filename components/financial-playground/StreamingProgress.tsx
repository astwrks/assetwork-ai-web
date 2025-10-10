'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BarChart3,
  FileText,
  TrendingUp,
  Brain,
  Zap,
  Database,
  Code,
  FileSearch
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface StreamingProgressProps {
  isGenerating: boolean;
  currentStage?: string;
  progress?: number;
  error?: string;
  tokens?: number;
  estimatedTime?: number;
  provider?: string;
  model?: string;
}

const stages = [
  { id: 'analyzing', label: 'Analyzing Request', icon: FileSearch, duration: 2000 },
  { id: 'fetching', label: 'Fetching Data', icon: Database, duration: 3000 },
  { id: 'processing', label: 'Processing with AI', icon: Brain, duration: 5000 },
  { id: 'generating', label: 'Generating Report', icon: Code, duration: 4000 },
  { id: 'formatting', label: 'Formatting Output', icon: FileText, duration: 2000 },
  { id: 'complete', label: 'Complete', icon: CheckCircle2, duration: 0 }
];

export default function StreamingProgress({
  isGenerating,
  currentStage = 'analyzing',
  progress = 0,
  error,
  tokens = 0,
  estimatedTime = 0,
  provider = 'anthropic',
  model = 'claude-3-5-sonnet'
}: StreamingProgressProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStageIndex(0);
      setStageProgress(0);
      setElapsedTime(0);
      return;
    }

    const stageIdx = stages.findIndex(s => s.id === currentStage);
    if (stageIdx !== -1) {
      setCurrentStageIndex(stageIdx);
    }

    // Animate stage progress
    const interval = setInterval(() => {
      setStageProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
      setElapsedTime(prev => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isGenerating, currentStage]);

  const getCurrentIcon = () => {
    const Icon = stages[currentStageIndex]?.icon || Loader2;
    return Icon;
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const formatTokens = (count: number) => {
    if (count > 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (!isGenerating && !error) return null;

  const Icon = getCurrentIcon();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-24 right-4 z-50 w-96"
      >
        <div className="bg-background border rounded-lg shadow-lg p-4">
          {error ? (
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <div className="flex-1">
                <p className="font-medium">Generation Failed</p>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${currentStage === 'complete' ? 'text-green-500' : 'text-primary'}`} />
                    {currentStage !== 'complete' && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0"
                      >
                        <Sparkles className="w-5 h-5 text-yellow-500 opacity-50" />
                      </motion.div>
                    )}
                  </div>
                  <span className="font-medium text-sm">
                    {stages[currentStageIndex]?.label || 'Processing...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {provider && (
                    <Badge variant="outline" className="text-xs">
                      {provider}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <Progress value={progress || stageProgress} className="h-2" />
              </div>

              {/* Stage Indicators */}
              <div className="flex items-center justify-between mb-3">
                {stages.slice(0, -1).map((stage, idx) => {
                  const StageIcon = stage.icon;
                  const isActive = idx === currentStageIndex;
                  const isComplete = idx < currentStageIndex;

                  return (
                    <div
                      key={stage.id}
                      className={`flex flex-col items-center gap-1 transition-all ${
                        isActive ? 'scale-110' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isComplete
                            ? 'bg-primary text-primary-foreground'
                            : isActive
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <StageIcon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] ${
                        isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}>
                        {stage.label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  {tokens > 0 && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>{formatTokens(tokens)} tokens</span>
                    </div>
                  )}
                  {model && (
                    <div className="flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      <span>{model.split('-').slice(-1)[0]}</span>
                    </div>
                  )}
                </div>
                {estimatedTime > 0 && (
                  <span>~{formatTime(estimatedTime - elapsedTime)} remaining</span>
                )}
              </div>

              {/* Streaming Indicator */}
              {currentStage === 'generating' && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                          className="w-1.5 h-1.5 bg-primary rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Streaming response...
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}