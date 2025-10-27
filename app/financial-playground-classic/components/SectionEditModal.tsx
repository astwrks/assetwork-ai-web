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
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Section {
  id: string;
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
}

interface SectionEditModalProps {
  section: Section;
  onClose: () => void;
  onSave: () => void;
}

export default function SectionEditModal({
  section,
  onClose,
  onSave,
}: SectionEditModalProps) {
  const [activeTab, setActiveTab] = useState('ai');
  const [prompt, setPrompt] = useState('');
  const [manualHtml, setManualHtml] = useState(section.htmlContent);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [previewHtml, setPreviewHtml] = useState(section.htmlContent);

  const handleAIEdit = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setStreamingContent('');

    try {
      const response = await fetch(
        `/api/v2/reports/${section.reportId}/sections/${section.id}`,
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
                  setStreamingContent(accumulated);
                  setPreviewHtml(accumulated);
                } else if (data.type === 'complete') {
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
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSave = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(
        `/api/v2/reports/${section.reportId}/sections/${section.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ htmlContent: manualHtml }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save section');
      }

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
        `/api/v2/reports/${section.reportId}/sections/${section.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ htmlContent }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to restore version');
      }

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-primary">Edit Section</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {section.title} · Version {section.version}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isGenerating}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI Edit
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <Code className="w-4 h-4" />
                Manual Edit
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                History ({section.editHistory?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* AI Edit Tab */}
          <TabsContent value="ai" className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  What would you like to change?
                </label>
                <div className="flex gap-2">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Add Q3 2024 data and show 25% growth"
                    disabled={isGenerating}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isGenerating) {
                        handleAIEdit();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAIEdit}
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
                <p className="text-sm text-muted-foreground mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {promptSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(suggestion)}
                      disabled={isGenerating}
                      className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
              {/* Current Version */}
              <div className="flex flex-col min-h-0">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Current Version
                </h3>
                <div
                  className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  dangerouslySetInnerHTML={{ __html: section.htmlContent }}
                />
              </div>

              {/* Preview */}
              <div className="flex-col min-h-0">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {isGenerating ? 'Generating...' : 'Preview'}
                </h3>
                <div className="flex-1 overflow-auto border border-primary/20 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
                  {streamingContent ? (
                    <div dangerouslySetInnerHTML={{ __html: streamingContent }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Preview will appear here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Manual Edit Tab */}
          <TabsContent value="manual" className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
              {/* HTML Editor */}
              <div className="flex flex-col min-h-0">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  HTML Code
                </h3>
                <textarea
                  value={manualHtml}
                  onChange={(e) => {
                    setManualHtml(e.target.value);
                    setPreviewHtml(e.target.value);
                  }}
                  disabled={isGenerating}
                  className="flex-1 font-mono text-sm p-4 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white dark:bg-gray-800"
                />
              </div>

              {/* Live Preview */}
              <div className="flex flex-col min-h-0">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Live Preview
                </h3>
                <div
                  className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isGenerating}>
                Cancel
              </Button>
              <Button
                onClick={handleManualSave}
                disabled={isGenerating}
                className="bg-primary hover:bg-primary/90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              {/* Current Version */}
              <div className="border border-primary rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-primary">
                      Version {section.version} (Current)
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleString()}
                  </span>
                </div>
                <div
                  className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 max-h-48 overflow-auto"
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
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-foreground">
                            Version {historyItem.version}
                          </span>
                          {historyItem.prompt && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Prompt: "{historyItem.prompt}"
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(historyItem.editedAt).toLocaleString()}
                          </span>
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
                          >
                            Restore
                          </Button>
                        </div>
                      </div>
                      <div
                        className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 max-h-48 overflow-auto"
                        dangerouslySetInnerHTML={{
                          __html: historyItem.htmlContent,
                        }}
                      />
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No previous versions
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
