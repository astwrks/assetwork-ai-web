/**
 * Section AI Suggestions Component
 * Provides context-aware AI suggestions for individual sections
 * Uses existing /api/playground/reports/[reportId]/suggestions API
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Suggestion {
  id: string;
  type: 'improvement' | 'insight' | 'warning' | 'opportunity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
  actionable: boolean;
}

interface SectionAISuggestionsProps {
  reportId: string;
  sectionId: string;
  sectionTitle: string;
  onApplySuggestion?: (suggestion: Suggestion) => void;
  className?: string;
}

export function SectionAISuggestions({
  reportId,
  sectionId,
  sectionTitle,
  onApplySuggestion,
  className
}: SectionAISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, [sectionId]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/playground/reports/${reportId}/suggestions?sectionId=${sectionId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setError('Could not load AI suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (suggestion: Suggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
      setAppliedSuggestions(prev => new Set(prev).add(suggestion.id));
      toast.success(`Applying suggestion: ${suggestion.title}`);
    }
  };

  const handleDismiss = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    toast.info('Suggestion dismissed');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'improvement':
        return <Sparkles className="w-4 h-4" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'opportunity':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuggestions}
            className="mt-4"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Section looks great!</p>
          <p className="text-xs text-muted-foreground mt-1">
            No suggestions at this time
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Suggestions</CardTitle>
              <CardDescription className="text-xs">
                For &quot;{sectionTitle}&quot;
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSuggestions}
            className="h-8"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <AnimatePresence>
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border ${
                appliedSuggestions.has(suggestion.id)
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${getPriorityColor(suggestion.priority)}`}>
                    {getIcon(suggestion.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{suggestion.title}</h4>
                    <Badge variant="outline" className="text-xs mt-1">
                      {suggestion.priority} priority
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(suggestion.id)}
                  className="h-6 w-6 p-0"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mb-2">
                {suggestion.description}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground italic">
                  Impact: {suggestion.estimatedImpact}
                </p>

                {suggestion.actionable && !appliedSuggestions.has(suggestion.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApply(suggestion)}
                    className="h-7 text-xs"
                  >
                    Apply
                  </Button>
                )}

                {appliedSuggestions.has(suggestion.id) && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Applied
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
