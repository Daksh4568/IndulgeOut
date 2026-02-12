import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import NavigationBar from "../components/NavigationBar";
import QRScanner from "../components/QRScanner";
import {
  QrCode,
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Ticket,
  ArrowLeft,
  Search,
  BarChart3,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";

const ScanTickets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventIdFromParams = searchParams.get("eventId");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualEntry, setManualEntry] = useState("");
  const [recentScans, setRecentScans] = useState([]);
  const [checkInResult, setCheckInResult] = useState(null);
  const [processingCheckIn, setProcessingCheckIn] = useState(false);
  const [ticketPreview, setTicketPreview] = useState(null); // For showing ticket before check-in
  const [loadingTicket, setLoadingTicket] = useState(false);

  useEffect(() => {
    fetchOrganizerEvents();
  }, []);

  useEffect(() => {
    if (eventIdFromParams && events.length > 0) {
      const event = events.find((e) => e._id === eventIdFromParams);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [eventIdFromParams, events]);

  // Fetch organizer's events
  const fetchOrganizerEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/organizer/events");

      // Filter to only show upcoming and today's events
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const relevantEvents =
        response.data.live?.filter((event) => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          // Show events from today and future events
          return eventDate >= today;
        }) || [];

      setEvents(relevantEvents);

      // If only one event, auto-select it
      if (relevantEvents.length === 1) {
        setSelectedEvent(relevantEvents[0]);
      }
    } catch (error) {
      console.error("❌ Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle QR code scan
  const handleScanSuccess = async (ticketData) => {
    const ticketNumber = ticketData.ticketNumber || ticketData;
    console.log("✅ Scanned ticket number:", ticketNumber);

    await fetchTicketInfo(ticketNumber);
  };

  // Fetch ticket info without checking in
  const fetchTicketInfo = async (ticketNumber) => {
    setLoadingTicket(true);
    setCheckInResult(null);
    setTicketPreview(null);

    try {
      // Fetch ticket details without checking in
      const response = await api.get(`/tickets/info/${ticketNumber}`);

      console.log("✅ Ticket info fetched:", response.data);

      setTicketPreview({
        ticketNumber,
        ticket: response.data.ticket,
      });

      // Clear manual entry
      setManualEntry("");
    } catch (error) {
      console.error("❌ Error fetching ticket:", error);

      const errorMessage =
        error.response?.data?.message || error.message || "Ticket not found";

      setCheckInResult({
        type: "error",
        message: errorMessage,
        ticketNumber,
      });

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setCheckInResult(null);
      }, 5000);
    } finally {
      setLoadingTicket(false);
    }
  };

  // Check in a ticket
  const checkInTicket = async (ticketNumber) => {
    setProcessingCheckIn(true);
    setCheckInResult(null);

    try {
      const response = await api.post(`/tickets/check-in/${ticketNumber}`);

      console.log("✅ Check-in successful:", response.data);

      // Success
      setCheckInResult({
        type: "success",
        message: response.data.message,
        ticket: response.data.ticket,
      });

      // Clear ticket preview after successful check-in
      setTicketPreview(null);

      // Add to recent scans
      setRecentScans((prev) => [
        {
          ticketNumber,
          userName: response.data.ticket.user.name,
          userEmail: response.data.ticket.user.email,
          checkInTime: new Date(),
          status: "success",
        },
        ...prev.slice(0, 9),
      ]); // Keep last 10 scans

      // Clear manual entry
      setManualEntry("");

      // Auto-clear result after 5 seconds
      setTimeout(() => {
        setCheckInResult(null);
      }, 5000);
    } catch (error) {
      console.error("❌ Check-in error:", error);

      const errorMessage =
        error.response?.data?.message || error.message || "Check-in failed";

      setCheckInResult({
        type: "error",
        message: errorMessage,
        ticketNumber,
      });

      // Add to recent scans with error
      setRecentScans((prev) => [
        {
          ticketNumber,
          userName: "Unknown",
          checkInTime: new Date(),
          status: "error",
          errorMessage,
        },
        ...prev.slice(0, 9),
      ]);

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setCheckInResult(null);
      }, 5000);
    } finally {
      setProcessingCheckIn(false);
    }
  };

  // Handle manual entry
  const handleManualCheckIn = (e) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      fetchTicketInfo(manualEntry.trim().toUpperCase());
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <NavigationBar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <NavigationBar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/organizer/dashboard")}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <QrCode className="h-8 w-8 mr-3 text-indigo-600" />
                Scan Tickets
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Check in attendees at your event entrance
              </p>
            </div>

            {selectedEvent && (
              <button
                onClick={() =>
                  navigate(`/organizer/events/${selectedEvent._id}/analytics`)
                }
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                View Analytics
              </button>
            )}
          </div>
        </div>

        {/* Event Selection */}
        {!selectedEvent ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select an Event
            </h2>

            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No upcoming events found
                </p>
                {user?.role === "host_partner" &&
                  user?.hostPartnerType === "community_organizer" && (
                    <button
                      onClick={() => navigate("/create-event")}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Create Event
                    </button>
                  )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <div
                    key={event._id}
                    onClick={() => setSelectedEvent(event)}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {event.title}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(event.date)} at {event.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location?.city}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {event.currentParticipants} / {event.maxParticipants}{" "}
                        registered
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Scanner */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selected Event Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedEvent.title}
                    </h2>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(selectedEvent.date)} at {selectedEvent.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {selectedEvent.location?.address},{" "}
                        {selectedEvent.location?.city}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Change Event
                  </button>
                </div>
              </div>

              {/* Scan Buttons */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <button
                  onClick={() => setScannerActive(true)}
                  disabled={processingCheckIn}
                  className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Camera className="h-12 w-12 mx-auto mb-3" />
                  <span className="text-xl font-semibold">Scan QR Code</span>
                  <p className="text-sm opacity-90 mt-1">
                    Use camera to scan ticket
                  </p>
                </button>

                {/* Manual Entry */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        Or enter manually
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleManualCheckIn} className="mt-6">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={manualEntry}
                        onChange={(e) =>
                          setManualEntry(e.target.value.toUpperCase())
                        }
                        placeholder="IND-XXX-XXX"
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        disabled={processingCheckIn}
                      />
                      <button
                        type="submit"
                        disabled={!manualEntry.trim() || processingCheckIn}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Search className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Ticket Preview - Show before check-in */}
              {ticketPreview && !checkInResult && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-indigo-500">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Ticket className="h-5 w-5 mr-2 text-indigo-600" />
                      Ticket Information
                    </h3>
                    <button
                      onClick={() => setTicketPreview(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Ticket Number */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Ticket Number
                      </p>
                      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {ticketPreview.ticketNumber}
                      </p>
                    </div>

                    {/* User Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Attendee Name
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {ticketPreview.ticket.user.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Email
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {ticketPreview.ticket.user.email}
                        </p>
                      </div>
                    </div>

                    {/* Event Info */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Event
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {ticketPreview.ticket.event.title}
                      </p>
                    </div>

                    {/* Quantity */}
                    {ticketPreview.ticket.quantity > 1 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Number of Spots Booked
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {ticketPreview.ticket.quantity} Spots
                        </p>
                      </div>
                    )}

                    {/* Check-in Status */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Status
                      </p>
                      {ticketPreview.ticket.status === "checked_in" ? (
                        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span className="font-medium">
                            Already Checked In
                          </span>
                          {ticketPreview.ticket.checkInTime && (
                            <span className="ml-2 text-sm">
                              at {formatTime(ticketPreview.ticket.checkInTime)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="font-medium">
                            Ready for Check-in
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Check-in Button */}
                    <button
                      onClick={() => checkInTicket(ticketPreview.ticketNumber)}
                      disabled={
                        processingCheckIn ||
                        ticketPreview.ticket.status === "checked_in"
                      }
                      className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                        ticketPreview.ticket.status === "checked_in"
                          ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700 transform hover:scale-105"
                      } ${processingCheckIn ? "animate-pulse" : ""}`}
                    >
                      {processingCheckIn ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Checking In...
                        </span>
                      ) : ticketPreview.ticket.status === "checked_in" ? (
                        "Already Checked In"
                      ) : (
                        <>
                          <CheckCircle className="inline h-5 w-5 mr-2" />
                          Confirm Check-In
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Check-in Result */}
              {checkInResult && (
                <div
                  className={`rounded-lg shadow-lg p-6 ${
                    checkInResult.type === "success"
                      ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-500"
                      : "bg-red-50 dark:bg-red-900/20 border-2 border-red-500"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {checkInResult.type === "success" ? (
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3
                        className={`text-lg font-semibold mb-2 ${
                          checkInResult.type === "success"
                            ? "text-green-900 dark:text-green-100"
                            : "text-red-900 dark:text-red-100"
                        }`}
                      >
                        {checkInResult.message}
                      </h3>

                      {checkInResult.ticket && (
                        <div className="space-y-2 text-sm">
                          <div
                            className={
                              checkInResult.type === "success"
                                ? "text-green-800 dark:text-green-200"
                                : "text-red-800 dark:text-red-200"
                            }
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <User className="h-4 w-4" />
                              <span className="font-semibold">
                                {checkInResult.ticket.user.name}
                              </span>
                            </div>
                            <div className="ml-6">
                              {checkInResult.ticket.user.email}
                            </div>
                            <div className="ml-6 flex items-center mt-2">
                              <Ticket className="h-4 w-4 mr-2" />
                              {checkInResult.ticket.ticketNumber}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Recent Scans */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                  Recent Check-ins
                </h3>

                {recentScans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No check-ins yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentScans.map((scan, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          scan.status === "success"
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {scan.userName}
                          </span>
                          {scan.status === "success" ? (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          {scan.userEmail && <div>{scan.userEmail}</div>}
                          <div>{formatTime(scan.checkInTime)}</div>
                          {scan.status === "error" && scan.errorMessage && (
                            <div className="text-red-600 dark:text-red-400 mt-1">
                              {scan.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {scannerActive && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onScanError={(error) => {
            console.error("Scan error:", error);
            setCheckInResult({
              type: "error",
              message: error,
            });
          }}
          onClose={() => setScannerActive(false)}
          isScanning={scannerActive}
        />
      )}
    </div>
  );
};

export default ScanTickets;
