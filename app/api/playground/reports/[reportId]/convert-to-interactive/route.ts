import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import ReportSection from '@/lib/db/models/ReportSection';

// POST /api/playground/reports/:reportId/convert-to-interactive
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { reportId } = await params;

    // Find the report
    const report = await PlaygroundReport.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // If already interactive, nothing to do
    if (report.isInteractiveMode) {
      return NextResponse.json({ message: 'Already in interactive mode' }, { status: 200 });
    }

    // Initialize sectionRefs array if it doesn't exist
    if (!report.sectionRefs) {
      report.sectionRefs = [];
    }

    // Parse HTML content into sections
    // Look for section markers like h2, h3 or divs with data-section-id
    const htmlContent = report.htmlContent || '';

    // Simple regex to split by h2 or h3 headers
    const sectionMatches = htmlContent.match(/<h[23][^>]*>.*?<\/h[23]>[\s\S]*?(?=<h[23][^>]*>|$)/gi) || [];

    if (sectionMatches.length === 0) {
      // If no sections found, create one section with all content
      const section = new ReportSection({
        reportId,
        type: 'custom',
        title: 'Full Report',
        htmlContent: htmlContent,
        order: 0,
        version: 1,
        editHistory: [],
        metadata: {
          originallyGeneratedBy: session.user.email,
          lastModifiedBy: session.user.email,
          originalPrompt: 'Converted from static report',
        },
      });
      await section.save();
      report.sectionRefs.push(section._id.toString());
    } else {
      // Create sections from matches
      for (let i = 0; i < sectionMatches.length; i++) {
        const sectionHtml = sectionMatches[i];

        // Extract title from heading
        const titleMatch = sectionHtml.match(/<h[23][^>]*>(.*?)<\/h[23]>/i);
        const title = titleMatch
          ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
          : `Section ${i + 1}`;

        const section = new ReportSection({
          reportId,
          type: 'custom',
          title,
          htmlContent: sectionHtml,
          order: i,
          version: 1,
          editHistory: [],
          metadata: {
            originallyGeneratedBy: session.user.email,
            lastModifiedBy: session.user.email,
            originalPrompt: 'Converted from static report',
          },
        });

        await section.save();
        report.sectionRefs.push(section._id.toString());
      }
    }

    // Mark report as interactive
    report.isInteractiveMode = true;
    await report.save();

    return NextResponse.json({
      message: 'Report converted to interactive mode',
      sectionCount: report.sectionRefs.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error converting report:', error);
    return NextResponse.json(
      { error: 'Failed to convert report' },
      { status: 500 }
    );
  }
}
