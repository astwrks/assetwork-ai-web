import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * GET /api/reports/[reportId]/entities
 * Get all entities mentioned in a specific report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // Verify report exists and user has access through thread
    const report = await prisma.playground_reports.findUnique({
      where: { id: reportId },
      include: {
        threads: {
          select: { userId: true },
        },
      },
    });

    if (!report) {
      console.error('❌ Report not found:', reportId);
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.threads.userId !== session.user.id) {
      console.error('❌ Access denied to report:', {
        reportId,
        reportUserId: report.threads.userId,
        sessionUserId: session.user.id,
      });
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all entity mentions for this report
    const mentions = await prisma.entity_mentions.findMany({
      where: { reportId },
      include: {
        entities: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            ticker: true,
            logo: true,
            industry: true,
            mentionCount: true,
          },
        },
      },
      orderBy: { relevance: 'desc' },
    });

    const entities = mentions.map((m) => ({
      ...m.entities,
      context: m.context,
      sentiment: m.sentiment,
      relevance: m.relevance,
      metadata: m.metadata,
    }));

    console.log('✅ Successfully fetched entities:', {
      reportId,
      entityCount: entities.length,
      mentionCount: mentions.length,
    });

    return NextResponse.json({
      success: true,
      entities,
      total: entities.length,
    });
  } catch (error) {
    console.error('❌ Failed to fetch report entities:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      reportId: (await params).reportId,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch entities',
        details: error instanceof Error ? error.message : String(error),
        entities: [], // Return empty array on error so UI doesn't break
      },
      { status: 500 }
    );
  }
}
