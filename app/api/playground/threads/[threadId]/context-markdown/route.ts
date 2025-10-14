import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { connectToDatabase } from '@/lib/db/mongodb';
import Thread from '@/lib/db/models/Thread';
import Message from '@/lib/db/models/Message';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';

// GET /api/playground/threads/:threadId/context-markdown
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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
    const isOwner = thread.userId === session.user.id;
    const hasSharedAccess = thread.sharedWith.some(
      (share) => share.userId === session.user.id
    );

    if (!isOwner && !hasSharedAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch messages
    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .limit(500);

    // Fetch reports
    const reports = await PlaygroundReport.find({ threadId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Generate markdown content
    let markdown = `# Thread: ${thread.title}\n\n`;

    if (thread.description) {
      markdown += `${thread.description}\n\n`;
    }

    markdown += `**Created**: ${new Date(thread.createdAt).toLocaleString()}\n`;
    markdown += `**Last Updated**: ${new Date(thread.updatedAt).toLocaleString()}\n`;
    markdown += `**Status**: ${thread.status}\n\n`;
    markdown += `---\n\n`;

    // Add conversation
    markdown += `## Conversation\n\n`;
    markdown += `*${messages.length} messages*\n\n`;

    messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? '**You**' : '**AI**';
      markdown += `### ${role} (${new Date(msg.createdAt).toLocaleString()})\n\n`;
      markdown += `${msg.content}\n\n`;

      if (msg.metadata?.tokens) {
        markdown += `*Tokens: ${msg.metadata.tokens}*\n\n`;
      }

      markdown += `---\n\n`;
    });

    // Add reports
    if (reports.length > 0) {
      markdown += `## Generated Reports\n\n`;
      markdown += `*${reports.length} reports*\n\n`;

      reports.forEach((report) => {
        markdown += `### ${report.title || 'Untitled Report'}\n\n`;
        markdown += `**Created**: ${new Date(report.createdAt).toLocaleString()}\n`;
        markdown += `**Mode**: ${report.isInteractiveMode ? 'Interactive' : 'Static'}\n\n`;

        if (report.htmlContent) {
          // Strip HTML tags for markdown
          const textContent = report.htmlContent.replace(/<[^>]*>/g, '');
          markdown += `${textContent}\n\n`;
        }

        markdown += `---\n\n`;
      });
    }

    return NextResponse.json(
      {
        markdown,
        stats: {
          messageCount: messages.length,
          reportCount: reports.length,
          totalTokens: messages.reduce(
            (sum, m) => sum + (typeof m.metadata?.tokens === 'number' ? m.metadata.tokens : 0),
            0
          ),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching context markdown:', error);
    return NextResponse.json(
      { error: 'Failed to fetch context markdown' },
      { status: 500 }
    );
  }
}
