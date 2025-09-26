// components/SignupForm.tsx - Complete signup flow matching mobile app exactly
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface SignupFormProps {
  onOTPSent?: (email: string) => void;
  onSwitchToLogin?: () => void;
}

export default function SignupForm({ onOTPSent, onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showSocialButtons, setShowSocialButtons] = useState(true);
  
  const { 
    sendEmailOTP, 
    googleLogin, 
    appleLogin, 
    isLoading, 
    error, 
    clearError 
  } = useAuthStore();

  // Email validation matching mobile app exactly
  const isValidEmail = (email: string) => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async () => {
    setEmailError('');
    clearError();

    // Validation matching mobile app exactly
    if (email.trim() === '') {
      setEmailError('Please enter your email');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      await sendEmailOTP(email.trim());
      toast.success('OTP sent successfully');
      // Trigger step change to OTP verification
      if (onOTPSent) {
        onOTPSent(email.trim());
      }
    } catch (err) {
      console.error('OTP send error:', err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // This would integrate with Google OAuth
      toast.info('Google Sign-In integration needed');
      // await googleLogin(googleToken);
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  const handleAppleLogin = async () => {
    try {
      // This would integrate with Apple Sign-In
      toast.info('Apple Sign-In integration needed');
      // await appleLogin(appleData);
    } catch (err) {
      console.error('Apple login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Marketing content matching AssetWorks website */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">
              Make Smarter Investment Decisions in Seconds
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Get personalized, AI-driven insights that help you invest with confidence. 
              Join thousands of investors already using AssetWorks.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-gray-200">Real-time market analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-gray-200">Personalized investment recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-gray-200">Professional-grade research tools</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>
            <p className="text-gray-600 text-lg">
              Enter your Email ID to get started
            </p>
          </div>

          {/* Email input section */}
          <div className="space-y-6">
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                    if (error) clearError();
                  }}
                  className="pl-10 h-14 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
              {emailError && (
                <p className="mt-2 text-sm text-red-600">{emailError}</p>
              )}
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Continue button */}
            <Button
              onClick={handleEmailSubmit}
              disabled={isLoading}
              className="w-full h-14 text-base font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Continue'
              )}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center my-8">
              <div className="flex-grow border-t border-gray-300" />
              <span className="flex-shrink-0 px-4 text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300" />
            </div>

            {/* Social login buttons matching mobile app */}
            <div className="space-y-4">
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                variant="outline"
                className="w-full h-14 text-base font-medium border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>

              <Button
                onClick={handleAppleLogin}
                disabled={isLoading}
                variant="outline"
                className="w-full h-14 text-base font-medium border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Sign in with Apple
              </Button>
            </div>

            {/* Terms and privacy policy */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600 mb-4">
                By continuing, you agree to our{' '}
                <a href="#" className="text-gray-900 underline hover:text-gray-700">
                  Terms & Service
                </a>
                {' '}and{' '}
                <a href="#" className="text-gray-900 underline hover:text-gray-700">
                  Privacy Policy
                </a>
              </p>

              {/* Login link */}
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-gray-900 font-medium hover:text-gray-700 underline transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}