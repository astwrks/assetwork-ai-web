'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AutoLoginPage() {
  const router = useRouter();

  useEffect(() => {
    performAutoLogin();
  }, []);

  const performAutoLogin = async () => {
    try {
      const result = await signIn('credentials', {
        email: 'test@assetworks.ai',
        password: 'Test123456!',
        redirect: false,
      });

      if (result?.ok) {
        router.push('/dashboard');
      } else {
        console.error('Login failed:', result?.error);
        router.push('/auth/signin');
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      router.push('/auth/signin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
        <h2 className="text-xl font-semibold mb-2">Logging you in...</h2>
        <p className="text-muted-foreground dark:text-muted-foreground">
          Using test account: test@assetworks.ai
        </p>
      </div>
    </div>
  );
}