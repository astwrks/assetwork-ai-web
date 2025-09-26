// store/authStore.ts - Authentication state management
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API } from '@/lib/api-new';

interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  clearError: () => void;
  setOtpSent: (sent: boolean) => void;
  
  // API calls
  sendEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, otp: string) => Promise<void>;
  googleLogin: (googleToken: string) => Promise<void>;
  appleLogin: (appleData: any) => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      otpSent: false,

      setUser: (user) => {
        const currentState = get();
        set({ 
          user, 
          isAuthenticated: !!(user && currentState.token)
        });
      },

      setToken: (token) => {
        const currentState = get();
        set({ 
          token, 
          isAuthenticated: !!(token && currentState.user)
        });
        if (token) {
          localStorage.setItem('assetworks_token', token);
        } else {
          localStorage.removeItem('assetworks_token');
        }
      },

      logout: async () => {
        try {
          await API.user.signOut();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            error: null 
          });
          localStorage.removeItem('assetworks_token');
        }
      },

      clearError: () => set({ error: null }),

      setOtpSent: (sent: boolean) => set({ otpSent: sent }),

      sendEmailOTP: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await API.auth.sendOTP({ identifier: email });
          set({ isLoading: false, otpSent: true });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || error.message || 'Failed to send OTP',
            isLoading: false 
          });
          throw error;
        }
      },

      verifyEmailOTP: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          console.log('🔐 Auth store verifying OTP:', { email, otp: otp?.slice(0, 2) + '****' });
          const response = await API.auth.verifyOTP({ identifier: email, otp });
          console.log('🔐 OTP verification response:', response);
          const { user, token } = response.data;
          
          // Set both user and token together to ensure authentication state is correct
          set({ 
            user, 
            token, 
            isAuthenticated: true,
            isLoading: false 
          });
          
          // Also store in localStorage for persistence
          localStorage.setItem('assetworks_token', token);
          
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'OTP verification failed',
            isLoading: false 
          });
          throw error;
        }
      },

      googleLogin: async (googleToken: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await API.auth.googleLogin({ access_token: googleToken });
          const { user, token } = response.data;
          
          get().setUser(user);
          get().setToken(token);
          
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Google login failed',
            isLoading: false 
          });
          throw error;
        }
      },

      appleLogin: async (appleData: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await API.auth.appleLogin({ access_token: appleData.access_token });
          const { user, token } = response.data;
          
          get().setUser(user);
          get().setToken(token);
          
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Apple login failed',
            isLoading: false 
          });
          throw error;
        }
      },


      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await API.user.getProfile();
          get().setUser(response.data);
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to fetch profile',
            isLoading: false 
          });
          throw error;
        }
      },

      updateProfile: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await API.user.updateProfile(data);
          get().setUser(response.data);
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to update profile',
            isLoading: false 
          });
          throw error;
        }
      },
    }),
    {
      name: 'assetworks-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 Rehydrating auth storage...', { 
          hasState: !!state, 
          hasToken: !!state?.token, 
          hasUser: !!state?.user 
        });
        
        if (state?.token && state?.user) {
          // Token and user exist in persisted state - restore authentication
          state.isAuthenticated = true;
          localStorage.setItem('assetworks_token', state.token);
          console.log('✅ Auth state restored from storage:', {
            user: state.user.email || state.user.phone || state.user.id,
            tokenLength: state.token.length
          });
        } else {
          // No valid persisted state
          state.isAuthenticated = false;
          localStorage.removeItem('assetworks_token');
          console.log('❌ No valid auth state found in storage');
        }
      },
    }
  )
);