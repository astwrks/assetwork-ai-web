import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { connectToMongoDB } from '@/lib/db/mongodb';
import Message from '@/lib/db/models/Message';
import MessageFeedback from '@/lib/db/models/MessageFeedback';

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
    if (!session?.user?.email) {
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

    await connectToMongoDB();

    // Verify message exists
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user already gave feedback for this message
    const existingFeedback = await MessageFeedback.findOne({
      messageId,
      userEmail: session.user.email,
    });

    if (existingFeedback) {
      // Update existing feedback
      existingFeedback.feedback = feedback;
      existingFeedback.updatedAt = new Date();
      await existingFeedback.save();
    } else {
      // Create new feedback
      await MessageFeedback.create({
        messageId,
        userEmail: session.user.email,
        feedback,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Get feedback counts
    const feedbackCounts = await MessageFeedback.aggregate([
      { $match: { messageId: messageId } },
      {
        $group: {
          _id: '$feedback',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      up: 0,
      down: 0,
    };

    feedbackCounts.forEach((item: any) => {
      if (item._id === 'up') counts.up = item.count;
      if (item._id === 'down') counts.down = item.count;
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
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;

    await connectToMongoDB();

    // Get feedback counts
    const feedbackCounts = await MessageFeedback.aggregate([
      { $match: { messageId: messageId } },
      {
        $group: {
          _id: '$feedback',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      up: 0,
      down: 0,
    };

    feedbackCounts.forEach((item: any) => {
      if (item._id === 'up') counts.up = item.count;
      if (item._id === 'down') counts.down = item.count;
    });

    // Get user's feedback
    const userFeedback = await MessageFeedback.findOne({
      messageId,
      userEmail: session.user.email,
    });

    return NextResponse.json({
      counts,
      userFeedback: userFeedback?.feedback || null,
    });
  } catch (error) {
    console.error('Error fetching message feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
