import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    console.log('📧 Proxy: Forwarding OTP request for:', body.identifier);
    
    // Forward the request to the staging API
    const response = await fetch('https://api.assetworks.ai/api/v1/auth/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    console.log('📧 Proxy: Response from staging API:', data);
    
    // Return the response
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('📧 Proxy: Error forwarding request:', error);
    return NextResponse.json(
      { error: 'Failed to forward request' },
      { status: 500 }
    );
  }
}