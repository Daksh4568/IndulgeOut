import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = identifier input, 2 = OTP verification
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError(`Please enter your ${loginMethod === 'email' ? 'email' : 'phone number'}`);
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/auth/otp/send`, {
        identifier,
        method: loginMethod === 'email' ? 'email' : 'sms',
      });

      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/otp/verify`, {
        identifier,
        otp: otpCode,
        method: loginMethod === 'email' ? 'email' : 'sms',
      });

      // Store token and user
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect based on role
      const user = response.data.user;
      if (user.role === 'host_partner') {
        if (user.hostPartnerType === 'community_organizer') {
          navigate('/organizer/dashboard');
        } else if (user.hostPartnerType === 'venue') {
          navigate('/venue/dashboard');
        } else if (user.hostPartnerType === 'brand_sponsor') {
          navigate('/brand/dashboard');
        } else {
          navigate('/organizer/dashboard');
        }
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }

      // Reload page to update auth context
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setError('');
    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/auth/otp/resend`, {
        identifier,
        method: loginMethod === 'email' ? 'email' : 'sms',
      });

      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Image with Opacity and Blur */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-20 blur-sm"
        style={{
          backgroundImage: 'url(/images/BackgroundLogin.jpg)',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glass Morphism Card */}
        <div 
          className="rounded-3xl p-8 border"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/images/LogoFinal2.jpg" 
              alt="IndulgeOut" 
              className="h-20 w-auto object-contain" 
            />
          </div>

          {/* Tagline */}
          <p className="text-gray-300 text-center mb-8 text-sm">
            Find offline experiences, join communities and connect with people
          </p>

          {step === 1 ? (
            /* Step 1: Enter Email/Phone */
            <>
              {/* Method Heading */}
              <h2 
                className="text-xl font-bold text-white text-center mb-6"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                {loginMethod === 'email' ? 'Enter Your Email' : 'Enter Your Mobile Number'}
              </h2>

              {/* Subtext for phone */}
              {loginMethod === 'phone' && (
                <p className="text-gray-400 text-center mb-6 text-xs">
                  (If you already have an account, log in here)
                </p>
              )}

              <form onSubmit={handleSendOTP} className="space-y-4">
                {/* Email or Phone Input */}
                {loginMethod === 'email' ? (
                  <div>
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <select 
                        className="px-3 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="+91">🇮🇳 +91</option>
                      </select>
                      <input
                        type="tel"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter mobile number"
                        className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2.5 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Send OTP Button with Purple Gradient */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white font-bold py-3.5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                    fontFamily: 'Oswald, sans-serif',
                  }}
                >
                  {isLoading ? 'SENDING...' : 'SEND OTP'}
                </button>

                {/* Terms Text */}
                <p className="text-gray-500 text-xs text-center mt-4">
                  By continuing, you agree to our Terms of Service Privacy Policy
                </p>

                {/* Toggle between Email and Phone */}
                <div className="text-center pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod(loginMethod === 'email' ? 'phone' : 'email');
                      setIdentifier('');
                      setError('');
                    }}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                  >
                    {loginMethod === 'email' ? 'Sign in with Phone Number' : 'Sign in with Email'}
                  </button>
                </div>

                {/* Signup Link */}
                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm">
                    Don't have an accounts?{' '}
                    <span 
                      onClick={() => navigate('/signup')}
                      className="text-purple-400 hover:text-purple-300 cursor-pointer font-semibold transition-colors"
                    >
                      Create Accounts
                    </span>
                  </p>
                </div>
              </form>
            </>
          ) : (
            /* Step 2: OTP Verification */
            <>
              <h2 
                className="text-xl font-bold text-white text-center mb-4"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Enter Your OTP
              </h2>
              <p className="text-gray-400 text-center mb-8 text-sm">
                We have sent the OTP to your {loginMethod === 'email' ? 'email' : 'mobile'} number
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2.5 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Verify Button with Purple Gradient */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white font-bold py-3.5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                    fontFamily: 'Oswald, sans-serif',
                  }}
                >
                  {isLoading ? 'VERIFYING...' : 'VERIFY'}
                </button>

                {/* Resend OTP */}
                <div className="text-center pt-4">
                  <p className="text-gray-400 text-sm">
                    Didn't receive code?{' '}
                    {resendTimer > 0 ? (
                      <span className="text-gray-500">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <span 
                        onClick={handleResendOTP}
                        className="text-purple-400 hover:text-purple-300 cursor-pointer font-semibold transition-colors"
                      >
                        Resend OTP
                      </span>
                    )}
                  </p>
                </div>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                  }}
                  className="w-full text-gray-400 hover:text-white text-sm transition-colors pt-2"
                >
                  ← Back to {loginMethod === 'email' ? 'email' : 'phone number'} entry
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

