import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { EntityHeader } from '@/components/entities/EntityHeader';
import { EntityStats } from '@/components/entities/EntityStats';
import { EntityInsights } from '@/components/entities/EntityInsights';
import { EntityReports } from '@/components/entities/EntityReports';
import { EntityMarkdown } from '@/components/entities/EntityMarkdown';

interface EntityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getEntityData(slug: string) {
  const entity = await prisma.entities.findUnique({
    where: { slug },
    include: {
      mentions: {
        include: {
          report: {
            select: {
              id: true,
              title: true,
              description: true,
              createdAt: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
      insights: {
        orderBy: { createdAt: 'desc' },
      },
      tags: {
        orderBy: { tag: 'asc' },
      },
    },
  });

  if (!entity) {
    return null;
  }

  // Calculate statistics
  const sentiments = entity.mentions
    .filter((m) => m.sentiment !== null)
    .map((m) => m.sentiment as number);

  const avgSentiment =
    sentiments.length > 0
      ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
      : null;

  const sentimentDistribution = {
    positive: sentiments.filter((s) => s > 0.3).length,
    neutral: sentiments.filter((s) => s >= -0.3 && s <= 0.3).length,
    negative: sentiments.filter((s) => s < -0.3).length,
  };

  // Group mentions by month for chart
  const mentionsByMonth: Record<string, number> = {};
  entity.mentions.forEach((m) => {
    const monthKey = new Date(m.createdAt).toISOString().substring(0, 7);
    mentionsByMonth[monthKey] = (mentionsByMonth[monthKey] || 0) + 1;
  });

  // Get unique reports
  const uniqueReports = Array.from(
    new Map(entity.mentions.map((m) => [m.report.id, m.report])).values()
  );

  return {
    entity,
    statistics: {
      avgSentiment,
      sentimentDistribution,
      mentionsByMonth,
      totalMentions: entity.mentions.length,
      uniqueReports: uniqueReports.length,
    },
    reports: uniqueReports,
  };
}

export default async function EntityPage({ params }: EntityPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to view entity details.</p>
        </div>
      </div>
    );
  }

  const { slug } = await params;
  const data = await getEntityData(slug);

  if (!data) {
    notFound();
  }

  const { entity, statistics, reports } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Entity Header */}
      <EntityHeader entity={entity} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics Dashboard */}
            <EntityStats entity={entity} statistics={statistics} />

            {/* AI Insights */}
            {entity.insights && entity.insights.length > 0 && (
              <EntityInsights insights={entity.insights} />
            )}

            {/* Master Markdown */}
            {entity.masterMarkdown && (
              <EntityMarkdown
                markdown={entity.masterMarkdown}
                entityName={entity.name}
              />
            )}

            {/* Related Reports Grid */}
            <EntityReports
              reports={reports}
              mentions={entity.mentions}
              entityName={entity.name}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Info</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Type</dt>
                  <dd className="font-medium">{entity.type}</dd>
                </div>
                {entity.ticker && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Ticker</dt>
                    <dd className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {entity.ticker}
                    </dd>
                  </div>
                )}
                {entity.industry && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Industry</dt>
                    <dd className="font-medium">{entity.industry}</dd>
                  </div>
                )}
                {entity.sector && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Sector</dt>
                    <dd className="font-medium">{entity.sector}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Total Mentions</dt>
                  <dd className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                    {entity.mentionCount}
                  </dd>
                </div>
                {entity.lastMentioned && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Last Mentioned</dt>
                    <dd className="font-medium">
                      {new Date(entity.lastMentioned).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>

              {entity.website && (
                <a
                  href={entity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Visit Website →
                </a>
              )}
            </div>

            {/* Tags */}
            {entity.tags && entity.tags.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {entity.tags.map((tagItem) => (
                    <span
                      key={tagItem.id}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
                    >
                      #{tagItem.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
