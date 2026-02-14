import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import NavigationBar from "../components/NavigationBar";
import {
  ArrowLeft,
  Eye,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  UserCheck,
  Calendar,
  Clock,
  Star,
  MessageSquare,
  Download,
  Search,
  RefreshCw,
  QrCode,
  Mail,
  Phone,
  ChevronDown,
  Filter,
  Award,
  MapPin,
  UserX,
  Zap,
  TrendingDown,
} from "lucide-react";

const EventAnalytics = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  const fetchAnalytics = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await api.get(`/events/${eventId}/analytics`);
      setAnalytics(response.data);
      console.log("📊 Analytics data:", response.data);
    } catch (error) {
      console.error("❌ Error fetching analytics:", error);
      setError(error.response?.data?.message || error.message || "Failed to load analytics");
      if (error.response?.status === 403) {
        alert("You are not authorized to view analytics for this event");
        navigate("/organizer/dashboard");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getFilteredAttendees = () => {
    if (!analytics?.attendees) return [];
    let filtered = analytics.attendees;

    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query) ||
          a.ticketNumber.toLowerCase().includes(query) ||
          (a.phoneNumber && a.phoneNumber.includes(query)),
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "checkInTime":
          if (!a.checkInTime && !b.checkInTime) return 0;
          if (!a.checkInTime) return 1;
          if (!b.checkInTime) return -1;
          return new Date(b.checkInTime) - new Date(a.checkInTime);
        case "purchaseDate":
          return new Date(b.purchaseDate) - new Date(a.purchaseDate);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const exportToCSV = () => {
    if (!analytics?.attendees) return;
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Ticket Number",
      "Ticket Type",
      "Status",
      "Purchase Date",
      "Check-in Time",
    ];
    const rows = analytics.attendees.map((a) => [
      a.name,
      a.email,
      a.phoneNumber || "",
      a.ticketNumber,
      a.ticketType,
      a.status,
      formatDate(a.purchaseDate),
      a.checkInTime ? formatDateTime(a.checkInTime) : "",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analytics?.eventTitle || "event"}_attendees.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "checked_in":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color = "purple",
    iconColor = "text-purple-500",
  }) => (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <span className="text-sm text-gray-400">{label}</span>
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {subValue && <div className="text-sm text-gray-400">{subValue}</div>}
    </div>
  );

  const filteredAttendees = getFilteredAttendees();

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <NavigationBar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-black">
        <NavigationBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-400 mb-2">{error || "No analytics data available"}</p>
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={() => fetchAnalytics()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/organizer/dashboard")}
                className="px-4 py-2 text-purple-500 hover:text-purple-400 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/organizer/dashboard")}
            className="flex items-center text-gray-400 hover:text-purple-400 mb-6 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 rounded-full text-sm text-blue-300 mb-3">
                <Clock className="h-4 w-4 mr-1.5" />
                Live
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {analytics.eventTitle || "Event Analytics"}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  {analytics.eventDate &&
                    formatDate(analytics.eventDate)}{" "}at {analytics.eventTime || "TBD"}
                </div>
                {analytics.eventLocation?.city && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5" />
                    {analytics.eventLocation.city}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/scan-tickets?eventId=${eventId}`)}
                className="flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Scan Tickets
              </button>

              <button
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="p-2.5 text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50 bg-gray-800/50 rounded-xl"
                title="Refresh data"
              >
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Core Performance Metrics */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-500" />
              Core Performance Metrics
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={Eye}
              label="Event Views"
              value={(analytics.coreMetrics?.eventViews || 0).toLocaleString()}
              subValue="Total page views"
              iconColor="text-blue-500"
            />
            <MetricCard
              icon={Users}
              label="Attendees"
              value={(analytics.coreMetrics?.totalBookings || 0).toLocaleString()}
              subValue="Total registrations"
              iconColor="text-green-500"
            />
            <MetricCard
              icon={Target}
              label="Bookings"
              value={analytics.coreMetrics?.bookingsVsCapacity || "0/0"}
              subValue={`${analytics.coreMetrics?.fillPercentage || 0}% filled`}
              iconColor="text-yellow-500"
            />
            <MetricCard
              icon={TrendingUp}
              label="Conversion Rate"
              value={`${analytics.coreMetrics?.conversionRate || 0}%`}
              subValue="Views to bookings"
              iconColor="text-purple-500"
            />
          </div>
        </div>

        {/* Revenue Performance */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-500" />
              Revenue Performance
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm rounded-xl p-6 border border-green-700/30">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-400">Total Revenue</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                ₹{(analytics.revenue?.totalRevenue || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-400">Avg per Attendee</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                ₹{(analytics.revenue?.avgPerAttendee || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="text-sm text-gray-400 mb-3">
                Revenue by Ticket Type
              </div>
              <div className="space-y-2">
                {(analytics.revenue?.revenueByTicketType || []).map((type, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          idx === 0
                            ? "bg-red-500"
                            : idx === 1
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      ></div>
                      <span className="text-sm text-gray-300 capitalize">{type.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">
                        ₹{(type.revenue || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {type.count} tickets
                      </div>
                    </div>
                  </div>
                ))}
                {(analytics.revenue?.revenueByTicketType || []).length === 0 && (
                  <p className="text-sm text-gray-500">No ticket sales yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance & Show-up Quality */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-green-500" />
              Attendance & Show-up Quality
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={Users}
              label="Tickets Sold"
              value={analytics.attendance?.ticketsSold || 0}
              iconColor="text-cyan-500"
            />
            <MetricCard
              icon={UserCheck}
              label="Actual Check-ins"
              value={analytics.attendance?.actualCheckIns || 0}
              subValue={`${analytics.attendance?.showUpRate || 0}% arrival`}
              iconColor="text-green-500"
            />
            <MetricCard
              icon={TrendingUp}
              label="Show-up Rate"
              value={`${analytics.attendance?.showUpRate || 0}%`}
              iconColor="text-green-500"
            />
            <MetricCard
              icon={UserX}
              label="No-shows"
              value={analytics.attendance?.noShows || 0}
              subValue={`${(analytics.attendance?.ticketsSold || 0) - (analytics.attendance?.noShows || 0)} attended`}
              iconColor="text-orange-500"
            />
          </div>
        </div>

        {/* Demand Timing & Sales Velocity */}
        {analytics.demandTiming && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-500" />
              Demand Timing & Sales Velocity
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-400">
                  First Booking Date
                </span>
              </div>
              <div className="text-xl font-semibold text-white">
                {analytics.demandTiming?.firstBookingDate
                  ? formatDate(analytics.demandTiming.firstBookingDate)
                  : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1">Campaign kickoff</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-700/30">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-gray-400">Peak Booking Date</span>
              </div>
              <div className="text-xl font-semibold text-white">
                {analytics.demandTiming?.peakBookingMessage || "Steady bookings"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last minute surge
              </div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-gray-400">Booking Period</span>
              </div>
              <div className="text-xl font-semibold text-white">
                {analytics.demandTiming?.bookingPeriodDays || 0} days
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Active sales window
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Audience Quality Snapshot */}
        {analytics.audienceQuality && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-500" />
              Audience Quality Snapshot
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-400">
                  First-Time Attendees
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {analytics.audienceQuality?.firstTimeAttendees || 0}%
              </div>
              <div className="text-xs text-gray-500">New to platform</div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-400">Repeat Attendees</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {analytics.audienceQuality?.repeatAttendees || 0}%
              </div>
              <div className="text-xs text-gray-500">Returning members</div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-gray-400">
                  Interest Conversion
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {analytics.audienceQuality?.interestConversion || 0}%
              </div>
              <div className="text-xs text-gray-500">Matched preferences</div>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-5 w-5 text-cyan-500" />
                <span className="text-sm text-gray-400">
                  Local Distribution
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {analytics.audienceQuality?.localDistribution || 0}%
              </div>
              <div className="text-xs text-gray-500">From same city</div>
            </div>
          </div>
        </div>
        )}

        {/* Event Outcome & Feedback */}
        {analytics.feedback && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-yellow-500" />
              Event Outcome & Feedback
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rating Summary */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-700/30">
              <div className="flex items-center space-x-2 mb-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-gray-400">Average Rating</span>
              </div>
              <div className="flex items-end space-x-2 mb-1">
                <div className="text-5xl font-bold text-white">
                  {analytics.feedback?.avgRating || 0}
                </div>
                <div className="text-2xl text-gray-400 mb-2">/5.0</div>
              </div>
              <div className="text-sm text-gray-400">
                Based on {analytics.feedback?.totalReviews || 0} reviews
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="text-sm text-gray-400 mb-4">Rating Breakdown</div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-8">
                      <span className="text-sm text-white">{rating}</span>
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rating === 5
                            ? "bg-yellow-500"
                            : rating === 4
                              ? "bg-yellow-500"
                              : rating === 3
                                ? "bg-yellow-600"
                                : rating === 2
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                        }`}
                        style={{
                          width: `${
                            (analytics.feedback?.totalReviews || 0) > 0
                              ? ((analytics.feedback?.ratingBreakdown?.[rating] || 0) /
                                  analytics.feedback.totalReviews) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-10 text-right">
                      {analytics.feedback?.ratingBreakdown?.[rating] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reviews Preview */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-400">Recent Reviews</div>
                {(analytics.feedback?.totalReviews || 0) > 0 && (
                  <button className="text-xs text-purple-400 hover:text-purple-300">
                    View All {analytics.feedback.totalReviews}
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {(analytics.feedback?.recentReviews?.length || 0) > 0 ? (
                  analytics.feedback.recentReviews.slice(0, 3).map((review) => (
                    <div
                      key={review.id}
                      className="pb-3 border-b border-gray-700 last:border-0"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs text-white">
                          {review.userName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-white">
                          {review.userName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {review.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No reviews yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Attendee Check-ins */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <UserCheck className="h-5 w-5 mr-2 text-green-500" />
                Attendee Check-ins
              </h2>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or ticket number..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="checked_in">Checked In</option>
                <option value="active">Not Checked In</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="name">Sort by Name</option>
                <option value="checkInTime">Sort by Check-in</option>
                <option value="purchaseDate">Sort by Purchase</option>
              </select>

              <button
                onClick={exportToCSV}
                className="flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Export CSV
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-400">
              Showing {filteredAttendees.length} of {analytics.attendees?.length || 0}{" "}
              attendees
            </div>
          </div>

          {/* Attendees Table */}
          <div className="overflow-x-auto">
            {filteredAttendees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery
                    ? "No attendees match your search"
                    : "No attendees registered yet"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ticket Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ticket Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Check-in Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredAttendees.map((attendee) => (
                    <tr
                      key={attendee.ticketId}
                      className="hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {attendee.profilePicture ? (
                              <img
                                src={attendee.profilePicture}
                                alt={attendee.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                {attendee.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {attendee.name}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {attendee.email}
                            </div>
                            {attendee.phoneNumber && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {attendee.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-white">
                          {attendee.ticketNumber}
                        </div>
                        {attendee.quantity > 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full">
                            × {attendee.quantity} Spots
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-700/50 text-gray-300 rounded-full">
                          {attendee.ticketType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(attendee.status)}`}
                        >
                          {attendee.status === "checked_in"
                            ? "✅ Checked In"
                            : "⏳ Not Checked In"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {attendee.checkInTime ? (
                          <div>
                            <div className="flex items-center text-green-400">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDateTime(attendee.checkInTime)}
                            </div>
                            {attendee.checkInBy && (
                              <div className="text-xs text-gray-500 mt-1">
                                by {attendee.checkInBy}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventAnalytics;
