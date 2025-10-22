import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getServerSessionWithDev } from '@/lib/auth/dev-auth';
import { prisma } from '@/lib/db/prisma';
import { nanoid } from 'nanoid';

/**
 * POST /api/v2/reports
 * Save a generated report to the database (playground_reports table)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWithDev(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { threadId, title, description, htmlContent, metadata } = body;

    // Validate required fields
    if (!threadId || !htmlContent) {
      return NextResponse.json({ 
        error: 'threadId and htmlContent are required' 
      }, { status: 400 });
    }

    // Create playground report
    const report = await prisma.playground_reports.create({
      data: {
        id: nanoid(),
        threadId,
        htmlContent,
        sections: [],
        insights: [],
        isInteractiveMode: false,
        metadata: metadata || {},
        model: metadata?.model || 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        prompt: description || title,
        generatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    console.log('[Reports API] Playground report saved:', report.id);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[Reports API] Error saving report:', error);
    return NextResponse.json(
      { error: 'Failed to save report', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/reports
 * Get reports for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWithDev(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const reports = await prisma.playground_reports.findMany({
      where: {
        ...(threadId ? { threadId } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('[Reports API] Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
