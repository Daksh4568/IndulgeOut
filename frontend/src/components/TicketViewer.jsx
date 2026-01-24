import React, { useState, useEffect } from 'react';
import { X, Download, MapPin, Calendar, Clock, Ticket as TicketIcon, QrCode } from 'lucide-react';
import { api } from '../config/api';

const TicketViewer = ({ ticketId, eventId, onClose }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTicket();
  }, [ticketId, eventId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch by ticket ID first, if not available fetch by event ID
      let response;
      if (ticketId) {
        response = await api.get(`/tickets/${ticketId}`);
      } else if (eventId) {
        // Get all user tickets and find the one for this event
        const allTickets = await api.get('/tickets/my-tickets');
        const eventTicket = allTickets.data.tickets.find(
          t => t.event._id === eventId || t.event === eventId
        );
        
        if (eventTicket) {
          response = { data: { ticket: eventTicket } };
        } else {
          // No ticket found - user should register first
          throw new Error('No ticket found for this event. Please register for the event first.');
        }
      }

      setTicket(response.data.ticket);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!ticket) return;

    // Create a printable version of the ticket
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${ticket.ticketNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 600px;
            margin: 0 auto;
          }
          .ticket-container {
            border: 2px dashed #22c55e;
            border-radius: 12px;
            padding: 30px;
            background: #f9fafb;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .ticket-number {
            font-size: 24px;
            font-weight: bold;
            color: #22c55e;
            margin: 10px 0;
          }
          .event-info {
            margin: 20px 0;
          }
          .event-title {
            font-size: 22px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
          }
          .info-row {
            margin: 10px 0;
            color: #666;
          }
          .qr-section {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .qr-code {
            max-width: 250px;
            margin: 20px auto;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #999;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="header">
            <h1 style="margin: 0; color: #22c55e;">🎫 Event Ticket</h1>
            <p class="ticket-number">${ticket.ticketNumber}</p>
            <p style="color: #666; margin: 5px 0;">${ticket.metadata?.ticketType || 'General'} Admission${ticket.quantity > 1 ? ` × ${ticket.quantity} Spots` : ''}</p>
          </div>
          
          <div class="event-info">
            <h2 class="event-title">${ticket.event.title}</h2>
            <div class="info-row"><strong>📅 Date:</strong> ${new Date(ticket.event.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="info-row"><strong>🕒 Time:</strong> ${ticket.event.time}</div>
            <div class="info-row"><strong>📍 Location:</strong> ${ticket.event.location.address}, ${ticket.event.location.city}</div>
            <div class="info-row"><strong>💵 Price:</strong> ₹${ticket.price.amount.toLocaleString('en-IN')}</div>
          </div>
          
          <div class="qr-section">
            <p style="color: #666; margin-bottom: 15px;"><strong>Scan this QR code at the entrance:</strong></p>
            <img src="${ticket.qrCode}" alt="QR Code" class="qr-code" />
            <p style="color: #999; font-size: 12px; margin-top: 15px;">
              Please have this ticket ready when you arrive
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 IndulgeOut. All rights reserved.</p>
            <p>Ticket purchased on ${new Date(ticket.purchaseDate).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    const statusColors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      checked_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
        {ticket.status === 'checked_in' ? '✅ Checked In' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-4">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Error</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <TicketIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Ticket</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Ticket Content */}
        <div className="p-6">
          {/* Ticket Number & Status */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-dashed border-gray-300 dark:border-gray-600">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ticket Number</p>
              <p className="text-2xl font-bold text-green-600">{ticket.ticketNumber}</p>
              <p className="text-sm text-gray-500 mt-1">
                {ticket.metadata?.ticketType || 'General'} Admission
                {ticket.quantity > 1 && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold">
                    × {ticket.quantity} Spots
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge()}
              {ticket.status === 'checked_in' && ticket.checkInTime && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium">Checked in at</p>
                  <p className="text-xs">{formatDateTime(ticket.checkInTime)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{ticket.event.title}</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <Calendar className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(ticket.event.date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.event.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {ticket.event.location.address}<br />
                    {ticket.event.location.city}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Entry QR Code</h4>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex justify-center">
              <img
                src={ticket.qrCode}
                alt="Ticket QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              Show this QR code at the event entrance
            </p>
          </div>

          {/* Purchase Info */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-6">
            <span>Price Paid: ₹{ticket.price.amount.toLocaleString('en-IN')}</span>
            <span>Purchased: {new Date(ticket.purchaseDate).toLocaleDateString('en-IN')}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              Download / Print Ticket
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketViewer;
