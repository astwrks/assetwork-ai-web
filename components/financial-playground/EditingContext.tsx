'use client';

import { useState, useEffect } from 'react';
import { X, Edit, Plus, Sparkles, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Section {
  _id: string;
  title: string;
  htmlContent: string;
  order: number;
}

interface EditingContextProps {
  type: 'edit' | 'add';
  section?: Section;
  position?: number;
  onCancel: () => void;
  onDone?: () => void;
  onSuggestionClick?: (suggestion: string) => void;
}

const FALLBACK_SUGGESTIONS = {
  edit: [
    'Add the latest quarter data',
    'Change visualization to bar chart',
    'Highlight key numbers in bold',
    'Include percentage changes',
    'Add trend indicators',
  ],
  add: [
    'Add bar chart comparing revenue trends',
    'Create table showing top 5 expenses',
    'Show key financial metrics dashboard',
    'Add year-over-year growth comparison',
    'Include cash flow analysis section',
  ],
};

export default function EditingContext({
  type,
  section,
  position,
  onCancel,
  onDone,
  onSuggestionClick,
}: EditingContextProps) {
  const [suggestions, setSuggestions] = useState<string[]>(FALLBACK_SUGGESTIONS[type]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Generate AI suggestions when component mounts
  useEffect(() => {
    const generateSuggestions = async () => {
      if (type === 'edit' && section) {
        setIsLoadingSuggestions(true);
        try {
          const response = await fetch('/api/playground/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'edit',
              sectionTitle: section.title,
              sectionContent: section.htmlContent.substring(0, 500), // Send first 500 chars for context
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.suggestions && data.suggestions.length > 0) {
              setSuggestions(data.suggestions);
            }
          }
        } catch (error) {
          console.error('Error generating suggestions:', error);
          // Keep fallback suggestions on error
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else if (type === 'add') {
        setIsLoadingSuggestions(true);
        try {
          const response = await fetch('/api/playground/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'add',
              position,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.suggestions && data.suggestions.length > 0) {
              setSuggestions(data.suggestions);
            }
          }
        } catch (error) {
          console.error('Error generating suggestions:', error);
          // Keep fallback suggestions on error
        } finally {
          setIsLoadingSuggestions(false);
        }
      }
    };

    generateSuggestions();
  }, [type, section, position]);

  return (
    <div className="border-t border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {type === 'edit' ? (
            <>
              <Edit className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Editing Section
              </span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Adding Section {position !== undefined ? `at position ${position + 1}` : ''}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onDone && type === 'edit' && (
            <Button
              variant="default"
              size="sm"
              onClick={onDone}
              className="h-7 px-3 bg-primary hover:bg-primary/90 text-white"
            >
              <Check className="w-3 h-3 mr-1" />
              Done Editing
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 px-3 hover:bg-white/80 border border-gray-300"
            title="Exit without making changes"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs">Cancel</span>
          </Button>
        </div>
      </div>

      {/* Section Preview (for edit mode) */}
      {type === 'edit' && section && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-1.5">
            Section Preview:
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-32 overflow-hidden relative">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              {section.title}
            </div>
            <div
              className="text-xs text-gray-600 line-clamp-3"
              dangerouslySetInnerHTML={{
                __html: section.htmlContent.substring(0, 200) + '...',
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      )}

      {/* AI-Powered Suggestions */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          {isLoadingSuggestions ? (
            <Loader2 className="w-3 h-3 text-primary animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 text-primary" />
          )}
          <span className="text-xs font-medium text-gray-600">
            {isLoadingSuggestions ? 'AI generating suggestions...' : 'AI-powered suggestions:'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              className="text-xs px-2.5 py-1 rounded-full bg-white hover:bg-gray-50 border border-gray-200 transition-colors disabled:opacity-50"
              disabled={isLoadingSuggestions}
              onClick={() => {
                if (onSuggestionClick) {
                  // Call the parent's handler to automatically send the suggestion
                  onSuggestionClick(suggestion);
                } else {
                  // Fallback: populate input field
                  const inputElement = document.querySelector(
                    '.chat-input-field'
                  ) as HTMLInputElement;
                  if (inputElement) {
                    inputElement.value = suggestion;
                    inputElement.focus();
                  }
                }
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
