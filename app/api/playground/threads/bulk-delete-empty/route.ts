import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

/**
 * DELETE /api/playground/threads/bulk-delete-empty
 * Delete all empty threads for the current user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🗑️ Starting bulk delete of empty threads for user:', session.user.id);

    // Find all empty threads (threads with no messages) for this user
    const emptyThreads = await prisma.threads.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // Filter to only truly empty threads (no messages)
    const threadsToDelete = emptyThreads.filter((thread) => thread._count.messages === 0);
    const threadIdsToDelete = threadsToDelete.map((t) => t.id);

    console.log('📊 Found empty threads:', {
      totalThreads: emptyThreads.length,
      emptyThreads: threadsToDelete.length,
      threadIds: threadIdsToDelete,
    });

    if (threadIdsToDelete.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No empty threads found',
          deletedCount: 0,
          threads: [],
        },
        { status: 200 }
      );
    }

    // Delete all empty threads in a single transaction
    const deleteResult = await prisma.threads.deleteMany({
      where: {
        id: {
          in: threadIdsToDelete,
        },
        userId: session.user.id, // Extra safety check
      },
    });

    console.log('✅ Bulk delete completed:', {
      requestedCount: threadIdsToDelete.length,
      deletedCount: deleteResult.count,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully deleted ${deleteResult.count} empty thread(s)`,
        deletedCount: deleteResult.count,
        threads: threadsToDelete.map((t) => ({
          id: t.id,
          title: t.title,
          createdAt: t.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error bulk deleting empty threads:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (await getServerSession(authOptions))?.user?.id,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete empty threads',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
