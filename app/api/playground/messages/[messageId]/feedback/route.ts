import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

/**
 * POST /api/playground/messages/[messageId]/feedback
 * Submit feedback (thumbs up/down) for a message
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;
    const { feedback } = await req.json();

    if (!feedback || !['up', 'down'].includes(feedback)) {
      return NextResponse.json(
        { error: 'Invalid feedback type. Must be "up" or "down"' },
        { status: 400 }
      );
    }

    // Verify message exists
    const message = await prisma.messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Convert feedback to enum format
    const feedbackEnum = feedback === 'up' ? 'UP' : 'DOWN';

    // Check if user already gave feedback for this message
    const existingFeedback = await prisma.message_feedback.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId: session.user.id,
        },
      },
    });

    if (existingFeedback) {
      // Update existing feedback
      await prisma.message_feedback.update({
        where: { id: existingFeedback.id },
        data: {
          feedback: feedbackEnum,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new feedback
      await prisma.message_feedback.create({
        data: {
          id: randomUUID(),
          messageId,
          userId: session.user.id,
          feedback: feedbackEnum,
          updatedAt: new Date(),
        },
      });
    }

    // Get feedback counts
    const feedbackCounts = await prisma.message_feedback.groupBy({
      by: ['feedback'],
      where: { messageId },
      _count: { feedback: true },
    });

    const counts = {
      up: 0,
      down: 0,
    };

    feedbackCounts.forEach((item) => {
      if (item.feedback === 'UP') counts.up = item._count.feedback;
      if (item.feedback === 'DOWN') counts.down = item._count.feedback;
    });

    return NextResponse.json({
      success: true,
      feedback,
      counts,
    });
  } catch (error) {
    console.error('Error submitting message feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/playground/messages/[messageId]/feedback
 * Get feedback stats for a message
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;

    // Get feedback counts
    const feedbackCounts = await prisma.message_feedback.groupBy({
      by: ['feedback'],
      where: { messageId },
      _count: { feedback: true },
    });

    const counts = {
      up: 0,
      down: 0,
    };

    feedbackCounts.forEach((item) => {
      if (item.feedback === 'UP') counts.up = item._count.feedback;
      if (item.feedback === 'DOWN') counts.down = item._count.feedback;
    });

    // Get user's feedback
    const userFeedback = await prisma.message_feedback.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      counts,
      userFeedback: userFeedback?.feedback.toLowerCase() || null,
    });
  } catch (error) {
    console.error('Error fetching message feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
