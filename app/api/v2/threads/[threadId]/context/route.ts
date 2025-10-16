/**
 * Thread Context API Endpoint
 * Returns complete conversation history and metadata for a thread
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Await params in Next.js 15
    const { threadId } = await params;

    // Get thread with all related data
    const thread = await prisma.threads.findFirst({
      where: {
        id: threadId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            metadata: true,
            createdAt: true,
          },
        },
        playground_reports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            htmlContent: true,
            sections: true,
            insights: true,
            metadata: true,
            model: true,
            provider: true,
            totalTokens: true,
            totalCost: true,
            createdAt: true,
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const stats = {
      messageCount: thread.messages.length,
      totalTokens: thread.messages.reduce((sum, msg) => {
        const tokens = (msg.metadata as any)?.tokens || 0;
        return sum + tokens;
      }, 0),
      totalCost: thread.messages.reduce((sum, msg) => {
        const cost = (msg.metadata as any)?.cost || 0;
        return sum + cost;
      }, 0),
      duration: thread.messages.length > 0
        ? new Date(thread.messages[thread.messages.length - 1].createdAt).getTime() -
          new Date(thread.messages[0].createdAt).getTime()
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        thread: {
          id: thread.id,
          title: thread.title,
          description: thread.description,
          status: thread.status,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          metadata: thread.metadata,
        },
        messages: thread.messages,
        latestReport: thread.playground_reports[0] || null,
        stats,
      },
    });
  } catch (error) {
    console.error('Failed to get thread context:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get thread context' },
      { status: 500 }
    );
  }
}