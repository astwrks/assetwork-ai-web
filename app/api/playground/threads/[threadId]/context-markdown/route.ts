import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

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

    const { threadId } = await params;

    // Find thread and verify ownership or sharing
    const thread = await prisma.threads.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check access permissions
    const threadUserId = thread.userId;
    const sessionUserId = session.user.id;

    const isOwner = threadUserId === sessionUserId;
    const sharedWith = (thread.sharedWith as any[]) || [];
    const hasSharedAccess = sharedWith.some(
      (share: any) => share.userId === sessionUserId
    );

    if (!isOwner && !hasSharedAccess) {
      console.error('❌ Context access denied:', {
        threadId,
        threadUserId,
        sessionUserId,
        hasSharedWith: !!thread.sharedWith,
        sharedWithLength: sharedWith.length,
      });
      return NextResponse.json(
        {
          error:
            'Access denied. You do not have permission to view this thread context.',
          debug:
            process.env.NODE_ENV === 'development'
              ? {
                  threadUserId,
                  sessionUserId,
                  isOwner,
                  hasSharedAccess,
                }
              : undefined,
        },
        { status: 403 }
      );
    }

    console.log('✅ Context access granted:', {
      threadId,
      isOwner,
      hasSharedAccess,
    });

    // Fetch messages
    const messages = await prisma.messages.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    // Fetch reports
    const reports = await prisma.playground_reports.findMany({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

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

      const msgMetadata = msg.metadata as any;
      if (msgMetadata?.tokens) {
        markdown += `*Tokens: ${msgMetadata.tokens}*\n\n`;
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
          totalTokens: messages.reduce((sum, m) => {
            const msgMetadata = m.metadata as any;
            return (
              sum +
              (typeof msgMetadata?.tokens === 'number' ? msgMetadata.tokens : 0)
            );
          }, 0),
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
