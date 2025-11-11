import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, Users, Phone, Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DarkModeToggle from '../components/DarkModeToggle'
import axios from 'axios'
import API_BASE_URL from '../config/api'

// Configure axios to use the API base URL
axios.defaults.baseURL = API_BASE_URL

const Register = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { register, refreshUser } = useAuth()
  const [registrationMethod, setRegistrationMethod] = useState('password') // 'password' or 'otp'
  const [currentStep, setCurrentStep] = useState(1) // 1: method selection, 2: form, 3: otp verification
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: searchParams.get('type') === 'host' ? 'community_member' : 'user'
  })
  
  const [otpData, setOtpData] = useState({
    otp: '',
    tempToken: '',
    isLoading: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    setRegistrationMethod(method)
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

  const handlePasswordRegistration = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please provide a valid 10-digit Indian mobile number')
      setIsLoading(false)
      return
    }

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        role: formData.role
      })

      if (result.success) {
        navigate('/')
      } else {
        setError(result.message || 'Registration failed')
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPRegistration = async (e) => {
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
      const response = await axios.post('/api/otp/register/send', {
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        fullName: formData.name
      })

      setOtpData({
        tempToken: response.data.tempToken,
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
      const response = await axios.post('/api/otp/register/verify', {
        otp: otpData.otp,
        tempToken: otpData.tempToken,
        interests: [] // Can be collected in interest selection page later
      })

      // Store auth token and update AuthContext
      const { token, user } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Refresh the auth context with the new user
      await refreshUser()
      
      setMessage('Registration successful! Redirecting...')
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
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
        type: 'register'
      })

      setOtpData({ ...otpData, tempToken: response.data.tempToken })
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
          {formData.role === 'community_member' ? 'Become a Host' : 'Join the Community'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {formData.role === 'community_member' 
            ? 'Start hosting amazing events for your community'
            : 'Discover events that match your interests'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors duration-300">
          {/* Role Toggle */}
          <div className="mb-6">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700">
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'user'})}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  formData.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Join as User
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'community_member'})}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  formData.role === 'community_member'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Become Host
              </button>
            </div>
          </div>

          {/* Step 1: Method Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-6">
                Choose Registration Method
              </h3>
              
              <button
                onClick={() => handleMethodSelection('otp')}
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-green-500 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <Phone className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Quick Sign Up with Phone</div>
                  <div className="text-sm text-gray-500">Register in seconds with OTP</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelection('password')}
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Mail className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Traditional Email & Password</div>
                  <div className="text-sm text-gray-500">Classic registration method</div>
                </div>
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Registration Form */}
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
                  {registrationMethod === 'otp' ? 'Phone Registration' : 'Email Registration'}
                </span>
              </div>

              <form onSubmit={registrationMethod === 'otp' ? handleOTPRegistration : handlePasswordRegistration} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
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

                {/* Phone Number Field */}
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
                    Enter your 10-digit Indian mobile number
                  </p>
                </div>

                {/* Password Fields - Only for password method */}
                {registrationMethod === 'password' && (
                  <>
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
                          placeholder="Create a password"
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

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors"
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

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
                    {isLoading ? 'Processing...' : registrationMethod === 'otp' ? 'Send OTP' : 'Create Account'}
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
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
                    {otpData.isLoading ? 'Verifying...' : 'Verify & Create Account'}
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

export default Register