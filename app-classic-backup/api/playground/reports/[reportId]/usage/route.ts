import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/playground/reports/:reportId/usage - Get usage metrics for a report
export async function GET(
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
      select: {
        totalTokens: true,
        totalCost: true,
        operations: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Return usage data
    return NextResponse.json({
      success: true,
      usage: {
        totalTokens: report.totalTokens || 0,
        totalCost: report.totalCost || 0,
        operations: (report.operations as any[]) || [],
      },
    });
  } catch (error) {
    console.error('Error fetching report usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
