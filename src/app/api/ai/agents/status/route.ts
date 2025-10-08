import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock agent status data
    const agents = [
      {
        id: 'data-agent',
        name: 'Data Agent',
        type: 'data',
        status: 'idle',
        lastActivity: new Date(),
        capabilities: ['Data fetching', 'Data validation', 'Data transformation'],
      },
      {
        id: 'analysis-agent',
        name: 'Analysis Agent',
        type: 'analysis',
        status: 'working',
        lastActivity: new Date(),
        capabilities: ['Financial analysis', 'Risk assessment', 'Trend analysis'],
      },
      {
        id: 'visualization-agent',
        name: 'Visualization Agent',
        type: 'visualization',
        status: 'idle',
        lastActivity: new Date(),
        capabilities: ['Chart generation', 'Interactive visualizations', 'Dashboard creation'],
      },
      {
        id: 'writer-agent',
        name: 'Writer Agent',
        type: 'writer',
        status: 'idle',
        lastActivity: new Date(),
        capabilities: ['Report writing', 'Content generation', 'Narrative creation'],
      },
      {
        id: 'review-agent',
        name: 'Review Agent',
        type: 'review',
        status: 'idle',
        lastActivity: new Date(),
        capabilities: ['Quality assurance', 'Compliance checking', 'Accuracy validation'],
      },
    ];

    return NextResponse.json({
      success: true,
      agents,
      systemStatus: {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'working').length,
        idleAgents: agents.filter(a => a.status === 'idle').length,
        errorAgents: agents.filter(a => a.status === 'error').length,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch agent status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
