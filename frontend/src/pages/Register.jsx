import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, Users, Home, Building2, Sparkles, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DarkModeToggle from '../components/DarkModeToggle'

const Register = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { register } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: searchParams.get('type') === 'host' ? 'host_partner' : 'user',
    hostPartnerType: searchParams.get('type') === 'host' ? 'community_organizer' : ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = async (e) => {
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

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      setError('Please provide a valid 10-digit Indian mobile number')
      setIsLoading(false)
      return
    }

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
        role: formData.role,
        hostPartnerType: formData.hostPartnerType || undefined
      })

      if (result.success) {
        // Route based on role
        if (formData.role === 'user') {
          navigate('/interests')
        } else if (formData.role === 'host_partner') {
          // Route to appropriate onboarding based on hostPartnerType
          if (formData.hostPartnerType === 'community_organizer') {
            navigate('/onboarding/community')
          } else if (formData.hostPartnerType === 'venue') {
            navigate('/onboarding/venue')
          } else if (formData.hostPartnerType === 'brand_sponsor') {
            navigate('/onboarding/brand')
          }
        }
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleToggle = (role, hostPartnerType = '') => {
    setFormData({ 
      ...formData, 
      role,
      hostPartnerType: role === 'host_partner' ? hostPartnerType : ''
    })
    setShowRoleDropdown(false)
  }

  const getRoleLabel = () => {
    if (formData.role === 'user') return 'Join as User'
    
    const labels = {
      'community_organizer': 'Communities & Organizers',
      'venue': 'Venues',
      'brand_sponsor': 'Brands & Sponsors'
    }
    return labels[formData.hostPartnerType] || 'Host & Partner'
  }

  const getRoleIcon = () => {
    if (formData.role === 'user') return <UserPlus className="h-4 w-4" />
    
    const icons = {
      'community_organizer': <Users className="h-4 w-4" />,
      'venue': <Building2 className="h-4 w-4" />,
      'brand_sponsor': <Sparkles className="h-4 w-4" />
    }
    return icons[formData.hostPartnerType] || <Users className="h-4 w-4" />
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
          Join the Community
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Discover events that match your interests
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors duration-300">
          
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              I want to
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleRoleToggle('user')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 rounded-lg ${
                  formData.role === 'user'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Join as User
              </button>
              
              <div className="flex-1 relative">
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className={`w-full py-3 px-4 text-sm font-medium transition-colors flex items-center justify-between gap-2 rounded-lg ${
                    formData.role === 'host_partner'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {getRoleIcon()}
                    {formData.role === 'host_partner' ? getRoleLabel() : 'Host & Partner'}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showRoleDropdown && (
                  <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleRoleToggle('host_partner', 'community_organizer')}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 first:rounded-t-lg transition-colors"
                    >
                      <Users className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Communities & Organizers</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Host events and build communities</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleToggle('host_partner', 'venue')}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 border-t border-gray-200 dark:border-gray-600 transition-colors"
                    >
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Venues</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">List your space for events</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleToggle('host_partner', 'brand_sponsor')}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 border-t border-gray-200 dark:border-gray-600 last:rounded-b-lg transition-colors"
                    >
                      <Sparkles className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Brands & Sponsors</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Partner with communities and events</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Role Description */}
            {formData.role === 'user' && (
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                🎯 Discover and join amazing events in your city
              </p>
            )}
            {formData.role === 'host_partner' && formData.hostPartnerType === 'community_organizer' && (
              <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                🎪 Create events, build communities, and grow your audience
              </p>
            )}
            {formData.role === 'host_partner' && formData.hostPartnerType === 'venue' && (
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                🏢 Monetize your space by hosting curated events
              </p>
            )}
            {formData.role === 'host_partner' && formData.hostPartnerType === 'brand_sponsor' && (
              <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                ✨ Reach engaged audiences through meaningful collaborations
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                placeholder="Enter your full name"
              />
            </div>

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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="mt-1 flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                  +91
                </span>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="flex-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-r-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                  placeholder="Enter 10-digit mobile number"
                  maxLength="10"
                  pattern="[6-9][0-9]{9}"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter your 10-digit Indian mobile number
              </p>
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
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
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
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
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
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

