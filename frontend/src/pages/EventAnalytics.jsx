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
  FileText,
  MapPin,
  Award,
  UserX,
  Zap,
  TrendingDown,
  X,
  Tag,
  Ticket,
  CheckCircle2,
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
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  
  // Questionnaire Submissions state
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [questionnaireSubmissions, setQuestionnaireSubmissions] = useState(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, paid, unpaid

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
      console.log("📊 Attendees with responses:", response.data.attendees?.filter(a => a.questionnaireResponses?.length > 0).length);
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

  const fetchQuestionnaireSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const response = await api.get(`/events/${eventId}/questionnaire-submissions`);
      setQuestionnaireSubmissions(response.data);
      console.log("📝 Questionnaire submissions:", response.data);
      setShowQuestionnaireModal(true);
    } catch (error) {
      console.error("❌ Error fetching questionnaire submissions:", error);
      alert(error.response?.data?.message || "Failed to load questionnaire submissions");
    } finally {
      setLoadingSubmissions(false);
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
      "Quantity",
      "Ticket Type",
      "Coupon Code",
      "Discount Applied",
      "Status",
      "Purchase Date",
      "Check-in Time",
    ];
    const rows = analytics.attendees.map((a) => [
      a.name,
      a.email,
      a.phoneNumber || "",
      a.ticketNumber,
      a.quantity || 1,
      a.ticketType,
      a.couponUsed?.code || "",
      a.couponUsed?.discountApplied ? `₹${a.couponUsed.discountApplied}` : "",
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate("/organizer/dashboard")}
            className="flex items-center text-gray-400 hover:text-purple-400 mb-4 sm:mb-6 transition-colors group text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-blue-500/20 rounded-full text-xs sm:text-sm text-blue-300 mb-2 sm:mb-3">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Live
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-2">
                {analytics.eventTitle || "Event Analytics"}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {analytics.eventDate &&
                      formatDate(analytics.eventDate)}{" "}at {analytics.eventTime || "TBD"}
                  </span>
                </div>
                {analytics.eventLocation && (
                  <div className="flex items-start">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {analytics.eventLocation.address || analytics.eventLocation.city || "Venue TBD"}
                      {analytics.eventLocation.address && analytics.eventLocation.city && (
                        <span className="text-gray-500"> • {analytics.eventLocation.city}</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate(`/scan-tickets?eventId=${eventId}`)}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20"
              >
                <QrCode className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:inline">Scan Tickets</span>
                <span className="sm:hidden">Scan</span>
              </button>

              {analytics.questionnaireSubmissionsCount > 0 && (
                <button
                  onClick={fetchQuestionnaireSubmissions}
                  disabled={loadingSubmissions}
                  className="flex-1 sm:flex-none flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-white rounded-xl transition-all shadow-lg"
                  style={{
                    background: loadingSubmissions 
                      ? 'linear-gradient(180deg, rgba(120, 120, 233, 0.5) 11%, rgba(61, 61, 212, 0.5) 146%)'
                      : 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                    opacity: loadingSubmissions ? 0.7 : 1
                  }}
                >
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="hidden sm:inline">Questionnaire</span>
                  <span className="sm:hidden">Q&A</span>
                </button>
              )}

              <button
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="p-2 sm:p-2.5 text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50 bg-gray-800/50 rounded-xl"
                title="Refresh data"
              >
                <RefreshCw
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? "animate-spin" : ""}`}
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
              subValue={`${analytics.attendance?.totalAttendees || 0} total attendees`}
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
              subValue={`${(analytics.attendance?.totalAttendees || 0) - (analytics.attendance?.noShows || 0)} attended`}
              iconColor="text-orange-500"
            />
          </div>
        </div>

        {/* Coupon Usage Statistics */}
        {analytics.attendees && analytics.attendees.some(a => a.couponUsed) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Ticket className="h-5 w-5 mr-2 text-purple-500" />
                Coupon Usage Statistics
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(() => {
                const couponsUsed = analytics.attendees.filter(a => a.couponUsed && a.couponUsed.code);
                const totalDiscount = couponsUsed.reduce((sum, a) => sum + (a.couponUsed.discountApplied || 0), 0);
                const uniqueCoupons = [...new Set(couponsUsed.map(a => a.couponUsed.code))];
                
                return (
                  <>
                    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30">
                      <div className="flex items-center space-x-2 mb-3">
                        <Ticket className="h-5 w-5 text-purple-500" />
                        <span className="text-sm text-gray-400">Coupons Used</span>
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">
                        {couponsUsed.length}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((couponsUsed.length / analytics.attendees.length) * 100).toFixed(1)}% of bookings
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl p-6 border border-red-700/30">
                      <div className="flex items-center space-x-2 mb-3">
                        <DollarSign className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-gray-400">Total Discount</span>
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">
                        ₹{totalDiscount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Revenue discount given
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                      <div className="flex items-center space-x-2 mb-3">
                        <Tag className="h-5 w-5 text-blue-500" />
                        <span className="text-sm text-gray-400">Unique Coupons</span>
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">
                        {uniqueCoupons.length}
                      </div>
                      <div className="text-xs text-gray-500">
                        {uniqueCoupons.join(', ')}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Coupon Details - All Coupons Created by Host */}
        {analytics.coupons && analytics.coupons.enabled && analytics.coupons.codes && analytics.coupons.codes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Tag className="h-5 w-5 mr-2 text-green-500" />
                Promo Codes Created
              </h2>
              <span className="text-sm text-gray-400">
                {analytics.coupons.codes.length} {analytics.coupons.codes.length === 1 ? 'code' : 'codes'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics.coupons.codes.map((coupon, index) => {
                const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                const isLimitReached = coupon.maxUses && coupon.currentUses >= coupon.maxUses;
                const usagePercentage = coupon.maxUses ? (coupon.currentUses / coupon.maxUses) * 100 : 0;
                
                return (
                  <div 
                    key={index}
                    className={`bg-gradient-to-br ${
                      !coupon.isActive || isExpired || isLimitReached
                        ? 'from-gray-800/40 to-gray-900/40 border-gray-700/30'
                        : 'from-green-900/20 to-emerald-900/20 border-green-700/30'
                    } backdrop-blur-sm rounded-xl p-6 border transition-all hover:border-green-600/50`}
                  >
                    {/* Coupon Code Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1.5 rounded-lg font-mono font-bold text-lg ${
                        !coupon.isActive || isExpired || isLimitReached
                          ? 'bg-gray-700/50 text-gray-400'
                          : 'bg-green-600/20 text-green-400'
                      }`}>
                        {coupon.code}
                      </div>
                      {coupon.isActive && !isExpired && !isLimitReached ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-gray-500" />
                      )}
                    </div>

                    {/* Discount Details */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-gray-400">Discount</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue} OFF`
                        }
                      </div>
                    </div>

                    {/* Usage Statistics */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Usage</span>
                        <span className="text-sm font-semibold text-white">
                          {coupon.currentUses} / {coupon.maxUses || '∞'}
                        </span>
                      </div>
                      {coupon.maxUses && (
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              usagePercentage >= 100 ? 'bg-red-500' : 
                              usagePercentage >= 80 ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-2 text-xs">
                      {coupon.maxUsesPerUser && (
                        <div className="flex items-center justify-between text-gray-400">
                          <span>Per User Limit</span>
                          <span className="font-semibold">{coupon.maxUsesPerUser}x</span>
                        </div>
                      )}
                      {coupon.expiryDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Expires</span>
                          <span className={`font-semibold ${isExpired ? 'text-red-400' : 'text-gray-300'}`}>
                            {formatDate(coupon.expiryDate)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Status</span>
                        <span className={`font-semibold ${
                          !coupon.isActive ? 'text-gray-400' :
                          isExpired ? 'text-red-400' :
                          isLimitReached ? 'text-orange-400' :
                          'text-green-400'
                        }`}>
                          {!coupon.isActive ? 'Inactive' :
                           isExpired ? 'Expired' :
                           isLimitReached ? 'Limit Reached' :
                           'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Users Who Used This Coupon */}
                    {coupon.usedBy && coupon.usedBy.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700/50">
                        <div className="text-xs text-gray-400 mb-2">
                          Used by {coupon.usedBy.length} {coupon.usedBy.length === 1 ? 'user' : 'users'}
                        </div>
                        <div className="flex -space-x-2">
                          {coupon.usedBy.slice(0, 5).map((usage, idx) => (
                            <div 
                              key={idx}
                              className="w-8 h-8 rounded-full bg-purple-600/20 border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-purple-400"
                              title={`₹${usage.discountApplied} saved`}
                            >
                              {idx + 1}
                            </div>
                          ))}
                          {coupon.usedBy.length > 5 && (
                            <div className="w-8 h-8 rounded-full bg-gray-600/40 border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                              +{coupon.usedBy.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Price Change Timeline */}
        {((analytics.priceChangeHistory && analytics.priceChangeHistory.length > 0) || 
          (analytics.pricingTimeline && analytics.pricingTimeline.enabled)) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-yellow-500" />
                Price Change Timeline
              </h2>
            </div>

            {/* Scheduled Pricing Timeline Tiers */}
            {analytics.pricingTimeline?.enabled && analytics.pricingTimeline.tiers?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Scheduled Price Tiers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analytics.pricingTimeline.tiers.map((tier, index) => {
                    // IST-aware date comparison for tier status
                    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
                    const toISTDate = (d) => new Date(new Date(d).getTime() + IST_OFFSET).toISOString().split('T')[0];
                    const todayIST = toISTDate(new Date());
                    const startIST = toISTDate(tier.startDate);
                    const endIST = toISTDate(tier.endDate);
                    const isActive = todayIST >= startIST && todayIST <= endIST;
                    const isPast = todayIST > endIST;
                    
                    return (
                      <div 
                        key={index}
                        className={`backdrop-blur-sm rounded-xl p-5 border transition-all ${
                          isActive 
                            ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/30 ring-1 ring-green-500/30'
                            : isPast 
                              ? 'bg-gray-800/30 border-gray-700/30 opacity-60'
                              : 'bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-700/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-white">
                            {tier.label || `Tier ${index + 1}`}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive 
                              ? 'bg-green-500/20 text-green-400'
                              : isPast 
                                ? 'bg-gray-600/20 text-gray-400'
                                : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {isActive ? 'Active' : isPast ? 'Ended' : 'Upcoming'}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-2">₹{tier.price}</div>
                        <div className="text-xs text-gray-400 mb-3">
                          {formatDate(tier.startDate)} → {formatDate(tier.endDate)}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{tier.spotsBought || 0} spots booked</span>
                          <span className="text-green-400 font-medium">₹{(tier.revenue || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Change History Log */}
            {analytics.priceChangeHistory && analytics.priceChangeHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Price Change History</h3>
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Date</th>
                          <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Previous Price</th>
                          <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">New Price</th>
                          <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Reason</th>
                          <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Spots at Prev Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.priceChangeHistory.map((change, index) => (
                          <tr key={index} className="border-b border-gray-700/30 last:border-b-0 hover:bg-white/5">
                            <td className="px-4 py-3 text-sm text-white">
                              {formatDateTime(change.changedAt)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              ₹{change.previousPrice}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-white">
                              ₹{change.newPrice}
                              {change.newPrice > change.previousPrice ? (
                                <TrendingUp className="inline h-3 w-3 ml-1 text-red-400" />
                              ) : change.newPrice < change.previousPrice ? (
                                <TrendingDown className="inline h-3 w-3 ml-1 text-green-400" />
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                change.reason === 'initial_creation' 
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : change.reason === 'timeline_automatic'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {change.reason === 'initial_creation' ? 'Created' : 
                                 change.reason === 'timeline_automatic' ? 'Auto (Timeline)' : 'Manual Edit'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {change.spotsBookedAtPrevPrice}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
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
                      Purchase Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ticket Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Coupon Used
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Base Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Price at Purchase
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total Paid
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
                        <div className="text-sm text-gray-300">
                          {attendee.purchaseDate ? (
                            <div>
                              <div>
                                {new Date(attendee.purchaseDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(attendee.purchaseDate).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {attendee.orderId ? (
                          <div className="text-xs">
                            <div className="font-mono text-blue-400 truncate max-w-[200px]" title={attendee.orderId}>
                              {attendee.orderId.substring(0, 20)}...
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(attendee.orderId);
                                // Optional: Show a toast notification
                              }}
                              className="text-gray-500 hover:text-gray-300 mt-1 text-[10px]"
                            >
                              📋 Copy
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-700/50 text-gray-300 rounded-full">
                          {attendee.ticketType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attendee.couponUsed && attendee.couponUsed.code ? (
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded-full inline-block">
                              {attendee.couponUsed.code}
                            </span>
                            <span className="text-xs text-gray-500">
                              -₹{attendee.couponUsed.discountApplied || 0} 
                              {attendee.couponUsed.discountType === 'percentage' 
                                ? ` (${attendee.couponUsed.discountValue}%)` 
                                : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white">
                          ₹{attendee.metadata?.priceAtPurchase || (attendee.metadata?.basePrice ? Math.round(attendee.metadata.basePrice / (attendee.quantity || 1)) : attendee.price?.amount || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(attendee.quantity || 1) > 1 ? `Per spot × ${attendee.quantity}` : 'Per spot'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          ₹{attendee.metadata?.priceAtPurchase || (attendee.metadata?.basePrice ? Math.round(attendee.metadata.basePrice / (attendee.quantity || 1)) : attendee.price?.amount || 0)}
                        </div>
                        {attendee.metadata?.pricingTimelineTier && (
                          <div className="text-xs text-purple-400">
                            {attendee.metadata.pricingTimelineTier}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-400">
                          ₹{attendee.metadata?.totalPaid || attendee.price?.amount || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          Inc. Fees & GST
                        </div>
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

      {/* Questionnaire Responses Modal */}
      {showResponsesModal && selectedAttendee && (
        <div className="fixed inset-0 bg-zinc-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-zinc-900 border-b border-gray-700 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Questionnaire Responses
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedAttendee.name || selectedAttendee.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowResponsesModal(false);
                  setSelectedAttendee(null);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {selectedAttendee.questionnaireResponses.map((response, index) => (
                <div key={index} className="bg-gray-750 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-semibold text-sm" style={{ color: '#7878E9' }}>Q{index + 1}:</span>
                    <p className="text-gray-300 font-medium flex-1">{response.question}</p>
                  </div>
                  <div className="flex items-start gap-2 pl-6">
                    <span className="text-green-400 font-semibold text-sm">A:</span>
                    <p className="text-gray-400 flex-1">{response.answer || "No answer provided"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Questionnaire Submissions Modal */}
      {showQuestionnaireModal && (
        <div className="fixed inset-0 bg-zinc-900 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-zinc-900 rounded-xl max-w-5xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-gray-700 flex flex-col">
            {/* Modal Header */}
            <div className="bg-zinc-900 border-b border-gray-700 p-4 sm:p-6">
              <div className="flex justify-between items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: '#7878E9' }} />
                    <span className="truncate">Questionnaire Submissions</span>
                  </h3>
                  {questionnaireSubmissions && (
                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
                      <span className="text-xs sm:text-sm text-gray-400">
                        Total: <span className="font-semibold text-white">{questionnaireSubmissions.total}</span>
                      </span>
                      <span className="text-xs sm:text-sm text-gray-400">
                        Paid: <span className="font-semibold text-green-400">{questionnaireSubmissions.paid}</span>
                      </span>
                      <span className="text-xs sm:text-sm text-gray-400">
                        Unpaid: <span className="font-semibold text-orange-400">{questionnaireSubmissions.unpaid}</span>
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowQuestionnaireModal(false);
                    setSelectedSubmission(null);
                    setPaymentFilter('all');
                  }}
                  className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </button>
              </div>
              
              {/* Filter Buttons + Export */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPaymentFilter('all')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    paymentFilter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  All ({questionnaireSubmissions?.total || 0})
                </button>
                <button
                  onClick={() => setPaymentFilter('paid')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    paymentFilter === 'paid'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Paid ({questionnaireSubmissions?.paid || 0})
                </button>
                <button
                  onClick={() => setPaymentFilter('unpaid')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    paymentFilter === 'unpaid'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Unpaid ({questionnaireSubmissions?.unpaid || 0})
                </button>
                <button
                  onClick={() => {
                    if (!questionnaireSubmissions?.submissions?.length) return;
                    const subs = questionnaireSubmissions.submissions.filter(s => {
                      if (paymentFilter === 'paid') return s.isPaid;
                      if (paymentFilter === 'unpaid') return !s.isPaid;
                      return true;
                    });
                    // Build CSV header from first submission's questions
                    const questions = subs[0]?.responses?.map(r => r.question) || [];
                    const headers = ['Name', 'Email', 'Ticket Number', 'Payment Status', 'Submitted At', ...questions];
                    const rows = subs.map(s => [
                      s.user.name,
                      s.user.email,
                      s.ticketNumber || '',
                      s.isPaid ? 'Paid' : 'Unpaid',
                      new Date(s.submittedAt).toLocaleDateString('en-IN'),
                      ...(s.responses?.map(r => `"${(r.answer || '').replace(/"/g, '""')}"`) || [])
                    ]);
                    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `questionnaire_responses_${eventId}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="ml-auto flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              {loadingSubmissions ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : questionnaireSubmissions?.submissions?.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No questionnaire submissions yet</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {questionnaireSubmissions?.submissions
                    ?.filter(submission => {
                      if (paymentFilter === 'all') return true;
                      if (paymentFilter === 'paid') return submission.isPaid;
                      if (paymentFilter === 'unpaid') return !submission.isPaid;
                      return true;
                    })
                    ?.map((submission) => (
                    <div 
                      key={submission.id} 
                      className="bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-4 hover:border-gray-600 transition-all"
                    >
                      {/* Mobile Layout: Stack everything */}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        {/* User Info + Status (Mobile: Row, Desktop: Separate) */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          {submission.user.profilePicture ? (
                            <img 
                              src={submission.user.profilePicture} 
                              alt={submission.user.name}
                              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm sm:text-base font-semibold flex-shrink-0">
                              {submission.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm sm:text-base font-medium truncate">{submission.user.name}</p>
                            <p className="text-gray-400 text-xs sm:text-sm truncate">{submission.user.email}</p>
                          </div>
                        </div>

                        {/* Submitted Date (Desktop Only) */}
                        <div className="text-right hidden lg:block flex-shrink-0">
                          <p className="text-xs text-gray-500">Submitted</p>
                          <p className="text-sm text-gray-300 whitespace-nowrap">
                            {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        {/* Status Badge + View Button (Mobile: Row at bottom, Desktop: Stay in line) */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2">
                          {/* Status Badge */}
                          {submission.isPaid ? (
                            <span className="px-2 sm:px-3 py-1 bg-green-500/20 text-green-400 text-[10px] sm:text-xs font-semibold rounded-full border border-green-500/30 whitespace-nowrap">
                              ✓ Paid
                            </span>
                          ) : (
                            <span className="px-2 sm:px-3 py-1 bg-orange-500/20 text-orange-400 text-[10px] sm:text-xs font-semibold rounded-full border border-orange-500/30 whitespace-nowrap">
                              Unpaid
                            </span>
                          )}

                          {/* View Button */}
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-white text-[10px] sm:text-xs font-medium rounded-lg transition-all hover:opacity-90 whitespace-nowrap"
                            style={{
                              background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)',
                            }}
                          >
                            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      </div>

                      {/* Ticket Number + Submitted Date (Mobile) */}
                      {(submission.ticketNumber || submission.submittedAt) && (
                        <div className="mt-2 pt-2 border-t border-gray-700 flex flex-wrap items-center gap-3 text-xs">
                          {submission.ticketNumber && (
                            <span className="text-gray-500">
                              Ticket: <span className="text-gray-300 font-mono">{submission.ticketNumber}</span>
                            </span>
                          )}
                          <span className="text-gray-500 lg:hidden">
                            Submitted: <span className="text-gray-300">
                              {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-zinc-900 bg-opacity-50 flex items-center justify-center z-[60] p-2 sm:p-4">
          <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-zinc-900 border-b border-gray-700 p-4 sm:p-6 flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  Response Details
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate">
                  {selectedSubmission.user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedSubmission.user.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {selectedSubmission.isPaid ? (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] sm:text-xs font-semibold rounded border border-green-500/30 whitespace-nowrap">
                      ✓ Paid
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-[10px] sm:text-xs font-semibold rounded border border-orange-500/30 whitespace-nowrap">
                      Unpaid
                    </span>
                  )}
                  {selectedSubmission.ticketNumber && (
                    <span className="text-[10px] sm:text-xs text-gray-500 truncate">
                      Ticket: <span className="text-gray-300 font-mono">{selectedSubmission.ticketNumber}</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
              {selectedSubmission.responses.map((response, index) => (
                <div key={index} className="bg-gray-750 p-3 sm:p-4 rounded-lg border border-gray-700">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-semibold text-xs sm:text-sm flex-shrink-0" style={{ color: '#7878E9' }}>Q{index + 1}:</span>
                    <p className="text-gray-300 text-sm sm:text-base font-medium flex-1">{response.question}</p>
                  </div>
                  <div className="flex items-start gap-2 pl-4 sm:pl-6">
                    <span className="text-green-400 font-semibold text-xs sm:text-sm flex-shrink-0">A:</span>
                    <p className="text-gray-400 text-sm sm:text-base flex-1 break-words">{response.answer || "No answer provided"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAnalytics;
