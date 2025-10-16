import prisma from '@/lib/db/prisma';
import fs from 'fs';
import path from 'path';

export type TimeRange = 'day' | 'week' | 'month' | 'year';

export interface ActivityMetrics {
  reportsGenerated: number;
  entitiesTracked: number;
  templatesUsed: number;
  pdfsExported: number;
  sectionsEdited: number;
  totalThreads: number;
  mostActiveTopics: Array<{ topic: string; count: number }>;
  topEntities: Array<{ name: string; symbol?: string; mentions: number }>;
}

export interface ActivitySummary {
  timeRange: TimeRange;
  startDate: Date;
  endDate: Date;
  metrics: ActivityMetrics;
  recentThreads: Array<{
    id: string;
    title: string;
    updatedAt: Date;
    messageCount: number;
  }>;
}

export interface ProjectContext {
  filename: string;
  content: string;
  lastModified: Date;
  keyInsights: string[];
}

export class ContextAggregationService {

  /**
   * Get start date based on time range
   */
  private getStartDate(range: TimeRange): Date {
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return startDate;
  }

  /**
   * Aggregate user activity from database
   */
  async aggregateUserActivity(
    userId: string,
    timeRange: TimeRange
  ): Promise<ActivitySummary> {
    const startDate = this.getStartDate(timeRange);
    const endDate = new Date();

    try {
      // Get reports generated
      const reportsCount = await prisma.reports.count({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Get entities tracked (unique)
      const entityMentions = await prisma.entity_mentions.findMany({
        where: {
          report: {
            userId,
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          entity: true,
        },
        distinct: ['entityId'],
      });

      // Get top entities with mention counts
      const topEntities = await prisma.entity_mentions.groupBy({
        by: ['entityId'],
        where: {
          report: {
            userId,
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          entityId: true,
        },
        orderBy: {
          _count: {
            entityId: 'desc',
          },
        },
        take: 10,
      });

      // Fetch entity details for top entities
      const topEntityDetails = await Promise.all(
        topEntities.map(async (item) => {
          const entity = await prisma.entities.findUnique({
            where: { id: item.entityId },
          });
          return {
            name: entity?.name || 'Unknown',
            symbol: entity?.symbol || undefined,
            mentions: item._count.entityId,
          };
        })
      );

      // Get threads count
      const threadsCount = await prisma.threads.count({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Get recent threads with message counts
      const recentThreads = await prisma.threads.findMany({
        where: {
          userId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
      });

      // Get message counts for recent threads
      const recentThreadsWithCounts = await Promise.all(
        recentThreads.map(async (thread) => {
          const messageCount = await prisma.messages.count({
            where: { threadId: thread.id },
          });
          return {
            id: thread.id,
            title: thread.title,
            updatedAt: thread.updatedAt,
            messageCount,
          };
        })
      );

      // Get templates used (estimate from reports metadata)
      const templatesUsed = 0; // Placeholder - implement when templates are tracked

      // Get PDFs exported (estimate from reports)
      const pdfsExported = 0; // Placeholder - implement export tracking

      // Get sections edited
      const sectionsEdited = await prisma.report_sections.count({
        where: {
          report: {
            userId,
          },
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
          version: {
            gt: 1, // Edited sections have version > 1
          },
        },
      });

      // Analyze most active topics (from thread titles)
      const threads = await prisma.threads.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          title: true,
        },
      });

      const topicCounts = new Map<string, number>();
      threads.forEach((thread) => {
        const words = thread.title
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 4); // Only significant words

        words.forEach((word) => {
          topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
        });
      });

      const mostActiveTopics = Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count }));

      const metrics: ActivityMetrics = {
        reportsGenerated: reportsCount,
        entitiesTracked: entityMentions.length,
        templatesUsed,
        pdfsExported,
        sectionsEdited,
        totalThreads: threadsCount,
        mostActiveTopics,
        topEntities: topEntityDetails,
      };

      return {
        timeRange,
        startDate,
        endDate,
        metrics,
        recentThreads: recentThreadsWithCounts,
      };
    } catch (error) {
      console.error('Error aggregating user activity:', error);
      throw new Error('Failed to aggregate user activity');
    }
  }

