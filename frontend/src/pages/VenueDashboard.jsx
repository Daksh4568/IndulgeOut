import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Briefcase,
  Image,
  FileText,
  Settings,
  Grid,
  Bell,
  BarChart3,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
  Sparkles,
  Eye,
  Copy,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import NavigationBar from "../components/NavigationBar";
import { api } from "../config/api";

const VenueDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState("all");
  const [activeCollabTab, setActiveCollabTab] = useState('all');
  const [collabCarouselIndex, setCollabCarouselIndex] = useState(0);
  const [collaborations, setCollaborations] = useState({ all: [], upcoming: [], live: [], completed: [] });

  useEffect(() => {
    if (authLoading) return;

    if (
      !user ||
      user.role !== "host_partner" ||
      user.hostPartnerType !== "venue"
    ) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, sentCollabsRes, receivedCollabsRes] = await Promise.all([
        api.get("/venues/dashboard"),
        api.get("/collaborations/sent"),
        api.get("/collaborations/received")
      ]);
      setDashboardData(dashboardRes.data);
      setError(null);

      // Organize collaborations by status
      const allCollabs = [...(sentCollabsRes.data.data || []), ...(receivedCollabsRes.data.data || [])];
      const upcoming = allCollabs.filter(c => ['submitted', 'admin_approved', 'pending', 'vendor_accepted', 'accepted'].includes(c.status));
      const liveCollabs = allCollabs.filter(c => ['confirmed', 'approved_delivered'].includes(c.status));
      const completed = allCollabs.filter(c => ['completed'].includes(c.status));

      setCollaborations({ all: allCollabs, upcoming, live: liveCollabs, completed });
    } catch (err) {
      console.error("Error fetching venue dashboard:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionType, itemId) => {
    switch (actionType) {
      case "missing_kyc":
      case "complete_kyc":
      case "kyc_required":
      case "kyc_pending":
        navigate("/kyc-setup");
        break;
      case "collaboration_request":
        navigate(`/organizer/collaborations?id=${itemId}`);
        break;
      case "profile_incomplete":
      case "profile_incomplete_venue":
        navigate("/profile");
        break;
      case "missing_photos":
        navigate("/profile?section=photos");
        break;
      case "pending_confirmation":
        navigate(`/organizer/collaborations?id=${itemId}`);
        break;
      default:
        break;
    }
  };

  // ==================== MANAGE COLLABORATIONS SECTION ====================
  const ManageCollaborationsSection = () => {
    const currentCollabs = collaborations[activeCollabTab] || [];
    const cardsPerView = 4;
    const maxIndex = Math.max(0, Math.ceil(currentCollabs.length / cardsPerView) - 1);

    const handlePrevious = () => {
      setCollabCarouselIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
      setCollabCarouselIndex(prev => Math.min(maxIndex, prev + 1));
    };

    const getStatusBadge = (status) => {
      const badges = {
        submitted: { text: 'Submitted', bg: 'bg-yellow-600' },
        admin_approved: { text: 'Approved', bg: 'bg-blue-600' },
        vendor_accepted: { text: 'Accepted', bg: 'bg-green-600' },
        accepted: { text: 'Accepted', bg: 'bg-green-600' },
        confirmed: { text: 'Live', bg: 'bg-green-600' },
        approved_delivered: { text: 'Live', bg: 'bg-green-600' },
        completed: { text: 'Completed', bg: 'bg-gray-600' },
        rejected: { text: 'Rejected', bg: 'bg-red-600' },
        vendor_rejected: { text: 'Rejected', bg: 'bg-red-600' },
        cancelled: { text: 'Cancelled', bg: 'bg-gray-600' },
        pending: { text: 'Pending', bg: 'bg-yellow-600' }
      };
      return badges[status] || { text: status, bg: 'bg-gray-600' };
    };

    const getCollaborationType = (collab) => {
      if (collab.requestDetails?.venueRequest) return { text: 'Venue', color: 'bg-purple-600' };
      if (collab.requestDetails?.brandSponsorship) {
        const types = collab.requestDetails.brandSponsorship.sponsorshipType || [];
        if (types.includes('product_sampling')) return { text: 'Sampling', color: 'bg-green-600' };
        if (types.includes('paid_monetary')) return { text: 'Sponsorship', color: 'bg-blue-600' };
        return { text: 'Brand', color: 'bg-blue-600' };
      }
      return { text: 'Partnership', color: 'bg-indigo-600' };
    };

    const getPartnerInfo = (collab) => {
      const currentUserId = user?.userId || user?._id;
      const isInitiator = collab.initiator?.user?.toString() === currentUserId?.toString() || 
                          collab.proposerId?.toString() === currentUserId?.toString();
      
      if (isInitiator) {
        return {
          name: collab.recipient?.name || 'Partner',
          location: collab.requestDetails?.venueRequest?.specialRequirements || 'Location N/A',
          type: collab.recipient?.userType || collab.recipientType || 'Partner'
        };
      } else {
        return {
          name: collab.initiator?.name || 'Partner',
          location: collab.initiator?.name || 'Location N/A',
          type: collab.initiator?.userType || collab.proposerType || 'Partner'
        };
      }
    };

    return (
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 pb-2 sm:pb-0">
              {[
                { key: 'all', label: 'All' },
                { key: 'upcoming', label: `Upcoming (${collaborations.upcoming?.length || 0})` },
                { key: 'live', label: `Live (${collaborations.live?.length || 0})` },
                { key: 'completed', label: `Completed (${collaborations.completed?.length || 0})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCollabTab(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeCollabTab === tab.key
                      ? 'bg-white dark:bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {currentCollabs.length > cardsPerView && (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={handlePrevious}
                  disabled={collabCarouselIndex === 0}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-400" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={collabCarouselIndex === maxIndex}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {currentCollabs.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
            <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No {activeCollabTab} collaborations
            </h3>
            <p className="text-gray-400 mb-4">
              {activeCollabTab === 'upcoming' 
                ? 'No upcoming collaborations at the moment'
                : activeCollabTab === 'live'
                ? 'No active collaborations'
                : activeCollabTab === 'completed'
                ? 'No completed collaborations to show'
                : 'No collaborations yet'}
            </p>
          </div>
        ) : (
          <div className="relative">
            <div 
              className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {currentCollabs.map((collab) => {
                const statusBadge = getStatusBadge(collab.status);
                const collabType = getCollaborationType(collab);
                const partner = getPartnerInfo(collab);

                return (
                  <div
                    key={collab._id}
                    className="w-[calc(100vw-3rem)] flex-shrink-0 snap-center bg-zinc-900 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col"
                  >
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 
                          className="font-bold text-white text-lg flex-1 line-clamp-2"
                          style={{ fontFamily: 'Oswald, sans-serif' }}
                        >
                          {collab.requestDetails?.eventName || 'Collaboration Request'}
                        </h3>
                        <span className={`${statusBadge.bg} text-white px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0`}>
                          {statusBadge.text}
                        </span>
                      </div>

                      <div className="text-sm text-gray-400 mb-3">
                        {partner.name}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                          <Building2 className="h-4 w-4 mr-2" />
                          <span>{partner.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Music & Social</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Collaboration Type</span>
                          <span className={`${collabType.color} text-white px-2 py-1 rounded text-xs font-medium`}>
                            {collabType.text}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                          <span className="text-sm text-gray-400">Event Date</span>
                          <span className="text-sm text-white font-medium">
                            {collab.requestDetails?.eventDate 
                              ? new Date(collab.requestDetails.eventDate).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })
                              : 'Date TBD'}
                          </span>
                        </div>

                        {collab.requestDetails?.venueRequest?.expectedAttendees && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Est. Attendees</span>
                            <span className="text-sm text-white font-medium">
                              {collab.requestDetails.venueRequest.expectedAttendees}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-gray-800 mt-auto">
                        <button
                          onClick={() => navigate(`/collaborations/${collab._id}`)}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </button>

                        <button
                          onClick={() => navigate(`/collaborations/${collab._id}/contact`)}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                        >
                          <Users className="h-4 w-4" />
                          <span>Contact</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(-${collabCarouselIndex * 100}%)`
                }}
              >
                {Array.from({ length: Math.ceil(currentCollabs.length / cardsPerView) }).map((_, pageIndex) => (
                  <div 
                    key={pageIndex} 
                    className="grid grid-cols-4 gap-4 flex-shrink-0 w-full"
                  >
                    {currentCollabs.slice(pageIndex * cardsPerView, (pageIndex + 1) * cardsPerView).map((collab) => {
                      const statusBadge = getStatusBadge(collab.status);
                      const collabType = getCollaborationType(collab);
                      const partner = getPartnerInfo(collab);

                      return (
                        <div
                          key={collab._id}
                          className="bg-zinc-900 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col"
                        >
                          <div className="p-4 flex flex-col flex-grow h-full">
                            <div className="flex items-start justify-between mb-3">
                              <h3 
                                className="font-bold text-white text-lg flex-1 line-clamp-2"
                                style={{ fontFamily: 'Oswald, sans-serif' }}
                              >
                                {collab.requestDetails?.eventName || 'Collaboration Request'}
                              </h3>
                              <span className={`${statusBadge.bg} text-white px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0`}>
                                {statusBadge.text}
                              </span>
                            </div>

                            <div className="text-sm text-gray-400 mb-3">
                              {partner.name}
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-400">
                                <Building2 className="h-4 w-4 mr-2" />
                                <span>{partner.location}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-400">
                                <Users className="h-4 w-4 mr-2" />
                                <span>Music & Social</span>
                              </div>
                            </div>

                            <div className="space-y-3 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Collaboration Type</span>
                                <span className={`${collabType.color} text-white px-2 py-1 rounded text-xs font-medium`}>
                                  {collabType.text}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                                <span className="text-sm text-gray-400">Event Date</span>
                                <span className="text-sm text-white font-medium">
                                  {collab.requestDetails?.eventDate 
                                    ? new Date(collab.requestDetails.eventDate).toLocaleDateString('en-IN', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })
                                    : 'Date TBD'}
                                </span>
                              </div>

                              {collab.requestDetails?.venueRequest?.expectedAttendees && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-400">Est. Attendees</span>
                                  <span className="text-sm text-white font-medium">
                                    {collab.requestDetails.venueRequest.expectedAttendees}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-gray-800 mt-auto">
                              <button
                                onClick={() => navigate(`/collaborations/${collab._id}`)}
                                className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View Details</span>
                              </button>

                              <button
                                onClick={() => navigate(`/collaborations/${collab._id}/contact`)}
                                className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                              >
                                <Users className="h-4 w-4" />
                                <span>Contact</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {currentCollabs.length > 1 && (
              <div className="hidden md:flex justify-center mt-6 space-x-2">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCollabCarouselIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === collabCarouselIndex ? 'w-8' : 'w-2'
                    }`}
                    style={idx === collabCarouselIndex ? {
                      background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)'
                    } : { background: '#374151' }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <NavigationBar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  const { actionsRequired, upcomingEvents, performance, insights } =
    dashboardData || {};

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />

      <div className="flex overflow-x-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:block w-20 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-gray-800 min-h-screen pt-8">
          <nav className="flex flex-col items-center space-y-6">
            {/* Dashboard/All */}
            <button
              onClick={() => setActiveSidebarItem("all")}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === "all"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-400"
              }`}
              style={
                activeSidebarItem === "all"
                  ? {
                      background:
                        "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                    }
                  : {}
              }
              title="Dashboard"
            >
              <Grid className="h-6 w-6" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>

            {/* Actions Required */}
            <button
              onClick={() => setActiveSidebarItem("actions")}
              className={`relative flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === "actions"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-400"
              }`}
              style={
                activeSidebarItem === "actions"
                  ? {
                      background:
                        "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                    }
                  : {}
              }
              title="Actions Required"
            >
              {actionsRequired && actionsRequired.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {actionsRequired.length}
                </span>
              )}
              <Bell className="h-6 w-6" />
              <span className="text-xs font-medium">Actions</span>
            </button>

            {/* Events */}
            <button
              onClick={() => setActiveSidebarItem("events")}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === "events"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-400"
              }`}
              style={
                activeSidebarItem === "events"
                  ? {
                      background:
                        "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                    }
                  : {}
              }
              title="Events"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-xs font-medium">Events</span>
            </button>

            {/* Analytics */}
            <button
              onClick={() => setActiveSidebarItem("analytics")}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === "analytics"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-400"
              }`}
              style={
                activeSidebarItem === "analytics"
                  ? {
                      background:
                        "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                    }
                  : {}
              }
              title="Analytics"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-xs font-medium">Analytics</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setActiveSidebarItem("settings")}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeSidebarItem === "settings"
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-400"
              }`}
              style={
                activeSidebarItem === "settings"
                  ? {
                      background:
                        "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                    }
                  : {}
              }
              title="Settings"
            >
              <Settings className="h-6 w-6" />
              <span className="text-xs font-medium">Settings</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1
                  className="text-3xl font-bold text-white mb-2 flex items-center"
                  style={{ fontFamily: "Oswald, sans-serif" }}
                >
                  <Building2 className="h-8 w-8 mr-3" />
                  {user?.venueProfile?.venueName || "The Garden Lounge"}
                </h1>
                <p className="text-gray-400">Rooftop Cafe, Bangalore</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/profile")}
                  className="px-6 py-2.5 rounded-lg font-medium text-white transition-all"
                  style={{
                    background:
                      "linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)",
                  }}
                >
                  Edit Venue
                </button>
                <button className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Actions Required Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold text-white flex items-center"
                  style={{ fontFamily: "Oswald, sans-serif" }}
                >
                  <Bell className="h-6 w-6 mr-2" />
                  Actions Required
                  {actionsRequired && actionsRequired.length > 0 && (
                    <span className="ml-3 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {actionsRequired.length}
                    </span>
                  )}
                </h2>
              </div>

              {actionsRequired && actionsRequired.length > 0 ? (
                <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                  {actionsRequired.map((action, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-80 bg-zinc-900 rounded-xl p-5 border transition-all ${
                        action.priority === "high"
                          ? "border-red-500/50 hover:border-red-500"
                          : "border-yellow-500/50 hover:border-yellow-500"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            action.priority === "high"
                              ? "bg-red-500/20"
                              : "bg-yellow-500/20"
                          }`}
                        >
                          {action.priority === "high" ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                        {action.priority === "high" && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                            High Priority
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {action.description}
                      </p>
                      <button
                        onClick={() =>
                          handleActionClick(action.type, action.itemId)
                        }
                        className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>{action.ctaText || "Respond"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-gray-800 rounded-xl p-8 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-green-400 font-medium text-lg">
                    You're all set. Your venue is visible to organizers.
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming Events Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold text-white flex items-center"
                  style={{ fontFamily: "Oswald, sans-serif" }}
                >
                  <Calendar className="h-6 w-6 mr-2" />
                  Upcoming Events
                </h2>
                <div className="flex items-center gap-2">
                  <ChevronLeft className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-400" />
                  <ChevronRight className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-400" />
                </div>
              </div>

              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event._id}
                      className="bg-zinc-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all cursor-pointer"
                    >
                      {/* Event Banner */}
                      <div className="relative h-32 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                        <span className="absolute top-3 left-3 px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                          Upcoming
                        </span>
                        <div className="text-center text-white">
                          <p className="text-sm opacity-80">
                            Sunday Jazz & Wine
                          </p>
                          <p className="text-xl font-bold">Night</p>
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="p-4">
                        <h3 className="text-white font-bold text-lg mb-1">
                          {event.eventName}
                        </h3>
                        <p className="text-sm text-gray-400 mb-3">
                          Culture Club Collective
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>
                              {new Date(event.date).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>7:00 PM - 10:00 PM</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-400">
                            <Users className="h-4 w-4 mr-2" />
                            <span>30-40 people</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-gray-800 rounded-xl p-12 text-center">
                  <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No Upcoming Events
                  </h3>
                  <p className="text-gray-400">
                    IndulgeOut is bringing activity into your space. Check back
                    soon!
                  </p>
                </div>
              )}
            </div>

            {/* Collaborations Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold text-white flex items-center"
                  style={{ fontFamily: "Oswald, sans-serif" }}
                >
                  <Building2 className="h-6 w-6 mr-2" />
                  Collaborations
                </h2>
              </div>
              <ManageCollaborationsSection />
            </div>

            {/* Performance & Insights Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold text-white flex items-center"
                  style={{ fontFamily: "Oswald, sans-serif" }}
                >
                  <BarChart3 className="h-6 w-6 mr-2" />
                  Performance & Insights
                </h2>
                <div className="flex items-center gap-2">
                  <ChevronLeft className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-400" />
                  <ChevronRight className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-400" />
                </div>
              </div>

              {/* Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-900 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {performance?.totalEvents || 47}
                  </p>
                  <p className="text-sm text-gray-400">Total Events Hosted</p>
                  <p className="text-xs text-green-400 mt-2">via IndulgeOut</p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {performance?.totalEvents || 47}
                  </p>
                  <p className="text-sm text-gray-400">Total Events Hosted</p>
                  <p className="text-xs text-green-400 mt-2">via IndulgeOut</p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {performance?.totalEvents || 47}
                  </p>
                  <p className="text-sm text-gray-400">Total Events Hosted</p>
                  <p className="text-xs text-green-400 mt-2">via IndulgeOut</p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {performance?.totalEvents || 47}
                  </p>
                  <p className="text-sm text-gray-400">Total Events Hosted</p>
                  <p className="text-xs text-green-400 mt-2">via IndulgeOut</p>
                </div>
              </div>
            </div>

            {/* What's Working & Suggestions */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                What's Working
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-green-900/20 to-green-800/10 border border-green-700/30 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-100">
                        Music & social events perform best at your venue
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-white mb-4">
                Suggestions for You
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 border border-yellow-700/30 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-100">
                        Music & social events perform best at your venue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDashboard;
