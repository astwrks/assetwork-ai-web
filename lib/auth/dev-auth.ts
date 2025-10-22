/**
 * Development Authentication Helper
 * Provides a wrapper around getServerSession that allows for development mode testing
 */

import { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import type { Session } from 'next-auth';

/**
 * Get server session with development mode support
 * In development, you can set DEV_USER_ID to bypass authentication
 */
export async function getServerSessionWithDev(
  authOptions: NextAuthOptions
): Promise<Session | null> {
  // First try to get the real session
  const session = await getServerSession(authOptions);
  
  if (session) {
    return session;
  }

  // In development mode, allow bypassing auth with DEV_USER_ID env var
  if (process.env.NODE_ENV === 'development' && process.env.DEV_USER_ID) {
    console.log('[DEV MODE] Using development user ID:', process.env.DEV_USER_ID);
    
    return {
      user: {
        id: process.env.DEV_USER_ID,
        email: process.env.DEV_USER_EMAIL || 'dev@example.com',
        name: process.env.DEV_USER_NAME || 'Development User',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
  }

  return null;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(authOptions: NextAuthOptions): Promise<Session> {
  const session = await getServerSessionWithDev(authOptions);
  
  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Get user ID from session with dev mode support
 */
export async function getUserId(authOptions: NextAuthOptions): Promise<string | null> {
  const session = await getServerSessionWithDev(authOptions);
  return session?.user?.id || null;
}
