'use client';

import { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  TrendingUp,
  BarChart,
  AlertTriangle,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Enhancement {
  id: string;
  prompt: string;
  changes: string[];
  timestamp: Date;
  tokensUsed: number;
  sections: string[];
}

interface EnhancementHistoryProps {
  threadId: string;
  enhancements: Enhancement[];
  currentVersion: number;
  onRollback?: (version: number) => void;
  className?: string;
}

export function EnhancementHistory({
  threadId,
  enhancements,
  currentVersion,
  onRollback,
  className = ''
}: EnhancementHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const getEnhancementIcon = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('technical') || lower.includes('indicator')) return <BarChart className="w-4 h-4" />;
    if (lower.includes('compare') || lower.includes('vs')) return <TrendingUp className="w-4 h-4" />;
    if (lower.includes('risk')) return <AlertTriangle className="w-4 h-4" />;
    if (lower.includes('predict') || lower.includes('forecast')) return <Target className="w-4 h-4" />;
    return <Plus className="w-4 h-4" />;
  };

  const formatTokens = (tokens: number) => {
    if (tokens < 1000) return `${tokens} tokens`;
    return `${(tokens / 1000).toFixed(1)}k tokens`;
  };

  const totalTokens = enhancements.reduce((sum, e) => sum + e.tokensUsed, 0);
  const tokensSaved = Math.floor(totalTokens * 0.7); // Estimate 70% savings

  return (
    <div className={`bg-background rounded-xl border border-border ${className}`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-semibold text-primary-foreground">Enhancement History</h3>
              <p className="text-xs text-muted-foreground">
                Version {currentVersion} • {enhancements.length} enhancements
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-green-400 font-medium">
                {formatTokens(tokensSaved)} saved
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTokens(totalTokens)} total
              </p>
            </div>
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Report Completeness</span>
                  <span>{Math.min(100, enhancements.length * 20)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, enhancements.length * 20)}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              </div>

              {/* Enhancement List */}
              <div className="space-y-2">
                {enhancements.map((enhancement, index) => (
                  <motion.div
                    key={enhancement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      group relative flex items-start gap-3 p-3 rounded-lg
                      ${selectedVersion === index + 1 
                        ? 'bg-purple-900/30 border border-purple-700' 
                        : 'hover:bg-secondary/50'
                      }
                      cursor-pointer transition-all
                    `}
                    onClick={() => setSelectedVersion(index + 1)}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-purple-400">
                        {getEnhancementIcon(enhancement.prompt)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          v{index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(enhancement.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-primary-foreground font-medium mb-1">
                        {enhancement.prompt}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {enhancement.sections.map(section => (
                          <span
                            key={section}
                            className="px-2 py-0.5 bg-secondary text-xs text-muted-foreground rounded"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTokens(enhancement.tokensUsed)} used
                      </p>
                    </div>

                    {/* Actions */}
                    {onRollback && index < enhancements.length - 1 && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRollback(index + 1);
                          }}
                          className="p-1.5 bg-secondary hover:bg-accent rounded text-muted-foreground hover:text-primary-foreground transition-colors"
                          title="Rollback to this version"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Enhancement</p>
                    <p className="text-sm font-medium text-primary-foreground">
                      {formatTokens(Math.floor(totalTokens / enhancements.length))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Efficiency</p>
                    <p className="text-sm font-medium text-green-400">
                      {((tokensSaved / totalTokens) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Thread ID</p>
                    <p className="text-sm font-medium text-muted-foreground">
                      ...{threadId.slice(-8)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}