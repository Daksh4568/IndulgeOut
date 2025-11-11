import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Phone, Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DarkModeToggle from '../components/DarkModeToggle'
import axios from 'axios'
import API_BASE_URL from '../config/api'

// Configure axios to use the API base URL
axios.defaults.baseURL = API_BASE_URL

const Login = () => {
  const navigate = useNavigate()
  const { login, refreshUser } = useAuth()
  const [loginMethod, setLoginMethod] = useState('email') // 'email' or 'otp'
  const [currentStep, setCurrentStep] = useState(1) // 1: method selection, 2: form, 3: otp verification
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phoneNumber: ''
  })
  
  const [otpData, setOtpData] = useState({
    otp: '',
    userId: '',
    isLoading: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleMethodSelection = (method) => {
    setLoginMethod(method)
    setCurrentStep(2)
    setError('')
    setMessage('')
  }

  const handleBackToMethodSelection = () => {
    setCurrentStep(1)
    setError('')
    setMessage('')
  }

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      })
      
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please provide a valid 10-digit Indian mobile number')
      setIsLoading(false)
      return
    }

    try {
      const response = await axios.post('/api/otp/login/send', {
        phoneNumber: formData.phoneNumber
      })

      setOtpData({
        userId: response.data.userId,
        otp: '',
        isLoading: false
      })

      setMessage(`OTP sent to +91${formData.phoneNumber}`)
      setCurrentStep(3)
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPVerification = async (e) => {
    e.preventDefault()
    setOtpData({ ...otpData, isLoading: true })
    setError('')

    if (!otpData.otp || otpData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      setOtpData({ ...otpData, isLoading: false })
      return
    }

    try {
      const response = await axios.post('/api/otp/login/verify', {
        otp: otpData.otp,
        userId: otpData.userId
      })

      // Store auth token and update AuthContext
      const { token, user } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Refresh the auth context with the new user
      await refreshUser()
      
      setMessage('Login successful! Redirecting...')
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (error) {
      setError(error.response?.data?.message || 'OTP verification failed')
    } finally {
      setOtpData({ ...otpData, isLoading: false })
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await axios.post('/api/otp/resend', {
        phoneNumber: formData.phoneNumber,
        type: 'login'
      })

      setOtpData({ ...otpData, userId: response.data.userId })
      setMessage('OTP resent successfully')
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
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
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Sign in to continue your journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors duration-300">
          
          {/* Step 1: Method Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-6">
                Choose Login Method
              </h3>
              
              <button
                onClick={() => handleMethodSelection('otp')}
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-green-500 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <Phone className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Login with Phone</div>
                  <div className="text-sm text-gray-500">Quick OTP verification</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelection('email')}
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Mail className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Login with Email</div>
                  <div className="text-sm text-gray-500">Traditional email & password</div>
                </div>
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Login Form */}
          {currentStep === 2 && (
            <>
              <div className="flex items-center mb-4">
                <button
                  onClick={handleBackToMethodSelection}
                  className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
                <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                  {loginMethod === 'otp' ? 'Phone Login' : 'Email Login'}
                </span>
              </div>

              {loginMethod === 'email' ? (
                <form onSubmit={handleEmailLogin} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                      <div className="text-sm text-red-800 dark:text-red-400">
                        {error}
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleOTPLogin} className="space-y-6">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <div className="mt-1 flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                        +91
                      </span>
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="flex-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-r-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors"
                        placeholder="Enter 10-digit mobile number"
                        maxLength="10"
                        pattern="[6-9][0-9]{9}"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter your registered mobile number
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                      <div className="text-sm text-red-800 dark:text-red-400">
                        {error}
                      </div>
                    </div>
                  )}

                  {message && (
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                      <div className="text-sm text-green-800 dark:text-green-400">
                        {message}
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign up
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* Step 3: OTP Verification */}
          {currentStep === 3 && (
            <>
              <div className="flex items-center mb-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
                <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                  Verify Phone Number
                </span>
              </div>

              <div className="text-center mb-6">
                <Phone className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  Enter OTP
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  We sent a verification code to +91{formData.phoneNumber}
                </p>
              </div>

              <form onSubmit={handleOTPVerification} className="space-y-6">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength="6"
                    value={otpData.otp}
                    onChange={(e) => setOtpData({...otpData, otp: e.target.value})}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    pattern="[0-9]{6}"
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <div className="text-sm text-red-800 dark:text-red-400">
                      {error}
                    </div>
                  </div>
                )}

                {message && (
                  <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                    <div className="text-sm text-green-800 dark:text-green-400">
                      {message}
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={otpData.isLoading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {otpData.isLoading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm text-primary-600 hover:text-primary-500 disabled:opacity-50"
                  >
                    Didn't receive code? Resend
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login