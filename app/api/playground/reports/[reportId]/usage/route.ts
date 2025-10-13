import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';

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

    await connectToDatabase();

    const { reportId } = await params;

    // Find the report
    const report = await PlaygroundReport.findById(reportId).lean();
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Return usage data
    return NextResponse.json({
      success: true,
      usage: report.usage || {
        totalTokens: 0,
        totalCost: 0,
        operations: [],
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
