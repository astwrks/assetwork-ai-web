// components/LoginForm.tsx - Login form component with exact AssetWorks design
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import AssetWorksHeader from './AssetWorksHeader';

interface LoginFormProps {
  onSwitchToSignup?: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [loginMethod, setLoginMethod] = useState<'email' | 'google' | 'apple'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  
  const { sendEmailOTP, verifyEmailOTP, googleLogin, appleLogin, isLoading, error, clearError, otpSent, setOtpSent } = useAuthStore();

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const handleSendEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      clearError();
      await sendEmailOTP(email);
      setResendCountdown(60); // 60 second cooldown
      toast.success('OTP sent to your email!');
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    try {
      clearError();
      await sendEmailOTP(email);
      setResendCountdown(60); // Reset 60 second cooldown
      toast.success('OTP resent to your email!');
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    }
  };

  const handleVerifyEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      clearError();
      console.log('🔑 Verifying OTP:', { email, otp: otp.length > 0 ? `${otp.length} digits` : 'empty' });
      await verifyEmailOTP(email, otp);
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error('🔴 OTP verification error:', error);
      toast.error('Invalid OTP. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      clearError();
      toast.error('Google OAuth not implemented yet. Please check the implementation guide.');
    } catch (error) {
      toast.error('Google login failed. Please try again.');
    }
  };

  const handleAppleLogin = async () => {
    try {
      clearError();
      toast.error('Apple OAuth not implemented yet. Please check the implementation guide.');
    } catch (error) {
      toast.error('Apple login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* AssetWorks Header */}
      <AssetWorksHeader showGetStarted={false} />
      
      {/* Hero Section - Exact copy from AssetWorks website */}
      <section className="px-4 md:px-6 py-12 md:py-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Side - Hero Content */}
          <div className="flex flex-col justify-center order-2 md:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 text-gray-900">
              Make Smarter<br />
              Investment Decisions<br />
              in Seconds
            </h1>
            <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 leading-relaxed">
              Stop spending hours on research. Get personalized,
              AI-powered insights that help you
              invest with confidence and stay ahead of the market.
            </p>
            <div className="flex flex-row gap-4 mb-6 md:mb-8 justify-center sm:justify-start">
              <a 
                href="https://play.google.com/store/apps/details?id=com.assetworks.app.hippo&pli=1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <img
                  src="/images/google-play-new.svg"
                  alt="Get it on Google Play"
                  className="h-10 sm:h-12 w-auto"
                />
              </a>
              <a 
                href="https://apps.apple.com/in/app/assetworks-ai/id6747794981"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <img
                  src="/images/app-store-new.svg"
                  alt="Download on the App Store"
                  className="h-10 sm:h-12 w-auto"
                />
              </a>
            </div>
            
            <div className="flex items-center space-x-4 text-xs md:text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-2 border-white">
                    <img
                      src="/waitlist/p1.png"
                      alt="Profile 1"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-2 border-white">
                    <img
                      src="/waitlist/p2.png"
                      alt="Profile 2"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-2 border-white">
                    <img
                      src="/waitlist/p3.png"
                      alt="Profile 3"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="ml-2">Join <strong>2,500+</strong> investors making smarter decisions</span>
              </div>
            </div>
          </div>
          
          {/* Right Side - Login Form (Floating Widget Style) */}
          <div className="relative flex justify-center order-1 md:order-2">
            <div className="w-full max-w-md">
              <Card className="bg-white border border-gray-200 shadow-xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {otpSent ? 'Enter Your OTP' : 'Sign in to AssetWorks'}
                  </CardTitle>
                  <CardDescription className="text-gray-700 mt-2">
                    Choose your preferred login method
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Login Method Selection */}
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => setLoginMethod('email')}
                      variant={loginMethod === 'email' ? 'default' : 'outline'}
                      className="py-3"
                    >
                      Email OTP
                    </Button>
                    <Button
                      onClick={() => setLoginMethod('google')}
                      variant={loginMethod === 'google' ? 'default' : 'outline'}
                      className="py-3"
                    >
                      Google
                    </Button>
                    <Button
                      onClick={() => setLoginMethod('apple')}
                      variant={loginMethod === 'apple' ? 'default' : 'outline'}
                      className="py-3"
                    >
                      Apple
                    </Button>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md">
                      {error}
                    </div>
                  )}

                  {/* Email OTP Login */}
                  {loginMethod === 'email' && (
                    <div className="space-y-4">
                      {!otpSent ? (
                        <form onSubmit={handleSendEmailOTP} className="space-y-4">
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                              Email Address
                            </label>
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              required
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full py-4 px-4 text-lg" 
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Sending...</span>
                              </div>
                            ) : 'Send OTP to Email'}
                          </Button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
                          <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-900 mb-2">
                              Enter OTP sent to {email}
                            </label>
                            <Input
                              id="otp"
                              type="text"
                              value={otp}
                              onChange={(e) => setOTP(e.target.value)}
                              placeholder="123456"
                              required
                              maxLength={6}
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 py-3"
                              onClick={() => {
                                setOtpSent(false);
                                setOTP('');
                              }}
                            >
                              Back
                            </Button>
                            <Button 
                              type="submit" 
                              className="flex-1 py-3" 
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Verifying...</span>
                                </div>
                              ) : 'Verify OTP'}
                            </Button>
                          </div>
                          
                          {/* Resend OTP */}
                          <div className="text-center pt-2">
                            {resendCountdown > 0 ? (
                              <p className="text-sm text-gray-500">
                                Resend OTP in {resendCountdown}s
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={isLoading}
                                className="text-sm text-gray-900 hover:text-gray-700 underline transition-colors disabled:opacity-50"
                              >
                                {isLoading ? 'Sending...' : 'Resend OTP'}
                              </button>
                            )}
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Google Login */}
                  {loginMethod === 'google' && (
                    <div className="space-y-4">
                      <Button 
                        onClick={handleGoogleLogin} 
                        variant="outline"
                        className="w-full flex items-center justify-center space-x-2 py-3" 
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
                      </Button>
                    </div>
                  )}

                  {/* Apple Login */}
                  {loginMethod === 'apple' && (
                    <div className="space-y-4">
                      <Button 
                        onClick={handleAppleLogin} 
                        variant="outline"
                        className="w-full flex items-center justify-center space-x-2 py-3" 
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        <span>{isLoading ? 'Signing in...' : 'Continue with Apple'}</span>
                      </Button>
                    </div>
                  )}

                </CardContent>
              </Card>

              {/* Signup link */}
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={onSwitchToSignup}
                    className="text-gray-900 font-medium hover:text-gray-700 underline transition-colors"
                  >
                    Sign up now
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}