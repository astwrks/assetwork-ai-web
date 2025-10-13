import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import Thread from '@/lib/db/models/Thread';
import Message from '@/lib/db/models/Message';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import PlaygroundSettings from '@/lib/db/models/PlaygroundSettings';
import { claudeService } from '@/lib/ai/claude.service';
import { openaiService } from '@/lib/ai/openai.service';

// System prompt for financial report generation with AssetWorks branding
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
   - Professional styling using AssetWorks brand colors

5. Provide 2-4 key insights at the top of each report

6. REAL-TIME FINANCIAL DATA ACCESS:
   You have access to real-time financial data through internal APIs. When generating reports about stocks or cryptocurrencies:

   **Stock Market Data:**
   - Use: GET /api/financial-data/stocks/{SYMBOL} for stock quotes
   - Example: /api/financial-data/stocks/AAPL returns real-time Apple stock data
   - Available parameters: ?history=true (historical data), ?company=true (company info)
   - Major indices available: SPY (S&P 500), DIA (Dow), QQQ (NASDAQ)

   **Cryptocurrency Data:**
   - Use: GET /api/financial-data/crypto/{COIN_ID} for crypto quotes
   - Example: /api/financial-data/crypto/bitcoin returns real-time Bitcoin data
   - Common coin IDs: bitcoin, ethereum, binancecoin, cardano, solana
   - Available parameters: ?history=true&days=30 (historical data)

   **Market Overview:**
   - Use: GET /api/financial-data/market-overview for complete market snapshot
   - Returns: Major stock indices + top 10 cryptocurrencies + global crypto stats

   **Search:**
   - Use: GET /api/financial-data/search?q=QUERY&type=stocks|crypto|all
   - Find stocks or cryptocurrencies by name or symbol

   IMPORTANT: When you include financial data in reports, you MUST actually fetch it from these APIs.
   Make HTTP requests to these endpoints and use the REAL data returned. Never fabricate data.

   Example: If user asks for "Apple stock analysis", you should:
   1. Fetch: /api/financial-data/stocks/AAPL
   2. Use the actual price, volume, and market data returned
   3. Cite source as: "Apple Inc. (Technology) - Source: Alpha Vantage API"

7. DATA SOURCE REQUIREMENTS:
   - ALWAYS cite data sources with entity name, category, and source
   - Include a "Data Sources" section at the end of every report
   - Format: "Company Name (Category) - Source: [API or Database Name]"
   - For our internal APIs, cite as "Alpha Vantage API" (stocks) or "CoinGecko API" (crypto)
   - Never fabricate data - if data isn't available, clearly state "Data not available"

8. Return ONLY the HTML content, properly structured and styled

ASSETWORKS BRAND COLORS (use these exclusively):
- Primary Navy: #1B2951 (headings, important text, primary buttons)
- Deep Blue: #405D80 (secondary accents, gradients)
- Selection Blue-Gray: #6C7B95 (labels, secondary text)
- Heavy Text: #2C3E50 (body text)
- Light Gray: #F8F9FA (backgrounds)
- Border Gray: #E9ECEF (borders, dividers)
- Danger Red: #DC3545 (warnings, critical alerts)

Example section structures:

METRIC CARD:
<div data-section-id="section_metric_1" class="report-section mb-6 p-6 rounded-lg shadow-md" style="background: linear-gradient(135deg, #1B2951 0%, #405D80 100%); color: white;">
  <h3 class="text-lg font-semibold mb-2">Revenue Growth</h3>
  <div class="text-4xl font-bold mb-1">$4.2M</div>
  <p class="text-sm opacity-90">+18% YoY</p>
</div>

TEXT SECTION:
<div data-section-id="section_text_1" class="report-section mb-6 p-6 bg-white rounded-lg shadow-md border" style="border-color: #E9ECEF;">
  <h3 class="text-xl font-semibold mb-4" style="color: #1B2951;">Financial Analysis</h3>
  <p style="color: #2C3E50; line-height: 1.6;">Your analysis text here...</p>
</div>

TABLE SECTION:
<div data-section-id="section_table_1" class="report-section mb-6 p-6 bg-white rounded-lg shadow-md">
  <h3 class="text-xl font-semibold mb-4" style="color: #1B2951;">Financial Summary</h3>
  <table class="w-full">
    <thead>
      <tr style="background: rgba(27, 41, 81, 0.05);">
        <th class="p-3 text-left font-semibold" style="color: #1B2951; border-bottom: 2px solid #E9ECEF;">Item</th>
        <th class="p-3 text-right font-semibold" style="color: #1B2951; border-bottom: 2px solid #E9ECEF;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr class="hover:bg-gray-50">
        <td class="p-3" style="color: #2C3E50; border-bottom: 1px solid #E9ECEF;">Revenue</td>
        <td class="p-3 text-right" style="color: #2C3E50; border-bottom: 1px solid #E9ECEF;">$4.2M</td>
      </tr>
    </tbody>
  </table>
