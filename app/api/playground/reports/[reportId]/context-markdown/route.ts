import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import ReportSection from '@/lib/db/models/ReportSection';

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

    await connectToDatabase();

    const { reportId } = await params;

    // Find report and verify ownership
    const report = await PlaygroundReport.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportUserId = report.userId?.toString();
    const sessionUserId = session.user.id?.toString();
    const isOwner = reportUserId === sessionUserId;

    if (!isOwner) {
      console.error('❌ Report context access denied:', {
        reportId,
        reportUserId,
        sessionUserId,
        isOwner
      });
      return NextResponse.json({
        error: 'Access denied. You do not have permission to view this report context.',
        debug: process.env.NODE_ENV === 'development' ? {
          reportUserId,
          sessionUserId,
          isOwner
        } : undefined
      }, { status: 403 });
    }

    console.log('✅ Report context access granted:', { reportId, isOwner });

    // Fetch sections
    const sections = await ReportSection.find({ reportId })
      .sort({ order: 1 })
      .limit(100);

    // Generate markdown content
    let markdown = `# ${report.title || 'Financial Report'}\n\n`;

    markdown += `**Created**: ${new Date(report.createdAt).toLocaleString()}\n`;
    markdown += `**Mode**: ${report.isInteractiveMode ? 'Interactive' : 'Static'}\n`;

    if (report.metadata?.model) {
      markdown += `**Model**: ${report.metadata.model}\n`;
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
    if (report.metadata) {
      markdown += `## Metadata\n\n`;

      if (report.metadata.prompt) {
        markdown += `**Original Prompt**: ${report.metadata.prompt}\n\n`;
      }

      if (report.metadata.tokens) {
        markdown += `**Tokens Used**: ${report.metadata.tokens}\n\n`;
      }

      if (report.metadata.cost) {
        markdown += `**Cost**: $${report.metadata.cost.toFixed(4)}\n\n`;
      }
    }

    return NextResponse.json(
      {
        markdown,
        stats: {
          sectionCount: sections.length,
          totalTokens:
            typeof report.metadata?.tokens === 'number'
              ? report.metadata.tokens
              : 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching report context markdown:', error);
    return NextResponse.json(
      { error: 'Failed to fetch context markdown' },
      { status: 500 }
    );
  }
}
