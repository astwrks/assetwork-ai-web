'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Code,
  History,
  Check,
  ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EditSidebarProps {
  section: {
    _id: string;
    reportId: string;
    title: string;
    htmlContent: string;
    version: number;
    editHistory?: Array<{
      version: number;
      htmlContent: string;
      prompt?: string;
      editedBy: string;
      editedAt: string;
    }>;
  };
  onClose: () => void;
  onContentUpdate: (content: string, isStreaming: boolean) => void;
  onSave: () => void;
}

export default function EditSidebar({
  section,
  onClose,
  onContentUpdate,
  onSave,
}: EditSidebarProps) {
  const [activeTab, setActiveTab] = useState('ai');
  const [prompt, setPrompt] = useState('');
  const [manualHtml, setManualHtml] = useState(section.htmlContent);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIEdit = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    onContentUpdate('', true); // Start streaming mode

    try {
      const response = await fetch(
        `/api/playground/reports/${section.reportId}/sections/${section._id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to edit section');
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
                  onContentUpdate(accumulated, true);
                } else if (data.type === 'complete') {
                  onContentUpdate(accumulated, false);
                  toast.success('Section updated successfully');
                  setPrompt('');
                  setTimeout(() => {
                    onSave();
                    onClose();
                  }, 500);
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
      console.error('Error editing section:', error);
      toast.error('Failed to edit section');
      onContentUpdate(section.htmlContent, false); // Restore original
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSave = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(
        `/api/playground/reports/${section.reportId}/sections/${section._id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ htmlContent: manualHtml }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save section');
      }

      onContentUpdate(manualHtml, false);
      toast.success('Section saved successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number, htmlContent: string) => {
    if (!confirm(`Restore to version ${versionNumber}?`)) return;

    setIsGenerating(true);

    try {
      const response = await fetch(
        `/api/playground/reports/${section.reportId}/sections/${section._id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ htmlContent }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to restore version');
      }

      onContentUpdate(htmlContent, false);
      toast.success(`Restored to version ${versionNumber}`);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    } finally {
      setIsGenerating(false);
    }
  };

  const promptSuggestions = [
    'Add Q3 2024 data',
    'Change to bar chart',
    'Make numbers bold',
    'Add percentage changes',
    'Include trend indicators',
    'Update colors to match brand',
  ];

  return (
    <div className="fixed top-0 right-0 h-full w-[400px] bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isGenerating}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Edit Section</h3>
            <p className="text-xs text-muted-foreground">{section.title}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isGenerating}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-3">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="ai" className="text-xs gap-1">
              <Sparkles className="w-3 h-3" />
              AI Edit
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs gap-1">
              <Code className="w-3 h-3" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1">
              <History className="w-3 h-3" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Edit Tab */}
        <TabsContent value="ai" className="flex-1 flex flex-col overflow-hidden p-4 gap-3 mt-0">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                What would you like to change?
              </label>
              <div className="flex gap-2">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Add Q3 2024 data..."
                  disabled={isGenerating}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isGenerating) {
                      handleAIEdit();
                    }
                  }}
                  className="flex-1 text-sm h-9"
                />
                <Button
                  onClick={handleAIEdit}
                  disabled={isGenerating || !prompt.trim()}
                  className="bg-primary hover:bg-primary/90 h-9"
                  size="sm"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {promptSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(suggestion)}
                    disabled={isGenerating}
                    className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isGenerating && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <p className="text-xs text-primary font-medium">
                AI is generating... watch the section update in real-time
              </p>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <Sparkles className="w-8 h-8 mx-auto opacity-20" />
              <p className="text-xs">
                Enter a prompt to edit this section with AI
              </p>
              <p className="text-xs opacity-70">
                Changes will appear in real-time
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Manual Edit Tab */}
        <TabsContent value="manual" className="flex-1 flex flex-col overflow-hidden p-4 gap-3 mt-0">
          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-xs font-medium text-foreground mb-1.5">
              HTML Code
            </label>
            <textarea
              value={manualHtml}
              onChange={(e) => {
                setManualHtml(e.target.value);
                onContentUpdate(e.target.value, false);
              }}
              disabled={isGenerating}
              className="flex-1 font-mono text-xs p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Edit HTML directly..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleManualSave}
              disabled={isGenerating}
              className="flex-1 bg-primary hover:bg-primary/90 h-9 text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 mr-1.5" />
                  Save
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 overflow-auto p-4 mt-0">
          <div className="space-y-3">
            {/* Current Version */}
            <div className="border border-primary rounded-lg p-3 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary">
                  Version {section.version} (Current)
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleString()}
                </span>
              </div>
              <div
                className="mt-2 p-2 bg-white rounded border border-gray-200 max-h-32 overflow-auto text-xs"
                dangerouslySetInnerHTML={{ __html: section.htmlContent }}
              />
            </div>

            {/* Previous Versions */}
            {section.editHistory && section.editHistory.length > 0 ? (
              section.editHistory
                .slice()
                .reverse()
                .map((historyItem) => (
                  <div
                    key={historyItem.version}
                    className="border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-semibold text-foreground">
                          Version {historyItem.version}
                        </span>
                        {historyItem.prompt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            &quot;{historyItem.prompt}&quot;
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRestoreVersion(
                            historyItem.version,
                            historyItem.htmlContent
                          )
                        }
                        disabled={isGenerating}
                        className="h-7 text-xs"
                      >
                        Restore
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {new Date(historyItem.editedAt).toLocaleString()}
                    </div>
                    <div
                      className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 max-h-32 overflow-auto text-xs"
                      dangerouslySetInnerHTML={{
                        __html: historyItem.htmlContent,
                      }}
                    />
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto opacity-20 mb-2" />
                <p className="text-xs">No previous versions</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
