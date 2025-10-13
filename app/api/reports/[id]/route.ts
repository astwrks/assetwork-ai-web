import { NextRequest, NextResponse } from 'next/server';
import { reportCombinerService } from '@/lib/services/report-combiner.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = reportCombinerService.getReport(id);
    
    if (!report) {
      return new NextResponse('Report not found', { status: 404 });
    }
    
    // Return the HTML content
    return new NextResponse(report.htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}