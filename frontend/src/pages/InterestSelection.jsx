import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ToastContext } from '../App'
import DarkModeToggle from '../components/DarkModeToggle'

const InterestSelection = () => {
  const navigate = useNavigate()
  const { updateUserInterests, user, isCommunityMember } = useAuth()
  const toast = useContext(ToastContext)
  const [selectedInterests, setSelectedInterests] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const interests = [
    {
      id: 'social-mixers',
      name: 'Social Mixers',
      description: 'Networking, meetups, social events',
      image: '/images/social-mixers.jpg'
    },
    {
      id: 'wellness-fitness-sports',
      name: 'Wellness, Fitness & Sports',
      description: 'Sports, fitness, wellness activities',
      image: '/images/wellness-fitness-sports.jpg'
    },
    {
      id: 'art-music-dance',
      name: 'Art, Music & Dance',
      description: 'Creative workshops, music, dance performances',
      image: '/images/art-music-dance.jpg'
    },
    {
      id: 'immersive',
      name: 'Immersive',
      description: 'Immersive experiences and interactive events',
      image: '/images/immersive.jpg'
    },
    {
      id: 'food-beverage',
      name: 'Food & Beverage',
      description: 'Food tastings, cooking classes, culinary events',
      image: '/images/food-beverage.jpg'
    },
    {
      id: 'games',
      name: 'Games',
      description: 'Board games, gaming tournaments, game nights',
      image: '/images/games.jpg'
    }
  ]

  const handleInterestToggle = (interestId) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId)
      } else {
        return [...prev, interestId]
      }
    })
  }

  const handleSubmit = async () => {
    if (selectedInterests.length === 0) {
      toast.warning('Please select at least one interest')
      return
    }

    setIsLoading(true)
    try {
      // Convert selected interest IDs to proper names that match the backend enum
      const interestNames = selectedInterests.map(id => {
        const interest = interests.find(interest => interest.id === id)
        return interest ? interest.name : id
      })
      
      const result = await updateUserInterests(interestNames)
      
      if (result.success) {
        // Navigate based on user role
        if (isCommunityMember) {
          // Community members (hosts) go to dashboard where they can create/manage events
          navigate('/dashboard')
        } else {
          // Regular users go to explore page to discover events
          navigate('/explore')
        }
      } else {
        toast.error('Failed to update interests. Please try again.')
      }
    } catch (error) {
      console.error('Failed to update interests:', error)
      toast.error('Failed to update interests. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-black shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24">
            <img src="/images/LogoFinal2.jpg" alt="IndulgeOut" className="h-16 sm:h-20 w-auto" />
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Step 2 of 2
              </div>
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            What are you interested in?
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {isCommunityMember 
              ? 'Select your interests to help create relevant events and connect with like-minded community members. You can always update these later.'
              : 'Select your interests to discover events and communities that match your passions. You can always update these later.'
            }
          </p>
        </div>

        {/* Interest Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {interests.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id)
            return (
              <div
                key={interest.id}
                onClick={() => handleInterestToggle(interest.id)}
                className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  isSelected 
                    ? 'ring-4 ring-primary-500 shadow-xl' 
                    : 'shadow-lg hover:shadow-xl'
                }`}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 z-10 bg-primary-500 rounded-full p-2">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Card Content */}
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={interest.image} 
                    alt={interest.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay for better text readability */}
                  <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {interest.name}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {interest.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected count and action */}
        <div className="text-center">
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {selectedInterests.length === 0 
                ? 'No interests selected yet'
                : `${selectedInterests.length} interest${selectedInterests.length === 1 ? '' : 's'} selected`
              }
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={selectedInterests.length === 0 || isLoading}
            className="disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 hover:opacity-90 flex items-center mx-auto"
            style={{ background: selectedInterests.length === 0 || isLoading ? '#d1d5db' : 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center">
                {isCommunityMember ? 'Continue to Dashboard' : 'Continue to Explore'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            )}
          </button>

          <button
            onClick={() => navigate(isCommunityMember ? '/dashboard' : '/explore')}
            className="mt-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}

export default InterestSelection
