'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Send, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddSectionButtonProps {
  reportId: string;
  position: number;
  onSectionAdded: () => void;
}

export default function AddSectionButton({
  reportId,
  position,
  onSectionAdded,
}: AddSectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

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

  const suggestions = [
    'Add a bar chart comparing monthly revenue',
    'Create a table showing top 5 expenses',
    'Add key financial metrics for Q4',
    'Show year-over-year growth comparison',
    'Add cash flow analysis section',
  ];

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
          <p className="text-sm text-muted-foreground mb-2">Quick suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setPrompt(suggestion)}
                disabled={isGenerating}
                className="text-xs px-3 py-1 rounded-full bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
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