  /**
   * Parse project documentation (.md files)
   */
  async parseProjectDocs(): Promise<ProjectContext[]> {
    try {
      const projectRoot = process.cwd();
      const contexts: ProjectContext[] = [];

      // List of important .md files to parse
      const mdFiles = [
        'CLAUDE_SESSION_CONTEXT.md',
        'PRODUCT_VISION.md',
        'IMPLEMENTATION_SUMMARY.md',
        'FINANCIAL_PLAYGROUND_TESTING.md',
        'AI_SUMMARY_DASHBOARD_PLAN.md',
      ];

      for (const filename of mdFiles) {
        const filePath = path.join(projectRoot, filename);

        try {
          // Check if file exists
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const stats = fs.statSync(filePath);

            // Extract key insights (simple heuristic: lines starting with ## or - or bullet points)
            const lines = content.split('\n');
            const keyInsights = lines
              .filter(
                (line) =>
                  line.trim().startsWith('##') ||
                  line.trim().startsWith('- ') ||
                  line.trim().startsWith('✅') ||
                  line.trim().startsWith('🎯')
              )
              .map((line) => line.trim())
              .slice(0, 10); // Top 10 insights per file

            contexts.push({
              filename,
              content,
              lastModified: stats.mtime,
              keyInsights,
            });
          }
        } catch (fileError) {
          console.warn(`Could not read ${filename}:`, fileError);
          // Continue with other files
        }
      }

      return contexts;
    } catch (error) {
      console.error('Error parsing project docs:', error);
      return []; // Return empty array on error, don't fail the whole request
    }
  }

  /**
   * Generate AI summary using Claude
   */
  async generateActivitySummary(
    activity: ActivitySummary,
    projectContext: ProjectContext[],
    userName?: string
  ): Promise<string> {
    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');

      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      // Build context from project docs
      const recentWork = projectContext
        .map((ctx) => `${ctx.filename}:\n${ctx.keyInsights.join('\n')}`)
        .join('\n\n');

      // Build prompt
      const prompt = `You are a helpful AI assistant analyzing a user's activity in a financial analysis platform called AssetWorks.

User: ${userName || 'User'}
Time Period: ${activity.timeRange} (${activity.startDate.toLocaleDateString()} - ${activity.endDate.toLocaleDateString()})

Activity Metrics:
- Reports Generated: ${activity.metrics.reportsGenerated}
- Unique Entities Tracked: ${activity.metrics.entitiesTracked}
- Sections Edited: ${activity.metrics.sectionsEdited}
- Total Threads: ${activity.metrics.totalThreads}

Top Entities:
${activity.metrics.topEntities.map((e) => `- ${e.name}${e.symbol ? ` (${e.symbol})` : ''}: ${e.mentions} mentions`).join('\n')}

Recent Threads:
${activity.recentThreads.map((t) => `- ${t.title} (${t.messageCount} messages, updated ${t.updatedAt.toLocaleDateString()})`).join('\n')}

Most Active Topics:
${activity.metrics.mostActiveTopics.map((t) => `- ${t.topic} (${t.count} times)`).join('\n')}

Recent Project Work (for context):
${recentWork}

Task: Create a friendly, insightful 2-3 sentence summary of this user's activity. Focus on:
1. Main focus areas (which sectors/companies they analyzed)
2. Most significant reports or analyses
3. A personalized suggestion for follow-up work based on their patterns

Keep it conversational and actionable. Don't just list numbers - tell a story.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const summary = response.content[0].type === 'text'
        ? response.content[0].text
        : 'Unable to generate summary';

      return summary;
    } catch (error) {
      console.error('Error generating AI summary:', error);
      // Fallback to template-based summary
      return this.generateTemplateSummary(activity);
    }
  }

  /**
   * Fallback: Generate template-based summary (no AI)
   */
  private generateTemplateSummary(activity: ActivitySummary): string {
    const { metrics, timeRange } = activity;

    if (metrics.reportsGenerated === 0) {
      return `No activity in the past ${timeRange}. Start creating financial reports to see insights here!`;
    }

    const topEntity = metrics.topEntities[0];
    const topTopic = metrics.mostActiveTopics[0];

    return `Over the past ${timeRange}, you generated ${metrics.reportsGenerated} report${metrics.reportsGenerated > 1 ? 's' : ''} and tracked ${metrics.entitiesTracked} unique entities${topEntity ? `, with a focus on ${topEntity.name}` : ''}${topTopic ? `. Your most common topic was "${topTopic.topic}"` : ''}. Keep up the great work analyzing financial data!`;
  }
}

export const contextAggregationService = new ContextAggregationService();
