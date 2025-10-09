import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import Thread from '@/lib/db/models/Thread';
import Message from '@/lib/db/models/Message';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import { claudeService } from '@/lib/ai/claude.service';
import { openaiService } from '@/lib/ai/openai.service';

// System prompt for financial report generation
const FINANCIAL_REPORT_PROMPT = `You are an expert financial analyst and data visualization specialist. Your role is to:

1. Generate comprehensive, professional financial reports in HTML format
2. Create interactive sections with clear headings and data visualizations
3. Structure reports with these section types:
   - Key Metrics (display important numbers prominently)
   - Charts (using Recharts-compatible data structures)
   - Tables (formatted financial data)
   - Analysis Text (insights and recommendations)
   - Critical Insights (highlighted important findings)

4. Each section MUST have:
   - A unique ID in this format: data-section-id="section_[type]_[number]"
   - A clear title
   - Professional styling using Tailwind CSS classes

5. Provide 2-4 key insights at the top of each report

6. Return ONLY the HTML content, properly structured and styled

Example section structure:
<div data-section-id="section_metric_1" class="report-section mb-6 p-4 bg-white rounded-lg shadow">
  <h3 class="text-lg font-semibold mb-2">Revenue Growth</h3>
  <div class="text-3xl font-bold text-green-600">$4.2M</div>
  <p class="text-sm text-gray-600">+18% YoY</p>
</div>`;

// POST /api/playground/threads/:threadId/messages - Send message and generate report
export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    const { threadId } = params;
    const body = await request.json();
    const { content, model = 'claude-3-5-sonnet-20241022', provider = 'anthropic' } = body;

    if (!content || content.trim().length === 0) {
      return new Response('Message content is required', { status: 400 });
    }

    // Verify thread access
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return new Response('Thread not found', { status: 404 });
    }

    const isOwner = thread.userId === session.user.email;
    const hasEditAccess = thread.sharedWith.some(
      (share) => share.userId === session.user.email && share.permission === 'edit'
    );

    if (!isOwner && !hasEditAccess) {
      return new Response('Access denied', { status: 403 });
    }

    // Save user message
    const userMessage = new Message({
      threadId,
      role: 'user',
      content: content.trim(),
    });
    await userMessage.save();

    // Update thread title if it's the first message
    if (thread.title === 'New Thread' || !thread.title) {
      thread.title = content.substring(0, 100);
      await thread.save();
    }

    // Get conversation history
    const previousMessages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming in background
    (async () => {
      const startTime = Date.now();
      let accumulatedContent = '';

      try {
        // Generate AI response
        let generator;
        const messages = previousMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        if (provider === 'anthropic' || model.startsWith('claude')) {
          generator = claudeService.streamResponse({
            messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
            systemPrompt: FINANCIAL_REPORT_PROMPT,
            model,
          });
        } else {
          generator = openaiService.streamResponse({
            messages: [
              { role: 'system', content: FINANCIAL_REPORT_PROMPT },
              ...messages,
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

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Parse HTML to extract sections and insights
        const sections = extractSections(accumulatedContent);
        const insights = extractInsights(accumulatedContent);

        // Create new report
        const report = new PlaygroundReport({
          threadId,
          htmlContent: accumulatedContent,
          sections,
          insights,
          metadata: {
            generatedBy: session.user.email,
            model,
            provider,
            prompt: content,
            generationTime: duration,
          },
        });
        await report.save();

        // Update thread with new report
        thread.currentReportId = report._id.toString();
        thread.reportVersions.push(report._id.toString());
        await thread.save();

        // Save assistant message
        const assistantMessage = new Message({
          threadId,
          role: 'assistant',
          content: accumulatedContent,
          reportId: report._id.toString(),
          metadata: {
            model,
            provider,
            duration,
          },
        });
        await assistantMessage.save();

        // Send completion event
        const completeChunk = `data: ${JSON.stringify({
          type: 'complete',
          reportId: report._id.toString(),
          duration,
        })}\n\n`;
        await writer.write(encoder.encode(completeChunk));
        await writer.close();
      } catch (error) {
        console.error('Streaming error:', error);
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
    console.error('Error in messages endpoint:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Helper function to extract sections from HTML
function extractSections(html: string) {
  const sections: any[] = [];
  const sectionRegex = /<div[^>]*data-section-id="([^"]+)"[^>]*>([\s\S]*?)<\/div>/g;
  let match;
  let order = 0;

  while ((match = sectionRegex.exec(html)) !== null) {
    const sectionId = match[1];
    const sectionHtml = match[0];

    // Extract title
    const titleMatch = sectionHtml.match(/<h[2-4][^>]*>(.*?)<\/h[2-4]>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled Section';

    // Determine section type from ID
    let type: 'chart' | 'table' | 'text' | 'metric' | 'insight' = 'text';
    if (sectionId.includes('chart')) type = 'chart';
    else if (sectionId.includes('table')) type = 'table';
    else if (sectionId.includes('metric')) type = 'metric';
    else if (sectionId.includes('insight')) type = 'insight';

    sections.push({
      id: sectionId,
      type,
      title,
      htmlContent: sectionHtml,
      order: order++,
    });
  }

  return sections;
}

// Helper function to extract insights
function extractInsights(html: string) {
  const insights: any[] = [];
  const insightRegex = /<div[^>]*class="[^"]*insight[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  let idCounter = 1;

  while ((match = insightRegex.exec(html)) !== null) {
    const insightHtml = match[1];
    const text = insightHtml.replace(/<[^>]+>/g, '').trim();

    let severity: 'info' | 'warning' | 'critical' | 'success' = 'info';
    if (insightHtml.includes('critical') || insightHtml.includes('danger')) {
      severity = 'critical';
    } else if (insightHtml.includes('warning')) {
      severity = 'warning';
    } else if (insightHtml.includes('success') || insightHtml.includes('positive')) {
      severity = 'success';
    }

    if (text.length > 0) {
      insights.push({
        id: `insight_${idCounter++}`,
        text,
        severity,
      });
    }
  }

  return insights;
}

// GET /api/playground/threads/:threadId/messages - Get all messages
export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { threadId } = params;

    // Verify thread access
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const isOwner = thread.userId === session.user.email;
    const hasAccess = thread.sharedWith.some(
      (share) => share.userId === session.user.email
    );

    if (!isOwner && !hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .limit(500);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
