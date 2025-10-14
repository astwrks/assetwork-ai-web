import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * GET /api/entities/[slug]
 * Get detailed information about a specific entity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const entity = await prisma.entities.findUnique({
      where: { slug },
      include: {
        mentions: {
          include: {
            report: {
              select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                status: true,
                userId: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100, // Get last 100 mentions
        },
        insights: {
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          orderBy: { tag: 'asc' },
        },
      },
    });

    if (!entity) {
      return NextResponse.json(
        { success: false, error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Calculate sentiment statistics
    const sentiments = entity.mentions
      .filter((m) => m.sentiment !== null)
      .map((m) => m.sentiment as number);

    const avgSentiment =
      sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
        : null;

    const sentimentDistribution = {
      positive: sentiments.filter((s) => s > 0.3).length,
      neutral: sentiments.filter((s) => s >= -0.3 && s <= 0.3).length,
      negative: sentiments.filter((s) => s < -0.3).length,
    };

    // Group mentions by month
    const mentionsByMonth: Record<string, number> = {};
    entity.mentions.forEach((m) => {
      const monthKey = new Date(m.createdAt).toISOString().substring(0, 7); // YYYY-MM
      mentionsByMonth[monthKey] = (mentionsByMonth[monthKey] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      entity: {
        ...entity,
        statistics: {
          avgSentiment,
          sentimentDistribution,
          mentionsByMonth,
          totalMentions: entity.mentions.length,
          uniqueReports: new Set(entity.mentions.map((m) => m.reportId)).size,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch entity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entity' },
      { status: 500 }
    );
  }
}
