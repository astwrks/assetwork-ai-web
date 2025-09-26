import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Proxy: Forwarding personalization dashboard/widgets request');
    
    // Get query parameters from the original request
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get the authorization header from the original request
    const authHeader = request.headers.get('authorization');
    const xRequestedPage = request.headers.get('X-Requested-Page') || '1';
    const xRequestedLimit = request.headers.get('X-Requested-Limit') || '10';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-Page': xRequestedPage,
      'X-Requested-Limit': xRequestedLimit,
    };
    
    // Include auth header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Build the target URL with query parameters
    let targetUrl = 'https://api.assetworks.ai/api/v1/personalization/dashboard/widgets';
    if (searchParams.toString()) {
      targetUrl += `?${searchParams.toString()}`;
    }
    
    console.log('📊 Target URL:', targetUrl);
    console.log('📊 Headers:', headers);
    
    // Forward the request to the staging API
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    console.log('📊 Proxy: Response from staging API:', data);
    
    // Return the response
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('📊 Proxy: Error forwarding personalization dashboard request:', error);
    return NextResponse.json(
      { error: 'Failed to forward personalization dashboard request' },
      { status: 500 }
    );
  }
}