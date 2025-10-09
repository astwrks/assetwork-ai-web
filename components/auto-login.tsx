'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function AutoLogin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== 'development') return;
    
    // Check if we're on localhost
    if (!window.location.hostname.includes('localhost')) return;
    
    // Only attempt once per page load
    if (hasAttempted) return;
    
    // If already logged in, redirect to dashboard
    if (status === 'authenticated') {
      router.push('/dashboard');
      return;
    }
    
    // If not authenticated and status is not loading, attempt auto-login
    if (status === 'unauthenticated' && !hasAttempted) {
      setHasAttempted(true);
      performAutoLogin();
    }
  }, [status, hasAttempted, router]);

  const performAutoLogin = async () => {
    try {
      console.log('Attempting auto-login with test credentials...');
      
      const result = await signIn('credentials', {
        email: 'test@assetworks.ai',
        password: 'Test123456!',
        redirect: false,
      });

      if (result?.ok) {
        toast.success('Auto-logged in with test account!');
        router.push('/dashboard');
      } else if (result?.error) {
        console.log('Auto-login failed:', result.error);
        // Don't show error toast for auto-login failure
      }
    } catch (error) {
      console.log('Auto-login error:', error);
      // Silent fail for auto-login
    }
  };

  return null; // This component doesn't render anything
}