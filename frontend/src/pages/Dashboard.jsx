import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Plus, Clock, Settings, LogOut, Search, Globe, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DarkModeToggle from '../components/DarkModeToggle'
import RecommendationsSection from '../components/RecommendationsSection'
import axios from 'axios'
import API_BASE_URL from '../config/api.js'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, isCommunityMember } = useAuth()
  const [communities, setCommunities] = useState([])
  const [loadingCommunities, setLoadingCommunities] = useState(true)
  const [registeredEvents, setRegisteredEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (user && isCommunityMember) {
      fetchUserCommunities()
    }
    if (user) {
      fetchUserRegisteredEvents()
    }
  }, [user, isCommunityMember])

  const fetchUserCommunities = async () => {
    try {
      setLoadingCommunities(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${API_BASE_URL}/api/communities/host/${user._id || user.id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      if (response.data.communities) {
        setCommunities(response.data.communities)
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setLoadingCommunities(false)
    }
  }

  const fetchUserRegisteredEvents = async () => {
    try {
      setLoadingEvents(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${API_BASE_URL}/api/users/registered-events`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      if (response.data.events) {
        setRegisteredEvents(response.data.events)
      }
    } catch (error) {
      console.error('Error fetching registered events:', error)
      setRegisteredEvents([]) // Set empty array on error
    } finally {
      setLoadingEvents(false)
    }
  }

  const [recommendedEvents] = useState([
    {
      id: 4,
      title: 'Cooking Class: Italian Cuisine',
      date: '2025-11-05',
      time: '6:00 PM',
      location: 'Culinary Institute',
      category: 'Sip & Savor',
      participants: 6,
      maxParticipants: 12,
      price: 45
    },
    {
      id: 5,
      title: 'Pottery Making Session',
      date: '2025-11-07',
      time: '10:00 AM',
      location: 'Clay Studio',
      category: 'Art & DIY',
      participants: 4,
      maxParticipants: 10,
      price: 35
    }
  ])

  const [hostedEvents, setHostedEvents] = useState([])
  const [loadingHostedEvents, setLoadingHostedEvents] = useState(false)

  // Fetch hosted events for community members
  useEffect(() => {
    if (isAuthenticated && isCommunityMember) {
      fetchHostedEvents()
    }
  }, [isAuthenticated, isCommunityMember])

  const fetchHostedEvents = async () => {
    setLoadingHostedEvents(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/api/events/my-hosted`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setHostedEvents(response.data.events || [])
    } catch (error) {
      console.error('Error fetching hosted events:', error)
    } finally {
      setLoadingHostedEvents(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">IndulgeOut</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">Welcome, {user?.name}</span>
              <DarkModeToggle />
              {user?.role !== 'community_member' && (
                <Link 
                  to="/analytics" 
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center space-x-1"
                  title="Analytics"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">Analytics</span>
                </Link>
              )}
              <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <Settings className="h-5 w-5" />
              </button>
              <button 
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isCommunityMember ? 'Host Dashboard' : 'Your Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isCommunityMember 
              ? 'Manage your events and connect with your community'
              : 'Discover events that match your interests and connect with like-minded people'
            }
          </p>
        </div>

        {/* Navigation Tabs for Hosts */}
        {isCommunityMember && (
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8">
                <Link
                  to="/dashboard"
                  className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 whitespace-nowrap text-sm font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Event Dashboard
                  </div>
                </Link>
                <Link
                  to="/communities"
                  className="py-2 px-1 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 whitespace-nowrap text-sm font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Community Hub
                  </div>
                </Link>
              </nav>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 gap-6 mb-8 ${isCommunityMember ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
          {isCommunityMember ? (
            <>
              <Link
                to="/create-event"
                className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center transition-colors"
              >
                <Plus className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">Create New Event</h3>
                <p className="text-sm text-blue-100">Host an amazing experience</p>
              </Link>
              <Link
                to="/community/create"
                className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg text-center transition-colors"
              >
                <Globe className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">Create Community</h3>
                <p className="text-sm text-purple-100">Build your tribe</p>
              </Link>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Total Attendees</h3>
                <p className="text-2xl font-bold text-blue-600">248</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Calendar className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Events Hosted</h3>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/events"
                className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center transition-colors"
              >
                <Search className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">Discover Events</h3>
                <p className="text-sm text-blue-100">Find events you'll love</p>
              </Link>
              <Link
                to="/communities"
                className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg text-center transition-colors"
              >
                <Globe className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">Browse Communities</h3>
                <p className="text-sm text-purple-100">Join like-minded groups</p>
              </Link>
              <Link
                to="/interests"
                className="bg-white hover:bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 text-center transition-colors"
              >
                <Settings className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Update Interests</h3>
                <p className="text-sm text-gray-500">Customize your experience</p>
              </Link>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <Calendar className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
                <p className="text-2xl font-bold text-green-600">3</p>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Upcoming Events */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.role === 'community_member' ? 'Your Upcoming Events' : 'Your Registered Events'}
                </h2>
              </div>
              <div className="p-6">
                {loadingEvents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading events...</p>
                  </div>
                ) : registeredEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No registered events</p>
                    <Link
                      to="/events"
                      className="text-blue-500 hover:text-blue-600 text-sm mt-2 inline-block"
                    >
                      Discover Events →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registeredEvents.map((event) => (
                      <Link 
                        key={event._id} 
                        to={`/event/${event._id}`}
                        className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <img 
                          src={event.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=100&h=100&fit=crop'} 
                          alt={event.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {event.time || 'TBA'}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location?.city || event.location || 'Location TBA'}
                            </span>
                          </div>
                          <div className="flex items-center mt-2">
                            <span className="text-sm text-gray-500">
                              {event.currentParticipants || 0}/{event.maxParticipants || 0} participants
                            </span>
                            {event.maxParticipants > 0 && (
                              <div className="ml-2 w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${((event.currentParticipants || 0) / event.maxParticipants) * 100}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hosted Events (Community Members Only) */}
            {isCommunityMember && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Your Hosted Events</h2>
                  <Link
                    to="/create-event"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Event
                  </Link>
                </div>
                <div className="p-6">
                  {loadingHostedEvents ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading your events...</p>
                    </div>
                  ) : hostedEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">You haven't created any events yet</p>
                      <Link
                        to="/create-event"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Create Your First Event
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hostedEvents.map((event) => (
                        <div key={event._id} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(event.date)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {event.time}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {event.location?.city || 'Location TBD'}
                              </span>
                            </div>
                            <div className="flex items-center mt-2">
                              <span className="text-sm text-gray-500">
                                {event.currentParticipants || 0}/{event.maxParticipants} participants
                              </span>
                              <div className="ml-2 w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary-600 h-2 rounded-full" 
                                  style={{ width: `${((event.currentParticipants || 0) / event.maxParticipants) * 100}%` }}
                                ></div>
                              </div>
                              <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                                event.status === 'published' ? 'bg-green-100 text-green-800' :
                                event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {event.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Your Communities (Community Members Only) */}
            {isCommunityMember && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Communities</h2>
                  <Link
                    to="/community/create"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Community
                  </Link>
                </div>
                <div className="p-6">
                  {loadingCommunities ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">Loading communities...</p>
                    </div>
                  ) : communities.length === 0 ? (
                    <div className="text-center py-8">
                      <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't created any communities yet</p>
                      <Link
                        to="/community/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Create Your First Community
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {communities.map((community) => (
                        <div
                          key={community._id}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/community/${community._id}`)}
                        >
                          {community.coverImage ? (
                            <img
                              src={community.coverImage}
                              alt={community.name}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg mb-3 flex items-center justify-center">
                              <Globe className="h-8 w-8 text-purple-600" />
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                            {community.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {community.shortDescription || community.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                              {community.category}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Users className="h-3 w-3" />
                              {community.stats?.totalMembers || community.members?.length || 0}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* User Interests */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Your Interests</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {user?.interests && Array.isArray(user.interests) ? user.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  )) : (
                    <p className="text-gray-500 text-sm">No interests selected yet</p>
                  )}
                </div>
                <Link
                  to="/interests"
                  className="text-primary-600 hover:text-primary-700 text-sm mt-3 inline-block"
                >
                  Update interests →
                </Link>
              </div>
            </div>

            {/* AI-Powered Recommendations */}
            {user?.role !== 'community_member' && (
              <RecommendationsSection />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard