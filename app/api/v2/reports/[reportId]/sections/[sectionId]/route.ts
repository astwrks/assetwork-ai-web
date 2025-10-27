/**
 * Report Section Editing API
 * PATCH - Edit a specific section using AI or manual save
 * DELETE - Delete a section
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionWithDev } from '@/lib/auth/dev-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

// Validation schemas
const EditSectionSchema = z.object({
  prompt: z.string().min(5).max(5000).optional(),
  htmlContent: z.string().optional(),
  model: z.enum(['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']).optional(),
  temperature: z.number().min(0).max(1).optional(),
}).refine(data => data.prompt || data.htmlContent, {
  message: "Either 'prompt' (for AI edit) or 'htmlContent' (for manual save) must be provided",
});

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * PATCH /api/v2/reports/[reportId]/sections/[sectionId]
 * Edit a section using AI (if prompt provided) or manual save (if htmlContent provided)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string; sectionId: string } }
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

    const { reportId, sectionId } = params;
    const body = await request.json();

    // 2. Validate request
    const { prompt, htmlContent, model, temperature } = EditSectionSchema.parse(body);

    // 3. Fetch section
    const section = await prisma.report_sections.findUnique({
      where: { id: sectionId },
      include: {
        reports: true,
      },
    });

    if (!section) {
      return new Response(
        JSON.stringify({ error: 'Section not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Verify report ID matches
    if (section.reportId !== reportId) {
      return new Response(
        JSON.stringify({ error: 'Section does not belong to this report' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Verify ownership
    if (section.reports.userId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Handle manual save (direct HTML update)
    if (htmlContent) {
      console.log(`[Section Edit API] Manual save for section ${sectionId}`);

      // Store current version in edit history
      const editHistory = Array.isArray(section.editHistory) ? section.editHistory : [];
      editHistory.push({
        version: section.version,
        htmlContent: section.htmlContent,
        editedBy: session.user.id,
        editedAt: new Date().toISOString(),
      });

      const updatedSection = await prisma.report_sections.update({
        where: { id: sectionId },
        data: {
          htmlContent,
          version: { increment: 1 },
          editHistory,
          updatedAt: new Date(),
          metadata: {
            ...(typeof section.metadata === 'object' ? section.metadata : {}),
            lastEditedAt: new Date().toISOString(),
            lastEditedBy: session.user.id,
            editType: 'manual',
          },
        },
      });

      console.log(`[Section Edit API] Section ${sectionId} updated manually (v${updatedSection.version})`);

      return NextResponse.json({
        success: true,
        data: updatedSection,
        message: 'Section updated successfully',
      });
    }

    // 7. Handle AI edit (streaming response)
    if (prompt) {
      console.log(`[Section Edit API] AI edit for section ${sectionId}`);
      console.log(`[Section Edit API] Prompt: ${prompt.substring(0, 100)}...`);

      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      // Start AI editing in background
      (async () => {
        try {
          let accumulatedContent = '';

          // Create AI stream
          const messageStream = await anthropic.messages.create({
            model: model || 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            temperature: temperature || 0.7,
            stream: true,
            messages: [
              {
                role: 'user',
                content: `You are an expert financial report editor. You are editing a specific section of a financial report.

SECTION TITLE: ${section.title}
SECTION TYPE: ${section.type}

CURRENT SECTION CONTENT (HTML):
${section.htmlContent}

USER REQUEST:
${prompt}

Please provide the COMPLETE updated HTML for this section with the requested changes applied. Maintain the existing structure and styling where appropriate. Only output the HTML code for this section, no explanations.`,
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

          // Store current version in edit history
          const editHistory = Array.isArray(section.editHistory) ? section.editHistory : [];
          editHistory.push({
            version: section.version,
            htmlContent: section.htmlContent,
            prompt,
            editedBy: session.user.id,
            editedAt: new Date().toISOString(),
          });

          // Save updated section
          const updatedSection = await prisma.report_sections.update({
            where: { id: sectionId },
            data: {
              htmlContent: accumulatedContent,
              version: { increment: 1 },
              editHistory,
              updatedAt: new Date(),
              metadata: {
                ...(typeof section.metadata === 'object' ? section.metadata : {}),
                lastEditedAt: new Date().toISOString(),
                lastEditedBy: session.user.id,
                lastEditPrompt: prompt,
                lastEditModel: model || 'claude-3-5-sonnet-20241022',
                editType: 'ai',
              },
            },
          });

          console.log(`[Section Edit API] Section ${sectionId} updated (v${updatedSection.version})`);

          // Send completion message
          const completeData = `data: ${JSON.stringify({
            type: 'complete',
            section: updatedSection,
            version: updatedSection.version,
          })}\n\n`;
          await writer.write(encoder.encode(completeData));

          // Send DONE signal
          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('[Section Edit API] Error during AI editing:', error);

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

      // Return streaming response
      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Should never reach here due to validation
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Section Edit API] Request error:', error);

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
      JSON.stringify({ error: 'Failed to edit section' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/v2/reports/[reportId]/sections/[sectionId]
 * Delete a section
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string; sectionId: string } }
) {
  try {
    const session = await getServerSessionWithDev(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, sectionId } = params;

    // Fetch section with report
    const section = await prisma.report_sections.findUnique({
      where: { id: sectionId },
      include: {
        reports: true,
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Verify report ID matches
    if (section.reportId !== reportId) {
      return NextResponse.json(
        { error: 'Section does not belong to this report' },
        { status: 400 }
      );
    }

    // Verify ownership
    if (section.reports.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete section
    await prisma.report_sections.delete({
      where: { id: sectionId },
    });

    console.log(`[Section Edit API] Section ${sectionId} deleted`);

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error) {
    console.error('[Section Edit API] Error deleting section:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
