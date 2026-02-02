import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

const B2CSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = details form, 2 = OTP verification
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [contactMethod, setContactMethod] = useState('email'); // 'email' or 'phone'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

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

    // Validation
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP
      const identifier = contactMethod === 'email' ? formData.email : formData.phoneNumber;
      await axios.post(`${API_URL}/auth/otp/send`, {
        identifier,
        method: contactMethod,
      });

      setStep(2);
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
      const identifier = contactMethod === 'email' ? formData.email : formData.phoneNumber;
      
      // Verify OTP and register
      const response = await axios.post(`${API_URL}/auth/otp/verify`, {
        identifier,
        otp: otpCode,
        method: contactMethod,
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: 'user',
      });

      // Store token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to user dashboard
      navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setIsLoading(true);

    try {
      const identifier = contactMethod === 'email' ? formData.email : formData.phoneNumber;
      await axios.post(`${API_URL}/auth/otp/resend`, {
        identifier,
        method: contactMethod,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Top Section - Pure Black */}
      <div className="w-full bg-black relative z-10">
        {/* Logo */}
        <div className="flex justify-center pt-6 pb-4">
          <img 
            src="/images/LogoFinal2.jpg" 
            alt="IndulgeOut" 
            className="h-12 w-auto object-contain" 
          />
        </div>
      </div>

      {/* Bottom Section - With Mirror Background */}
      <div className="flex-1 relative flex items-center justify-center py-8">
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

        {/* Form Card */}
        <div 
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(180deg, rgba(217,217,217,0.02) 0%, rgba(115,115,115,0.04) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {step === 1 ? (
            /* Step 1: Details Form */
            <>
              <h1 
                className="text-2xl md:text-3xl font-bold text-white text-center mb-1.5"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Join Us
              </h1>
              <p className="text-gray-300 text-center mb-4 text-sm">
                Create your account to get started
              </p>

              <form onSubmit={handleSendOTP} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1] transition-colors"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2.5 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1] transition-colors"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select 
                      className="px-3 py-2.5 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#6366F1]"
                    >
                      <option value="+91">🇮🇳 +91</option>
                    </select>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Enter mobile number"
                      className="flex-1 px-4 py-2.5 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6366F1] transition-colors"
                    />
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    required
                    className="mt-1 w-4 h-4 rounded border-gray-700 bg-[#2A2A2A] checked:bg-[#6366F1] focus:ring-[#6366F1]"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300">
                    I agree to the{' '}
                    <span className="text-[#6366F1] hover:underline cursor-pointer">
                      Terms & Conditions
                    </span>{' '}
                    and{' '}
                    <span className="text-[#6366F1] hover:underline cursor-pointer">
                      Privacy Policy
                    </span>
                  </label>
                </div>

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
                  className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold py-3 rounded-lg transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  {isLoading ? 'SENDING...' : 'SEND OTP'}
                </button>

                {/* Login Link */}
                <div className="text-center pt-3 border-t border-gray-700">
                  <p className="text-gray-400 text-sm">
                    Already have an Account?{' '}
                    <span 
                      onClick={() => navigate('/login')}
                      className="text-[#6366F1] hover:underline cursor-pointer font-semibold"
                    >
                      Log In
                    </span>
                  </p>
                </div>
              </form>
            </>
          ) : (
            /* Step 2: OTP Verification */
            <>
              <h1 
                className="text-2xl md:text-3xl font-bold text-white text-center mb-1.5"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                Enter Your OTP here
              </h1>
              <p className="text-gray-300 text-center mb-6 text-sm">
                We have sent an OTP to your mobile number and email
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
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
                      className="w-11 h-11 md:w-12 md:h-12 text-center text-xl font-bold bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#6366F1] transition-colors"
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold py-3 rounded-lg transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  {isLoading ? 'VERIFYING...' : 'SIGN UP'}
                </button>

                {/* Resend OTP */}
                <div className="text-center pt-3 border-t border-gray-700">
                  <p className="text-gray-400 text-sm">
                    Didn't receive code?{' '}
                    <span 
                      onClick={handleResendOTP}
                      className="text-[#6366F1] hover:underline cursor-pointer font-semibold"
                    >
                      Resend OTP
                    </span>
                  </p>
                </div>
              </form>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default B2CSignup;
