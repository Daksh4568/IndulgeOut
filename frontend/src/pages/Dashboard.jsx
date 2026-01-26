import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, isCommunityOrganizer, isVenue, isBrandSponsor } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }

    // Redirect to appropriate dashboard based on user type
    if (isCommunityOrganizer) {
      navigate('/organizer/dashboard', { replace: true })
    } else if (isVenue) {
      navigate('/venue/dashboard', { replace: true })
    } else if (isBrandSponsor) {
      navigate('/brand/dashboard', { replace: true })
    } else {
      // Regular users - redirect to user dashboard
      navigate('/user/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate, isCommunityOrganizer, isVenue, isBrandSponsor])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}

export default Dashboard

