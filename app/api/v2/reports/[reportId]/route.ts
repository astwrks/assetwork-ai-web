/**
 * Report Management API
 * GET - Fetch a specific report
 * PATCH - Update report content (manual save)
 * DELETE - Delete a report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionWithDev } from '@/lib/auth/dev-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for PATCH request
const UpdateReportSchema = z.object({
  htmlContent: z.string().optional(),
  title: z.string().max(300).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  metadata: z.any().optional(),
});

/**
 * GET /api/v2/reports/[reportId]
 * Fetch a specific report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSessionWithDev(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = params;

    // Try to find in reports table first
    let report = await prisma.reports.findUnique({
      where: { id: reportId },
      include: {
        report_sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // If not found, try playground_reports
    if (!report) {
      const playgroundReport = await prisma.playground_reports.findUnique({
        where: { id: reportId },
      });

      if (!playgroundReport) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: playgroundReport,
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[Reports API] Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/reports/[reportId]
 * Update report content (manual HTML save)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSessionWithDev(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = params;
    const body = await request.json();

    // Validate request body
    const validatedData = UpdateReportSchema.parse(body);

    // Check if report exists and user has access
    const existingReport = await prisma.reports.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      // Try playground_reports table
      const playgroundReport = await prisma.playground_reports.findUnique({
        where: { id: reportId },
      });

      if (!playgroundReport) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      // Update playground report
      const updatedReport = await prisma.playground_reports.update({
        where: { id: reportId },
        data: {
          ...(validatedData.htmlContent && { htmlContent: validatedData.htmlContent }),
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      console.log(`[Reports API] Playground report updated: ${reportId} (v${updatedReport.version})`);

      return NextResponse.json({
        success: true,
        data: updatedReport,
        message: 'Report updated successfully',
      });
    }

    // Verify user owns the report
    if (existingReport.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update report
    const updatedReport = await prisma.reports.update({
      where: { id: reportId },
      data: {
        ...(validatedData.htmlContent && { htmlContent: validatedData.htmlContent }),
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.metadata && {
          metadata: {
            ...(typeof existingReport.metadata === 'object' ? existingReport.metadata : {}),
            ...(validatedData.metadata || {}),
            lastEditedAt: new Date().toISOString(),
            lastEditedBy: session.user.id,
          }
        }),
        version: { increment: 1 },
        updatedAt: new Date(),
      },
      include: {
        report_sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    console.log(`[Reports API] Report updated: ${reportId} (v${updatedReport.version})`);

    return NextResponse.json({
      success: true,
      data: updatedReport,
      message: 'Report updated successfully',
    });
  } catch (error) {
    console.error('[Reports API] Error updating report:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/reports/[reportId]
 * Delete a report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSessionWithDev(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = params;

    // Check if report exists
    const report = await prisma.reports.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      // Try playground_reports
      const playgroundReport = await prisma.playground_reports.findUnique({
        where: { id: reportId },
      });

      if (!playgroundReport) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      // Delete playground report
      await prisma.playground_reports.delete({
        where: { id: reportId },
      });

      console.log(`[Reports API] Playground report deleted: ${reportId}`);

      return NextResponse.json({
        success: true,
        message: 'Report deleted successfully',
      });
    }

    // Verify user owns the report
    if (report.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete report (cascade will delete sections and entity mentions)
    await prisma.reports.delete({
      where: { id: reportId },
    });

    console.log(`[Reports API] Report deleted: ${reportId}`);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('[Reports API] Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
