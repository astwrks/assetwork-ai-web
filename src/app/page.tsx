// app/page.tsx - Main application page
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAuthInit } from '@/hooks/useAuthInit';
import LoginForm from '@/components/LoginForm';
import SignupFlow from '@/components/SignupFlow';
import Home from '@/components/Home';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

type AuthView = 'login' | 'signup';

export default function HomePage() {
  const { isAuthenticated, token, user, isLoading } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Initialize auth state on app start
  const { isInitialized } = useAuthInit();

  // Track hydration state for SSR compatibility
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Wait for both hydration and auth initialization
  useEffect(() => {
    if (isHydrated && isInitialized) {
      // Give a brief moment for any pending auth operations to complete
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, isInitialized]);

  // Show loading state until everything is ready
  if (!isHydrated || isInitializing || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading AssetWorks...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
      
      {/* Render based on authentication state */}
      {isAuthenticated && token && user ? (
        <Home />
      ) : (
        <div>
          {authView === 'login' ? (
            <LoginForm onSwitchToSignup={() => setAuthView('signup')} />
          ) : (
            <SignupFlow onSwitchToLogin={() => setAuthView('login')} />
          )}
        </div>
      )}
    </div>
  );
}