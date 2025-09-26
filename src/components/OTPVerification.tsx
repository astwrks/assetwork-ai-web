// components/OTPVerification.tsx - OTP verification matching mobile app exactly
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface OTPVerificationProps {
  email: string;
  onBack: () => void;
}

export default function OTPVerification({ email, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { 
    verifyEmailOTP, 
    sendEmailOTP, 
    isLoading, 
    error, 
    clearError 
  } = useAuthStore();

  // Timer for resend functionality
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (error) clearError();

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (value && newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Focus previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newOtp = digits.split('');
      setOtp(newOtp);
      handleVerifyOTP(digits);
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (otpToVerify.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    try {
      await verifyEmailOTP(email, otpToVerify);
      toast.success('Verification successful');
    } catch (err) {
      console.error('OTP verification error:', err);
      toast.error('Invalid OTP. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    try {
      await sendEmailOTP(email);
      toast.success('OTP sent successfully');
      setResendTimer(30);
      setCanResend(false);
      // Clear current OTP
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Resend OTP error:', err);
      toast.error('Failed to resend OTP. Please try again.');
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
              Secure Your Account
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              We've sent a verification code to your email. 
              This helps us ensure the security of your AssetWorks account.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-gray-200">Bank-grade security</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-gray-200">Multi-factor authentication</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-gray-200">Data encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - OTP verification form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={onBack}
            className="mb-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h2>
            <div className="flex items-center justify-center lg:justify-start mb-4">
              <Mail className="h-5 w-5 text-gray-400 mr-2" />
              <p className="text-gray-600 text-base">
                Code sent to <span className="font-medium text-gray-900">{email}</span>
              </p>
            </div>
          </div>

          {/* OTP input */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between space-x-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                    disabled={isLoading}
                  />
                ))}
              </div>
              
              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}
            </div>

            {/* Verify button */}
            <Button
              onClick={() => handleVerifyOTP()}
              disabled={isLoading || otp.some(digit => !digit)}
              className="w-full h-14 text-base font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Verify Code'
              )}
            </Button>

            {/* Resend section */}
            <div className="text-center pt-4">
              <p className="text-gray-600 text-sm mb-2">
                Didn't receive the code?
              </p>
              
              {canResend ? (
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-gray-900 font-medium hover:text-gray-700 transition-colors underline disabled:opacity-50"
                >
                  Resend Code
                </button>
              ) : (
                <p className="text-gray-500 text-sm">
                  Resend available in {resendTimer}s
                </p>
              )}
            </div>

            {/* Help text */}
            <div className="text-center pt-4">
              <p className="text-xs text-gray-500">
                Check your spam folder if you don't see the email
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}