import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import ReportSection from '@/lib/db/models/ReportSection';
import { claudeService } from '@/lib/ai/claude.service';

/**
 * POST /api/playground/reports/[reportId]/suggestions
 * Generate context-aware section suggestions based on existing report content
 */
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

    // Find the report
    const report = await PlaygroundReport.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get ALL existing sections
    const sections = await ReportSection.find({ reportId })
      .sort({ order: 1 })
      .lean();

    // Build context for AI
    const sectionsContext = sections.length > 0
      ? sections.map((s, idx) => {
          const textContent = s.htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          return `${idx + 1}. ${s.title} (${s.type})
   ${textContent.substring(0, 200)}...`;
        }).join('\n\n')
      : 'No sections yet.';

    // Extract data points
    const dataPoints = sections
      .flatMap(s => {
        const numbers = s.htmlContent.match(/[\$£€¥]?\d+(?:,\d{3})*(?:\.\d+)?%?/g) || [];
        return numbers.slice(0, 3);
      })
      .slice(0, 10);

    const prompt = `You are analyzing a financial report to suggest 5 relevant sections that would add value.

REPORT TITLE: ${report.metadata?.prompt || report.title || 'Financial Report'}

EXISTING SECTIONS:
${sectionsContext}

${dataPoints.length > 0 ? `KEY DATA POINTS: ${dataPoints.join(', ')}` : ''}

Based on the existing content, suggest 5 NEW sections that would:
1. Complement the existing sections
2. Fill gaps in the analysis
3. Provide deeper insights
4. Add visual representations (charts, tables)
5. Be actionable and specific

Return ONLY a JSON array of 5 short, specific suggestions (each 5-8 words max). Format:
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]

Requirements:
- Be specific about what to add (e.g., "Add Q4 revenue breakdown chart" not "Add chart")
- Reference actual data or topics from the existing sections
- Suggest actionable additions (charts, tables, analysis)
- Keep each suggestion under 8 words
- Focus on financial analysis elements

Return only the JSON array, no other text.`;

    try {
      const response = await claudeService.chat({
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'You are a financial analysis expert. Return only valid JSON.',
      });

      // Extract JSON from response
      let suggestions = [];
      try {
        // Try to find JSON array in the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          suggestions = JSON.parse(response);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', response);
        // Fallback to generic suggestions
        suggestions = [
          'Add executive summary section',
          'Create key metrics dashboard',
          'Show financial trends chart',
          'Add risk analysis section',
          'Include recommendations summary',
        ];
      }

      // Ensure we have exactly 5 suggestions
      if (suggestions.length < 5) {
        const defaults = [
          'Add comparative analysis',
          'Show data visualization',
          'Include market context',
          'Add strategic recommendations',
          'Create summary dashboard',
        ];
        while (suggestions.length < 5) {
          suggestions.push(defaults[suggestions.length]);
        }
      }

      return NextResponse.json({
        success: true,
        suggestions: suggestions.slice(0, 5),
      });
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      // Return default suggestions on AI error
      return NextResponse.json({
        success: true,
        suggestions: [
          'Add executive summary section',
          'Create key metrics dashboard',
          'Show financial trends chart',
          'Add risk analysis section',
          'Include strategic recommendations',
        ],
      });
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
