import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import PlaygroundReport from '@/lib/db/models/PlaygroundReport';
import Thread from '@/lib/db/models/Thread';

// GET /api/playground/reports/:reportId - Fetch a specific report
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

    // Fetch the report
    const report = await PlaygroundReport.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify access through the thread
    const thread = await Thread.findById(report.threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check access using both email and id for compatibility
    const userIdentifier = session.user.email || session.user.id;
    const isOwner = thread.userId === userIdentifier ||
                    thread.userId === session.user.id ||
                    thread.userId === session.user.email;
    const hasAccess = thread.sharedWith.some(
      (share: any) => share.userId === userIdentifier ||
                      share.userId === session.user.id ||
                      share.userId === session.user.email
    );

    if (!isOwner && !hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}