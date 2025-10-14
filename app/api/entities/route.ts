import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * GET /api/entities
 * List all entities with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'mentionCount'; // mentionCount, name, createdAt

    const entities = await prisma.entities.findMany({
      where: {
        ...(type && { type: type as any }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { ticker: { contains: search, mode: 'insensitive' } },
            { industry: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy:
        sortBy === 'name'
          ? { name: 'asc' }
          : sortBy === 'createdAt'
            ? { createdAt: 'desc' }
            : { mentionCount: 'desc' },
      take: Math.min(limit, 100), // Max 100 entities
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        ticker: true,
        logo: true,
        industry: true,
        sector: true,
        summary: true,
        mentionCount: true,
        lastMentioned: true,
        createdAt: true,
        _count: {
          select: {
            mentions: true,
            insights: true,
            tags: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      entities,
      total: entities.length,
    });
  } catch (error) {
    console.error('Failed to fetch entities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}
