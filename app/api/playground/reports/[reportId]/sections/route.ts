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

    // Get ALL sections for comprehensive context
    const allSections = await ReportSection.find({ reportId })
      .sort({ order: 1 })
      .lean();

    // Get conversation history from thread if available
    let conversationContext = '';
    if (report.threadId) {
      const Thread = (await import('@/lib/db/models/Thread')).default;
      const thread = await Thread.findById(report.threadId);

      if (thread) {
        const Message = (await import('@/lib/db/models/Message')).default;
        const messages = await Message.find({ threadId: thread._id })
          .sort({ createdAt: 1 })
          .limit(10)
          .lean();

        if (messages.length > 0) {
          conversationContext = '\n\nConversation History:\n' + messages
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`)
            .join('\n');
        }
      }
    }

    // Build comprehensive section context
    const sectionsContext = allSections.length > 0
      ? '\n\nExisting Report Sections:\n' + allSections.map((s, idx) => {
          // Extract text content from HTML (remove tags for cleaner context)
          const textContent = s.htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          return `${idx + 1}. ${s.title} (${s.type})
   Content Preview: ${textContent.substring(0, 300)}${textContent.length > 300 ? '...' : ''}`;
        }).join('\n\n')
      : '\n\nThis is the first section of the report.';

    // Extract key data points and metrics from existing sections
    const dataPointsContext = allSections.length > 0
      ? '\n\nKey Data Points from Existing Sections:\n' + allSections
          .map(s => {
            // Extract numbers, percentages, and monetary values
            const numbers = s.htmlContent.match(/[\$£€¥]?\d+(?:,\d{3})*(?:\.\d+)?%?/g) || [];
            if (numbers.length > 0) {
              return `- ${s.title}: ${numbers.slice(0, 5).join(', ')}`;
            }
            return null;
          })
          .filter(Boolean)
          .join('\n')
      : '';

    const contextPrompt = `You are generating a new section for a financial report. Your goal is to create content that is coherent with the existing report, matches its style and tone, and adds meaningful value.

REPORT CONTEXT:
=================
Report Title: ${report.metadata?.prompt || report.title || 'Financial Report'}
Report Type: ${report.metadata?.reportType || 'Financial Analysis'}
Created: ${report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recently'}
${conversationContext}${sectionsContext}${dataPointsContext}

STYLE GUIDELINES:
=================
- Match the tone and complexity of existing sections
- Use consistent terminology with previous sections
- Reference data points from existing sections when relevant
- Maintain professional financial reporting standards
- Use AssetWorks branding colors: Primary (#1B2951), Secondary (#405D80), Accent (#6C7B95)

USER'S NEW SECTION REQUEST:
===========================
${prompt}

INSTRUCTIONS:
=============
1. Analyze the existing sections to understand the report's narrative and data points
2. Create a new section that fits naturally with the existing content
3. If the user's request relates to existing data, incorporate and build upon it
4. Generate ONLY clean, semantic HTML for this new section
5. Include a data-section-id attribute: data-section-id="section_${type}_${position || 'new'}"
6. Use appropriate heading levels (h2 for section title, h3 for subsections)
7. Include relevant charts, tables, or data visualizations if appropriate
8. Return ONLY the HTML content, no explanations or markdown code blocks

Generate the new section now:`;

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
