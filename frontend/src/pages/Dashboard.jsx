import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Plus, Clock, Settings, LogOut, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, isCommunityMember } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const [upcomingEvents] = useState([
    {
      id: 1,
      title: 'Wine Tasting Evening',
      date: '2025-10-28',
      time: '7:00 PM',
      location: 'Downtown Wine Bar',
      category: 'Sip & Savor',
      participants: 12,
      maxParticipants: 20,
      image: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=300&h=200&fit=crop'
    },
    {
      id: 2,
      title: 'Painting Workshop',
      date: '2025-10-30',
      time: '2:00 PM',
      location: 'Art Studio Downtown',
      category: 'Art & DIY',
      participants: 8,
      maxParticipants: 15,
      image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=300&h=200&fit=crop'
    },
    {
      id: 3,
      title: 'Networking Mixer',
      date: '2025-11-02',
      time: '6:30 PM',
      location: 'Business Center',
      category: 'Social Mixers',
      participants: 25,
      maxParticipants: 50,
      image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=300&h=200&fit=crop'
    }
  ])

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
      const response = await axios.get('http://localhost:5000/api/events/my-hosted', {
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">IndulgeOut</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button className="text-gray-500 hover:text-gray-700">
                <Settings className="h-5 w-5" />
              </button>
              <button 
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="text-gray-500 hover:text-gray-700"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isCommunityMember ? 'Host Dashboard' : 'Your Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isCommunityMember 
              ? 'Manage your events and connect with your community'
              : 'Discover events that match your interests and connect with like-minded people'
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Total Attendees</h3>
                <p className="text-2xl font-bold text-blue-600">248</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <Calendar className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Events Hosted</h3>
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
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg">
                        <img 
                          src={event.image} 
                          alt={event.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {event.date}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {event.time}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location}
                            </span>
                          </div>
                          <div className="flex items-center mt-2">
                            <span className="text-sm text-gray-500">
                              {event.participants}/{event.maxParticipants} participants
                            </span>
                            <div className="ml-2 w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full" 
                                style={{ width: `${(event.participants / event.maxParticipants) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
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

            {/* Recommended Events */}
            {user?.role !== 'community_member' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recommendedEvents.map((event) => (
                      <div key={event.id} className="p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <div className="text-sm text-gray-500 mt-1">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {event.date} at {event.time}
                          </div>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </div>
                          {event.price && (
                            <div className="mt-1 text-primary-600 font-medium">
                              ${event.price}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/events"
                    className="text-primary-600 hover:text-primary-700 text-sm mt-4 inline-block"
                  >
                    View all events →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard