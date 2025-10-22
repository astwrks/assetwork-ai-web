import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

// GET /api/playground/templates - Get all public templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      OR: [
        { isPublic: true }, // Public templates
        { userId: session.user.id }, // User's own templates
      ],
    };

    if (category) {
      where.category = category;
    }

    if (tier) {
      where.tier = tier.toUpperCase() as any; // Convert to enum
    }

    if (search) {
      // Simple search on name and description
      where.OR = [
        ...where.OR,
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch templates with sorting
    const templates = await prisma.templates.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/playground/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      tags,
      structure,
      basePrompt,
      isPublic,
      isPremium,
      tier,
      icon,
      previewImageUrl,
    } = body;

    // Validate required fields
    if (!name || !structure || !Array.isArray(structure)) {
      return NextResponse.json(
        { error: 'Name and structure are required' },
        { status: 400 }
      );
    }

    // Create new template
    const template = await prisma.templates.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        tags: tags || [],
        structure,
        basePrompt: basePrompt?.trim() || null,
        isPublic: isPublic || false,
        isPremium: isPremium || false,
        tier: tier ? tier.toUpperCase() : 'FREE', // Convert to enum
        icon: icon?.trim() || null,
        previewImageUrl: previewImageUrl?.trim() || null,
        usageCount: 0,
        rating: 0,
        ratingCount: 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
