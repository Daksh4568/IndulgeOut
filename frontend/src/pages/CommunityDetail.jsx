import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api.js';
import NavigationBar from '../components/NavigationBar';
import LoginPromptModal from '../components/LoginPromptModal';
import Footer from '../components/Footer';
import { 
  Users, 
  Calendar,
  MessageSquare,
  Star,
  MapPin,
  Globe,
  Instagram,
  Send,
  Clock,
  Quote,
  PartyPopper
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContext } from '../App';

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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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
      const response = await api.get(`/communities/${id}`);
      
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
      const response = await api.get(`/communities/host/${hostId}`);
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
      setShowLoginPrompt(true);
      return;
    }

    // Check if user is already a member before making the request
    if (isUserMember()) {
      toast.info('You are already a member of this community');
      return;
    }

    try {
      setIsJoining(true);
      const response = await api.post(`/communities/${id}/join`, {});
      
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
      const response = await api.post(`/communities/${id}/leave`, {});
      
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
      await api.post(`/communities/${id}/forum`, { content: newPost });
      
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
      await api.post(`/communities/${id}/testimonials`, newTestimonial);
      
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
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Community not found
          </h2>
          <button
            onClick={() => navigate(-1)}
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
      <div className="min-h-screen bg-black">
        <NavigationBar />
        
        {/* Community Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Community Image */}
            <div className="relative w-full lg:w-[200px] h-[200px] rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}>
              {community.coverImage ? (
                <img
                  src={community.coverImage}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  🌟
                </div>
              )}
            </div>

            {/* Community Info */}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {community.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1.5 rounded-md text-sm font-medium text-[#8B8BCC] bg-[#2A2A4A] border border-[#3A3A5A]" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                  {community.category}
                </span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400 text-sm" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                    {community.location?.city || 'Bangalore'}
                  </span>
                </div>
                {community.stats?.averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white text-sm font-medium">
                      {community.stats.averageRating.toFixed(1)} ({community.testimonials?.length || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Social Links - Always visible */}
              <div className="flex gap-3 mb-4">
                <a 
                  href={community.socialLinks?.instagram ? `https://instagram.com/${community.socialLinks.instagram}` : '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                  onClick={(e) => !community.socialLinks?.instagram && e.preventDefault()}
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a 
                  href={community.socialLinks?.website || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                  onClick={(e) => !community.socialLinks?.website && e.preventDefault()}
                >
                  <Globe className="h-4 w-4" />
                </a>
                <a 
                  href={community.socialLinks?.twitter ? `https://twitter.com/${community.socialLinks.twitter}` : '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                  onClick={(e) => !community.socialLinks?.twitter && e.preventDefault()}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>

            </div>

            {/* Join Button - Positioned on the right */}
            <div className="flex-shrink-0">
              {(!user || (user && user.id !== community.host?._id)) && (
                <button
                  onClick={isUserMember() ? leaveCommunity : joinCommunity}
                  disabled={isJoining}
                  className="px-6 py-2.5 rounded-md font-semibold text-sm transform hover:scale-105 transition-all"
                  style={{ 
                    background: isUserMember() ? 'transparent' : 'transparent',
                    border: isUserMember() ? '1px solid #DC2626' : '1px solid #FFFFFF',
                    color: isUserMember() ? '#DC2626' : '#FFFFFF',
                    fontFamily: 'Source Serif Pro, serif'
                  }}
                >
                  {isJoining ? 'Processing...' : isUserMember() ? 'Leave Community' : 'Join Community'}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 mt-8 mb-6 overflow-x-auto border-b border-gray-800">
            {[
              { id: 'overview', label: 'Overview', icon: Users },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'forum', label: 'Forum', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition-all whitespace-nowrap relative flex items-center gap-2 ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
                style={{ fontFamily: 'Source Serif Pro, serif' }}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* About the Community */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  About the Community
                </h2>
                <div className="bg-zinc-900/50 rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 leading-relaxed" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                    {community.description}
                  </p>
                </div>
              </div>

              {/* Community Guide */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  Community Guide
                </h2>
                <div className="bg-zinc-900/50 rounded-lg p-6 border border-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Category */}
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gray-800">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                        Category
                      </div>
                      <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        {community.category}
                      </div>
                    </div>

                    {/* Who is it for */}
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gray-800">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                        Who is it for
                      </div>
                      <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        Everyone
                      </div>
                    </div>

                    {/* What you'll find here */}
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gray-800">
                        <PartyPopper className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                        What you'll find here
                      </div>
                      <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        Ice-breaker events <br />& group activities
                      </div>
                    </div>

                    {/* Age Restriction */}
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gray-800">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                        Age Restriction
                      </div>
                      <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        18 yrs & above
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    Highlights
                  </h2>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
                      ←
                    </button>
                    <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
                      →
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Large image on left */}
                  <div className="row-span-2">
                    <div className="aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden">
                      <img 
                        src="/images/Media (10).jpg"
                        alt="Community Highlight"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Two smaller images on right */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                      <img 
                        src="/images/Media (11).jpg"
                        alt="Community Highlight"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                      <img 
                        src="/images/Media (12).jpg"
                        alt="Community Highlight"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1">
                    <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      <img 
                        src="/images/Media (13).jpg"
                        alt="Community Highlight"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Oswald, sans-serif' }}>
                Upcoming Events
              </h2>
              <p className="text-gray-400 mb-6" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                Experiences trending around you.
              </p>

              {events.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 rounded-lg border border-gray-800">
                  <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    No events yet
                  </h4>
                  <p className="text-gray-400" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                    Stay tuned for upcoming community events!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {events.map((event) => (
                    <div
                      key={event._id}
                      className="bg-zinc-900/50 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all cursor-pointer"
                      onClick={() => navigate(`/event/${event._id}`)}
                    >
                      <div className="relative h-48 bg-gray-800">
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
                        <h3 className="font-bold text-white mb-2 line-clamp-2 text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{event.venue || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                            ₹{event.ticketPrice || 0} onwards
                          </span>
                          <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-xs">
                            {event.registrations?.length || 0} attending
                          </span>
                        </div>
                        <button 
                          className="w-full mt-3 px-4 py-2 rounded-md text-white font-bold text-xs uppercase"
                          style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Oswald, sans-serif' }}>
                Reviews
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Rating Summary */}
                <div className="bg-zinc-900/50 rounded-lg p-6 border border-gray-800 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold mb-2" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Oswald, sans-serif' }}>
                    {community.stats?.averageRating?.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-5 w-5 ${star <= (community.stats?.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />
                    ))}
                  </div>
                  <div className="text-gray-400 text-sm" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                    Based on {community.testimonials?.length || 0} reviews
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="lg:col-span-2 bg-zinc-900/50 rounded-lg p-6 border border-gray-800">
                  <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    Rating Breakdown:
                  </h3>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = community.testimonials?.filter(t => t.rating === stars).length || 0;
                    const percentage = community.testimonials?.length ? (count / community.testimonials.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1 w-16">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-white text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{stars}</span>
                        </div>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ width: `${percentage}%`, background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
                          ></div>
                        </div>
                        <span className="text-gray-400 text-sm w-12 text-right" style={{ fontFamily: 'Source Serif Pro, serif' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Form */}
              {isUserMember() && (
                <div className="bg-zinc-900/50 rounded-lg p-6 border border-gray-800 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    Write a Review
                  </h3>
                  <form onSubmit={submitTestimonial} className="space-y-4">
                    <div>
                      <div className="flex gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewTestimonial(prev => ({ ...prev, rating: star }))}
                            className="transition-colors"
                          >
                            <Star className={`h-6 w-6 ${star <= newTestimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={newTestimonial.content}
                      onChange={(e) => setNewTestimonial(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Share your experience with this community..."
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white resize-none focus:outline-none focus:border-gray-600"
                      rows={4}
                      maxLength={500}
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                        {newTestimonial.content.length}/500
                      </span>
                      <button
                        type="submit"
                        disabled={!newTestimonial.content.trim()}
                        className="px-6 py-2 rounded-md text-white font-bold text-sm uppercase disabled:opacity-50"
                        style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                      >
                        Submit Review
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Recent Reviews */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  Recent Reviews
                </h3>
                <div className="space-y-4">
                  {community.testimonials && community.testimonials.length > 0 ? (
                    community.testimonials.slice(0, 10).map((testimonial) => (
                      <div key={testimonial._id} className="bg-zinc-900/50 rounded-lg p-6 border border-gray-800">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            {testimonial.author?.profilePicture ? (
                              <img src={testimonial.author.profilePicture} alt={testimonial.author.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <span className="text-lg font-bold text-gray-400">
                                {testimonial.author?.name?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                  {testimonial.author?.name || 'Anonymous'}
                                </h4>
                                <div className="flex gap-1 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`h-3 w-3 ${star <= testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-gray-500" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                {formatDate(testimonial.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                              {testimonial.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-zinc-900/50 rounded-lg border border-gray-800">
                      <Star className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        No reviews yet
                      </h4>
                      <p className="text-gray-400" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                        Be the first to share your experience!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'forum' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Oswald, sans-serif' }}>
                Forum
              </h2>

              {/* Post Form */}
              {isUserMember() && (
                <div className="bg-zinc-900/50 rounded-lg p-6 border border-gray-800 mb-6">
                  <form onSubmit={submitForumPost}>
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Start a discussion..."
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white resize-none focus:outline-none focus:border-gray-600"
                      rows={4}
                      maxLength={1000}
                      style={{ fontFamily: 'Source Serif Pro, serif' }}
                    />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                        {newPost.length}/1000
                      </span>
                      <button
                        type="submit"
                        disabled={!newPost.trim()}
                        className="px-6 py-2 rounded-md text-white font-bold text-sm uppercase disabled:opacity-50 flex items-center gap-2"
                        style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                      >
                        <Send className="h-4 w-4" />
                        Post
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Discussion List - Left sidebar with topics, Right main content area */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Discussion Topics */}
                <div className="lg:col-span-1 bg-zinc-900/50 rounded-lg p-4 border border-gray-800">
                  <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    Discussions
                  </h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 rounded-md text-white text-sm" style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Source Serif Pro, serif' }}>
                      Weekend Mock Strategy
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-md text-gray-400 hover:bg-gray-800 text-sm" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      New Members Welcome
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-md text-gray-400 hover:bg-gray-800 text-sm" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      Training Schedule
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-md text-gray-400 hover:bg-gray-800 text-sm" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                      Equipment Discussion
                    </button>
                  </div>
                  <button 
                    className="w-full mt-4 px-4 py-2 rounded-md text-white font-bold text-sm uppercase"
                    style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)', fontFamily: 'Oswald, sans-serif' }}
                  >
                    New Thread
                  </button>
                </div>

                {/* Main Content - Forum Posts */}
                <div className="lg:col-span-3 space-y-4">
                  {community.forum && community.forum.length > 0 ? (
                    community.forum.map((post) => (
                      <div key={post._id} className="bg-zinc-900/50 rounded-lg p-6 border border-gray-800">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            {post.author?.profilePicture ? (
                              <img src={post.author.profilePicture} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-gray-400">
                                {post.author?.name?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-white text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                {post.author?.name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-500" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                                {formatRelativeTime(post.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-3 whitespace-pre-line" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                              {post.content}
                            </p>
                            <div className="flex items-center gap-4">
                              <button className="flex items-center gap-1 text-gray-500 hover:text-white text-xs transition-colors">
                                <MessageSquare className="h-3 w-3" />
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-zinc-900/50 rounded-lg border border-gray-800">
                      <MessageSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        No discussions yet
                      </h4>
                      <p className="text-gray-400" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                        Be the first to start a conversation!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        eventTitle={community?.name}
      />

      {/* Footer */}
      <Footer />
    </>
  );
};

export default CommunityDetail;
