'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, CheckCircle2, AlertCircle, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportSection, ReportSectionData } from './ReportSection';

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
  onReportComplete?: (reportId: string) => void;
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
                console.log('[ReportGenerator] Report complete, reportId:', data.reportId);
                setStatus('complete');
                setProgress(100);
                if (data.reportId) {
                  onReportComplete?.(data.reportId);
                } else {
                  console.error('[ReportGenerator] No reportId in complete event');
                }
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

      // Fallback: if stream ends without complete event
      if (accumulatedContent && status === 'generating') {
        console.warn('[ReportGenerator] Stream ended without complete event');
        setStatus('complete');
        setProgress(100);
        // Don't call onReportComplete here since we don't have a reportId
        // The report should have been saved on the backend and we should have received a complete event
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

      <div className="flex-1 max-w-full">
        {/* Progress Header */}
        {status === 'generating' && (
          <Card className="p-4 mb-4">
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
              </div>
            </div>
          </Card>
        )}

        {/* Real-time Section Display - Show during generation AND after completion */}
        {(status === 'generating' || status === 'complete') && sections.length > 0 && (
          <div className="space-y-4 report-content">
            <AnimatePresence mode="popLayout">
              {sections.map((section, index) => {
                const sectionData: ReportSectionData = {
                  id: section.id,
                  title: section.title,
                  content: section.content,
                  order: section.order,
                  status: 'complete'
                };
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                  >
                    <ReportSection section={sectionData} isLoading={false} />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Loading indicator for next section - only while generating */}
            {status === 'generating' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-4"
              >
                <div className="flex space-x-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{
                        duration: 1.2,
                        delay: i * 0.2,
                        repeat: Infinity
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Completion indicator - subtle, doesn't replace sections */}
        {status === 'complete' && sections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
          >
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Report generation complete • {sections.length} sections • {content.length.toLocaleString()} characters</span>
          </motion.div>
        )}

        {/* Error Card */}
        {status === 'error' && (
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Error: {error}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Check browser console for details
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
