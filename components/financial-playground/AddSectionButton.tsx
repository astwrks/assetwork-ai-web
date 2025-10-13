'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Send, Loader2, Sparkles, Zap, TrendingUp, Award } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddSectionButtonProps {
  reportId: string;
  position: number;
  onSectionAdded: () => void;
}

// Predefined prompts by complexity level
const SIMPLE_PROMPTS = [
  'Add a summary of key metrics',
  'Create a simple revenue chart',
  'Show monthly expenses table',
  'Add quarterly performance overview',
  'Display profit margin analysis',
  'Show customer growth metrics',
];

const INTERMEDIATE_PROMPTS = [
  'Compare revenue vs expenses with year-over-year trends',
  'Analyze customer acquisition cost and lifetime value',
  'Create a cash flow forecast for next 6 months',
  'Show product performance breakdown by region',
  'Analyze operational efficiency metrics with benchmarks',
  'Compare budget vs actual with variance analysis',
];

const ADVANCED_PROMPTS = [
  'Perform scenario analysis showing best/worst case financial projections with sensitivity tables',
  'Create a comprehensive competitive analysis with market share trends and positioning matrix',
  'Build a discounted cash flow (DCF) valuation model with WACC calculation and terminal value',
  'Analyze working capital optimization with days sales outstanding and inventory turnover metrics',
  'Generate a strategic financial dashboard with KPIs, variance analysis, and executive insights',
  'Create a risk-adjusted portfolio analysis with correlation matrix and Sharpe ratios',
];

export default function AddSectionButton({
  reportId,
  position,
  onSectionAdded,
}: AddSectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeTab, setActiveTab] = useState<'simple' | 'intermediate' | 'advanced'>('simple');
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsGenerating(true);
    setStreamingContent('');

    try {
      const response = await fetch(
        `/api/playground/reports/${reportId}/sections`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            position,
            type: 'custom',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create section');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'content') {
                  accumulated += data.content;
                  setStreamingContent(accumulated);
                } else if (data.type === 'complete') {
                  toast.success('Section added successfully');
                  setPrompt('');
                  setIsOpen(false);
                  onSectionAdded();
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error('Failed to create section');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch context-aware suggestions when dialog opens
  useEffect(() => {
    if (isOpen && !loadingSuggestions) {
      fetchSmartSuggestions();
    }
  }, [isOpen]);

  const fetchSmartSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/playground/reports/${reportId}/suggestions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestions) {
          setContextualSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      // Keep predefined suggestions on error
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Get current prompts based on active tab
  const getCurrentPrompts = () => {
    switch (activeTab) {
      case 'simple':
        return SIMPLE_PROMPTS;
      case 'intermediate':
        return INTERMEDIATE_PROMPTS;
      case 'advanced':
        return ADVANCED_PROMPTS;
      default:
        return SIMPLE_PROMPTS;
    }
  };

  if (!isOpen) {
    return (
      <div className="flex items-center justify-center my-4 group">
        <div className="flex-1 h-px bg-gray-200 group-hover:bg-primary/30 transition-colors" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="mx-4 border border-dashed border-gray-300 hover:border-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
        <div className="flex-1 h-px bg-gray-200 group-hover:bg-primary/30 transition-colors" />
      </div>
    );
  }

  return (
    <div className="my-6 p-6 border-2 border-dashed border-primary/30 rounded-lg bg-blue-50/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Add New Section</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setPrompt('');
            setStreamingContent('');
          }}
          disabled={isGenerating}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Describe the section you want to add
          </label>
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Add a bar chart comparing monthly revenue..."
              disabled={isGenerating}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  handleGenerate();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-3">Quick Prompts by Complexity:</p>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'simple' | 'intermediate' | 'advanced')}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="simple" className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Simple</span>
              </TabsTrigger>
              <TabsTrigger value="intermediate" className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Intermediate</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Advanced</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="mt-0">
              <div className="flex flex-wrap gap-2">
                {SIMPLE_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(promptText)}
                    disabled={isGenerating}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-400 text-green-800 transition-colors disabled:opacity-50 text-left"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="intermediate" className="mt-0">
              <div className="flex flex-wrap gap-2">
                {INTERMEDIATE_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(promptText)}
                    disabled={isGenerating}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-400 text-blue-800 transition-colors disabled:opacity-50 text-left"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="mt-0">
              <div className="flex flex-wrap gap-2">
                {ADVANCED_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(promptText)}
                    disabled={isGenerating}
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-400 text-purple-800 transition-colors disabled:opacity-50 text-left"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Contextual AI-generated suggestions */}
          {contextualSuggestions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                AI-suggested based on your report:
              </p>
              <div className="flex flex-wrap gap-2">
                {contextualSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(suggestion)}
                    disabled={isGenerating}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-primary/30 hover:border-primary text-primary transition-colors disabled:opacity-50 text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {streamingContent && (
          <div className="border border-primary/20 rounded-lg p-4 bg-white">
            <p className="text-sm font-medium text-foreground mb-2">Preview:</p>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: streamingContent }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
