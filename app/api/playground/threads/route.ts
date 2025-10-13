import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import Thread from '@/lib/db/models/Thread';

// GET /api/playground/threads - Get all threads for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const isTemplate = searchParams.get('isTemplate') === 'true';

    const query: any = { userId: session.user.id };
    if (status) query.status = status;
    if (isTemplate !== null) query.isTemplate = isTemplate;

    const threads = await Thread.find(query)
      .sort({ updatedAt: -1 })
      .limit(100);

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
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { title, description, isTemplate, templateName, templateDescription } = body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create new thread
    const thread = new Thread({
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim(),
      status: 'active',
      isTemplate: isTemplate || false,
      templateName: templateName?.trim(),
      templateDescription: templateDescription?.trim(),
      reportVersions: [],
      sharedWith: [],
    });

    await thread.save();

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}
