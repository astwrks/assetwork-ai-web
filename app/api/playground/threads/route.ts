import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

// GET /api/playground/threads - Get all threads for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const isTemplate = searchParams.get('isTemplate');

    // Build where clause
    const where: any = { userId: session.user.id };
    if (status) {
      where.status = status.toUpperCase() as any; // 'active' -> 'ACTIVE'
    }
    if (isTemplate !== null) {
      where.isTemplate = isTemplate === 'true';
    }

    const threads = await prisma.threads.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ threads }, { status: 200 });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

// POST /api/playground/threads - Create a new thread
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, isTemplate, templateName, templateDescription } = body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create new thread using Prisma
    const thread = await prisma.threads.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        status: 'ACTIVE',
        isTemplate: isTemplate || false,
        templateName: templateName?.trim() || null,
        templateDescription: templateDescription?.trim() || null,
        reportVersions: [],
        sharedWith: [],
        metadata: {},
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}
