import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration
const mockReports = [
  {
    id: 'report-1',
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
  },
];

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would fetch from a database
    return NextResponse.json({ reports: mockReports });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create new report
    const newReport = {
      id: `report-${Date.now()}`,
      title: body.title || 'Untitled Report',
      description: body.description || '',
      sections: body.sections || [],
      metadata: {
        author: 'Current User',
        version: '1.0',
        tags: body.tags || [],
      },
      dataSources: body.dataSources || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
    };

    // In a real implementation, this would save to a database
    mockReports.push(newReport);

    return NextResponse.json({ report: newReport }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
