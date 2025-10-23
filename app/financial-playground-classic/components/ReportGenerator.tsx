'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, CheckCircle2, AlertCircle, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Section {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface ReportGeneratorProps {
  threadId: string;
  prompt: string;
  model: string;
  systemPrompt?: any;
  onReportComplete?: (report: any) => void;
  onError?: (error: Error) => void;
  onContentUpdate?: (content: string) => void;
  onSectionsUpdate?: (sections: Section[]) => void;
  onShowReport?: () => void;
  onCancel?: () => void;
  abortControllerRef?: React.MutableRefObject<AbortController | null>;
  className?: string;
}

export function ReportGenerator({
  threadId,
  prompt,
  model,
  systemPrompt,
  onReportComplete,
  onError,
  onContentUpdate,
  onSectionsUpdate,
  onShowReport,
  onCancel,
  abortControllerRef,
  className,
}: ReportGeneratorProps) {
  const [status, setStatus] = useState<'generating' | 'complete' | 'error'>('generating');
  const [progress, setProgress] = useState(0);
  const [content, setContent] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateReport();
  }, [threadId, prompt]);

  const generateReport = async () => {
    try {
      setStatus('generating');
      setProgress(10);
      setSections([]);

      console.log('[ReportGenerator] Starting generation:', {
        threadId,
        prompt: prompt.substring(0, 50),
        model,
        systemPrompt: systemPrompt?.name || 'none',
      });

      // Create AbortController for this request
      const abortController = new AbortController();
      if (abortControllerRef) {
        abortControllerRef.current = abortController;
      }

      const response = await fetch('/api/v2/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: abortController.signal,
        body: JSON.stringify({
          threadId,
          prompt,
          model,
          systemPrompt: systemPrompt?.content || systemPrompt,
        }),
      });

      console.log('[ReportGenerator] Response status:', response.status);
      setProgress(20);

      if (!response.ok) {
        const errorData = await response.text().then(text => { 
          try { return JSON.parse(text); } 
          catch { return { error: text || "Unknown error" }; } 
        });
        console.error('[ReportGenerator] API error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      const accumulatedSections: Section[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[ReportGenerator] Stream complete');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content') {
                const textContent = data.content || data.data || '';
                accumulatedContent += textContent;
                setContent(accumulatedContent);
                onContentUpdate?.(accumulatedContent);
                setProgress(Math.min(85, 20 + (accumulatedContent.length / 100)));
              } 
              else if (data.type === 'sections') {
                const newSections = data.data || [];
                console.log('[ReportGenerator] Received sections:', newSections.length);
                
                accumulatedSections.push(...newSections);
                setSections([...accumulatedSections]);
                onSectionsUpdate?.([...accumulatedSections]);
                setProgress(Math.min(90, 20 + accumulatedSections.length * 5));
              }
              else if (data.type === 'complete') {
                console.log('[ReportGenerator] Report complete');
                setStatus('complete');
                setProgress(100);
                onReportComplete?.(data.report || { 
                  htmlContent: accumulatedContent,
                  sections: accumulatedSections 
                });
              } 
              else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              if (line.trim() && line !== 'data: ' && line !== 'data: [DONE]') {
                console.warn('[ReportGenerator] Failed to parse SSE line:', line);
              }
            }
          }
        }
      }

      if (accumulatedContent && status === 'generating') {
        setStatus('complete');
        setProgress(100);
        onReportComplete?.({ 
          htmlContent: accumulatedContent,
          sections: accumulatedSections 
        });
      }

    } catch (err) {
      // Check if it was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[ReportGenerator] Generation cancelled by user');
        setStatus('error');
        setError('Generation cancelled');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ReportGenerator] Generation failed:', errorMessage, err);
      setStatus('error');
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  };

  return (
    <div className={className || "flex gap-3 mb-6"}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
        {status === 'generating' && <Loader2 className="w-4 h-4 animate-spin" />}
        {status === 'complete' && <CheckCircle2 className="w-4 h-4" />}
        {status === 'error' && <AlertCircle className="w-4 h-4" />}
      </div>

      <div className="flex-1 max-w-[85%]">
        <Card className="p-4">
          {status === 'generating' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Generating comprehensive financial report...</span>
                </div>
                {onCancel && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={onCancel}
                    className="h-7"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{sections.length} sections</span>
                <span>•</span>
                <span>{content.length.toLocaleString()} characters</span>
                {onShowReport && (
                  <>
                    <span>•</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-xs font-normal"
                      onClick={onShowReport}
                    >
                      View in Report panel →
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {status === 'complete' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Report Generated Successfully</span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Generated a comprehensive financial analysis with {sections.length} sections 
                  and {content.length.toLocaleString()} characters using {model}.
                </p>
                {sections.length > 0 && (
                  <div className="text-xs">
                    <strong>Sections included:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {sections.slice(0, 5).map((section, i) => (
                        <li key={i}>{section.title}</li>
                      ))}
                      {sections.length > 5 && (
                        <li>...and {sections.length - 5} more sections</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              {onShowReport && (
                <Button 
                  onClick={onShowReport}
                  className="w-full mt-2"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Open Full Report
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Error: {error}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Check browser console for details
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
