'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Maximize2, Minimize2, Copy, Check, RefreshCw, Code, Download, Link2, Cpu, Hash, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface WidgetRendererProps {
  htmlContent: string;
  isLoading?: boolean;
  messageId: string;
  onRegenerate?: () => void;
  onEnhance?: () => void;
  metadata?: {
    model: string;
    tokens: {
      input: number;
      output: number;
    };
    duration: number;
    timestamp: string;
  };
  widgetUrl?: string;
  widgetId?: string;
}

export function WidgetRenderer({ htmlContent, isLoading, messageId, onRegenerate, onEnhance, metadata, widgetUrl, widgetId }: WidgetRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(600);

  // Create a complete HTML document with all necessary styles
  const createCompleteHTML = (content: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: transparent;
              overflow-x: hidden;
            }
            /* Smooth animations */
            * {
              transition: all 0.3s ease;
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            // Auto-resize iframe to content
            function resizeIframe() {
              const height = document.body.scrollHeight;
              window.parent.postMessage({ type: 'resize', height: height, id: '${messageId}' }, '*');
            }
            
            // Initial resize
            setTimeout(resizeIframe, 100);
            
            // Resize on content changes
            const observer = new MutationObserver(resizeIframe);
            observer.observe(document.body, { childList: true, subtree: true });
            
            // Resize on window resize
            window.addEventListener('resize', resizeIframe);
          </script>
        </body>
      </html>
    `;
  };

  // Handle iframe resize messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'resize' && event.data.id === messageId) {
        // Allow taller heights for financial reports
        setIframeHeight(Math.min(event.data.height + 40, 1200));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [messageId]);

  // Load content into iframe
  useEffect(() => {
    if (iframeRef.current && htmlContent && !isLoading) {
      try {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          // Check if content is already a complete HTML document
          if (htmlContent.trim().toLowerCase().startsWith('<!doctype html') || 
              htmlContent.trim().toLowerCase().startsWith('<html')) {
            // Content is already complete HTML, write it directly
            doc.write(htmlContent);
          } else {
            // Content is just HTML fragment, wrap it
            doc.write(createCompleteHTML(htmlContent));
          }
          doc.close();
          setError(null);
        }
      } catch (err) {
        setError('Failed to render widget');
        console.error('Widget rendering error:', err);
      }
    }
  }, [htmlContent, isLoading, messageId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyWidgetLink = () => {
    if (widgetUrl) {
      const fullUrl = widgetUrl.startsWith('http') ? widgetUrl : `${window.location.origin}${widgetUrl}`;
      navigator.clipboard.writeText(fullUrl);
      toast.success('Widget link copied to clipboard');
    }
  };

  const saveAsHTML = () => {
    // Check if content is already complete HTML
    const isCompleteHTML = htmlContent.trim().toLowerCase().startsWith('<!doctype html') || 
                          htmlContent.trim().toLowerCase().startsWith('<html');
    const finalHTML = isCompleteHTML ? htmlContent : createCompleteHTML(htmlContent);
    
    const blob = new Blob([finalHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${messageId}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Generating widget...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="widget-renderer">
      <AnimatePresence mode="wait">
        {showCode ? (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            <div className="bg-background rounded-lg p-4 overflow-hidden">
              <pre className="text-sm text-muted-foreground overflow-x-auto">
                <code>{htmlContent}</code>
              </pre>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="widget"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`relative ${isExpanded ? 'fixed inset-4 z-50 bg-background dark:bg-background rounded-lg shadow-2xl' : ''}`}
          >
            <div className={`${isExpanded ? 'h-full flex flex-col' : ''}`}>
              {/* Metadata Bar */}
              {metadata && (
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-t-lg border-b border-border dark:border-border">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-blue-600" />
                      <span className="font-medium">{metadata.model}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-green-600" />
                      <span>{metadata.tokens.input} → {metadata.tokens.output} tokens</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-600" />
                      <span>{formatDuration(metadata.duration)}</span>
                    </div>
                    {widgetUrl && (
                      <button
                        onClick={copyWidgetLink}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <Link2 className="w-3 h-3" />
                        <span className="underline">Widget Link</span>
                      </button>
                    )}
                  </div>
                  {onEnhance && (
                    <button
                      onClick={onEnhance}
                      className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-primary-foreground text-xs rounded-md hover:from-purple-700 hover:to-pink-700 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Enhance
                    </button>
                  )}
                </div>
              )}
              
              {/* Widget toolbar */}
              <div className="flex items-center justify-between p-2 bg-muted dark:bg-secondary border-b border-border dark:border-border">
                <span className="text-xs text-muted-foreground dark:text-muted-foreground px-2">Interactive Widget</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="p-1.5 hover:bg-accent dark:hover:bg-accent rounded transition-colors"
                    title="View code"
                  >
                    <Code className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-accent dark:hover:bg-accent rounded transition-colors"
                    title="Copy HTML"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={saveAsHTML}
                    className="p-1.5 hover:bg-accent dark:hover:bg-accent rounded transition-colors"
                    title="Save as HTML"
                  >
                    <Download className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                  </button>
                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="p-1.5 hover:bg-accent dark:hover:bg-accent rounded transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1.5 hover:bg-accent dark:hover:bg-accent rounded transition-colors"
                    title={isExpanded ? "Minimize" : "Expand"}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Widget content iframe */}
              <div className={`bg-background dark:bg-background rounded-b-lg overflow-hidden ${isExpanded ? 'flex-1' : ''}`}>
                <iframe
                  ref={iframeRef}
                  className="w-full border-0"
                  style={{ 
                    height: isExpanded ? '100%' : `${iframeHeight}px`,
                    minHeight: '200px',
                    maxHeight: isExpanded ? '100%' : '800px'
                  }}
                  sandbox="allow-scripts allow-same-origin"
                  title={`Widget ${messageId}`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}