import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔥 Proxy: Forwarding trending widgets request');
    
    // Get the authorization header from the original request
    const authHeader = request.headers.get('authorization');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Include auth header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Forward the request to the staging API
    const response = await fetch('https://api.assetworks.ai/api/v1/widgets/trending', {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('🔥 Proxy: Response from staging API:', data);
    
    // Return the response
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('🔥 Proxy: Error forwarding trending widgets request:', error);
    return NextResponse.json(
      { error: 'Failed to forward trending widgets request' },
      { status: 500 }
    );
  }
}