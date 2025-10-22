import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

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

    const { reportId } = await params;

    // Fetch the report with thread for access control
    const report = await prisma.playground_reports.findUnique({
      where: { id: reportId },
      include: {
        threads: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!report.threads) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check access using both email and id for compatibility
    const userIdentifier = session.user.email || session.user.id;
    const thread = report.threads;
    const isOwner = thread.userId === userIdentifier ||
                    thread.userId === session.user.id ||
                    thread.userId === session.user.email;

    const sharedWith = (thread.sharedWith as any[]) || [];
    const hasAccess = sharedWith.some(
      (share: any) => share.userId === userIdentifier ||
                      share.userId === session.user.id ||
                      share.userId === session.user.email
    );

    if (!isOwner && !hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Remove threads from response to keep it clean
    const { threads: _, ...reportData } = report;

    return NextResponse.json({ report: reportData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}