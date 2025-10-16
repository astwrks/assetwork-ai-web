import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

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

    const { reportId } = await params;

    // Find the report
    const report = await prisma.playground_reports.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // If already interactive, nothing to do
    if (report.isInteractiveMode) {
      return NextResponse.json({ message: 'Already in interactive mode' }, { status: 200 });
    }

    // Parse HTML content into sections
    const htmlContent = report.htmlContent || '';
    const currentSectionRefs = (report.sectionRefs as string[]) || [];

    // Simple regex to split by h2 or h3 headers
    const sectionMatches = htmlContent.match(/<h[23][^>]*>.*?<\/h[23]>[\s\S]*?(?=<h[23][^>]*>|$)/gi) || [];

    const createdSectionIds: string[] = [];

    if (sectionMatches.length === 0) {
      // If no sections found, create one section with all content
      const section = await prisma.report_sections.create({
        data: {
          id: randomUUID(),
          reportId,
          type: 'CUSTOM',
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
          updatedAt: new Date(),
        },
      });
      createdSectionIds.push(section.id);
    } else {
      // Create sections from matches
      for (let i = 0; i < sectionMatches.length; i++) {
        const sectionHtml = sectionMatches[i];

        // Extract title from heading
        const titleMatch = sectionHtml.match(/<h[23][^>]*>(.*?)<\/h[23]>/i);
        const title = titleMatch
          ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
          : `Section ${i + 1}`;

        const section = await prisma.report_sections.create({
          data: {
            id: randomUUID(),
            reportId,
            type: 'CUSTOM',
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
            updatedAt: new Date(),
          },
        });
        createdSectionIds.push(section.id);
      }
    }

    // Mark report as interactive and update sectionRefs
    await prisma.playground_reports.update({
      where: { id: reportId },
      data: {
        isInteractiveMode: true,
        sectionRefs: [...currentSectionRefs, ...createdSectionIds],
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Report converted to interactive mode',
      sectionCount: createdSectionIds.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error converting report:', error);
    return NextResponse.json(
      { error: 'Failed to convert report' },
      { status: 500 }
    );
  }
}
