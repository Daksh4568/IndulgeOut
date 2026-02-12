import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, Mail, Phone, ArrowRight, RefreshCw } from 'lucide-react'
import DarkModeToggle from '../components/DarkModeToggle'
import { api } from '../config/api'
import { useAuth } from '../contexts/AuthContext'

const OTPLogin = () => {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  
  const [loginMethod, setLoginMethod] = useState('email') // 'email' or 'phone'
  const [step, setStep] = useState(1) // 1: Enter identifier, 2: Enter OTP
  const [identifier, setIdentifier] = useState('')
  const [otp, setOTP] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await api.post('/auth/otp/send', {
        identifier,
        method: loginMethod === 'email' ? 'email' : 'sms'
      })

      if (response.data.message) {
        setSuccessMessage(response.data.message)
        setStep(2)
        setResendTimer(60) // 60 seconds cooldown
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('🔐 Verifying OTP...', { identifier, otp, method: loginMethod })
      
      const response = await api.post('/auth/otp/verify', {
        identifier,
        otp,
        method: loginMethod === 'email' ? 'email' : 'sms'
      })

      console.log('✅ OTP Verification Response:', response.data)

      if (response.data.token) {
        // Save token to localStorage
        localStorage.setItem('token', response.data.token)

        console.log('✅ Token saved, refreshing user context...')

        // Refresh auth context to get user data
        await refreshUser()

        // Route based on user role
        const { user } = response.data
        
        let targetRoute = '/dashboard'
        if (user.role === 'admin') {
          targetRoute = '/admin/dashboard'
        } else if (user.role === 'host_partner' && user.hostPartnerType === 'community_organizer') {
          targetRoute = '/organizer/dashboard'
        } else if (user.role === 'host_partner' && user.hostPartnerType === 'venue') {
          targetRoute = '/venue/dashboard'
        } else if (user.role === 'host_partner' && user.hostPartnerType === 'brand_sponsor') {
          targetRoute = '/brand/dashboard'
        }
        
        console.log('🚀 Navigating to:', targetRoute)
        
        // Navigate to dashboard
        navigate(targetRoute, { replace: true })
      } else {
        console.error('❌ No token in response')
        setError('Login failed. Please try again.')
      }
    } catch (err) {
      console.error('❌ OTP Verification Error:', err)
      console.error('Error response:', err.response?.data)
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await api.post('/auth/otp/resend', {
        identifier,
        method: loginMethod === 'email' ? 'email' : 'sms'
      })

      if (response.data.message) {
        setSuccessMessage(response.data.message)
        setResendTimer(60)
        setOTP('') // Clear previous OTP
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeMethod = () => {
    setLoginMethod(loginMethod === 'email' ? 'phone' : 'email')
    setIdentifier('')
    setOTP('')
    setStep(1)
    setError('')
    setSuccessMessage('')
  }

  const handleGoBack = () => {
    setStep(1)
    setOTP('')
    setError('')
    setSuccessMessage('')
  }

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
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo - Fully Outside Card, Clickable */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 flex justify-center w-full">
          <button onClick={() => navigate('/')} className="focus:outline-none bg-transparent" style={{ pointerEvents: 'auto' }}>
            <img 
              src="/images/LogoOrbital.png" 
              alt="IndulgeOut" 
              className="h-20 w-auto object-contain drop-shadow-xl bg-transparent" 
            />
          </button>
        </div>
        {/* Glass Morphism Card */}
        <div 
          className="rounded-3xl p-8 border w-full mt-12"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >

          {/* Tagline */}
          <p className="text-gray-300 text-center mb-8 text-sm">
            Find offline experiences, join communities and connect with people
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 bg-green-500/10 border border-green-500 text-green-500 px-4 py-2.5 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

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
                      id="identifier"
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': '#7878E9' }}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <select 
                        className="px-3 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#7878E9' }}
                      >
                        <option value="+91">🇮🇳 +91</option>
                      </select>
                      <input
                        id="identifier"
                        type="tel"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter mobile number"
                        className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': '#7878E9' }}
                      />
                    </div>
                  </div>
                )}

                {/* Send OTP Button with Purple Gradient */}
                <button
                  type="submit"
                  disabled={isLoading || !identifier}
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
                    className="text-sm font-bold transition-colors"
                    style={{ color: '#7878E9' }}
                  >
                    {loginMethod === 'email' ? 'Sign in with Phone Number' : 'Sign in with Email'}
                  </button>
                </div>

                {/* Signup Link */}
                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm">
                    Don't have an account?{' '}
                    <span 
                      onClick={() => navigate('/signup')}
                      className="cursor-pointer font-bold transition-colors"
                      style={{ color: '#7878E9' }}
                    >
                      Create Account
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
                {/* OTP Input */}
                <div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength="6"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOTP(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Verify Button with Purple Gradient */}
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
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
                        className="cursor-pointer font-semibold transition-colors"
                        style={{ color: '#7878E9' }}
                      >
                        Resend OTP
                      </span>
                    )}
                  </p>
                </div>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleGoBack}
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
  )
}

export default OTPLogin
