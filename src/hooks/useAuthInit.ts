// hooks/useAuthInit.ts - Initialize authentication state on app start
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useAuthInit() {
  const { token, user, setToken, setUser } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = () => {
      console.log('🔄 Initializing auth state...', { token: !!token, user: !!user });
      
      // Check if we have a persisted token in localStorage as fallback
      const persistedToken = localStorage.getItem('assetworks_token');
      
      if (persistedToken && !token) {
        console.log('🔑 Found persisted token, initializing auth...');
        setToken(persistedToken);
        
        // If we have a token but no user, try to fetch the profile
        if (!user) {
          console.log('👤 Fetching user profile with persisted token...');
          // Note: fetchProfile will be called after token is set, which triggers API calls
        }
      } else if (token && user) {
        console.log('✅ Auth already initialized from Zustand persist');
      } else {
        console.log('ℹ️ No authentication data found');
      }
      
      setIsInitialized(true);
    };

    // Small delay to ensure Zustand has hydrated from localStorage
    const timer = setTimeout(initializeAuth, 200);
    
    return () => clearTimeout(timer);
  }, [token, user, setToken, setUser]);

  return {
    isInitialized,
    isAuthenticated: !!token && !!user,
  };
}