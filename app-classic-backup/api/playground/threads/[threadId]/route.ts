import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

// GET /api/playground/threads/:threadId - Get specific thread with messages and current report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await params;

    // Find thread with messages and report
    const thread = await prisma.threads.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 500,
        },
        playground_reports: {
          where: { id: threadId }, // This won't work correctly - need to use currentReportId
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = thread.userId === session.user.id;
    const sharedWith = (thread.sharedWith as any[]) || [];
    const hasSharedAccess = sharedWith.some(
      (share: any) => share.userId === session.user.id
    );

    if (!isOwner && !hasSharedAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get current report if exists
    let currentReport = null;
    if (thread.currentReportId) {
      currentReport = await prisma.playground_reports.findUnique({
        where: { id: thread.currentReportId },
      });
    }

    return NextResponse.json(
      {
        thread,
        messages: thread.messages,
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await params;
    const body = await request.json();

    // Find thread and verify ownership
    const thread = await prisma.threads.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build update data with allowed fields only
    const allowedUpdates = [
      'title',
      'description',
      'status',
      'isTemplate',
      'templateName',
      'templateDescription',
    ];

    const updateData: any = { updatedAt: new Date() };
    Object.keys(body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === 'status' && body[key]) {
          // Convert status to uppercase for enum
          updateData[key] = body[key].toUpperCase();
        } else {
          updateData[key] = body[key];
        }
      }
    });

    const updatedThread = await prisma.threads.update({
      where: { id: threadId },
      data: updateData,
    });

    return NextResponse.json({ thread: updatedThread }, { status: 200 });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await params;

    // Find thread and verify ownership
    const thread = await prisma.threads.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete thread (cascade will delete messages and reports automatically)
    await prisma.threads.delete({
      where: { id: threadId },
    });

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
