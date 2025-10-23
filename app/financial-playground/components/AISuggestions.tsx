/**
 * AI Suggestions Component
 * Displays AI-powered suggestions for report improvement
 * Uses existing /api/playground/reports/[reportId]/suggestions API
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Check,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Suggestion {
  id: string;
  type: 'improvement' | 'insight' | 'warning' | 'opportunity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  implementation?: string;
}

interface AISuggestionsProps {
  reportId: string | null;
  isOpen?: boolean;
  onApplySuggestion?: (suggestion: Suggestion) => void;
}

export function AISuggestions({ reportId, isOpen = true, onApplySuggestion }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const fetchSuggestions = async () => {
    if (!reportId) {
      toast.error('No report selected for suggestions');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/playground/reports/${reportId}/suggestions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      toast.success(`Loaded ${data.suggestions?.length || 0} AI suggestions`);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      toast.error('Could not load AI suggestions');

      // DON'T set fallback data - keep empty array to show proper empty state
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'improvement':
        return <TrendingUp className="w-4 h-4" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'opportunity':
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'improvement':
        return 'bg-blue-500/10 text-blue-600';
      case 'insight':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'warning':
        return 'bg-red-500/10 text-red-600';
      case 'opportunity':
        return 'bg-green-500/10 text-green-600';
    }
  };

  const getPriorityColor = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
    }
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    if (appliedSuggestions.has(suggestion.id)) {
      toast.info('This suggestion has already been applied');
      return;
    }

    onApplySuggestion?.(suggestion);
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    toast.success(`Applied: ${suggestion.title}`);
  };

  const copySuggestion = (suggestion: Suggestion) => {
    const text = `${suggestion.title}\n\n${suggestion.description}${suggestion.implementation ? '\n\nImplementation: ' + suggestion.implementation : ''}`;
    navigator.clipboard.writeText(text);
    toast.success('Suggestion copied to clipboard');
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Suggestions</CardTitle>
              <CardDescription className="text-xs">
                Intelligent recommendations to enhance your report
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSuggestions}
            disabled={isLoading || !reportId}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!reportId ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Generate a report first to get AI suggestions
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-6">
            <Lightbulb className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Click refresh to generate AI suggestions
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-3">
            <AnimatePresence>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative p-3 rounded-lg border transition-all cursor-pointer
                      ${selectedSuggestion === suggestion.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}
                      ${appliedSuggestions.has(suggestion.id) ? 'opacity-60' : ''}`}
                    onClick={() => setSelectedSuggestion(
                      selectedSuggestion === suggestion.id ? null : suggestion.id
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded ${getTypeColor(suggestion.type)}`}>
                        {getTypeIcon(suggestion.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{suggestion.title}</h4>
                          <Badge variant={getPriorityColor(suggestion.priority)} className="text-xs">
                            {suggestion.priority}
                          </Badge>
                          {appliedSuggestions.has(suggestion.id) && (
                            <Badge variant="outline" className="text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Applied
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {suggestion.description}
                        </p>

                        <AnimatePresence>
                          {selectedSuggestion === suggestion.id && suggestion.implementation && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-2 pt-2 border-t"
                            >
                              <p className="text-xs text-muted-foreground">
                                <strong>How to implement:</strong> {suggestion.implementation}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {selectedSuggestion === suggestion.id && suggestion.actionable && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplySuggestion(suggestion);
                              }}
                              disabled={appliedSuggestions.has(suggestion.id)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Apply
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                copySuggestion(suggestion);
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        )}
                      </div>

                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform
                        ${selectedSuggestion === suggestion.id ? 'rotate-90' : ''}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}

        {suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>{suggestions.length} suggestions available</span>
            <span>{appliedSuggestions.size} applied</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}