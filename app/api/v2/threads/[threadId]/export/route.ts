/**
 * Thread Export API Endpoint
 * Exports thread conversation as markdown or JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    // Authentication - session already contains user.id from JWT callback
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get format from query
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'markdown';

    // Await params in Next.js 15
    const { threadId } = await params;

    // Get thread with messages
    const thread = await prisma.threads.findFirst({
      where: {
        id: threadId,
        userId: userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        playground_reports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    let content = '';
    const timestamp = new Date().toISOString();

    if (format === 'json') {
      // Export as JSON
      content = JSON.stringify({
        thread: {
          id: thread.id,
          title: thread.title,
          description: thread.description,
          status: thread.status,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
        },
        messages: thread.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          metadata: msg.metadata,
          createdAt: msg.createdAt,
        })),
        report: thread.playground_reports[0] ? {
          id: thread.playground_reports[0].id,
          title: thread.playground_reports[0].title,
          htmlContent: thread.playground_reports[0].htmlContent,
          metadata: thread.playground_reports[0].metadata,
          createdAt: thread.playground_reports[0].createdAt,
        } : null,
        exportedAt: timestamp,
      }, null, 2);
    } else {
      // Export as Markdown
      content = `# ${thread.title}\n\n`;

      if (thread.description) {
        content += `> ${thread.description}\n\n`;
      }

      content += `**Created:** ${new Date(thread.createdAt).toLocaleString()}\n`;
      content += `**Last Updated:** ${new Date(thread.updatedAt).toLocaleString()}\n`;
      content += `**Status:** ${thread.status}\n\n`;
      content += `---\n\n`;
      content += `## Conversation\n\n`;

      thread.messages.forEach(msg => {
        const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
        const time = new Date(msg.createdAt).toLocaleTimeString();

        content += `### ${role} (${time})\n\n`;

        // Remove HTML tags for markdown
        const plainText = msg.content
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'");

        content += `${plainText}\n\n`;

        const metadata = msg.metadata as any;
        if (metadata) {
          if (metadata.tokens) {
            content += `*Tokens: ${metadata.tokens}*\n`;
          }
          if (metadata.cost) {
            content += `*Cost: $${metadata.cost.toFixed(4)}*\n`;
          }
          if (metadata.model) {
            content += `*Model: ${metadata.model}*\n`;
          }
          content += '\n';
        }

        content += `---\n\n`;
      });

      // Add report if available
      if (thread.playground_reports[0]) {
        content += `## Generated Report\n\n`;
        content += `**Title:** ${thread.playground_reports[0].title}\n`;
        content += `**Generated:** ${new Date(thread.playground_reports[0].createdAt).toLocaleString()}\n\n`;

        if (thread.playground_reports[0].htmlContent) {
          // Strip HTML for markdown export
          const plainContent = thread.playground_reports[0].htmlContent
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
          content += `${plainContent}\n\n`;
        }
      }

      content += `\n---\n`;
      content += `*Exported from AssetWorks Financial Playground on ${new Date(timestamp).toLocaleString()}*\n`;
    }

    // Return as file download
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/markdown',
    });

    return new NextResponse(blob, {
      headers: {
        'Content-Type': format === 'json' ? 'application/json' : 'text/markdown',
        'Content-Disposition': `attachment; filename="${thread.title.replace(/[^a-z0-9]/gi, '_')}.${format === 'json' ? 'json' : 'md'}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export thread:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export thread' },
      { status: 500 }
    );
  }
}