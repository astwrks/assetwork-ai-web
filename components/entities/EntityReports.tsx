'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Calendar, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  status: string;
}

interface Mention {
  id: string;
  reportId: string;
  context: string | null;
  sentiment: number | null;
  relevance: number | null;
  createdAt: Date;
}

interface EntityReportsProps {
  reports: Report[];
  mentions: Mention[];
  entityName: string;
}

export function EntityReports({ reports, mentions, entityName }: EntityReportsProps) {
  const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'sentiment'>('date');

  if (reports.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No Reports Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {entityName} hasn't been mentioned in any reports yet.
        </p>
      </div>
    );
  }

  // Create a map of reportId -> mention for quick lookup
  const mentionMap = new Map<string, Mention>();
  mentions.forEach((mention) => {
    mentionMap.set(mention.reportId, mention);
  });

  // Sort reports based on selected criteria
  const sortedReports = [...reports].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'relevance') {
      const aRelevance = mentionMap.get(a.id)?.relevance || 0;
      const bRelevance = mentionMap.get(b.id)?.relevance || 0;
      return bRelevance - aRelevance;
    }
    if (sortBy === 'sentiment') {
      const aSentiment = mentionMap.get(a.id)?.sentiment || 0;
      const bSentiment = mentionMap.get(b.id)?.sentiment || 0;
      return bSentiment - aSentiment;
    }
    return 0;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Related Reports ({reports.length})
        </h2>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'relevance' | 'sentiment')}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Date</option>
            <option value="relevance">Relevance</option>
            <option value="sentiment">Sentiment</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedReports.map((report) => {
          const mention = mentionMap.get(report.id);
          const sentiment = mention?.sentiment;
          const relevance = mention?.relevance;

          return (
            <Link
              key={report.id}
              href={`/playground/reports/${report.id}`}
              className="group block bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 border border-gray-200 dark:border-gray-600 rounded-lg p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
            >
              {/* Report Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {report.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      report.status === 'PUBLISHED'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>

                {/* Sentiment indicator */}
                {sentiment !== null && sentiment !== undefined && (
                  <div
                    className={`ml-3 p-2 rounded-lg ${
                      sentiment > 0.3
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                        : sentiment < -0.3
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'
                    }`}
                    title={`Sentiment: ${sentiment.toFixed(2)}`}
                  >
                    {sentiment > 0.3 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : sentiment < -0.3 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {report.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {report.description}
                </p>
              )}

              {/* Context from mention */}
              {mention?.context && (
                <div className="bg-white dark:bg-gray-800 rounded-md p-3 mb-3 border-l-4 border-blue-500">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                    Mention context:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic line-clamp-2">
                    "{mention.context}"
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs">
                {relevance !== null && relevance !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 w-16">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${relevance * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      {(relevance * 100).toFixed(0)}% relevant
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {entityName} mentioned in <span className="font-bold text-blue-600 dark:text-blue-400">{reports.length}</span> {reports.length === 1 ? 'report' : 'reports'}
        </p>
      </div>
    </div>
  );
}
