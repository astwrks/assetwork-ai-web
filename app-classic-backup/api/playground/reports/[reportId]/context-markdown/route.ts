import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

// GET /api/playground/reports/:reportId/context-markdown
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // Find report and verify ownership via thread
    const report = await prisma.playground_reports.findUnique({
      where: { id: reportId },
      include: { threads: true },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!report.threads) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const reportUserId = report.threads.userId;
    const sessionUserId = session.user.id;
    const isOwner = reportUserId === sessionUserId;

    if (!isOwner) {
      console.error('❌ Report context access denied:', {
        reportId,
        reportUserId,
        sessionUserId,
        isOwner,
      });
      return NextResponse.json(
        {
          error:
            'Access denied. You do not have permission to view this report context.',
          debug:
            process.env.NODE_ENV === 'development'
              ? {
                  reportUserId,
                  sessionUserId,
                  isOwner,
                }
              : undefined,
        },
        { status: 403 }
      );
    }

    console.log('✅ Report context access granted:', { reportId, isOwner });

    // Fetch sections
    const sections = await prisma.report_sections.findMany({
      where: { reportId },
      orderBy: { order: 'asc' },
      take: 100,
    });

    // Generate markdown content
    let markdown = `# ${report.title || 'Financial Report'}\n\n`;

    markdown += `**Created**: ${new Date(report.createdAt).toLocaleString()}\n`;
    markdown += `**Mode**: ${report.isInteractiveMode ? 'Interactive' : 'Static'}\n`;

    const reportMetadata = report.metadata as any;
    if (reportMetadata?.model) {
      markdown += `**Model**: ${reportMetadata.model}\n`;
    }

    markdown += `\n---\n\n`;

    // Add main report content
    if (report.htmlContent) {
      markdown += `## Report Content\n\n`;
      // Strip HTML tags for markdown
      const textContent = report.htmlContent.replace(/<[^>]*>/g, '');
      markdown += `${textContent}\n\n`;
      markdown += `---\n\n`;
    }

    // Add sections
    if (sections.length > 0) {
      markdown += `## Report Sections\n\n`;
      markdown += `*${sections.length} sections*\n\n`;

      sections.forEach((section, index) => {
        markdown += `### ${index + 1}. ${section.title || 'Untitled Section'}\n\n`;

        if (section.type) {
          markdown += `**Type**: ${section.type}\n\n`;
        }

        if (section.htmlContent) {
          // Strip HTML tags for markdown
          const textContent = section.htmlContent.replace(/<[^>]*>/g, '');
          markdown += `${textContent}\n\n`;
        }

        markdown += `---\n\n`;
      });
    }

    // Add metadata
    if (reportMetadata) {
      markdown += `## Metadata\n\n`;

      if (reportMetadata.prompt) {
        markdown += `**Original Prompt**: ${reportMetadata.prompt}\n\n`;
      }

      if (reportMetadata.tokens) {
        markdown += `**Tokens Used**: ${reportMetadata.tokens}\n\n`;
      }

      if (reportMetadata.cost) {
        markdown += `**Cost**: $${reportMetadata.cost.toFixed(4)}\n\n`;
      }
    }

    return NextResponse.json(
      {
        markdown,
        stats: {
          sectionCount: sections.length,
          totalTokens:
            typeof reportMetadata?.tokens === 'number'
              ? reportMetadata.tokens
              : 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching report context markdown:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      reportId: (await params).reportId,
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
