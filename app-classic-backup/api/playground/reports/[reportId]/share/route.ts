import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { nanoid } from 'nanoid';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// POST /api/playground/reports/:reportId/share - Generate public share link
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

    // Fetch report with thread for access control
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

    const thread = report.threads;

    // Check access permissions
    const isOwner = thread.userId === session.user.email;
    const sharedWith = (thread.sharedWith as any[]) || [];
    const hasAccess = sharedWith.some(
      (share: any) => share.userId === session.user.email
    );

    if (!isOwner && !hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if already has a public share
    const publicShare = report.publicShare as any;
    if (publicShare?.shareId && publicShare?.isActive) {
      return NextResponse.json({
        success: true,
        shareId: publicShare.shareId,
        expiresAt: publicShare.expiresAt,
      });
    }

    // Generate unique share ID
    const shareId = nanoid(12);

    // Update report with public share info
    const updatedReport = await prisma.playground_reports.update({
      where: { id: reportId },
      data: {
        publicShare: {
          shareId,
          isActive: true,
          createdAt: new Date(),
          createdBy: session.user.email,
          // Optional: Set expiration (e.g., 30 days)
          // expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      shareId,
      expiresAt: null,
    });
  } catch (error) {
    console.error('Error generating share link:', error);
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 }
    );
  }
}

// DELETE /api/playground/reports/:reportId/share - Revoke public share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // Fetch report with thread for ownership check
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

    // Only owner can revoke share
    if (report.threads.userId !== session.user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Deactivate public share
    const publicShare = report.publicShare as any;
    if (publicShare) {
      await prisma.playground_reports.update({
        where: { id: reportId },
        data: {
          publicShare: {
            ...publicShare,
            isActive: false,
          },
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Share link revoked',
    });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}
