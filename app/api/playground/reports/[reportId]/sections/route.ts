import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import ReportSection from '@/lib/db/models/ReportSection';
import PlaygroundSettings from '@/lib/db/models/PlaygroundSettings';
import { claudeService } from '@/lib/ai/claude.service';
import { openaiService } from '@/lib/ai/openai.service';

// GET /api/playground/reports/:reportId/sections - Get all sections for a report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { reportId } = await params;

    // Find the report and verify access
    const report = await PlaygroundReport.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get all sections for this report, ordered
    const sections = await ReportSection.find({ reportId })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({ sections }, { status: 200 });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST /api/playground/reports/:reportId/sections - Create new section with AI
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { reportId } = await params;
    const body = await request.json();
    const {
      prompt,
      position,
      type = 'custom',
      model = 'claude-3-5-sonnet-20241022',
      provider = 'anthropic',
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Find the report
    const report = await PlaygroundReport.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Load user settings for system prompt and model config
    let settings = await PlaygroundSettings.findOne({
      userId: session.user.email,
      isGlobal: false,
    });

    if (!settings) {
      settings = await PlaygroundSettings.findOne({ isGlobal: true });
    }

    // Get adjacent sections for context
    const adjacentSections = await ReportSection.find({ reportId })
      .sort({ order: 1 })
      .limit(5)
      .lean();

    const contextPrompt = `You are generating a new section for a financial report.

Report Context:
- Report Title: ${report.metadata?.prompt || 'Financial Report'}
- Existing sections: ${adjacentSections.map(s => s.title).join(', ')}

User Request: ${prompt}

Generate ONLY the HTML for this new section. Use AssetWorks branding colors (#1B2951, #405D80, #6C7B95).
Include a data-section-id attribute with format: data-section-id="section_${type}_${position}"
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
            messages: [{ role: 'user', content: contextPrompt }],
            systemPrompt: settings?.systemPrompt || '',
            model,
          });
        } else {
          generator = openaiService.streamResponse({
            messages: [
              { role: 'system', content: settings?.systemPrompt || '' },
              { role: 'user', content: contextPrompt },
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

        // Extract title from HTML
        const titleMatch = accumulatedContent.match(
          /<h[2-4][^>]*>(.*?)<\/h[2-4]>/
        );
        const title = titleMatch
          ? titleMatch[1].replace(/<[^>]+>/g, '')
          : 'New Section';

        // Update order of existing sections if inserting in middle
        if (position !== undefined && position >= 0) {
          await ReportSection.updateMany(
            { reportId, order: { $gte: position } },
            { $inc: { order: 1 } }
          );
        }

        // Determine order
        const maxOrderSection = await ReportSection.findOne({ reportId })
          .sort({ order: -1 })
          .limit(1);
        const order =
          position !== undefined && position >= 0
            ? position
            : maxOrderSection
            ? maxOrderSection.order + 1
            : 0;

        // Create new section
        const newSection = new ReportSection({
          reportId,
          type,
          title,
          htmlContent: accumulatedContent,
          order,
          version: 1,
          editHistory: [],
          metadata: {
            originallyGeneratedBy: session.user.email,
            lastModifiedBy: session.user.email,
            model,
            originalPrompt: prompt,
          },
        });

        await newSection.save();

        // Update report to enable interactive mode
        report.isInteractiveMode = true;
        if (!report.sectionRefs.includes(newSection._id.toString())) {
          report.sectionRefs.push(newSection._id.toString());
        }
        await report.save();

        // Send completion event
        const completeChunk = `data: ${JSON.stringify({
          type: 'complete',
          section: newSection,
        })}\n\n`;
        await writer.write(encoder.encode(completeChunk));
        await writer.close();
      } catch (error) {
        console.error('Section generation error:', error);
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
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}
