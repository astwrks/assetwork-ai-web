/**
 * AI-Powered Report Editing API
 * PATCH - Edit report content using AI with streaming response
 */

import { NextRequest } from 'next/server';
import { getServerSessionWithDev } from '@/lib/auth/dev-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

// Validation schema
const EditReportSchema = z.object({
  prompt: z.string().min(5).max(5000),
  model: z.enum(['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']).optional(),
  temperature: z.number().min(0).max(1).optional(),
});

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * PATCH /api/v2/reports/[reportId]/edit
 * Edit report using AI with streaming response
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSessionWithDev(authOptions);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { reportId } = params;
    const body = await request.json();

    // 2. Validate request
    const { prompt, model, temperature } = EditReportSchema.parse(body);

    // 3. Fetch existing report
    let report = await prisma.reports.findUnique({
      where: { id: reportId },
    });

    // Try playground_reports if not found
    let isPlaygroundReport = false;
    if (!report) {
      const playgroundReport = await prisma.playground_reports.findUnique({
        where: { id: reportId },
      });

      if (!playgroundReport) {
        return new Response(
          JSON.stringify({ error: 'Report not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      report = playgroundReport as any;
      isPlaygroundReport = true;
    }

    // 4. Verify ownership (skip for playground reports in dev)
    if (!isPlaygroundReport && report.userId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentHtmlContent = report.htmlContent || '';

    console.log(`[Report Edit API] Starting AI edit for report ${reportId}`);
    console.log(`[Report Edit API] Prompt: ${prompt.substring(0, 100)}...`);

    // 5. Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // 6. Start AI editing in background
    (async () => {
      try {
        let accumulatedContent = '';

        // Create AI stream
        const messageStream = await anthropic.messages.create({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: 8000,
          temperature: temperature || 0.7,
          stream: true,
          messages: [
            {
              role: 'user',
              content: `You are an expert financial report editor. You have been asked to edit the following financial report based on a user request.

CURRENT REPORT (HTML):
${currentHtmlContent}

USER REQUEST:
${prompt}

Please provide the COMPLETE updated HTML report with the requested changes applied. Maintain the existing structure and styling where appropriate. Only output the HTML code, no explanations.`,
            },
          ],
        });

        // Stream AI response
        for await (const messageStreamEvent of messageStream) {
          if (messageStreamEvent.type === 'content_block_delta') {
            const delta = messageStreamEvent.delta;
            if (delta.type === 'text_delta') {
              const text = delta.text;
              accumulatedContent += text;

              // Send content chunk
              const data = `data: ${JSON.stringify({
                type: 'content',
                content: text,
              })}\n\n`;
              await writer.write(encoder.encode(data));
            }
          }
        }

        // 7. Save updated report to database
        const updatedReport = isPlaygroundReport
          ? await prisma.playground_reports.update({
              where: { id: reportId },
              data: {
                htmlContent: accumulatedContent,
                version: { increment: 1 },
                updatedAt: new Date(),
                metadata: {
                  ...(typeof report.metadata === 'object' ? report.metadata : {}),
                  lastEditedAt: new Date().toISOString(),
                  lastEditedBy: session.user.id,
                  lastEditPrompt: prompt,
                  lastEditModel: model || 'claude-3-5-sonnet-20241022',
                },
              },
            })
          : await prisma.reports.update({
              where: { id: reportId },
              data: {
                htmlContent: accumulatedContent,
                version: { increment: 1 },
                updatedAt: new Date(),
                metadata: {
                  ...(typeof report.metadata === 'object' ? report.metadata : {}),
                  lastEditedAt: new Date().toISOString(),
                  lastEditedBy: session.user.id,
                  lastEditPrompt: prompt,
                  lastEditModel: model || 'claude-3-5-sonnet-20241022',
                },
              },
            });

        console.log(`[Report Edit API] Report ${reportId} updated successfully (v${updatedReport.version})`);

        // 8. Send completion message
        const completeData = `data: ${JSON.stringify({
          type: 'complete',
          report: updatedReport,
          version: updatedReport.version,
        })}\n\n`;
        await writer.write(encoder.encode(completeData));

        // 9. Send DONE signal
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('[Report Edit API] Error during AI editing:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorData = `data: ${JSON.stringify({
          type: 'error',
          error: errorMessage,
        })}\n\n`;
        await writer.write(encoder.encode(errorData));
      } finally {
        await writer.close();
      }
    })();

    // 10. Return streaming response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Report Edit API] Request error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to edit report' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
