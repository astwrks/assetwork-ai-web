import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { claudeService } from '@/lib/ai/claude.service';
import { openaiService } from '@/lib/ai/openai.service';
// import { ContextSnapshotService } from '@/lib/services/context-snapshot-service';

// GET /api/playground/reports/:reportId/sections/:sectionId - Get specific section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, sectionId } = await params;

    const section = await prisma.report_sections.findFirst({
      where: {
        id: sectionId,
        reportId,
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({ section }, { status: 200 });
  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section' },
      { status: 500 }
    );
  }
}

// PATCH /api/playground/reports/:reportId/sections/:sectionId - Edit section
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, sectionId } = await params;
    const body = await request.json();
    const {
      prompt,
      htmlContent,
      title,
      order,
      action,
      model = 'claude-3-5-sonnet-20241022',
      provider = 'anthropic',
    } = body;

    const section = await prisma.report_sections.findFirst({
      where: {
        id: sectionId,
        reportId,
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Handle different actions
    if (action === 'move-up' || action === 'move-down') {
      const direction = action === 'move-up' ? -1 : 1;
      const currentOrder = section.order;
      const targetOrder = currentOrder + direction;

      // Find section to swap with
      const swapSection = await prisma.report_sections.findFirst({
        where: {
          reportId,
          order: targetOrder,
        },
      });

      if (swapSection) {
        // Swap orders using transactions to ensure atomicity
        await prisma.$transaction([
          prisma.report_sections.update({
            where: { id: sectionId },
            data: { order: targetOrder, updatedAt: new Date() },
          }),
          prisma.report_sections.update({
            where: { id: swapSection.id },
            data: { order: currentOrder, updatedAt: new Date() },
          }),
        ]);

        // Fetch updated section
        const updatedSection = await prisma.report_sections.findUnique({
          where: { id: sectionId },
        });

        return NextResponse.json({ section: updatedSection }, { status: 200 });
      }

      return NextResponse.json({ section }, { status: 200 });
    }

    // Handle duplicate action
    if (action === 'duplicate') {
      const maxOrderSection = await prisma.report_sections.findFirst({
        where: { reportId },
        orderBy: { order: 'desc' },
        take: 1,
      });

      const newSection = await prisma.report_sections.create({
        data: {
          id: randomUUID(),
          reportId,
          type: section.type,
          title: `${section.title} (Copy)`,
          htmlContent: section.htmlContent,
          order: maxOrderSection ? maxOrderSection.order + 1 : 0,
          version: 1,
          editHistory: [],
          metadata: {
            originallyGeneratedBy: session.user.id,
            lastModifiedBy: session.user.id,
            model: (section.metadata as any)?.model,
            originalPrompt: `Duplicate of: ${section.title}`,
          },
          updatedAt: new Date(),
        },
      });

      // Update report section refs
      const report = await prisma.playground_reports.findUnique({
        where: { id: reportId },
      });

      if (report) {
        const currentSectionRefs = (report.sectionRefs as string[]) || [];
        await prisma.playground_reports.update({
          where: { id: reportId },
          data: {
            sectionRefs: [...currentSectionRefs, newSection.id],
            updatedAt: new Date(),
          },
        });
      }

      // Update context snapshot in background (non-blocking)
      // TODO: Re-enable after migrating ContextSnapshotService to Prisma
      // ContextSnapshotService.createOrUpdateReportSnapshot(
      //   reportId,
      //   'section_duplicated'
      // ).catch((error) => {
      //   console.error('Failed to update report snapshot:', error);
      // });

      return NextResponse.json({ section: newSection }, { status: 201 });
    }

    // Handle AI edit with streaming
    if (prompt) {
      // Load settings
      let settings = await prisma.playground_settings.findFirst({
        where: {
          userId: session.user.id,
        },
      });

      const editPrompt = `You are editing a section of a financial report.

Current Section:
Title: ${section.title}
Current HTML:
${section.htmlContent}

User's Edit Request: ${prompt}

Generate the UPDATED HTML for this section based on the user's request.
Maintain the same structure and data-section-id attribute.
Use AssetWorks branding colors (#1B2951, #405D80, #6C7B95).
Return only the HTML content, no explanations.`;

      // Create streaming response
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      // Start AI generation in background
      (async () => {
        let accumulatedContent = '';

        try {
          let generator;

          if (provider === 'anthropic' || model.startsWith('claude')) {
            generator = claudeService.streamResponse({
              messages: [{ role: 'user', content: editPrompt }],
              systemPrompt: settings?.systemPrompt || '',
              model,
            });
          } else {
            generator = openaiService.streamResponse({
              messages: [
                { role: 'system', content: settings?.systemPrompt || '' },
                { role: 'user', content: editPrompt },
              ],
            });
          }

          // Stream chunks to client
          for await (const chunk of generator) {
            accumulatedContent += chunk;
            const dataChunk = `data: ${JSON.stringify({
              type: 'content',
              content: chunk,
            })}\n\n`;
            await writer.write(encoder.encode(dataChunk));
          }

          // Save new version
          const currentEditHistory = (section.editHistory as any[]) || [];
          await prisma.report_sections.update({
            where: { id: sectionId },
            data: {
              htmlContent: accumulatedContent,
              version: section.version + 1,
              editHistory: [
                ...currentEditHistory,
                {
                  version: section.version + 1,
                  htmlContent: accumulatedContent,
                  editedBy: session.user.id,
                  editedAt: new Date(),
                  editPrompt: prompt,
                },
              ],
              metadata: {
                ...(section.metadata as any),
                lastModifiedBy: session.user.id,
              },
              updatedAt: new Date(),
            },
          });

          // Update context snapshot in background (non-blocking)
          // TODO: Re-enable after migrating ContextSnapshotService to Prisma
          // ContextSnapshotService.createOrUpdateReportSnapshot(
          //   reportId,
          //   'section_edited'
          // ).catch((error) => {
          //   console.error('Failed to update report snapshot:', error);
          // });

          // Fetch updated section
          const updatedSection = await prisma.report_sections.findUnique({
            where: { id: sectionId },
          });

          // Send completion event
          const completeChunk = `data: ${JSON.stringify({
            type: 'complete',
            section: updatedSection,
          })}\n\n`;
          await writer.write(encoder.encode(completeChunk));
          await writer.close();
        } catch (error) {
          console.error('Section edit error:', error);
          const errorChunk = `data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          })}\n\n`;
          await writer.write(encoder.encode(errorChunk));
          await writer.close();
        }
      })();

      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Handle manual updates
    const updateData: any = {
      updatedAt: new Date(),
      metadata: {
        ...(section.metadata as any),
        lastModifiedBy: session.user.id,
      },
    };

    if (htmlContent !== undefined) {
      const currentEditHistory = (section.editHistory as any[]) || [];
      updateData.htmlContent = htmlContent;
      updateData.version = section.version + 1;
      updateData.editHistory = [
        ...currentEditHistory,
        {
          version: section.version + 1,
          htmlContent,
          editedBy: session.user.id,
          editedAt: new Date(),
        },
      ];
    }

    if (title !== undefined) {
      updateData.title = title;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    const updatedSection = await prisma.report_sections.update({
      where: { id: sectionId },
      data: updateData,
    });

    // Update context snapshot in background (non-blocking)
    // TODO: Re-enable after migrating ContextSnapshotService to Prisma
    // ContextSnapshotService.createOrUpdateReportSnapshot(
    //   reportId,
    //   'section_updated'
    // ).catch((error) => {
    //   console.error('Failed to update report snapshot:', error);
    // });

    return NextResponse.json({ section: updatedSection }, { status: 200 });
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE /api/playground/reports/:reportId/sections/:sectionId - Delete section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, sectionId } = await params;

    const section = await prisma.report_sections.findFirst({
      where: {
        id: sectionId,
        reportId,
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const deletedOrder = section.order;

    // Delete the section
    await prisma.report_sections.delete({
      where: { id: sectionId },
    });

    // Update order of sections after deleted one
    await prisma.report_sections.updateMany({
      where: {
        reportId,
        order: { gt: deletedOrder },
      },
      data: {
        order: { decrement: 1 },
        updatedAt: new Date(),
      },
    });

    // Update report section refs
    const report = await prisma.playground_reports.findUnique({
      where: { id: reportId },
    });

    if (report) {
      const currentSectionRefs = (report.sectionRefs as string[]) || [];
      await prisma.playground_reports.update({
        where: { id: reportId },
        data: {
          sectionRefs: currentSectionRefs.filter((ref) => ref !== sectionId),
          updatedAt: new Date(),
        },
      });
    }

    // Update context snapshot in background (non-blocking)
    // TODO: Re-enable after migrating ContextSnapshotService to Prisma
    // ContextSnapshotService.createOrUpdateReportSnapshot(
    //   reportId,
    //   'section_deleted'
    // ).catch((error) => {
    //   console.error('Failed to update report snapshot:', error);
    // });

    return NextResponse.json(
      { message: 'Section deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
