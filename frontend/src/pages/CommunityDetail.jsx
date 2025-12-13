import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api.js';
import DarkModeToggle from '../components/DarkModeToggle';
import Testimonial3D from '../components/Testimonial3D';
import { 
  ArrowLeft,
  Users, 
  Calendar,
  MessageSquare,
  Star,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  Heart,
  ThumbsUp,
  Award,
  TrendingUp,
  Eye,
  Clock,
  Quote
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';
import axios from 'axios';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useContext(ToastContext);
  const [community, setCommunity] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newPost, setNewPost] = useState('');
  const [newTestimonial, setNewTestimonial] = useState({ content: '', rating: 5 });
  const [isJoining, setIsJoining] = useState(false);
  const [hostCommunities, setHostCommunities] = useState([]);

  // Function to close testimonials and return to overview
  const handleCloseTestimonials = () => {
    setActiveTab('overview');
  };

  // Handle escape key to close testimonials
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && activeTab === 'testimonials') {
        handleCloseTestimonials();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [activeTab]);

  useEffect(() => {
    fetchCommunityData();
  }, [id]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/communities/${id}`);
      
      if (response.data.community) {
        setCommunity(response.data.community);
        setEvents(response.data.events || []);
        
        // Fetch other communities by the same host
        if (response.data.community.host?._id) {
          fetchHostCommunities(response.data.community.host._id);
        }
      }
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHostCommunities = async (hostId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/communities/host/${hostId}`);
      if (response.data.communities) {
        // Filter out the current community
        const otherCommunities = response.data.communities.filter(c => c._id !== id);
        setHostCommunities(otherCommunities);
      }
    } catch (error) {
      console.error('Error fetching host communities:', error);
    }
  };

  const joinCommunity = async () => {
    if (!user) {
      toast.warning('Please log in to join communities');
      navigate('/login');
      return;
    }

    // Check if user is already a member before making the request
    if (isUserMember()) {
      toast.info('You are already a member of this community');
      return;
    }

    try {
      setIsJoining(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/communities/${id}/join`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      // Update the community state with the returned data
      if (response.data.community) {
        setCommunity(response.data.community);
      }
      
      toast.success('Successfully joined community!');
    } catch (error) {
      console.error('Error joining community:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already a member')) {
        // If user is already a member, refresh the community data
        fetchCommunityData();
        toast.info('You are already a member of this community');
      } else {
        toast.error(error.response?.data?.message || 'Error joining community');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const leaveCommunity = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/communities/${id}/leave`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      // Update the community state with the returned data
      if (response.data.community) {
        setCommunity(response.data.community);
      }
      
      toast.success('Successfully left community');
    } catch (error) {
      console.error('Error leaving community:', error);
      toast.error(error.response?.data?.message || 'Error leaving community');
    }
  };

  const submitForumPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/communities/${id}/forum`,
        { content: newPost },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setNewPost('');
      fetchCommunityData();
    } catch (error) {
      console.error('Error posting:', error);
      toast.error(error.response?.data?.message || 'Error posting message');
    }
  };

  const submitTestimonial = async (e) => {
    e.preventDefault();
    if (!newTestimonial.content.trim() || !user) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/communities/${id}/testimonials`,
        newTestimonial,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setNewTestimonial({ content: '', rating: 5 });
      fetchCommunityData();
      toast.success('Testimonial added successfully!');
    } catch (error) {
      console.error('Error adding testimonial:', error);
      toast.error(error.response?.data?.message || 'Error adding testimonial');
    }
  };

  const isUserMember = () => {
    if (!user || !community || !community.members) return false;
    
    const userId = user.id || user._id;
    console.log('Debug isUserMember:', {
      userId,
      user,
      communityMembers: community.members,
      memberIds: community.members.map(m => ({
        original: m.user,
        id: m.user?._id || m.user?.id || m.user
      }))
    });
    
    const isMember = community.members.some(member => {
      const memberId = member.user?._id || member.user?.id || member.user;
      return memberId === userId;
    });
    
    console.log('Is user member?', isMember);
    return isMember;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Community not found
          </h2>
          <button
            onClick={() => navigate('/communities')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 3D Testimonial View - Full Screen */}
      {activeTab === 'testimonials' && (
        <div className="fixed inset-0 z-50">
          {/* Exit Button */}
          <button
            onClick={() => setActiveTab('overview')}
            className="absolute top-6 left-6 z-60 p-3 bg-black/20 backdrop-blur-sm rounded-full text-white hover:bg-black/30 transition-all duration-300 flex items-center space-x-2 group"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:block">Back to Community</span>
          </button>

          {/* Dark Mode Toggle */}
          <div className="absolute top-6 right-6 z-60">
            <DarkModeToggle />
          </div>

          {/* 3D Testimonial Component */}
          <Testimonial3D 
            testimonials={community?.testimonials} 
            isVisible={activeTab === 'testimonials'}
            onClose={handleCloseTestimonials}
          />
        </div>
      )}

      {/* Regular Community Detail View */}
      {activeTab !== 'testimonials' && (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/communities')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Communities
              </button>
              {/* Dashboard link for hosts */}
              {user && community && user.id === community.host._id && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-blue-600 dark:text-blue-400"
                >
                  <Calendar className="h-5 w-5" />
                  Host Dashboard
                </button>
              )}
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </div>

      {/* Community Hero Section */}
      <div className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Community Image */}
            <div className="lg:w-1/3">
              <div className="relative h-64 lg:h-80 rounded-lg overflow-hidden">
                {community.coverImage ? (
                  <img
                    src={community.coverImage}
                    alt={community.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center text-6xl">
                    🌟
                  </div>
                )}
              </div>
            </div>

            {/* Community Info */}
            <div className="lg:w-2/3">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {community.name}
                  </h1>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                      {community.category}
                    </span>
                    {community.stats?.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {community.stats.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {user && user.id !== community.host._id && (
                  <button
                    onClick={isUserMember() ? leaveCommunity : joinCommunity}
                    disabled={isJoining}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      isUserMember()
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    {isJoining ? 'Joining...' : isUserMember() ? 'Leave Community' : 'Join Community'}
                  </button>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {community.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {community.stats?.totalMembers || community.members?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Members</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {community.stats?.totalEvents || events.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Events</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {community.forum?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {community.testimonials?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reviews</div>
                </div>
              </div>

              {/* Host and Location */}
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                    {community.host?.profilePicture ? (
                      <img
                        src={community.host.profilePicture}
                        alt={community.host.name}
                        className="w-12 h-12 object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        {community.host?.name?.charAt(0) || 'H'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-lg">
                      {community.host?.name}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      🏆 Community Host & Organizer
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Managing this community since {new Date(community.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                {community.location?.city && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {community.location.city}
                      {community.location.state && `, ${community.location.state}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {Object.values(community.socialLinks || {}).some(link => link) && (
                <div className="flex gap-4 mt-4">
                  {community.socialLinks?.website && (
                    <a
                      href={community.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                  {community.socialLinks?.instagram && (
                    <a
                      href={`https://instagram.com/${community.socialLinks.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {community.socialLinks?.facebook && (
                    <a
                      href={community.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: Eye },
              { id: 'events', name: 'Events', icon: Calendar },
              { id: 'forum', name: 'Forum', icon: MessageSquare },
              { id: 'testimonials', name: 'Testimonials', icon: Star }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-all relative group ${
                  activeTab === tab.id
                    ? tab.id === 'testimonials'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                } ${tab.id === 'testimonials' ? 'hover:scale-105' : ''}`}
              >
                {/* Special glow effect for testimonials tab */}
                {tab.id === 'testimonials' && activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg blur-sm"></div>
                )}
                <tab.icon className={`h-4 w-4 relative z-10 ${
                  tab.id === 'testimonials' && activeTab === tab.id ? 'animate-pulse' : ''
                }`} />
                <span className="relative z-10">{tab.name}</span>
                {/* 3D indicator for testimonials */}
                {tab.id === 'testimonials' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full opacity-80 group-hover:scale-110 transition-transform"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Guidelines */}
            {community.guidelines && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Community Guidelines
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {community.guidelines}
                </p>
              </div>
            )}

            {/* About the Host */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                About the Host
              </h3>
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {community.host?.profilePicture ? (
                    <img
                      src={community.host.profilePicture}
                      alt={community.host.name}
                      className="w-20 h-20 object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
                      {community.host?.name?.charAt(0) || 'H'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {community.host?.name}
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                      🏆 Community Host
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                      📅 Event Organizer
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <strong>Community Created:</strong> {formatDate(community.createdAt)}
                    </p>
                    <p>
                      <strong>Total Events Organized:</strong> {community.stats?.totalEvents || events.length}
                    </p>
                    <p>
                      <strong>Community Members:</strong> {community.stats?.totalMembers || community.members?.length || 0}
                    </p>
                    {community.host?.email && (
                      <p>
                        <strong>Contact:</strong> {community.host.email}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <strong>Host Responsibilities:</strong> {community.host?.name} manages this community, organizes events, moderates discussions, and ensures a welcoming environment for all members.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Communities by Host */}
            {hostCommunities.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Other Communities by {community.host?.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hostCommunities.slice(0, 6).map((hostCommunity) => (
                    <div
                      key={hostCommunity._id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/community/${hostCommunity._id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                          {hostCommunity.coverImage ? (
                            <img
                              src={hostCommunity.coverImage}
                              alt={hostCommunity.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            '🌟'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                            {hostCommunity.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {hostCommunity.shortDescription || hostCommunity.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                              {hostCommunity.category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {hostCommunity.stats?.totalMembers || hostCommunity.members?.length || 0} members
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {hostCommunities.length > 6 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => navigate(`/communities?host=${community.host._id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                    >
                      View all {hostCommunities.length} communities by {community.host?.name} →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {community.tags && community.tags.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Community Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {community.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Members */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Members
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {community.members?.slice(0, 8).map((member, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                      {member.user?.profilePicture ? (
                        <img
                          src={member.user.profilePicture}
                          alt={member.user.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                          {member.user?.name?.charAt(0) || 'M'}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.user?.name || 'Member'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(member.joinedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Community Events
              </h3>
              {user && user.id === community.host._id && (
                <button
                  onClick={() => navigate('/event/create')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Event
                </button>
              )}
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No events yet
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Stay tuned for upcoming community events!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/event/${event._id}`)}
                  >
                    <div className="relative h-32 bg-gray-200 dark:bg-gray-700">
                      {event.images && event.images.length > 0 ? (
                        <img
                          src={event.images[0]}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          📅
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        {event.venue || 'TBD'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'forum' && (
          <div className="space-y-6">
            {/* Post Form */}
            {isUserMember() && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Start a Discussion
                </h3>
                <form onSubmit={submitForumPost}>
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share your thoughts with the community..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {newPost.length}/1000 characters
                    </span>
                    <button
                      type="submit"
                      disabled={!newPost.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Post
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Forum Posts */}
            <div className="space-y-4">
              {community.forum && community.forum.length > 0 ? (
                community.forum.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {post.author?.profilePicture ? (
                          <img
                            src={post.author.profilePicture}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            {post.author?.name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {post.author?.name || 'Anonymous'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-line">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <ThumbsUp className="h-4 w-4" />
                            {post.likes?.length || 0}
                          </button>
                          <button className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <MessageSquare className="h-4 w-4" />
                            {post.replies?.length || 0} replies
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No discussions yet
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isUserMember() 
                      ? 'Be the first to start a conversation!'
                      : 'Join the community to start participating in discussions.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Testimonial Form */}
            {isUserMember() && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Share Your Experience
                </h3>
                <form onSubmit={submitTestimonial} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rating
                    </label>
                    <div className="flex gap-2 sm:gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewTestimonial(prev => ({ ...prev, rating: star }))}
                          className={`w-10 h-10 sm:w-8 sm:h-8 min-h-[44px] sm:min-h-0 touch-manipulation ${
                            star <= newTestimonial.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          } transition-colors`}
                        >
                          <Star className="w-full h-full" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={newTestimonial.content}
                    onChange={(e) => setNewTestimonial(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your experience with this community..."
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {newTestimonial.content.length}/500 characters
                    </span>
                    <button
                      type="submit"
                      disabled={!newTestimonial.content.trim()}
                      className="w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] sm:min-h-0 touch-manipulation"
                    >
                      <Star className="h-4 w-4" />
                      Submit Review
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Testimonials List */}
            <div className="space-y-4">
              {community.testimonials && community.testimonials.length > 0 ? (
                community.testimonials.map((testimonial) => (
                  <div
                    key={testimonial._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {testimonial.author?.profilePicture ? (
                          <img
                            src={testimonial.author.profilePicture}
                            alt={testimonial.author.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-400">
                            {testimonial.author?.name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                              {testimonial.author?.name || 'Anonymous'}
                            </h4>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                    i < testimonial.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatDate(testimonial.createdAt)}
                          </span>
                        </div>
                        <blockquote className="text-gray-700 dark:text-gray-300 italic text-sm sm:text-base break-words">
                          <Quote className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 text-gray-400" />
                          {testimonial.content}
                        </blockquote>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Star className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2 px-4">
                    No testimonials yet
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4">
                    {isUserMember() 
                      ? 'Be the first to share your experience!'
                      : 'Join the community to leave a testimonial.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
        </div>
      )}
    </>
  );
};

export default CommunityDetail;