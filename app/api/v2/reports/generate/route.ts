/**
 * Report Generation API Endpoint
 * Generates AI-powered financial reports with real-time streaming
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { ReportGenerationService, ReportOptionsSchema } from '@/lib/services/report-generation.service';
import { ErrorHandler, AppErrors, LoggingService, PerformanceMonitor } from '@/lib/services/error-logging.service';
import { RateLimitService } from '@/lib/services/redis.service';

// Request validation schema
const GenerateReportRequestSchema = z.object({
  threadId: z.string().optional(),
  prompt: z.string().min(10).max(5000),
  model: z.enum(['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']).optional(),
  systemPrompt: z.string().optional(),
  options: z.object({
    stream: z.boolean().default(true),
    extractEntities: z.boolean().default(true),
    generateCharts: z.boolean().default(true),
    includeMarketData: z.boolean().default(true),
    language: z.enum(['en', 'es', 'fr', 'de', 'zh', 'ja']).default('en'),
    format: z.enum(['html', 'markdown', 'json']).default('html'),
  }).optional(),
});

type GenerateReportRequest = z.infer<typeof GenerateReportRequestSchema>;

export async function POST(request: NextRequest) {
  const operationId = `report-generation-${Date.now()}`;
  PerformanceMonitor.start(operationId);

  try {
    // 1. Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw AppErrors.UNAUTHORIZED;
    }

    // 2. Rate limiting
    const rateLimitKey = `report-gen:${session.user.email}`;
    // Higher limit for development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const { limited, remaining } = await RateLimitService.isLimited(
      rateLimitKey,
      isDevelopment ? 100 : 10, // 100 reports per hour in dev, 10 in prod
      3600
    );

    if (limited) {
      throw AppErrors.RATE_LIMIT_EXCEEDED;
    }

    // 3. Parse and validate request
    const body = await request.json();
    const validatedRequest = GenerateReportRequestSchema.parse(body);

    // 4. Log request
    LoggingService.logRequest(
      'POST',
      '/api/v2/reports/generate',
      session.user.email,
      {
        prompt: validatedRequest.prompt.substring(0, 100),
        options: validatedRequest.options,
      }
    );

    // 5. Generate report
    const reportOptions = {
      prompt: validatedRequest.prompt,
      systemPrompt: validatedRequest.systemPrompt,
      threadId: validatedRequest.threadId,
      model: validatedRequest.model || 'claude-3-opus-20240229',
      maxTokens: 8000,
      temperature: 0.7,
      stream: validatedRequest.options?.stream ?? true,
      extractEntities: validatedRequest.options?.extractEntities ?? true,
      generateCharts: validatedRequest.options?.generateCharts ?? true,
      includeMarketData: validatedRequest.options?.includeMarketData ?? true,
      language: validatedRequest.options?.language || 'en',
      format: validatedRequest.options?.format || 'html',
    };

    // 6. Stream or batch generation
    if (reportOptions.stream) {
      // Create a TransformStream for streaming response
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      // Start report generation in background
      (async () => {
        try {
          const reportIterator = await ReportGenerationService.generateReport(
            session.user!.id || session.user!.email!,
            reportOptions
          );

          for await (const chunk of reportIterator) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            await writer.write(encoder.encode(data));
          }

          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('[Report Generation] Stream error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Generation failed';
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            error: errorMessage,
            details: error instanceof Error ? error.stack : undefined,
          })}\n\n`;
          await writer.write(encoder.encode(errorData));
        } finally {
          await writer.close();

          const duration = PerformanceMonitor.end(operationId, {
            userId: session.user!.email,
            prompt: validatedRequest.prompt.substring(0, 100),
          });

          LoggingService.logResponse(
            'POST',
            '/api/v2/reports/generate',
            200,
            duration,
            session.user!.email
          );
        }
      })();

      // Return streaming response
      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-RateLimit-Remaining': remaining.toString(),
        },
      });
    } else {
      // Batch generation
      const reportIterator = await ReportGenerationService.generateReport(
        session.user.id || session.user.email!,
        reportOptions
      );

      let finalResult = null;
      for await (const chunk of reportIterator) {
        if (chunk.type === 'complete') {
          finalResult = chunk;
        }
      }

      const duration = PerformanceMonitor.end(operationId, {
        userId: session.user.email,
        prompt: validatedRequest.prompt.substring(0, 100),
      });

      LoggingService.logResponse(
        'POST',
        '/api/v2/reports/generate',
        200,
        duration,
        session.user.email
      );

      return NextResponse.json({
        success: true,
        data: finalResult,
        meta: {
          rateLimitRemaining: remaining,
          generationTime: duration,
        },
      });
    }
  } catch (error) {
    const duration = PerformanceMonitor.end(operationId);

    LoggingService.error('Report generation failed', error as Error, {
      userId: (await getServerSession())?.user?.email,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: (error as any).statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}