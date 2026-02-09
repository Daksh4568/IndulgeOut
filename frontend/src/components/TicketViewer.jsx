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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
        <div className="bg-black border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
          <p className="text-center text-gray-400 mt-4">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
        <div className="bg-black border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white">Error</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-black rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto my-8 relative border border-gray-800 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Ticket Content */}
        <div className="p-6">
          {/* Status Badge */}
          {ticket.status === 'checked_in' && (
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-5 h-5 rounded-full border-2 border-green-400 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">Checked In</span>
              </div>
              {ticket.checkInTime && (
                <span className="text-xs text-gray-500 ml-auto">
                  {formatDateTime(ticket.checkInTime)}
                </span>
              )}
            </div>
          )}

          {/* Event Title */}
          <h2 className="text-2xl font-bold text-white mb-2">{ticket.event.title}</h2>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-6">
            {ticket.metadata?.ticketType || 'General'} Admission
            {ticket.quantity > 1 && ` × ${ticket.quantity} Spots`}
          </p>

          {/* Event Details */}
          <div className="space-y-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
              </div>
              <p className="text-white text-sm ml-6">{formatDate(ticket.event.date)}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Time</p>
              </div>
              <p className="text-white text-sm ml-6">{ticket.event.time}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
              </div>
              <p className="text-white text-sm ml-6">
                {ticket.event.location.address}
              </p>
              <p className="text-gray-400 text-sm ml-6">{ticket.event.location.city}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 border-t border-dashed border-gray-700"></div>
            <div className="flex-1 border-t border-dashed border-gray-700"></div>
            <div className="flex-1 border-t border-dashed border-gray-700"></div>
            <div className="flex-1 border-t border-dashed border-gray-700"></div>
            <div className="flex-1 border-t border-dashed border-gray-700"></div>
          </div>

          {/* QR Code Section */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode className="h-4 w-4 text-gray-500" />
              <p className="text-xs text-gray-500 uppercase tracking-wider">Entry QR Code</p>
            </div>
            <div className="bg-white rounded-lg p-4 inline-block">
              <img
                src={ticket.qrCode}
                alt="Ticket QR Code"
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>

          {/* Ticket ID */}
          <div className="mb-6">
            <div className="border border-gray-700 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Ticket ID</p>
              <p className="text-white font-mono text-sm tracking-wider">{ticket.ticketNumber}</p>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-[#7878E9] to-[#3D3DD4] text-white py-3 rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
          >
            <Download className="h-5 w-5" />
            DOWNLOAD TICKET
          </button>
        </div>

        {/* Decorative semicircle cuts on sides - positioned at divider */}
        <div className="absolute left-0 top-[52%] -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-gray-800" style={{ background: 'rgba(0, 0, 0, 0.85)' }}></div>
        <div className="absolute right-0 top-[52%] -translate-y-1/2 translate-x-1/2 w-10 h-10 rounded-full border-2 border-gray-800" style={{ background: 'rgba(0, 0, 0, 0.85)' }}></div>
      </div>
    </div>
  );
};

export default TicketViewer;
