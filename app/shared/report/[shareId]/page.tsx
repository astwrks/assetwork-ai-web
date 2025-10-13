import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import Thread from '@/lib/db/models/Thread';
import { TrendingUp, Calendar, User, Globe } from 'lucide-react';
import './shared-report.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    shareId: string;
  }>;
}

export default async function SharedReportPage({ params }: PageProps) {
  const { shareId } = await params;

  await connectToDatabase();

  // Find report by shareId using MongoDB
  const report = await PlaygroundReport.findOne({
    'publicShare.shareId': shareId,
  }).lean();

  if (!report) {
    notFound();
  }

  // Check if share is active and not expired
  const publicShare = report.publicShare as any;
  if (!publicShare?.isActive) {
    notFound();
  }

  if (publicShare?.expiresAt && new Date(publicShare.expiresAt) < new Date()) {
    notFound();
  }

  // Fetch thread separately
  const thread = await Thread.findById(report.threadId).lean();

  const createdDate = new Date(publicShare?.createdAt || report.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const metadata = report.metadata as any;
  const usage = report.usage as any;
  const insights = (report.insights || []) as any[];
  const creatorEmail = publicShare?.createdBy || metadata?.generatedBy || 'Anonymous';
  const creatorName = creatorEmail.split('@')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AssetWorks Header */}
      <header className="bg-gradient-to-r from-[#1B2951] to-[#405D80] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AssetWorks</h1>
                <p className="text-sm text-white/80">Financial Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">Public Report</span>
            </div>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Report Title & Metadata */}
        <div className="mb-8 pb-6 border-b-2 border-gray-200">
          <h2 className="text-4xl font-bold text-[#1B2951] mb-4">
            {thread?.title || 'Financial Analysis Report'}
          </h2>

          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#405D80]" />
              <span className="font-medium">Published:</span>
              <span>{createdDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#405D80]" />
              <span className="font-medium">Created by:</span>
              <span>{creatorName}</span>
            </div>
            {metadata?.model && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#405D80]" />
                <span className="font-medium">Generated with:</span>
                <span className="text-[#405D80] font-semibold">AI-Powered Analysis</span>
              </div>
            )}
          </div>
        </div>

        {/* Key Insights */}
        {insights.length > 0 && (
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-l-4 border-[#1B2951] rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-[#1B2951] mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Key Insights
            </h3>
            <div className="space-y-3">
              {insights.map((insight: any) => (
                <div
                  key={insight.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    insight.severity === 'critical'
                      ? 'bg-red-50 border-l-4 border-red-500'
                      : insight.severity === 'warning'
                      ? 'bg-yellow-50 border-l-4 border-yellow-500'
                      : insight.severity === 'success'
                      ? 'bg-green-50 border-l-4 border-green-500'
                      : 'bg-blue-50 border-l-4 border-blue-500'
                  }`}
                >
                  <span className="text-lg mt-0.5">
                    {insight.severity === 'critical' ? '⚠️' :
                     insight.severity === 'warning' ? '⚡' :
                     insight.severity === 'success' ? '✅' : 'ℹ️'}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          <div
            className="shared-report-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: report.htmlContent }}
          />
        </div>

        {/* Report Footer Info */}
        <div className="mt-8 p-6 bg-gray-100 rounded-lg border border-gray-200">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="font-medium text-gray-700 mb-1">About This Report</p>
              <p className="leading-relaxed">
                This financial analysis report was generated using AssetWorks' AI-powered platform.
                The data and insights presented are based on the specified parameters and available data sources at the time of generation.
              </p>
              {usage && (
                <p className="mt-2 text-xs text-gray-500">
                  Report generation used {usage.totalTokens?.toLocaleString() || 0} AI tokens
                  across {usage.operations?.length || 0} operations.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* AssetWorks Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1B2951] to-[#405D80] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-[#1B2951]">AssetWorks</p>
                <p className="text-xs text-gray-500">Financial Intelligence Platform</p>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>© {new Date().getFullYear()} AssetWorks. All rights reserved.</p>
              <p className="text-xs text-gray-500 mt-1">
                Powered by AI-driven financial analysis
              </p>
            </div>

            <div className="text-xs text-gray-500 text-center md:text-right">
              <p>This report is shared publicly</p>
              <p className="mt-1">Report ID: {shareId.substring(0, 8)}...</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 italic">
            This report contains proprietary information generated through AssetWorks.
            For more information, visit assetworks.ai
          </div>
        </div>
      </footer>
    </div>
  );
}
