'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Download, Code, Clock, Cpu, Hash, Link2, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface WidgetData {
  id: string;
  htmlContent: string;
  metadata: {
    model: string;
    tokens: {
      input: number;
      output: number;
    };
    duration: number;
    timestamp: string;
  };
  userPrompt: string;
  parentWidgetId?: string;
  version: number;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
}

export default function WidgetViewerPage() {
  const params = useParams();
  const widgetId = params.id as string;
  const [widget, setWidget] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [widgetHistory, setWidgetHistory] = useState<WidgetData[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchWidget();
  }, [widgetId]);

  const fetchWidget = async () => {
    try {
      const response = await fetch(`/api/widgets/${widgetId}`);
      if (!response.ok) {
        throw new Error('Widget not found');
      }
      const data = await response.json();
      setWidget(data);
      
      // Load widget content into iframe
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(createCompleteHTML(data.htmlContent));
          doc.close();
        }
      }
    } catch (error) {
      console.error('Failed to fetch widget:', error);
      toast.error('Widget not found');
    } finally {
      setLoading(false);
    }
  };

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
              background: white;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const downloadHTML = () => {
    if (!widget) return;
    const blob = new Blob([createCompleteHTML(widget.htmlContent)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `widget-${widget.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Widget Not Found</h1>
        <p className="text-muted-foreground">The requested widget could not be found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-background dark:bg-background rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-primary-foreground mb-2">
                AI Generated Widget
              </h1>
              <p className="text-muted-foreground dark:text-muted-foreground">
                {widget.userPrompt}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                title="Copy link"
              >
                <Link2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowCode(!showCode)}
                title="View code"
              >
                <Code className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={downloadHTML}
                title="Download HTML"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted dark:bg-secondary rounded-lg">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="text-sm font-medium">{widget.metadata.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Tokens</p>
                <p className="text-sm font-medium">
                  {widget.metadata.tokens.input} → {widget.metadata.tokens.output}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">{formatDuration(widget.metadata.duration)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Version</p>
                <p className="text-sm font-medium">v{widget.version}</p>
              </div>
            </div>
          </div>

          {/* Version History Toggle */}
          {widget.version > 1 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              View version history ({widget.version} versions)
            </button>
          )}
        </div>

        {/* Version History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-background dark:bg-background rounded-xl shadow-lg p-6 mb-6"
            >
              <h2 className="text-lg font-semibold mb-4">Version History</h2>
              <div className="space-y-2">
                {widgetHistory.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between p-3 bg-muted dark:bg-secondary rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Version {version.version}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(version.createdAt)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/widget/${version.id}`, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget Content */}
        <div className="bg-background dark:bg-background rounded-xl shadow-lg overflow-hidden">
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <pre className="bg-background text-muted-foreground p-4 rounded-lg overflow-x-auto">
                  <code>{widget.htmlContent}</code>
                </pre>
              </motion.div>
            ) : (
              <motion.div
                key="widget"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <iframe
                  ref={iframeRef}
                  className="w-full"
                  style={{ minHeight: '500px', height: 'auto' }}
                  sandbox="allow-scripts allow-same-origin"
                  title={`Widget ${widget.id}`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Created on {formatDate(widget.createdAt)} • 
          Widget ID: {widget.id}
        </div>
      </div>
    </div>
  );
}