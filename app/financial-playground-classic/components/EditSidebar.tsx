/**
 * Edit Sidebar Component
 * Provides AI-powered editing interface for sections
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wand2,
  X,
  Send,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { SectionAISuggestions } from './SectionAISuggestions';

interface EditSidebarProps {
  section: any;
  reportId: string;
  onSubmitEdit: (prompt: string) => void;
  onCancel: () => void;
  isStreaming?: boolean;
}

export function EditSidebar({
  section,
  reportId,
  onSubmitEdit,
  onCancel,
  isStreaming = false
}: EditSidebarProps) {
  const [editPrompt, setEditPrompt] = useState('');

  const handleSubmit = () => {
    if (editPrompt.trim()) {
      onSubmitEdit(editPrompt);
      setEditPrompt('');
    }
  };

  const quickPrompts = [
    'Make this section more detailed',
    'Simplify the language',
    'Add a table summarizing the data',
    'Include visual charts',
    'Add risk analysis',
    'Expand on key metrics'
  ];

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Edit Section</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{section.title}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="suggestions">
              <Sparkles className="w-3 h-3 mr-1" />
              Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            {/* Quick Prompts */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Quick Actions
              </Label>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setEditPrompt(prompt)}
                    className="text-xs h-7"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Edit Prompt */}
            <div>
              <Label htmlFor="edit-prompt" className="text-sm mb-2 block">
                Describe your changes
              </Label>
              <Textarea
                id="edit-prompt"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="E.g., Add more details about revenue growth, include a comparison table, make the tone more professional..."
                className="min-h-[120px]"
                disabled={isStreaming}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!editPrompt.trim() || isStreaming}
              className="w-full"
            >
              {isStreaming ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Apply Edit
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="suggestions">
            <SectionAISuggestions
              reportId={reportId}
              sectionId={section.id}
              sectionTitle={section.title}
              onApplySuggestion={(suggestion) => {
                setEditPrompt(suggestion.description);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
