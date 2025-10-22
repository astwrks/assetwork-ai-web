import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { claudeService } from '@/lib/ai/claude.service';
import { openaiService } from '@/lib/ai/openai.service';
import { trackReportUsage } from '@/lib/ai/usage-tracker';
import { ContextSnapshotService } from '@/lib/services/context-snapshot-service';

// GET /api/playground/reports/:reportId/sections - Get all sections for a report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // Find the report and verify access
    const report = await prisma.playground_reports.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get all sections for this report, ordered
    const sections = await prisma.report_sections.findMany({
      where: { reportId },
      orderBy: { order: 'asc' },
    });

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const report = await prisma.playground_reports.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Load user settings for system prompt and model config
    let settings = await prisma.playground_settings.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    // Get ALL sections for comprehensive context
    const allSections = await prisma.report_sections.findMany({
      where: { reportId },
      orderBy: { order: 'asc' },
    });

    // Get conversation history from thread if available
    let conversationContext = '';
    if (report.threadId) {
      const thread = await prisma.threads.findUnique({
        where: { id: report.threadId },
      });

      if (thread) {
        const messages = await prisma.messages.findMany({
          where: { threadId: report.threadId },
          orderBy: { createdAt: 'asc' },
          take: 10,
        });

        if (messages.length > 0) {
          conversationContext = '\n\nConversation History:\n' + messages
            .map(m => `${m.role === 'USER' ? 'User' : 'Assistant'}: ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`)
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

    const contextPrompt = `You are an expert financial report designer generating a new section with PROFESSIONAL, HIGH-QUALITY HTML. Your goal is to create visually stunning, modern content that is coherent with the existing report.

REPORT CONTEXT:
=================
Report Title: ${report.metadata?.prompt || report.title || 'Financial Report'}
Report Type: ${report.metadata?.reportType || 'Financial Analysis'}
Created: ${report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recently'}
${conversationContext}${sectionsContext}${dataPointsContext}

ASSETWORKS DESIGN SYSTEM:
==========================
COLOR PALETTE (Use these exact hex codes):
- Primary: #1B2951 (Navy Blue) - Main headings, important text
- Secondary: #405D80 (Steel Blue) - Subheadings, secondary elements
- Accent: #6C7B95 (Slate Blue) - Muted text, borders
- Success: #10B981 - Positive metrics, growth indicators
- Warning: #F59E0B - Caution, moderate alerts
- Danger: #EF4444 - Negative metrics, alerts
- Info: #3B82F6 - Informational elements
- Background: #F8FAFC - Light backgrounds
- Text: #1E293B - Body text
- Muted: #64748B - Secondary text, captions

TYPOGRAPHY HIERARCHY (Tailwind Classes):
- Section Title: class="text-2xl md:text-3xl font-bold text-[#1B2951] mb-6 pb-4 border-b-2 border-[#405D80]"
- Subsection: class="text-xl font-semibold text-[#405D80] mb-4"
- Body Text: class="text-base text-[#1E293B] leading-relaxed"
- Caption: class="text-sm text-[#64748B]"
- Large Metrics: class="text-3xl md:text-4xl font-bold text-[#1B2951]"

PROFESSIONAL COMPONENT PATTERNS:
=================================

1. METRIC CARDS (Use for KPIs, statistics):
<div class="bg-gradient-to-br from-blue-50 to-white rounded-lg p-6 border border-blue-100 hover:shadow-md transition-shadow">
  <div class="flex items-center justify-between mb-2">
    <span class="text-sm font-medium text-[#64748B]">Metric Name</span>
    <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
    </svg>
  </div>
  <div class="text-3xl font-bold text-[#1B2951]">$2.4M</div>
  <div class="mt-2 flex items-center text-sm">
    <span class="text-green-600 font-medium">↑ 12.5%</span>
    <span class="text-[#64748B] ml-2">vs last period</span>
  </div>
</div>

2. DATA TABLES (Professional styling):
<div class="overflow-x-auto rounded-lg border border-gray-200">
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gradient-to-r from-[#1B2951] to-[#405D80]">
      <tr>
        <th class="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Column</th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1E293B]">Data</td>
      </tr>
    </tbody>
  </table>
</div>

3. INSIGHT/ALERT BOXES:
<div class="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 my-6 shadow-sm">
  <div class="flex items-start">
    <svg class="w-6 h-6 text-blue-500 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
    </svg>
    <div>
      <h4 class="text-lg font-semibold text-[#1B2951] mb-2">Key Insight</h4>
      <p class="text-[#1E293B] leading-relaxed">Insight content here</p>
    </div>
  </div>
</div>

4. STATUS BADGES:
<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ On Target</span>
<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">⚠ Warning</span>
<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Critical</span>

USER'S NEW SECTION REQUEST:
===========================
${prompt}

CHARTS - CRITICAL: NO JAVASCRIPT ALLOWED!
==========================================
If creating charts, use ONLY CSS or SVG. Examples:

CSS BAR CHART:
<div style="display: flex; align-items: flex-end; justify-content: space-around; height: 250px; border-bottom: 2px solid #E9ECEF; gap: 20px;">
  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
    <div style="font-weight: 600; color: #1B2951; margin-bottom: 8px;">$2.1M</div>
    <div style="width: 100%; height: 65%; background: linear-gradient(180deg, #1B2951 0%, #405D80 100%); border-radius: 8px 8px 0 0;"></div>
    <div style="margin-top: 8px; font-size: 14px; color: #2C3E50;">Q1</div>
  </div>
</div>

SVG LINE CHART:
<svg width="100%" height="250" viewBox="0 0 600 250">
  <path d="M 0 180 L 100 150 L 200 120 L 300 140 L 400 90 L 500 70 L 600 50" stroke="#1B2951" stroke-width="3" fill="none"/>
  <circle cx="200" cy="120" r="5" fill="#1B2951"/>
</svg>

DO NOT use: <script>, <canvas>, Chart.js, D3.js, or any JavaScript libraries!

MANDATORY QUALITY REQUIREMENTS:
================================
1. ✓ Wrap entire section in: <section data-section-id="section_${type}_${position || 'new'}" class="bg-white rounded-xl shadow-sm p-6 md:p-8 space-y-6">
2. ✓ Use h2 for main title with bottom border: class="text-2xl md:text-3xl font-bold text-[#1B2951] mb-6 pb-4 border-b-2 border-[#405D80]"
3. ✓ Use gradient backgrounds for metric cards: class="bg-gradient-to-br from-blue-50 to-white"
4. ✓ Add hover effects: class="hover:shadow-md transition-shadow"
5. ✓ Use grid layouts for multiple items: class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
6. ✓ Format all numbers with commas: $1,234,567 not $1234567
7. ✓ Include trend indicators: ↑ ↓ → with colors (green/red/gray)
8. ✓ Use SVG icons from Heroicons for visual interest
9. ✓ Add rounded corners to all containers: class="rounded-lg" or "rounded-xl"
10. ✓ Include proper spacing: p-6, space-y-4, gap-6
11. ✓ Make it responsive with md: and lg: breakpoints
12. ✓ Use semantic HTML5 elements
13. ✓ Add subtle shadows: class="shadow-sm" or "shadow-md"

DATA PRESENTATION EXCELLENCE:
==============================
- Format currency: $2,400,000 (with commas)
- Show percentages: 12.5% (one decimal)
- Add comparison text: "vs last quarter", "YoY growth"
- Color code metrics: green for positive, red for negative
- Include context: time periods, benchmarks, targets
- Use visual hierarchy: large numbers, small labels

RETURN FORMAT:
==============
Return ONLY the HTML content. NO markdown code blocks, NO explanations, NO backticks.
Start directly with the <section> tag.

Generate a professional, visually stunning section now:`;

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start AI generation in background
    (async () => {
      let accumulatedContent = '';
      let usageData = { inputTokens: 0, outputTokens: 0 };

      try {
        let generator;

        if (provider === 'anthropic' || model.startsWith('claude')) {
          generator = claudeService.streamResponse({
            messages: [{ role: 'user', content: contextPrompt }],
            systemPrompt: settings?.systemPrompt || 'You are an expert financial report designer. Generate professional, visually stunning HTML with modern design patterns.',
            model,
            maxTokens: 4000, // Increased for complex HTML generation
            temperature: 0.7,
            onUsage: (usage) => {
              usageData = usage;
            },
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
          await prisma.report_sections.updateMany({
            where: {
              reportId,
              order: { gte: position },
            },
            data: {
              order: { increment: 1 },
            },
          });
        }

        // Determine order
        const maxOrderSection = await prisma.report_sections.findFirst({
          where: { reportId },
          orderBy: { order: 'desc' },
          take: 1,
        });

        const order =
          position !== undefined && position >= 0
            ? position
            : maxOrderSection
            ? maxOrderSection.order + 1
            : 0;

        // Create new section
        const newSection = await prisma.report_sections.create({
          data: {
            id: randomUUID(),
            reportId,
            type: type.toUpperCase() as any, // Convert to enum if needed
            title,
            htmlContent: accumulatedContent,
            order,
            version: 1,
            editHistory: [],
            metadata: {
              originallyGeneratedBy: session.user.id,
              lastModifiedBy: session.user.id,
              model,
              originalPrompt: prompt,
            },
            updatedAt: new Date(),
          },
        });

        // Track usage
        if (usageData.inputTokens > 0 || usageData.outputTokens > 0) {
          await trackReportUsage(reportId, {
            type: 'section_add',
            model,
            provider,
            inputTokens: usageData.inputTokens,
            outputTokens: usageData.outputTokens,
          });
        }

        // Update report to enable interactive mode
        const currentSectionRefs = (report.sectionRefs as string[]) || [];
        if (!currentSectionRefs.includes(newSection.id)) {
          await prisma.playground_reports.update({
            where: { id: reportId },
            data: {
              isInteractiveMode: true,
              sectionRefs: [...currentSectionRefs, newSection.id],
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.playground_reports.update({
            where: { id: reportId },
            data: {
              isInteractiveMode: true,
              updatedAt: new Date(),
            },
          });
        }

        // Update context snapshot in background (non-blocking)
        ContextSnapshotService.createOrUpdateReportSnapshot(
          reportId,
          'section_added'
        ).catch((error) => {
          console.error('Failed to update report snapshot:', error);
        });

        // Get updated usage data for immediate client update
        const updatedReport = await prisma.playground_reports.findUnique({
          where: { id: reportId },
          select: {
            totalTokens: true,
            totalCost: true,
            operations: true,
          },
        });

        // Send completion event with updated usage
        const completeChunk = `data: ${JSON.stringify({
          type: 'complete',
          section: newSection,
          usage: updatedReport ? {
            totalTokens: updatedReport.totalTokens || 0,
            totalCost: updatedReport.totalCost || 0,
            operations: updatedReport.operations || [],
          } : null,
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
