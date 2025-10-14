'use client';

import { useState, useEffect } from 'react';
import { X, Download, Minimize2, AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ContextDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'thread' | 'report';
  entityId: string;
  currentTokens: number;
  maxTokens?: number;
}

export default function ContextDetailsModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  currentTokens,
  maxTokens = 200000,
}: ContextDetailsModalProps) {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    beforeTokens: number;
    afterTokens: number;
    savings: number;
  } | null>(null);

  // Fetch markdown content when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMarkdownContent();
    }
  }, [isOpen, entityId, entityType]);

  const fetchMarkdownContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/playground/${entityType}s/${entityId}/context-markdown`,
        {
          credentials: 'include', // Include cookies for authentication
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Context fetch failed:', {
          status: response.status,
          error,
          entityType,
          entityId
        });
        // Provide user-friendly error message
        if (response.status === 403) {
          throw new Error('Access denied. This may be because the thread or report was created by another user.');
        } else if (response.status === 404) {
          throw new Error(`${entityType === 'thread' ? 'Thread' : 'Report'} not found.`);
        }
        throw new Error(error.error || `Failed to fetch context (${response.status})`);
      }
      const data = await response.json();
      console.log('✅ Context loaded:', { entityType, entityId, markdownLength: data.markdown?.length });
      setMarkdownContent(data.markdown || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load context');
      console.error('Error fetching markdown:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompress = async () => {
    setIsCompressing(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/playground/${entityType}s/${entityId}/compress-context`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({
            currentContent: markdownContent,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Failed to compress context (${response.status})`);
      }

      const data = await response.json();
      setMarkdownContent(data.compressedContent);
      setCompressionStats({
        beforeTokens: currentTokens,
        afterTokens: data.newTokenCount,
        savings: Math.round(
          ((currentTokens - data.newTokenCount) / currentTokens) * 100
        ),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to compress context'
      );
      console.error('Error compressing:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `context-${entityType}-${entityId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const percentage = Math.min((currentTokens / maxTokens) * 100, 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0A0E1A] border border-[#1E2432] rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2432]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">
                Context Details
              </span>
              <span className="text-gray-500 text-xs font-mono">
                {entityType.toUpperCase()}
              </span>
            </div>
            {/* Token Usage Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <span className="text-blue-400 text-xs font-mono font-bold">
                {currentTokens.toLocaleString()} / {maxTokens.toLocaleString()}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  percentage >= 90
                    ? 'text-red-400'
                    : percentage >= 75
                    ? 'text-orange-400'
                    : 'text-green-400'
                }`}
              >
                {Math.round(percentage)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isLoading || !markdownContent}
              className="p-2 hover:bg-white/5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download as Markdown"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Compression Stats */}
        {compressionStats && (
          <div className="px-6 py-3 bg-green-500/10 border-b border-green-500/20 flex items-center gap-3">
            <Minimize2 className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm">
              Compressed successfully! Saved{' '}
              <span className="font-bold">
                {(compressionStats.beforeTokens - compressionStats.afterTokens).toLocaleString()} tokens
              </span>{' '}
              ({compressionStats.savings}%)
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : markdownContent ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  // Custom styling for markdown elements
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold text-white mb-3 mt-6">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-white mb-2 mt-4">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-300 mb-3 leading-relaxed">
                      {children}
                    </p>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-gray-900 text-gray-200 p-3 rounded-lg overflow-x-auto text-sm font-mono">
                        {children}
                      </code>
                    ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">
                      {children}
                    </ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No context available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1E2432] bg-[#0D1117]">
          <div className="text-xs text-gray-500 font-mono">
            {markdownContent
              ? `${markdownContent.split('\n').length} lines · ${markdownContent.length} chars`
              : ''}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleCompress}
              disabled={isCompressing || isLoading || !markdownContent}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <Minimize2 className="w-4 h-4" />
                  Compress Context
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
