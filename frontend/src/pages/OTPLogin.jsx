import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, Mail, Phone, ArrowRight, RefreshCw, Copy, Check } from 'lucide-react'
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
  const [testAccountOTP, setTestAccountOTP] = useState(null) // Store OTP for test accounts
  const [copied, setCopied] = useState(false) // Track if OTP was copied

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
        
        // If OTP is returned (test account), store it for display
        if (response.data.otp && response.data.isDummyAccount) {
          setTestAccountOTP(response.data.otp)
          console.log('🧪 Test Account OTP:', response.data.otp)
        } else {
          setTestAccountOTP(null)
        }
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
        
        // If OTP is returned (test account), store it for display
        if (response.data.otp && response.data.isDummyAccount) {
          setTestAccountOTP(response.data.otp)
          console.log('🧪 Test Account OTP:', response.data.otp)
        } else {
          setTestAccountOTP(null)
        }
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
    setTestAccountOTP(null) // Clear test OTP
    setCopied(false) // Reset copy state
  }

  const handleCopyOTP = () => {
    if (testAccountOTP) {
      navigator.clipboard.writeText(testAccountOTP)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="absolute top-4 left-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Home className="h-5 w-5" />
          <span className="hidden sm:inline">Home</span>
        </button>
      </div>
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            IndulgeOut
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          {step === 1 ? 'Welcome Back' : 'Verify OTP'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {step === 1 
            ? `Sign in with ${loginMethod === 'email' ? 'Email' : 'Phone'} OTP`
            : `Enter the OTP sent to your ${loginMethod === 'email' ? 'email' : 'phone'}`
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors duration-300">
          
          {/* Login Method Toggle */}
          {step === 1 && (
            <div className="mb-6">
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
                    loginMethod === 'email'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email</span>
                </button>
                <button
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
                    loginMethod === 'phone'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Phone</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          )}

          {/* Step 1: Enter Identifier */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type={loginMethod === 'email' ? 'email' : 'tel'}
                  required
                  placeholder={loginMethod === 'email' ? 'your@email.com' : '9876543210'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {loginMethod === 'phone' && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter 10-digit Indian mobile number
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !identifier}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter OTP
                  </label>
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Change {loginMethod === 'email' ? 'email' : 'phone'}
                  </button>
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength="6"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOTP(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                  OTP sent to {identifier}
                </p>
                
                {/* Display OTP for Test/Dummy Accounts */}
                {testAccountOTP && (
                  <div className="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 uppercase tracking-wide">
                        🧪 Test Account
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyOTP}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-yellow-300 dark:border-yellow-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your OTP:</p>
                      <p className="text-3xl font-bold text-center text-gray-900 dark:text-white font-mono tracking-widest">
                        {testAccountOTP}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 text-center">
                      This OTP is shown because you're using a test email address
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Login</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Resend OTP in {resendTimer}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Register Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OTPLogin
