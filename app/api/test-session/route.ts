import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// Test endpoint to check session status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userEmail: session?.user?.email || null,
      userId: session?.user?.id || null,
      sessionData: session,
    }, { status: 200 });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

