import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    
    // Mock report data
    const report = {
      id: reportId,
      title: 'Q4 2024 Financial Analysis',
      description: 'Comprehensive financial analysis for Q4 2024',
      sections: [
        {
          id: 'intro',
          type: 'text',
          title: 'Executive Summary',
          content: '<h2>Executive Summary</h2><p>Q4 2024 showed strong financial performance...</p>',
          aiPrompt: 'Create executive summary',
          editable: true,
          order: 1,
        },
        {
          id: 'analysis',
          type: 'text',
          title: 'Financial Analysis',
          content: '<h2>Financial Analysis</h2><p>Detailed analysis of financial metrics...</p>',
          aiPrompt: 'Generate financial analysis',
          editable: true,
          order: 2,
        },
      ],
      metadata: {
        author: 'John Doe',
        version: '1.0',
        tags: ['financial', 'q4-2024'],
      },
      dataSources: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      status: 'draft',
    };

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const body = await request.json();
    
    // Mock report update
    const updatedReport = {
      id: reportId,
      title: body.title || 'Updated Report',
      description: body.description || '',
      sections: body.sections || [],
      metadata: {
        author: 'John Doe',
        version: '1.1',
        tags: body.tags || [],
      },
      dataSources: body.dataSources || [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      status: body.status || 'draft',
    };

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    
    // Mock report deletion
    return NextResponse.json({ 
      success: true, 
      message: `Report ${reportId} deleted successfully` 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
