import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { EntityAggregationService } from '@/lib/services/entity-aggregation.service';

/**
 * POST /api/entities/[slug]/refresh
 * Regenerate master markdown and insights for an entity
 */
export async function POST(
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
      select: { id: true, name: true },
    });

    if (!entity) {
      return NextResponse.json(
        { success: false, error: 'Entity not found' },
        { status: 404 }
      );
    }

    const aggregationService = new EntityAggregationService();

    // Regenerate master markdown
    const markdown = await aggregationService.generateMasterMarkdown(entity.id);

    // Regenerate insights
    const insightCount = await aggregationService.generateInsights(entity.id);

    return NextResponse.json({
      success: true,
      message: `Successfully refreshed ${entity.name}`,
      data: {
        markdownLength: markdown.length,
        insightsGenerated: insightCount,
      },
    });
  } catch (error) {
    console.error('Failed to refresh entity:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh entity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
