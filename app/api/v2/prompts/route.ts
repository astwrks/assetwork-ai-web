import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/v2/prompts
 * Get available system prompts for the financial playground from database
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch system prompts from database
    const prompts = await prisma.system_prompts.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' }, // Default first
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        content: true,
        icon: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        category: true,
      },
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system prompts' },
      { status: 500 }
    );
  }
}
