import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { claudeService } from '@/lib/ai/claude.service';
import { openaiService } from '@/lib/ai/openai.service';
import { trackReportUsage } from '@/lib/ai/usage-tracker';
import { ContextSnapshotService } from '@/lib/services/context-snapshot-service';
import { syncReportToPrisma } from '@/lib/utils/report-sync';

// System prompt for financial report generation with AssetWorks branding
const FINANCIAL_REPORT_PROMPT = `You are an expert financial analyst and data visualization specialist. Your role is to:

1. Generate comprehensive, professional financial reports in HTML format
2. Create interactive sections with clear headings and data visualizations
3. Structure reports with these section types:
   - Key Metrics (display important numbers prominently)
   - Charts (use CSS-only or SVG charts - NO JavaScript!)
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

8. OUTPUT FORMAT - ABSOLUTELY CRITICAL - READ THIS CAREFULLY:

   YOUR ENTIRE RESPONSE MUST BE PURE HTML ONLY. NOTHING ELSE.

   ❌ NEVER DO THIS:
   - "I'll create a dashboard..."
   - "This dashboard provides..."
   - Code fence markers (three backticks with html)
   - Any text before the HTML starts
   - Any text after the HTML ends
   - Any explanations or commentary

   ✅ ALWAYS DO THIS:
   - Start your response IMMEDIATELY with an HTML opening tag like <div
   - End your response with the closing HTML tag like </div>
   - NOTHING before the first <
   - NOTHING after the last >

   Example of CORRECT response format:
   <div data-section-id="section_text_1" class="report-section mb-6">
   [rest of HTML content]
   </div>

   Example of INCORRECT response (DO NOT DO THIS):
   I'll create a dashboard...
   (code fence with html)
   <div>...</div>
   (code fence end)

   IF YOU ADD ANY TEXT OUTSIDE THE HTML TAGS, YOU WILL BREAK THE SYSTEM.

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

CHART SECTIONS (CSS-ONLY - NO JAVASCRIPT):

IMPORTANT: DO NOT use <script>, <canvas>, or any JavaScript libraries (Chart.js, D3, etc.).
Use PURE CSS and SVG for all charts. Here are working examples:

CSS BAR CHART (Vertical):
<div data-section-id="section_chart_1" class="report-section mb-6 p-6 bg-white rounded-lg shadow-md">
  <h3 class="text-xl font-semibold mb-4" style="color: #1B2951;">Revenue by Quarter</h3>
  <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 250px; border-bottom: 2px solid #E9ECEF; gap: 20px;">
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
      <div style="font-weight: 600; color: #1B2951; margin-bottom: 8px;">$2.1M</div>
      <div style="width: 100%; height: 65%; background: linear-gradient(180deg, #1B2951 0%, #405D80 100%); border-radius: 8px 8px 0 0;"></div>
      <div style="margin-top: 8px; font-size: 14px; color: #2C3E50;">Q1</div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
      <div style="font-weight: 600; color: #1B2951; margin-bottom: 8px;">$2.8M</div>
      <div style="width: 100%; height: 87%; background: linear-gradient(180deg, #1B2951 0%, #405D80 100%); border-radius: 8px 8px 0 0;"></div>
      <div style="margin-top: 8px; font-size: 14px; color: #2C3E50;">Q2</div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
      <div style="font-weight: 600; color: #1B2951; margin-bottom: 8px;">$3.2M</div>
      <div style="width: 100%; height: 100%; background: linear-gradient(180deg, #1B2951 0%, #405D80 100%); border-radius: 8px 8px 0 0;"></div>
      <div style="margin-top: 8px; font-size: 14px; color: #2C3E50;">Q3</div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
      <div style="font-weight: 600; color: #1B2951; margin-bottom: 8px;">$2.9M</div>
      <div style="width: 100%; height: 91%; background: linear-gradient(180deg, #1B2951 0%, #405D80 100%); border-radius: 8px 8px 0 0;"></div>
      <div style="margin-top: 8px; font-size: 14px; color: #2C3E50;">Q4</div>
    </div>
  </div>
</div>

CSS HORIZONTAL BAR CHART:
<div data-section-id="section_chart_2" class="report-section mb-6 p-6 bg-white rounded-lg shadow-md">
  <h3 class="text-xl font-semibold mb-4" style="color: #1B2951;">Top Products by Sales</h3>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="font-weight: 500; color: #2C3E50;">Product A</span>
        <span style="font-weight: 600; color: #1B2951;">$845K</span>
      </div>
      <div style="width: 100%; height: 32px; background: #F8F9FA; border-radius: 8px; overflow: hidden;">
        <div style="width: 95%; height: 100%; background: linear-gradient(90deg, #1B2951 0%, #405D80 100%); display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; color: white; font-size: 12px; font-weight: 600;">95%</div>
      </div>
    </div>
    <div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="font-weight: 500; color: #2C3E50;">Product B</span>
        <span style="font-weight: 600; color: #1B2951;">$720K</span>
      </div>
      <div style="width: 100%; height: 32px; background: #F8F9FA; border-radius: 8px; overflow: hidden;">
        <div style="width: 81%; height: 100%; background: linear-gradient(90deg, #1B2951 0%, #405D80 100%); display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; color: white; font-size: 12px; font-weight: 600;">81%</div>
      </div>
    </div>
    <div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="font-weight: 500; color: #2C3E50;">Product C</span>
        <span style="font-weight: 600; color: #1B2951;">$520K</span>
      </div>
      <div style="width: 100%; height: 32px; background: #F8F9FA; border-radius: 8px; overflow: hidden;">
        <div style="width: 58%; height: 100%; background: linear-gradient(90deg, #1B2951 0%, #405D80 100%); display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; color: white; font-size: 12px; font-weight: 600;">58%</div>
      </div>
    </div>
  </div>
</div>

SVG PIE/DONUT CHART:
<div data-section-id="section_chart_3" class="report-section mb-6 p-6 bg-white rounded-lg shadow-md">
  <h3 class="text-xl font-semibold mb-4" style="color: #1B2951;">Revenue Distribution</h3>
  <div style="display: flex; align-items: center; gap: 40px;">
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="90" fill="none" stroke="#1B2951" stroke-width="40" stroke-dasharray="282.74 282.74" transform="rotate(-90 100 100)"/>
      <circle cx="100" cy="100" r="90" fill="none" stroke="#405D80" stroke-width="40" stroke-dasharray="141.37 424.12" stroke-dashoffset="-282.74" transform="rotate(-90 100 100)"/>
      <circle cx="100" cy="100" r="90" fill="none" stroke="#6C7B95" stroke-width="40" stroke-dasharray="84.82 519.67" stroke-dashoffset="-424.11" transform="rotate(-90 100 100)"/>
      <circle cx="100" cy="100" r="40" fill="white"/>
    </svg>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 16px; height: 16px; background: #1B2951; border-radius: 4px;"></div>
        <span style="color: #2C3E50;"><strong>Products:</strong> 50%</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 16px; height: 16px; background: #405D80; border-radius: 4px;"></div>
        <span style="color: #2C3E50;"><strong>Services:</strong> 30%</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 16px; height: 16px; background: #6C7B95; border-radius: 4px;"></div>
        <span style="color: #2C3E50;"><strong>Other:</strong> 20%</span>
      </div>
    </div>
  </div>
</div>

LINE CHART (SVG):
<div data-section-id="section_chart_4" class="report-section mb-6 p-6 bg-white rounded-lg shadow-md">
  <h3 class="text-xl font-semibold mb-4" style="color: #1B2951;">Stock Price Trend</h3>
  <svg width="100%" height="250" viewBox="0 0 600 250" style="border-bottom: 2px solid #E9ECEF;">
    <!-- Grid lines -->
    <line x1="0" y1="50" x2="600" y2="50" stroke="#E9ECEF" stroke-width="1"/>
    <line x1="0" y1="100" x2="600" y2="100" stroke="#E9ECEF" stroke-width="1"/>
    <line x1="0" y1="150" x2="600" y2="150" stroke="#E9ECEF" stroke-width="1"/>
    <line x1="0" y1="200" x2="600" y2="200" stroke="#E9ECEF" stroke-width="1"/>

    <!-- Line chart path -->
    <path d="M 0 180 L 100 150 L 200 120 L 300 140 L 400 90 L 500 70 L 600 50"
          stroke="#1B2951" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Data points -->
    <circle cx="0" cy="180" r="5" fill="#1B2951"/>
    <circle cx="100" cy="150" r="5" fill="#1B2951"/>
    <circle cx="200" cy="120" r="5" fill="#1B2951"/>
    <circle cx="300" cy="140" r="5" fill="#1B2951"/>
    <circle cx="400" cy="90" r="5" fill="#1B2951"/>
    <circle cx="500" cy="70" r="5" fill="#1B2951"/>
    <circle cx="600" cy="50" r="5" fill="#1B2951"/>

    <!-- Labels -->
    <text x="0" y="235" fill="#2C3E50" font-size="12" text-anchor="middle">Jan</text>
    <text x="100" y="235" fill="#2C3E50" font-size="12" text-anchor="middle">Feb</text>
    <text x="200" y="235" fill="#2C3E50" font-size="12" text-anchor="middle">Mar</text>
    <text x="300" y="235" fill="#2C3E50" font-size="12" text-anchor="middle">Apr</text>
    <text x="400" y="235" fill="#2C3E50" font-size="12" text-anchor="middle">May</text>
    <text x="500" y="235" fill="#2C3E50" font-size="12" text-anchor="middle">Jun</text>
  </svg>
</div>

Use these exact patterns for all charts. Adjust heights/widths/percentages based on your data. NEVER use JavaScript.

Use these styles consistently throughout all generated reports.`;

