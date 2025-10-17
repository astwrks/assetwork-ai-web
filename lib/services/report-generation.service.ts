/**
 * Advanced Report Generation Service
 * AI-powered financial report generation with entity extraction and real-time streaming
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { CacheService, CacheKeys, CacheTTL } from './redis.service';
import { WebSocketService } from './websocket.service';
import { nanoid } from 'nanoid';
import { MockReportGenerationService } from './mock-report-generation.service';

// Lazy initialization of Anthropic client
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropic = new Anthropic({ apiKey });
    console.log('[Anthropic] Client initialized with API key length:', apiKey.length);
  }
  return anthropic;
}

// Check if we should use mock service
function shouldUseMockService(): boolean {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const forceMock = process.env.USE_MOCK_AI === 'true';

  return forceMock || (isDevelopment && !hasApiKey);
}

// Report generation schemas
export const ReportOptionsSchema = z.object({
  prompt: z.string().min(10),
  systemPrompt: z.string().optional(),
  threadId: z.string().optional(),
  model: z.enum([
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ]).default('claude-3-5-sonnet-20241022'),
  maxTokens: z.number().min(100).max(100000).default(8000),
  temperature: z.number().min(0).max(1).default(0.7),
  stream: z.boolean().default(true),
  extractEntities: z.boolean().default(true),
  generateCharts: z.boolean().default(true),
  includeMarketData: z.boolean().default(true),
  language: z.enum(['en', 'es', 'fr', 'de', 'zh', 'ja']).default('en'),
  format: z.enum(['html', 'markdown', 'json']).default('html'),
});

export const ReportSectionSchema = z.object({
  id: z.string(),
  type: z.enum(['METRIC', 'CHART', 'TABLE', 'TEXT', 'INSIGHT', 'CUSTOM', 'IMAGE']),
  title: z.string(),
  content: z.string(),
  order: z.number(),
  metadata: z.record(z.any()).optional(),
});

export const ExtractedEntitySchema = z.object({
  name: z.string(),
  type: z.enum(['COMPANY', 'STOCK', 'PERSON', 'PRODUCT', 'SECTOR', 'CRYPTOCURRENCY', 'COMMODITY', 'INDEX', 'ETF', 'MUTUAL_FUND', 'COUNTRY', 'CURRENCY']),
  confidence: z.number().min(0).max(1),
  sentiment: z.number().min(-1).max(1),
  context: z.string(),
  mentions: z.number(),
  metadata: z.record(z.any()).optional(),
});

export type ReportOptions = z.infer<typeof ReportOptionsSchema>;
export type ReportSection = z.infer<typeof ReportSectionSchema>;
export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>;

// System prompts for different report types
const SYSTEM_PROMPTS = {
  financial_analysis: `You are a world-class financial analyst with expertise in market analysis, fundamental analysis, and technical analysis.
You provide comprehensive, data-driven insights that rival Bloomberg Terminal reports.
Your analysis should be:
- Data-driven with specific metrics and numbers
- Professional and institutional-grade
- Actionable with clear recommendations
- Comprehensive covering multiple aspects
- Visually structured with clear sections

Format your response as HTML with proper semantic tags. Include tables, lists, and structured data where appropriate.
Always identify and highlight key entities (companies, stocks, people, etc.) for extraction.`,

  market_research: `You are a senior market research analyst specializing in comprehensive industry analysis and competitive intelligence.
Your reports should include:
- Market size and growth projections
- Competitive landscape analysis
- Key players and market share
- Trends and opportunities
- Risk factors and challenges
- Investment recommendations

Use professional formatting with clear sections, data tables, and actionable insights.`,

  technical_analysis: `You are a expert technical analyst with deep knowledge of chart patterns, indicators, and market psychology.
Your analysis should include:
- Price action analysis
- Support and resistance levels
- Technical indicators (RSI, MACD, Moving Averages)
- Chart patterns identification
- Volume analysis
- Entry and exit recommendations

Present data in a clear, structured format with specific price levels and timeframes.`,
};

/**
 * Advanced Report Generation Service
 */
