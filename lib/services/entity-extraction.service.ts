import { Anthropic } from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

interface ExtractedEntity {
  name: string;
  type: 'COMPANY' | 'STOCK' | 'PERSON' | 'PRODUCT' | 'SECTOR' | 'CRYPTOCURRENCY' | 'COMMODITY' | 'INDEX' | 'ETF';
  ticker?: string;
  context: string;
  sentiment: number; // -1 to 1
  relevance: number; // 0 to 1
  metadata?: Record<string, any>;
}

/**
 * Service for extracting named entities from financial reports using AI
 */
export class EntityExtractionService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Extract entities from report content using Claude
   */
  async extractEntities(content: string): Promise<ExtractedEntity[]> {
    if (!content || !process.env.ANTHROPIC_API_KEY) {
      console.warn('Entity extraction skipped: missing content or API key');
      return [];
    }

    try {
      const prompt = `You are a financial entity extraction AI. Extract all named entities from the following financial report.

For each entity, provide:
1. name: The entity name (standardized, e.g., "Bharti Airtel Limited" → "Airtel")
2. type: COMPANY, STOCK, PERSON, PRODUCT, SECTOR, CRYPTOCURRENCY, COMMODITY, INDEX, or ETF
3. ticker: Stock ticker if applicable (e.g., "BHARTIARTL.NS" for Airtel on NSE, "AAPL" for Apple)
4. context: The sentence or paragraph where the entity was mentioned (keep it concise, max 200 chars)
5. sentiment: Score from -1.0 (very negative) to 1.0 (very positive) based on how the entity is portrayed
6. relevance: Score from 0.0 to 1.0 indicating how important this entity is to the report
7. metadata: Any additional data like financial metrics mentioned (e.g., {"revenue": "1.2B", "growth": "15%"})

Return a JSON array of entities.

Report Content:
${content.substring(0, 8000)} ${content.length > 8000 ? '... (truncated)' : ''}

Important Guidelines:
- Deduplicate entities (combine multiple mentions of same entity)
- Use standardized, commonly-known names (e.g., "Apple" not "Apple Inc." or "AAPL")
- Only include entities that are genuinely relevant to finance/business
- For stocks, use the primary ticker (NSE/BSE for Indian stocks, NASDAQ/NYSE for US stocks)
- Focus on the main entities - aim for 3-10 entities max
- Higher relevance scores for entities that are central to the report's topic

Return ONLY the JSON array, no other text.`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.3, // Lower temperature for more consistent extraction
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '';

      // Parse JSON response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in AI response');
        return [];
      }

      const entities: ExtractedEntity[] = JSON.parse(jsonMatch[0]);
      console.log(`Extracted ${entities.length} entities from report`);
      return entities;
    } catch (error) {
      console.error('Entity extraction failed:', error);
      return [];
    }
  }

  /**
   * Process extracted entities and save to database for a report
   */
  async processEntitiesForReport(
    reportId: string,
    htmlContent: string
  ): Promise<ExtractedEntity[]> {
    // Convert HTML to plain text for extraction
    const plainText = this.htmlToText(htmlContent);

    if (!plainText || plainText.length < 100) {
      console.warn('Report content too short for entity extraction');
      return [];
    }

    // Extract entities using AI
    const extractedEntities = await this.extractEntities(plainText);

    if (extractedEntities.length === 0) {
      return [];
    }

    // Process each entity
    for (const extracted of extractedEntities) {
      try {
        await this.upsertEntityAndMention(reportId, extracted);
      } catch (error) {
        console.error(`Failed to process entity ${extracted.name}:`, error);
      }
    }

    return extractedEntities;
  }

  /**
   * Upsert entity and create mention
   */
  private async upsertEntityAndMention(
    reportId: string,
    extracted: ExtractedEntity
  ) {
    const slug = this.generateSlug(extracted.name);

    // Find or create entity
    let entity = await prisma.entities.findUnique({
      where: { slug },
    });

    if (!entity) {
      entity = await prisma.entities.create({
        data: {
          id: crypto.randomUUID(),
          name: extracted.name,
          slug,
          type: extracted.type,
          ticker: extracted.ticker,
          mentionCount: 0,
        },
      });
      console.log(`Created new entity: ${extracted.name}`);
    }

    // Check if mention already exists
    const existingMention = await prisma.entity_mentions.findUnique({
      where: {
        entityId_reportId: {
          entityId: entity.id,
          reportId,
        },
      },
    });

    if (existingMention) {
      console.log(`Mention already exists for ${extracted.name} in this report`);
      return entity;
    }

    // Create mention
    await prisma.entity_mentions.create({
      data: {
        id: crypto.randomUUID(),
        entityId: entity.id,
        reportId,
        context: extracted.context,
        sentiment: extracted.sentiment,
        relevance: extracted.relevance,
        metadata: extracted.metadata || {},
      },
    });

    // Update entity stats
    await prisma.entities.update({
      where: { id: entity.id },
      data: {
        mentionCount: { increment: 1 },
        lastMentioned: new Date(),
        firstMentioned: entity.firstMentioned || new Date(),
      },
    });

    console.log(`Processed entity: ${extracted.name} (${entity.mentionCount + 1} mentions)`);

    return entity;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate URL-friendly slug from entity name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
