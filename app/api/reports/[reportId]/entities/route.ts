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

    // Verify report exists and user has access
    const report = await prisma.reports.findUnique({
      where: { id: reportId },
      select: { userId: true },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.userId !== session.user.id) {
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

    return NextResponse.json({
      success: true,
      entities,
      total: entities.length,
    });
  } catch (error) {
    console.error('Failed to fetch report entities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}