// POST /api/playground/threads/:threadId/messages - Send message and generate report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { threadId } = await params;
    const body = await request.json();
    const { content, model = 'claude-3-5-sonnet-20241022', provider = 'anthropic' } = body;

    if (!content || content.trim().length === 0) {
      return new Response('Message content is required', { status: 400 });
    }

    // Verify thread access
    const thread = await prisma.threads.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return new Response('Thread not found', { status: 404 });
    }

    const isOwner = thread.userId === session.user.id;
    const sharedWith = (thread.sharedWith as any[]) || [];
    const hasEditAccess = sharedWith.some(
      (share: any) => share.userId === session.user.id && share.permission === 'edit'
    );

    if (!isOwner && !hasEditAccess) {
      return new Response('Access denied', { status: 403 });
    }

    // Save user message
    const userMessage = await prisma.messages.create({
      data: {
        id: randomUUID(),
        threadId,
        userId: session.user.id,
        role: 'USER',
        content: content.trim(),
        metadata: {},
        updatedAt: new Date(),
      },
    });

    // Update thread title if it's the first message
    if (thread.title === 'New Thread' || !thread.title) {
      await prisma.threads.update({
        where: { id: threadId },
        data: {
          title: content.substring(0, 100),
          updatedAt: new Date(),
        },
      });
    }

    // Load user's playground settings
    let settings = await prisma.playground_settings.findFirst({
      where: { userId: session.user.id },
    });

    // If no settings, create default
    if (!settings) {
      settings = await prisma.playground_settings.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          defaultModel: null,
          defaultProvider: null,
          autoSave: true,
          settings: {}, // Empty JSON object for default settings
          updatedAt: new Date(),
        },
      });
    }

    // Extract settings from JSON field with fallback to defaults
    const settingsData = (settings.settings as any) || {};

    // Default provider configuration (fallback for missing/incomplete settings)
    const DEFAULT_PROVIDERS = [
      {
        id: 'anthropic',
        name: 'Anthropic',
        enabled: true,
        models: [
          {
            id: 'claude-3-5-sonnet-20241022',
            name: 'Claude 3.5 Sonnet',
            enabled: true,
            maxTokens: 8192,
            temperature: 0.7,
          },
        ],
      },
    ];

    // Select system prompt based on activeSystemPromptId
    let systemPrompt = FINANCIAL_REPORT_PROMPT;

    if (settingsData.systemPrompts && settingsData.systemPrompts.length > 0 && settingsData.activeSystemPromptId) {
      const activePrompt = settingsData.systemPrompts.find(
        (p: any) => p.id === settingsData.activeSystemPromptId
      );
      if (activePrompt) {
        systemPrompt = activePrompt.content;
      } else {
        // Fallback to legacy systemPrompt field if active prompt not found
        systemPrompt = settingsData.systemPrompt || FINANCIAL_REPORT_PROMPT;
      }
    } else {
      // Fallback to legacy systemPrompt field
      systemPrompt = settingsData.systemPrompt || FINANCIAL_REPORT_PROMPT;
    }

    // Validate provider and model are enabled (with fallback to defaults)
    const providers = settingsData.providers || DEFAULT_PROVIDERS;
    const selectedProvider = providers.find(
      (p: any) => p.id === provider && p.enabled
    );
    if (!selectedProvider) {
      console.error('Provider not enabled:', { provider, availableProviders: providers.map((p: any) => ({ id: p.id, enabled: p.enabled })) });
      return new Response(`Selected provider '${provider}' is not enabled. Please check your playground settings.`, { status: 400 });
    }

    const selectedModel = selectedProvider.models.find(
      (m: any) => m.id === model && m.enabled
    );
    if (!selectedModel) {
      console.error('Model not enabled:', { model, availableModels: selectedProvider.models.map((m: any) => ({ id: m.id, enabled: m.enabled })) });
      return new Response(`Selected model '${model}' is not enabled. Please check your playground settings.`, { status: 400 });
    }

    // Get conversation history
    const previousMessages = await prisma.messages.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming in background
    (async () => {
      const startTime = Date.now();
      let accumulatedContent = '';
      let usageData = { inputTokens: 0, outputTokens: 0 };
      let reportId: string | null = null;

      try {
        // Generate AI response
        let generator;
        // Normalize roles to lowercase and filter out system messages (Claude doesn't accept them in messages array)
        const messages = previousMessages
          .filter((m) => m.role.toUpperCase() !== 'SYSTEM') // Remove system messages
          .map((m) => ({
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: m.content,
          }));

        if (provider === 'anthropic' || model.startsWith('claude')) {
          generator = claudeService.streamResponse({
            messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
            systemPrompt: systemPrompt,
            model,
            temperature: selectedModel.temperature,
            maxTokens: selectedModel.maxTokens,
            onUsage: (usage) => {
              usageData = usage;
              console.log('🔔 Sending usage update to client:', usage);
              // Send usage update to client during streaming
              const usageChunk = `data: ${JSON.stringify({
                type: 'usage',
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
              })}\n\n`;
              writer.write(encoder.encode(usageChunk)).catch(() => {});
            },
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

        // Clean up any non-HTML text that the AI might have added
        accumulatedContent = cleanHtmlContent(accumulatedContent);

        // Parse HTML to extract sections and insights
        const sections = extractSections(accumulatedContent);
        const insights = extractInsights(accumulatedContent);

        // Create new report
        const report = await prisma.playground_reports.create({
          data: {
            id: randomUUID(),
            threadId,
            htmlContent: accumulatedContent,
            sections: sections as any[],
            insights: insights as any[],
            isInteractiveMode: false,
            generatedBy: session.user.email || session.user.id,
            model,
            provider,
            prompt: content,
            generationTime: duration,
            metadata: {
              generatedBy: session.user.email,
              model,
              provider,
              prompt: content,
              generationTime: duration,
            },
            totalTokens: usageData.inputTokens + usageData.outputTokens,
            totalCost: 0, // Will be calculated by trackReportUsage
            updatedAt: new Date(),
          },
        });
        reportId = report.id;

        // Track usage if we have token data
        if (usageData.inputTokens > 0 || usageData.outputTokens > 0) {
          await trackReportUsage(reportId, {
            type: 'generation',
            model,
            provider,
            inputTokens: usageData.inputTokens,
            outputTokens: usageData.outputTokens,
          });
        }

        // Update thread with new report
        const currentReportVersions = thread.reportVersions || [];
        await prisma.threads.update({
          where: { id: threadId },
          data: {
            currentReportId: reportId,
            reportVersions: [...currentReportVersions, reportId],
            updatedAt: new Date(),
          },
        });

        // Generate a conversational summary for chat display
        const sectionCount = sections.length;
        const insightCount = insights.length;
        const chatSummary = generateChatSummary(sectionCount, insightCount, content);

        // Save assistant message with summary (not full HTML)
        const assistantMessage = await prisma.messages.create({
          data: {
            id: randomUUID(),
            threadId,
            userId: session.user.id,
            role: 'ASSISTANT',
            content: chatSummary,
            reportId: report.id,
            metadata: {
              model,
              provider,
              duration,
            },
            updatedAt: new Date(),
          },
        });

        // Update context snapshot in background (non-blocking)
        ContextSnapshotService.createOrUpdateThreadSnapshot(
          threadId,
          'message_created'
        ).catch((error) => {
          console.error('Failed to update thread snapshot:', error);
        });

        // Report already created in Prisma, just sync entities (non-blocking)
        syncReportToPrisma({
          _id: report.id,
          threadId,
          htmlContent: accumulatedContent,
          metadata: {
            generatedBy: session.user.email || session.user.id,
            prompt: content,
            model,
            provider,
          },
        }).catch((error) => {
          console.error('Failed to sync entities from report:', error);
        });

        // Send completion event
        const completeChunk = `data: ${JSON.stringify({
          type: 'complete',
          reportId: report.id,
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

// Helper function to clean HTML content by removing explanatory text
function cleanHtmlContent(content: string): string {
  // Remove any text before the first HTML tag
  const firstTagIndex = content.indexOf('<');
  if (firstTagIndex > 0) {
    content = content.substring(firstTagIndex);
  }

  // Remove any text after the last HTML closing tag
  const lastTagIndex = content.lastIndexOf('>');
  if (lastTagIndex > 0 && lastTagIndex < content.length - 1) {
    content = content.substring(0, lastTagIndex + 1);
  }

  // Remove ```html and ``` code fence markers if present
  content = content.replace(/^```html\s*/i, '').replace(/\s*```$/,  '');

  return content.trim();
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await params;

    // Verify thread access
    const thread = await prisma.threads.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const isOwner = thread.userId === session.user.id;
    const sharedWith = (thread.sharedWith as any[]) || [];
    const hasAccess = sharedWith.some(
      (share: any) => share.userId === session.user.id
    );

    if (!isOwner && !hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const messages = await prisma.messages.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
