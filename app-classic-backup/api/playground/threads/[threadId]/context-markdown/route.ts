import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

// Efficient HTML to text converter
function stripHtmlTags(html: string): string {
  // Remove script and style tags with their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

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

    // Fetch messages and reports in parallel for better performance
    const [messages, reports] = await Promise.all([
      prisma.messages.findMany({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
        take: 100, // Reduced from 500 for better performance
        select: {
          id: true,
          role: true,
          content: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.playground_reports.findMany({
        where: { threadId },
        orderBy: { createdAt: 'desc' },
        take: 5, // Reduced from 50 - only show recent reports
        select: {
          id: true,
          title: true,
          htmlContent: true,
          isInteractiveMode: true,
          createdAt: true,
        },
      }),
    ]);

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
          // Strip HTML tags for markdown using efficient function
          const textContent = stripHtmlTags(report.htmlContent);
          // Limit report content length to avoid huge payloads
          const maxLength = 5000;
          markdown += textContent.length > maxLength
            ? `${textContent.substring(0, maxLength)}...\n\n*[Content truncated for performance]*\n\n`
            : `${textContent}\n\n`;
        }

        markdown += `---\n\n`;
      });
    }

    // Calculate total tokens more efficiently
    const totalTokens = messages.reduce((sum, m) => {
      const msgMetadata = m.metadata as any;
      return sum + (typeof msgMetadata?.tokens === 'number' ? msgMetadata.tokens : 0);
    }, 0);

    // Return with caching headers for better performance
    return NextResponse.json(
      {
        markdown,
        stats: {
          messageCount: messages.length,
          reportCount: reports.length,
          totalTokens,
        },
      },
      {
        status: 200,
        headers: {
          // Cache for 5 minutes - thread context doesn't change frequently
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
          // Add ETag for conditional requests
          'ETag': `W/"${threadId}-${thread.updatedAt.getTime()}"`,
        },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching thread context markdown:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      threadId: (await params).threadId,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch context markdown',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