export class ReportGenerationService {
  /**
   * Generate a comprehensive financial report
   */
  static async generateReport(
    userId: string,
    options: ReportOptions
  ): Promise<AsyncIterableIterator<any>> {
    console.log('[Report Generation] Starting report generation');
    console.log('[Report Generation] User ID:', userId);
    console.log('[Report Generation] Options:', JSON.stringify(options, null, 2));

    // Use mock service if appropriate
    if (shouldUseMockService()) {
      console.log('[Report Generation] Using mock service for development/testing');
      return MockReportGenerationService.generateReport(userId, options);
    }

    try {
      const validatedOptions = ReportOptionsSchema.parse(options);
      const reportId = nanoid();
      const threadId = validatedOptions.threadId || nanoid();

      console.log('[Report Generation] Validated options successfully');
      console.log('[Report Generation] Report ID:', reportId);
      console.log('[Report Generation] Thread ID:', threadId);

      // Ensure user exists in database
      console.log('[Report Generation] Checking if user exists...');
      // Try to find by ID first, then by email
      let user = await prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        console.log('[Report Generation] User not found by ID, trying email...');
        user = await prisma.users.findUnique({
          where: { email: userId },
        });
      }

      if (!user) {
        console.log('[Report Generation] User not found, attempting to create...');
        // Try to create user (userId might be email)
        try {
          user = await prisma.users.create({
            data: {
              id: nanoid(),
              email: userId,
              name: userId.split('@')[0] || 'User',
              emailVerified: new Date(),
              updatedAt: new Date(),
            },
          });
          console.log('[Report Generation] User created successfully:', user.id);
        } catch (createError) {
          console.error('[Report Generation] Failed to create user:', createError);
          throw new Error(`User not found and could not be created: ${userId}`);
        }
      } else {
        console.log('[Report Generation] User found:', user.id);
      }

      // Check cache for similar report
      console.log('[Report Generation] Checking cache...');
      const cacheKey = CacheKeys.REPORT(`${user.id}:${Buffer.from(validatedOptions.prompt).toString('base64').substring(0, 50)}`);
      const cached = await CacheService.get(cacheKey);
      if (cached && !validatedOptions.stream) {
        console.log('[Report Generation] Cache hit, returning cached report');
        return this.createAsyncIterator([cached]);
      }
      console.log('[Report Generation] Cache miss, generating new report');

      // Create report in database (playground_reports for Financial Playground)
      console.log('[Report Generation] Creating report in database...');
      const report = await prisma.playground_reports.create({
        data: {
          id: reportId,
          threadId,
          htmlContent: '',
          model: validatedOptions.model,
          prompt: validatedOptions.prompt,
          metadata: {
            temperature: validatedOptions.temperature,
            generatedAt: new Date().toISOString(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log('[Report Generation] Report created successfully:', report.id);

      // Generate report content
      console.log('[Report Generation] Starting content generation (stream:', validatedOptions.stream, ')');
      if (validatedOptions.stream) {
        return this.streamReportGeneration(report.id, user.id, validatedOptions);
      } else {
        return this.generateReportBatch(report.id, user.id, validatedOptions);
      }
    } catch (error) {
      console.error('[Report Generation] Fatal error:', error);
      console.error('[Report Generation] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        options,
      });

      // Return error iterator
      return this.createAsyncIterator([{
        type: 'error',
        error: error instanceof Error ? error.message : 'Report generation failed',
        details: error instanceof Error ? error.stack : undefined,
      }]);
    }
  }

  /**
   * Stream report generation with real-time updates
   */
  private static async *streamReportGeneration(
    reportId: string,
    userId: string,
    options: ReportOptions
  ): AsyncIterableIterator<any> {
    console.log('[Stream Generation] Starting streaming generation');
    console.log('[Stream Generation] Report ID:', reportId);
    console.log('[Stream Generation] User ID:', userId);

    try {
      // Use provided system prompt or select based on content
      console.log('[Stream Generation] Selecting system prompt...');
      const systemPrompt = options.systemPrompt || this.selectSystemPrompt(options.prompt);
      console.log('[Stream Generation] System prompt selected:', systemPrompt.substring(0, 100) + '...');

      // Create streaming request
      console.log('[Stream Generation] Creating Anthropic stream with model:', options.model);
      const stream = await getAnthropicClient().messages.create({
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: this.enhancePrompt(options),
          },
        ],
        stream: true,
      });
      console.log('[Stream Generation] Stream created successfully');

      let fullContent = '';
      let buffer = '';
      const sections: ReportSection[] = [];
      const entities: ExtractedEntity[] = [];

      // Process stream
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const delta = chunk.delta;
          if ('text' in delta) {
            buffer += delta.text;
            fullContent += delta.text;

            // Emit chunk to client
            yield {
              type: 'content',
              data: delta.text,
              reportId,
            };

            // Broadcast via WebSocket
            await WebSocketService.broadcastReportUpdate(
              reportId,
              userId,
              'EDIT',
              { content: delta.text }
            );

            // Process buffer for sections
            if (buffer.length > 500) {
              const processedSections = this.extractSections(buffer);
              if (processedSections.length > 0) {
                sections.push(...processedSections);
                yield {
                  type: 'sections',
                  data: processedSections,
                  reportId,
                };
              }
              buffer = '';
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.length > 0) {
        const processedSections = this.extractSections(buffer);
        sections.push(...processedSections);
      }

      // Extract entities if enabled
      if (options.extractEntities) {
        const extractedEntities = await this.extractEntities(fullContent);
        entities.push(...extractedEntities);

        yield {
          type: 'entities',
          data: entities,
          reportId,
        };

        // Save entities to database
        await this.saveEntities(reportId, entities);
      }

      // Update report in database
      await prisma.playground_reports.update({
        where: { id: reportId },
        data: {
          htmlContent: fullContent,
          totalTokens: fullContent.split(/\s+/).length, // Approximate token count
          sections: sections as any,
          insights: [] as any,
          metadata: {
            sections: sections.length,
            entities: entities.length,
            wordCount: fullContent.split(/\s+/).length,
            generatedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      });

      // Save sections to database
      if (sections.length > 0) {
        await this.saveSections(reportId, sections);
      }

      // Cache the result
      await CacheService.set(
        CacheKeys.REPORT(reportId),
        {
          content: fullContent,
          sections,
          entities,
        },
        CacheTTL.REPORT
      );

      // Send completion signal
      yield {
        type: 'complete',
        reportId,
        data: {
          totalSections: sections.length,
          totalEntities: entities.length,
          wordCount: fullContent.split(/\s+/).length,
        },
      };
    } catch (error) {
      console.error('[Stream Generation] Error occurred:', error);
      console.error('[Stream Generation] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        reportId,
        userId,
      });

      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Report generation failed',
        details: error instanceof Error ? error.stack : undefined,
        reportId,
      };
    }
  }

  /**
   * Generate report in batch mode (non-streaming)
   */
  private static async *generateReportBatch(
    reportId: string,
    userId: string,
    options: ReportOptions
  ): AsyncIterableIterator<any> {
    try {
      const systemPrompt = options.systemPrompt || this.selectSystemPrompt(options.prompt);

      const response = await getAnthropicClient().messages.create({
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: this.enhancePrompt(options),
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      // Extract sections and entities
      const sections = this.extractSections(content);
      const entities = options.extractEntities ? await this.extractEntities(content) : [];

      // Update report
      await prisma.playground_reports.update({
        where: { id: reportId },
        data: {
          htmlContent: content,
          totalTokens: content.split(/\s+/).length,
          sections: sections as any,
          insights: [] as any,
          updatedAt: new Date(),
        },
      });

      // Save sections and entities
      if (sections.length > 0) {
        await this.saveSections(reportId, sections);
      }
      if (entities.length > 0) {
        await this.saveEntities(reportId, entities);
      }

      // Cache result
      await CacheService.set(
        CacheKeys.REPORT(reportId),
        { content, sections, entities },
        CacheTTL.REPORT
      );

      yield {
        type: 'complete',
        reportId,
        data: {
          content,
          sections,
          entities,
        },
      };
    } catch (error) {
      console.error('Batch generation error:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Report generation failed',
        reportId,
      };
    }
  }

  /**
   * Enhance user prompt with additional context
   */
  private static enhancePrompt(options: ReportOptions): string {
    const enhancements = [];

    // Add current date context
    enhancements.push(`Current date: ${new Date().toISOString().split('T')[0]}`);

    // Add market data request
    if (options.includeMarketData) {
      enhancements.push('Include relevant real-time market data and prices where applicable.');
    }

    // Add chart generation request
    if (options.generateCharts) {
      enhancements.push('Suggest appropriate charts and visualizations with specific data points.');
    }

    // Add entity extraction hint
    if (options.extractEntities) {
      enhancements.push('Clearly identify all companies, stocks, people, and other entities mentioned.');
    }

    // Add language specification
    if (options.language !== 'en') {
      enhancements.push(`Generate the report in ${options.language}.`);
    }

    return `${options.prompt}\n\nAdditional requirements:\n${enhancements.join('\n')}`;
  }

  /**
   * Select appropriate system prompt
   */
  private static selectSystemPrompt(userPrompt: string): string {
    const prompt = userPrompt.toLowerCase();

    if (prompt.includes('technical') || prompt.includes('chart') || prompt.includes('indicator')) {
      return SYSTEM_PROMPTS.technical_analysis;
    } else if (prompt.includes('market') || prompt.includes('industry') || prompt.includes('competitive')) {
      return SYSTEM_PROMPTS.market_research;
    } else {
      return SYSTEM_PROMPTS.financial_analysis;
    }
  }

  /**
   * Extract sections from content
   */
  private static extractSections(content: string): ReportSection[] {
    const sections: ReportSection[] = [];

    // Extract HTML sections
    const sectionRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>([\s\S]*?)(?=<h[1-6]|$)/gi;
    let match;
    let order = 0;

    while ((match = sectionRegex.exec(content)) !== null) {
      const [, , title, sectionContent] = match;

      // Determine section type based on content
      let type: ReportSection['type'] = 'TEXT';
      if (sectionContent.includes('<table')) type = 'TABLE';
      else if (sectionContent.includes('chart') || sectionContent.includes('graph')) type = 'CHART';
      else if (sectionContent.match(/\d+%|\$[\d,]+/)) type = 'METRIC';
      else if (sectionContent.includes('insight') || sectionContent.includes('recommendation')) type = 'INSIGHT';

      sections.push({
        id: nanoid(),
        type,
        title: title.replace(/<[^>]*>/g, '').trim(),
        content: sectionContent.trim(),
        order: order++,
      });
    }

    return sections;
  }

  /**
   * Extract entities from content using AI
   */
  private static async extractEntities(content: string): Promise<ExtractedEntity[]> {
    try {
      const response = await getAnthropicClient().messages.create({
        model: 'claude-3-haiku-20240307', // Use faster model for entity extraction
        max_tokens: 2000,
        temperature: 0.3,
        system: `You are an entity extraction specialist. Extract all financial entities from the text and return them as a JSON array.
Each entity should have: name, type (COMPANY/STOCK/PERSON/etc.), confidence (0-1), sentiment (-1 to 1), and brief context.`,
        messages: [
          {
            role: 'user',
            content: `Extract entities from this text and return as JSON array:\n\n${content.substring(0, 10000)}`,
          },
        ],
      });

      const extractedText = response.content[0].type === 'text' ? response.content[0].text : '';

      // Parse JSON from response
      const jsonMatch = extractedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const entities = JSON.parse(jsonMatch[0]);
        return entities.map((e: any) => ({
          name: e.name || '',
          type: e.type || 'COMPANY',
          confidence: e.confidence || 0.8,
          sentiment: e.sentiment || 0,
          context: e.context || '',
          mentions: e.mentions || 1,
        }));
      }
    } catch (error) {
      console.error('Entity extraction error:', error);
    }

    return [];
  }

  /**
   * Save report sections to database
   */
  private static async saveSections(reportId: string, sections: ReportSection[]) {
    const sectionData = sections.map(section => ({
      id: section.id,
      reportId,
      type: section.type,
      title: section.title,
      htmlContent: section.content,
      order: section.order,
      metadata: section.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await prisma.report_sections.createMany({
      data: sectionData,
      skipDuplicates: true,
    });
  }

  /**
   * Save extracted entities to database
   */
  private static async saveEntities(reportId: string, entities: ExtractedEntity[]) {
    for (const entity of entities) {
      // Create or update entity
      const dbEntity = await prisma.entities.upsert({
        where: { slug: entity.name.toLowerCase().replace(/\s+/g, '-') },
        create: {
          id: nanoid(),
          name: entity.name,
          slug: entity.name.toLowerCase().replace(/\s+/g, '-'),
          type: entity.type,
          mentionCount: 1,
          firstMentioned: new Date(),
          lastMentioned: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          mentionCount: { increment: 1 },
          lastMentioned: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create or update entity mention (avoid duplicates)
      await prisma.entity_mentions.upsert({
        where: {
          entityId_reportId: {
            entityId: dbEntity.id,
            reportId,
          },
        },
        create: {
          id: nanoid(),
          entityId: dbEntity.id,
          reportId,
          context: entity.context,
          sentiment: entity.sentiment,
          relevance: entity.confidence,
          metadata: entity.metadata || {},
          createdAt: new Date(),
        },
        update: {
          // Update sentiment and context if entity is mentioned again
          sentiment: entity.sentiment,
          context: entity.context,
          relevance: entity.confidence,
          metadata: entity.metadata || {},
        },
      });
    }
  }

  /**
   * Create async iterator helper
   */
  private static async *createAsyncIterator<T>(items: T[]): AsyncIterableIterator<T> {
    for (const item of items) {
      yield item;
    }
  }

  /**
   * Get report by ID with caching
   */
  static async getReport(reportId: string) {
    const cacheKey = CacheKeys.REPORT(reportId);

    // Check cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    // Fetch from database
    const report = await prisma.reports.findUnique({
      where: { id: reportId },
      include: {
        report_sections: true,
        entity_mentions: {
          include: {
            entities: true,
          },
        },
      },
    });

    if (report) {
      // Cache for future requests
      await CacheService.set(cacheKey, report, CacheTTL.REPORT);
    }

    return report;
  }

  /**
   * Update report section
   */
  static async updateSection(
    sectionId: string,
    userId: string,
    content: string
  ) {
    const section = await prisma.report_sections.update({
      where: { id: sectionId },
      data: {
        htmlContent: content,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    await CacheService.delete(CacheKeys.REPORT(section.reportId));

    // Broadcast update
    await WebSocketService.broadcastReportUpdate(
      section.reportId,
      userId,
      'EDIT',
      { sectionId, content }
    );

    return section;
  }
}

export default ReportGenerationService;