import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import Thread from '@/lib/db/models/Thread';
import Message from '@/lib/db/models/Message';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';

// GET /api/playground/threads/:threadId - Get specific thread with messages and current report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { threadId } = await params;

    // Find thread and verify ownership or sharing
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = thread.userId === session.user.email;
    const hasSharedAccess = thread.sharedWith.some(
      (share) => share.userId === session.user.email
    );

    if (!isOwner && !hasSharedAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all messages for this thread
    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .limit(500);

    // Get current report if exists
    let currentReport = null;
    if (thread.currentReportId) {
      currentReport = await PlaygroundReport.findById(thread.currentReportId);
    }

    return NextResponse.json(
      {
        thread,
        messages,
        currentReport,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

// PATCH /api/playground/threads/:threadId - Update thread
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { threadId } = await params;
    const body = await request.json();

    // Find thread and verify ownership
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.userId !== session.user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title',
      'description',
      'status',
      'isTemplate',
      'templateName',
      'templateDescription',
    ];

    Object.keys(body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        (thread as any)[key] = body[key];
      }
    });

    await thread.save();

    return NextResponse.json({ thread }, { status: 200 });
  } catch (error) {
    console.error('Error updating thread:', error);
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    );
  }
}

// DELETE /api/playground/threads/:threadId - Delete thread
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { threadId } = await params;

    // Find thread and verify ownership
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.userId !== session.user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete associated messages and reports
    await Message.deleteMany({ threadId });
    await PlaygroundReport.deleteMany({ threadId });
    await Thread.findByIdAndDelete(threadId);

    return NextResponse.json(
      { message: 'Thread deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    );
  }
}
