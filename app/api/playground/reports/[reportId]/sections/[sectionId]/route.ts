import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import ReportSection from '@/lib/db/models/ReportSection';
import PlaygroundSettings from '@/lib/db/models/PlaygroundSettings';
import { claudeService } from '@/lib/ai/claude.service';
import { openaiService } from '@/lib/ai/openai.service';
import { ContextSnapshotService } from '@/lib/services/context-snapshot-service';

// GET /api/playground/reports/:reportId/sections/:sectionId - Get specific section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { reportId, sectionId } = await params;

    const section = await ReportSection.findOne({
      _id: sectionId,
      reportId,
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
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

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

    const section = await ReportSection.findOne({
      _id: sectionId,
      reportId,
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
      const swapSection = await ReportSection.findOne({
        reportId,
        order: targetOrder,
      });

      if (swapSection) {
        // Swap orders
        section.order = targetOrder;
        swapSection.order = currentOrder;
        await section.save();
        await swapSection.save();
      }

      return NextResponse.json({ section }, { status: 200 });
    }

    // Handle duplicate action
    if (action === 'duplicate') {
      const maxOrderSection = await ReportSection.findOne({ reportId })
        .sort({ order: -1 })
        .limit(1);

      const newSection = new ReportSection({
        reportId,
        type: section.type,
        title: `${section.title} (Copy)`,
        htmlContent: section.htmlContent,
        order: maxOrderSection ? maxOrderSection.order + 1 : 0,
        version: 1,
        editHistory: [],
        metadata: {
          originallyGeneratedBy: session.user.email,
          lastModifiedBy: session.user.email,
          model: section.metadata.model,
          originalPrompt: `Duplicate of: ${section.title}`,
        },
      });

      await newSection.save();

      // Update report section refs
      const report = await PlaygroundReport.findById(reportId);
      if (report) {
        report.sectionRefs.push(newSection._id.toString());
        await report.save();
      }

      // Update context snapshot in background (non-blocking)
      ContextSnapshotService.createOrUpdateReportSnapshot(
        reportId,
        'section_duplicated'
      ).catch((error) => {
        console.error('Failed to update report snapshot:', error);
      });

      return NextResponse.json({ section: newSection }, { status: 201 });
    }

    // Handle AI edit with streaming
    if (prompt) {
      // Load settings
      let settings = await PlaygroundSettings.findOne({
        userId: session.user.email,
        isGlobal: false,
      });

      if (!settings) {
        settings = await PlaygroundSettings.findOne({ isGlobal: true });
      }

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
          await section.saveVersion(
            accumulatedContent,
            session.user.email!,
            prompt
          );

          // Update context snapshot in background (non-blocking)
          ContextSnapshotService.createOrUpdateReportSnapshot(
            reportId,
            'section_edited'
          ).catch((error) => {
            console.error('Failed to update report snapshot:', error);
          });

          // Send completion event
          const completeChunk = `data: ${JSON.stringify({
            type: 'complete',
            section: section,
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
    if (htmlContent !== undefined) {
      await section.saveVersion(htmlContent, session.user.email!);
    }

    if (title !== undefined) {
      section.title = title;
    }

    if (order !== undefined) {
      section.order = order;
    }

    section.metadata.lastModifiedBy = session.user.email!;
    await section.save();

    // Update context snapshot in background (non-blocking)
    ContextSnapshotService.createOrUpdateReportSnapshot(
      reportId,
      'section_updated'
    ).catch((error) => {
      console.error('Failed to update report snapshot:', error);
    });

    return NextResponse.json({ section }, { status: 200 });
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
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { reportId, sectionId } = await params;

    const section = await ReportSection.findOne({
      _id: sectionId,
      reportId,
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const deletedOrder = section.order;

    // Delete the section
    await ReportSection.deleteOne({ _id: sectionId });

    // Update order of sections after deleted one
    await ReportSection.updateMany(
      { reportId, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    // Update report section refs
    const report = await PlaygroundReport.findById(reportId);
    if (report) {
      report.sectionRefs = report.sectionRefs.filter(
        (ref) => ref !== sectionId
      );
      await report.save();
    }

    // Update context snapshot in background (non-blocking)
    ContextSnapshotService.createOrUpdateReportSnapshot(
      reportId,
      'section_deleted'
    ).catch((error) => {
      console.error('Failed to update report snapshot:', error);
    });

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
