// app/login/page.tsx - Login page that shows authentication form
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import LoginForm from '@/components/LoginForm';
import SignupFlow from '@/components/SignupFlow';
import { Loader2 } from 'lucide-react';

type AuthView = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuthStore();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (isHydrated && isAuthenticated && token && user) {
      router.replace('/');
    }
  }, [isAuthenticated, token, user, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && token && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {authView === 'login' ? (
        <LoginForm onSwitchToSignup={() => setAuthView('signup')} />
      ) : (
        <SignupFlow onSwitchToLogin={() => setAuthView('login')} />
      )}
    </div>
  );
}