</div>

INSIGHT SECTION:
<div data-section-id="section_insight_1" class="report-section mb-6 p-5 rounded-lg" style="background: rgba(27, 41, 81, 0.05); border-left: 4px solid #1B2951;">
  <div class="flex items-start gap-3">
    <div class="font-semibold" style="color: #1B2951;">💡 Key Insight</div>
    <p style="color: #2C3E50;">Your insight text here...</p>
  </div>
</div>

DATA SOURCES SECTION (REQUIRED at end of every report):
<div data-section-id="section_sources_1" class="report-section mb-6 p-6 bg-white rounded-lg shadow-md border-t-4" style="border-top-color: #405D80;">
  <h3 class="text-xl font-semibold mb-4" style="color: #1B2951;">📊 Data Sources</h3>
  <ul class="space-y-2">
    <li style="color: #2C3E50;">
      <strong>Apple Inc.</strong> (Technology) - Source: <a href="https://finance.yahoo.com/quote/AAPL" style="color: #405D80; text-decoration: underline;">Yahoo Finance Q4 2024</a>
    </li>
    <li style="color: #2C3E50;">
      <strong>Tesla Inc.</strong> (Automotive) - Source: <a href="https://ir.tesla.com" style="color: #405D80; text-decoration: underline;">Tesla Investor Relations</a>
    </li>
  </ul>
</div>

Use these styles consistently throughout all generated reports.`;

// POST /api/playground/threads/:threadId/messages - Send message and generate report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    const { threadId } = await params;
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

    // Load user's playground settings
    let settings = await PlaygroundSettings.findOne({
      userId: session.user.email,
      isGlobal: false,
    });

    // If no user settings, try global settings
    if (!settings) {
      settings = await PlaygroundSettings.findOne({ isGlobal: true });
    }

    // If still no settings, create default
    if (!settings) {
      settings = new PlaygroundSettings({
        userId: session.user.email,
        isGlobal: false,
        lastModifiedBy: session.user.email,
      });
      await settings.save();
    }

    // Select system prompt based on activeSystemPromptId
    let systemPrompt = FINANCIAL_REPORT_PROMPT;

    if (settings.systemPrompts && settings.systemPrompts.length > 0 && settings.activeSystemPromptId) {
      const activePrompt = settings.systemPrompts.find(
        (p) => p.id === settings.activeSystemPromptId
      );
      if (activePrompt) {
        systemPrompt = activePrompt.content;
      } else {
        // Fallback to legacy systemPrompt field if active prompt not found
        systemPrompt = settings.systemPrompt || FINANCIAL_REPORT_PROMPT;
      }
    } else {
      // Fallback to legacy systemPrompt field
      systemPrompt = settings.systemPrompt || FINANCIAL_REPORT_PROMPT;
    }

    // Validate provider and model are enabled
    const selectedProvider = settings.providers.find(
      (p) => p.id === provider && p.enabled
    );
    if (!selectedProvider) {
      return new Response('Selected provider is not enabled', { status: 400 });
    }

    const selectedModel = selectedProvider.models.find(
      (m) => m.id === model && m.enabled
    );
    if (!selectedModel) {
      return new Response('Selected model is not enabled', { status: 400 });
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
            systemPrompt: systemPrompt,
            model,
            temperature: selectedModel.temperature,
            maxTokens: selectedModel.maxTokens,
          });
        } else {
          generator = openaiService.streamResponse({
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            temperature: selectedModel.temperature,
            maxTokens: selectedModel.maxTokens,
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

        // Generate a conversational summary for chat display
        const sectionCount = sections.length;
        const insightCount = insights.length;
        const chatSummary = generateChatSummary(sectionCount, insightCount, content);

        // Save assistant message with summary (not full HTML)
        const assistantMessage = new Message({
          threadId,
          role: 'assistant',
          content: chatSummary,
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

// Helper function to generate conversational chat summary
function generateChatSummary(sectionCount: number, insightCount: number, userRequest: string): string {
  // Extract key topic from user request (first few words)
  const topic = userRequest.length > 60 ? userRequest.substring(0, 60) + '...' : userRequest;

  const sectionText = sectionCount === 1 ? '1 section' : `${sectionCount} sections`;
  const insightText = insightCount > 0 ? ` with ${insightCount} key insights` : '';

  return `I've created a comprehensive report about "${topic}" with ${sectionText}${insightText}. You can view the full report in the right panel, where you can interact with individual sections, edit them, or download the report as PDF.`;
}

// GET /api/playground/threads/:threadId/messages - Get all messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { threadId } = await params;

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
