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
    <div className="h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background with mirror effect */}
      <div className="absolute inset-0 flex">
        <div 
          className="w-1/2 h-full bg-cover bg-center"
          style={{
            backgroundImage: 'url(/images/BackgroundLogin.jpg)',
          }}
        />
        <div 
          className="w-1/2 h-full bg-cover bg-center"
          style={{
            backgroundImage: 'url(/images/BackgroundLogin.jpg)',
            transform: 'scaleX(-1)',
          }}
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/85" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg px-4">
        {/* Black Background Section - Logo */}
        <div className="flex justify-center mb-8 -mx-4 px-4 py-8 bg-black">
          <img 
            src="/images/LogoFinal2.jpg" 
            alt="IndulgeOut" 
            className="h-16 w-auto object-contain" 
          />
        </div>

        {/* Form Card */}
        <div 
          className="rounded-2xl p-8"
          style={{
            background: 'linear-gradient(180deg, rgba(217,217,217,0.01) 0%, rgba(115,115,115,0.02) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {step === 1 ? (
            /* Step 1: Enter Email/Phone */
            <>
              <h1 
                className="text-3xl md:text-4xl font-bold text-white text-center mb-2"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Welcome Back
              </h1>
              <p className="text-gray-300 text-center mb-6 text-sm">
                Sign in to your account to continue
              </p>

              {/* Toggle Email/Phone */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                    loginMethod === 'email'
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-[#2A2A2A] text-gray-400 border border-gray-700'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                    loginMethod === 'phone'
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-[#2A2A2A] text-gray-400 border border-gray-700'
                  }`}
                >
                  Phone
                </button>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                {/* Email or Phone Input */}
                {loginMethod === 'email' ? (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1] transition-colors"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select 
                        className="px-3 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#6366F1]"
                      >
                        <option value="+91">🇮🇳 +91</option>
                      </select>
                      <input
                        type="tel"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter mobile number"
                        className="flex-1 px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1] transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Send OTP Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold py-3.5 rounded-lg transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  {isLoading ? 'SENDING...' : 'SEND OTP'}
                </button>

                {/* Signup Link */}
                <div className="text-center pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm">
                    Don't have an account?{' '}
                    <span 
                      onClick={() => navigate('/signup')}
                      className="text-[#6366F1] hover:underline cursor-pointer font-semibold"
                    >
                      Sign Up
                    </span>
                  </p>
                </div>
              </form>
            </>
          ) : (
            /* Step 2: OTP Verification */
            <>
              <h1 
                className="text-3xl md:text-4xl font-bold text-white text-center mb-2"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Enter Your OTP
              </h1>
              <p className="text-gray-300 text-center mb-8 text-sm">
                We have sent an OTP to your {loginMethod === 'email' ? 'email' : 'phone number'}
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-2 md:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 md:w-14 md:h-14 text-center text-2xl font-bold bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#6366F1] transition-colors"
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold py-3.5 rounded-lg transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  {isLoading ? 'VERIFYING...' : 'SIGN IN'}
                </button>

                {/* Resend OTP */}
                <div className="text-center pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm">
                    Didn't receive code?{' '}
                    {resendTimer > 0 ? (
                      <span className="text-gray-500">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <span 
                        onClick={handleResendOTP}
                        className="text-[#6366F1] hover:underline cursor-pointer font-semibold"
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
                  className="w-full text-gray-400 hover:text-white text-sm transition-colors"
                >
                  ← Back to login
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

