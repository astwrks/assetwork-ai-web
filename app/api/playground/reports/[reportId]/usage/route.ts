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
        model: true,
        generationTime: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Calculate inputTokens and outputTokens from operations
    let inputTokens = 0;
    let outputTokens = 0;
    const operations = (report.operations as any[]) || [];
    
    // If operations array exists, calculate from it
    for (const op of operations) {
      if (op.inputTokens) inputTokens += op.inputTokens;
      if (op.outputTokens) outputTokens += op.outputTokens;
    }
    
    // If no operations data, estimate based on typical LLM input/output ratio
    // Claude models typically have ~1:3 input to output ratio for report generation
    if (inputTokens === 0 && outputTokens === 0 && report.totalTokens > 0) {
      // Estimate: 25% input, 75% output (typical for generation tasks)
      inputTokens = Math.floor(report.totalTokens * 0.25);
      outputTokens = report.totalTokens - inputTokens;
    }

    // Calculate efficiency metrics
    const responseTime = (report.generationTime || 0) / 1000; // Convert ms to seconds
    const tokensPerSecond = responseTime > 0 ? report.totalTokens / responseTime : 0;
    const costPerThousandTokens = report.totalTokens > 0 ? (report.totalCost / report.totalTokens) * 1000 : 0;

    // Return comprehensive usage data
    return NextResponse.json({
      success: true,
      usage: {
        totalTokens: report.totalTokens || 0,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        totalCost: report.totalCost || 0,
        model: report.model || 'Unknown',
        responseTime: responseTime,
        operations: operations,
        efficiency: {
          tokensPerSecond: tokensPerSecond,
          costPerThousandTokens: costPerThousandTokens,
          compressionRatio: inputTokens > 0 ? outputTokens / inputTokens : 1,
        },
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
