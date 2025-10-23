import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/playground/reports/[reportId]/suggestions
 * Generate context-aware section suggestions based on existing report content
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // In development mode, use a default user
    const userId = process.env.NODE_ENV === 'development'
      ? 'dev-user-123'
      : session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // Get sectionId from query params
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    // Find the report
    const report = await prisma.reports.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // If sectionId provided, generate section-specific suggestions
    if (sectionId) {
      const section = await prisma.report_sections.findFirst({
        where: { id: sectionId, reportId }
      });

      if (!section) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      }

      // Generate section-specific suggestions
      const suggestions = [
        {
          id: '1',
          type: 'improvement' as const,
          title: `Enhance ${section.title}`,
          description: `Add more detailed analysis or visual elements to ${section.title}`,
          priority: 'medium' as const,
          estimatedImpact: 'Improves section clarity and depth',
          actionable: true
        },
        {
          id: '2',
          type: 'insight' as const,
          title: 'Add Comparative Data',
          description: 'Include industry benchmarks or historical comparisons',
          priority: 'low' as const,
          estimatedImpact: 'Provides better context for readers',
          actionable: true
        },
        {
          id: '3',
          type: 'opportunity' as const,
          title: 'Add Visual Charts',
          description: 'Include graphs or tables to visualize key metrics',
          priority: 'high' as const,
          estimatedImpact: 'Makes data more digestible and engaging',
          actionable: true
        }
      ];

      return NextResponse.json({
        suggestions,
        generatedAt: new Date().toISOString(),
        reportId,
        sectionId
      });
    }

    // Generate report-level suggestions (original logic)
    const suggestions = [
      {
        id: '1',
        type: 'improvement' as const,
        title: 'Add Technical Analysis',
        description: 'Include RSI, MACD, and Bollinger Bands analysis',
        priority: 'high' as const,
        estimatedImpact: 'Provides deeper insights into market momentum',
        actionable: true
      },
      {
        id: '2',
        type: 'insight' as const,
        title: 'Competitive Comparison',
        description: 'Add comparison with industry peers',
        priority: 'medium' as const,
        estimatedImpact: 'Better context for valuation metrics',
        actionable: true
      },
      {
        id: '3',
        type: 'warning' as const,
        title: 'Risk Assessment Missing',
        description: 'Consider adding volatility and beta analysis',
        priority: 'high' as const,
        estimatedImpact: 'Critical for investment decision making',
        actionable: true
      },
      {
        id: '4',
        type: 'opportunity' as const,
        title: 'ESG Metrics',
        description: 'Include Environmental, Social, and Governance scores',
        priority: 'low' as const,
        estimatedImpact: 'Appeals to ESG-focused investors',
        actionable: true
      }
    ];

    return NextResponse.json({
      suggestions,
      generatedAt: new Date().toISOString(),
      reportId
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/playground/reports/[reportId]/suggestions
 * Get existing suggestions for a report or specific section
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // In development mode, use a default user
    const userId = process.env.NODE_ENV === 'development'
      ? 'dev-user-123'
      : session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // Get sectionId from query params
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    // If sectionId provided, return section-specific suggestions
    if (sectionId) {
      const section = await prisma.report_sections.findFirst({
        where: { id: sectionId, reportId }
      });

      if (!section) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      }

      const suggestions = [
        {
          id: '1',
          type: 'improvement' as const,
          title: `Enhance ${section.title}`,
          description: `Add more detailed analysis or visual elements`,
          priority: 'medium' as const,
          estimatedImpact: 'Improves section clarity and depth',
          actionable: true
        },
        {
          id: '2',
          type: 'insight' as const,
          title: 'Add Comparative Data',
          description: 'Include industry benchmarks or historical comparisons',
          priority: 'low' as const,
          estimatedImpact: 'Provides better context for readers',
          actionable: true
        }
      ];

      return NextResponse.json({
        suggestions,
        generatedAt: new Date().toISOString(),
        reportId,
        sectionId
      });
    }

    // Return report-level suggestions
    const suggestions = [
      {
        id: '1',
        type: 'improvement' as const,
        title: 'Add Technical Analysis',
        description: 'Include RSI, MACD, and Bollinger Bands analysis',
        priority: 'high' as const,
        estimatedImpact: 'Provides deeper insights into market momentum',
        actionable: true
      },
      {
        id: '2',
        type: 'insight' as const,
        title: 'Competitive Comparison',
        description: 'Add comparison with industry peers',
        priority: 'medium' as const,
        estimatedImpact: 'Better context for valuation metrics',
        actionable: true
      }
    ];

    return NextResponse.json({
      suggestions,
      generatedAt: new Date().toISOString(),
      reportId
    });

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}