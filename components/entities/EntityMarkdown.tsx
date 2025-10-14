'use client';

import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface EntityMarkdownProps {
  markdown: string;
  entityName: string;
}

export function EntityMarkdown({ markdown, entityName }: EntityMarkdownProps) {
  const [expanded, setExpanded] = useState(true);

  if (!markdown) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No Master Document Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          The comprehensive profile for {entityName} is being generated. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {entityName} - Master Profile
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Comprehensive analysis aggregated from all reports
            </p>
          </div>
        </div>

        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Markdown Content */}
      {expanded && (
        <div className="p-6">
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Customize heading styles
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-blue-600"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-8 mb-4"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-6 mb-3"
                    {...props}
                  />
                ),
                // Customize paragraph styles
                p: ({ node, ...props }) => (
                  <p
                    className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4"
                    {...props}
                  />
                ),
                // Customize list styles
                ul: ({ node, ...props }) => (
                  <ul
                    className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4"
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-gray-700 dark:text-gray-300" {...props} />
                ),
                // Customize blockquote
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg italic text-gray-700 dark:text-gray-300"
                    {...props}
                  />
                ),
                // Customize code blocks
                code: ({ node, inline, ...props }: any) =>
                  inline ? (
                    <code
                      className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded text-sm font-mono"
                      {...props}
                    />
                  ) : (
                    <code
                      className="block p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm font-mono overflow-x-auto"
                      {...props}
                    />
                  ),
                // Customize tables
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table
                      className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg"
                      {...props}
                    />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700"
                    {...props}
                  />
                ),
                // Customize links
                a: ({ node, ...props }) => (
                  <a
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                // Customize horizontal rules
                hr: ({ node, ...props }) => (
                  <hr
                    className="my-8 border-t-2 border-gray-200 dark:border-gray-700"
                    {...props}
                  />
                ),
                // Customize strong/bold text
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-gray-900 dark:text-white" {...props} />
                ),
                // Customize emphasis/italic text
                em: ({ node, ...props }) => (
                  <em className="italic text-gray-800 dark:text-gray-200" {...props} />
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Auto-generated from all reports mentioning {entityName}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            Master Document
          </span>
        </div>
      </div>
    </div>
  );
}
