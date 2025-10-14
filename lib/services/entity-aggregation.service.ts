import { Anthropic } from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db/prisma';

/**
 * Service for aggregating data from all reports mentioning an entity
 * into a master markdown file and generating AI insights
 */
export class EntityAggregationService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Generate master markdown for an entity
   * This creates a comprehensive profile by aggregating all mentions
   */
  async generateMasterMarkdown(entityId: string): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('Master markdown generation skipped: missing API key');
      return '';
    }

    // Fetch entity with all mentions
    const entity = await prisma.entities.findUnique({
      where: { id: entityId },
      include: {
        mentions: {
          include: {
            report: {
              select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 mentions
        },
        insights: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tags: true,
      },
    });

    if (!entity) {
      throw new Error('Entity not found');
    }

    // Prepare context for AI
    const mentionsContext = entity.mentions.map((m) => ({
      reportTitle: m.report.title,
      reportDescription: m.report.description,
      context: m.context,
      sentiment: m.sentiment,
      relevance: m.relevance,
      date: m.createdAt,
      metadata: m.metadata,
    }));

    // Generate markdown using AI
    const markdown = await this.generateMarkdownWithAI(entity, mentionsContext);

    // Save to database
    await prisma.entities.update({
      where: { id: entityId },
      data: {
        masterMarkdown: markdown,
        updatedAt: new Date(),
      },
    });

    console.log(`Generated master markdown for ${entity.name}`);
    return markdown;
  }

  /**
   * Use AI to generate comprehensive markdown from entity data
   */
  private async generateMarkdownWithAI(
    entity: any,
    mentions: any[]
  ): Promise<string> {
    const mentionsText = mentions
      .map(
        (m, idx) => `
### Mention ${idx + 1} - ${m.reportTitle} (${new Date(m.date).toLocaleDateString()})
- **Context**: ${m.context}
- **Sentiment**: ${m.sentiment?.toFixed(2) || 'N/A'}
- **Relevance**: ${m.relevance?.toFixed(2) || 'N/A'}
${m.metadata && Object.keys(m.metadata).length > 0 ? `- **Metrics**: ${JSON.stringify(m.metadata)}` : ''}
`
      )
      .join('\n');

    const prompt = `You are creating a comprehensive entity profile for "${entity.name}".

**Entity Information:**
- Name: ${entity.name}
- Type: ${entity.type}
- Industry: ${entity.industry || 'Unknown'}
- Sector: ${entity.sector || 'Unknown'}
- Ticker: ${entity.ticker || 'N/A'}
- Total Mentions: ${entity.mentionCount}
- Website: ${entity.website || 'N/A'}

**Recent Mentions from Reports:**
${mentionsText}

Create a well-structured, informative markdown document with the following sections:

# ${entity.name}

## Overview
[Write a comprehensive 2-4 sentence overview of this entity based on the mentions]

## Key Information
- **Type**: ${entity.type}
- **Industry**: ${entity.industry || 'N/A'}
- **Sector**: ${entity.sector || 'N/A'}
- **Ticker**: ${entity.ticker || 'N/A'}
- **Total Report Mentions**: ${entity.mentionCount}
- **First Mentioned**: ${entity.firstMentioned ? new Date(entity.firstMentioned).toLocaleDateString() : 'N/A'}
- **Last Mentioned**: ${entity.lastMentioned ? new Date(entity.lastMentioned).toLocaleDateString() : 'N/A'}

## Recent Activity & Developments
[Summarize recent mentions chronologically, highlighting key developments and events]

## Sentiment Analysis
[Analyze overall sentiment across mentions. Calculate average sentiment and explain trends]

## Key Topics & Themes
[Extract and list 5-10 main topics/themes associated with this entity based on the contexts]

## Financial Highlights
[Summarize any financial metrics, numbers, or performance data mentioned across reports]

## Related Reports Summary
[Create a brief summary of the reports that mention this entity, grouped by theme if applicable]

## Trends & Insights
[Identify any patterns, trends, or notable insights about this entity from the data]

---

**Last Updated**: ${new Date().toLocaleDateString()}

IMPORTANT:
- Make it informative and data-driven - use actual data from the mentions
- Be specific and cite information where relevant
- Use professional, financial language
- If data is missing, say "No data available" rather than making things up
- Highlight quantitative metrics when available
- Keep it well-structured and easy to scan`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        temperature: 0.5,
        messages: [{ role: 'user', content: prompt }],
      });

      return message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (error) {
      console.error('Failed to generate markdown with AI:', error);
      return `# ${entity.name}\n\nFailed to generate comprehensive profile. Please try again later.`;
    }
  }

  /**
   * Generate AI insights for an entity
   */
  async generateInsights(entityId: string): Promise<number> {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('Insight generation skipped: missing API key');
      return 0;
    }

    const entity = await prisma.entities.findUnique({
      where: { id: entityId },
      include: {
        mentions: {
          include: { report: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!entity || entity.mentions.length === 0) {
      return 0;
    }

    // Generate different types of insights
    let insightCount = 0;

    try {
      await this.generateSummaryInsight(entity);
      insightCount++;
    } catch (error) {
      console.error('Failed to generate summary insight:', error);
    }

    if (entity.mentions.length >= 3) {
      try {
        await this.generateTrendInsight(entity);
        insightCount++;
      } catch (error) {
        console.error('Failed to generate trend insight:', error);
      }
    }

    console.log(`Generated ${insightCount} insights for ${entity.name}`);
    return insightCount;
  }

  /**
   * Generate a summary insight
   */
  private async generateSummaryInsight(entity: any) {
    const prompt = `Based on ${entity.mentionCount} mentions of "${entity.name}" across financial reports, create a 2-3 sentence executive summary highlighting the most important aspects.

Recent mention contexts:
${entity.mentions.slice(0, 5).map((m: any) => `- ${m.context}`).join('\n')}

Write only the summary, no title or formatting.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';

    // Delete old summary insights
    await prisma.entity_insights.deleteMany({
      where: {
        entityId: entity.id,
        type: 'SUMMARY',
      },
    });

    // Create new summary insight
    await prisma.entity_insights.create({
      data: {
        entityId: entity.id,
        type: 'SUMMARY',
        title: `${entity.name} Overview`,
        content,
        sourceReportIds: entity.mentions
          .slice(0, 5)
          .map((m: any) => m.reportId),
        model: 'claude-3-5-sonnet-20241022',
      },
    });
  }

  /**
   * Generate a trend insight
   */
  private async generateTrendInsight(entity: any) {
    const sentiments = entity.mentions
      .filter((m: any) => m.sentiment !== null)
      .map((m: any) => ({
        date: m.createdAt,
        sentiment: m.sentiment,
      }));

    if (sentiments.length < 2) {
      return;
    }

    const avgSentiment =
      sentiments.reduce((sum: number, s: any) => sum + s.sentiment, 0) /
      sentiments.length;

    const prompt = `Analyze the trend for "${entity.name}" based on the following sentiment data over time:

${sentiments.map((s: any) => `- ${new Date(s.date).toLocaleDateString()}: ${s.sentiment.toFixed(2)}`).join('\n')}

Average sentiment: ${avgSentiment.toFixed(2)}

Identify:
1. Overall trend (improving, declining, stable)
2. Any notable shifts or patterns
3. What this might indicate

Keep it to 2-3 sentences, be specific and data-driven.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';

    // Delete old trend insights
    await prisma.entity_insights.deleteMany({
      where: {
        entityId: entity.id,
        type: 'TREND',
      },
    });

    // Create new trend insight
    await prisma.entity_insights.create({
      data: {
        entityId: entity.id,
        type: 'TREND',
        title: `${entity.name} Sentiment Trend`,
        content,
        sourceReportIds: entity.mentions.slice(0, 10).map((m: any) => m.reportId),
        model: 'claude-3-5-sonnet-20241022',
        metadata: { avgSentiment },
      },
    });
  }

  /**
   * Refresh entity data (regenerate markdown and insights)
   */
  async refreshEntity(entityId: string): Promise<void> {
    console.log(`Refreshing entity ${entityId}...`);
    await this.generateMasterMarkdown(entityId);
    await this.generateInsights(entityId);
    console.log(`Entity ${entityId} refreshed successfully`);
  }
}
