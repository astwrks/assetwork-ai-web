// components/SignupFlow.tsx - Complete signup flow coordinator
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import SignupForm from './SignupForm';
import OTPVerification from './OTPVerification';

type SignupStep = 'email' | 'otp' | 'profile' | 'completed';

interface SignupState {
  step: SignupStep;
  email: string;
}

interface SignupFlowProps {
  onSwitchToLogin?: () => void;
}

export default function SignupFlow({ onSwitchToLogin }: SignupFlowProps) {
  const [signupState, setSignupState] = useState<SignupState>({
    step: 'email',
    email: '',
  });

  const { isAuthenticated, user } = useAuthStore();

  // Listen for successful OTP send to move to verification step
  useEffect(() => {
    // This would be triggered by navigation from the auth store
    // For now, we'll handle it manually when OTP is sent
  }, []);

  // Navigate to home if authentication is successful
  useEffect(() => {
    if (isAuthenticated && user) {
      // User successfully authenticated, will be handled by main app router
      console.log('✅ Signup completed successfully');
    }
  }, [isAuthenticated, user]);

  const handleEmailSubmitted = (email: string) => {
    setSignupState({
      step: 'otp',
      email: email,
    });
  };

  const handleBackToEmail = () => {
    setSignupState({
      step: 'email',
      email: signupState.email,
    });
  };

  switch (signupState.step) {
    case 'email':
      return (
        <SignupForm 
          onOTPSent={handleEmailSubmitted}
          onSwitchToLogin={onSwitchToLogin}
        />
      );
      
    case 'otp':
      return (
        <OTPVerification
          email={signupState.email}
          onBack={handleBackToEmail}
        />
      );
      
    default:
      return (
        <SignupForm 
          onOTPSent={handleEmailSubmitted}
          onSwitchToLogin={onSwitchToLogin}
        />
      );
  }
}