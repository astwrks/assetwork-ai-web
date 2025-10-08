import { NextRequest, NextResponse } from 'next/server';

// Mock data sources
const mockDataSources = [
  {
    id: 'ds-1',
    name: 'Production Database',
    type: 'database',
    connectionString: 'postgresql://user:pass@localhost:5432/finance',
    status: 'connected',
    lastSync: new Date(),
  },
  {
    id: 'ds-2',
    name: 'Market Data API',
    type: 'api',
    connectionString: 'https://api.marketdata.com/v1',
    status: 'connected',
    lastSync: new Date(Date.now() - 300000), // 5 minutes ago
  },
  {
    id: 'ds-3',
    name: 'Quarterly Reports',
    type: 'file',
    status: 'disconnected',
  },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ dataSources: mockDataSources });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data sources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newDataSource = {
      id: `ds-${Date.now()}`,
      name: body.name,
      type: body.type,
      connectionString: body.connectionString,
      credentials: body.credentials || {},
      status: 'disconnected',
      lastSync: null,
    };

    mockDataSources.push(newDataSource);

    return NextResponse.json({ dataSource: newDataSource }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create data source' },
      { status: 500 }
    );
  }
}
