const QRCode = require('qrcode');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');

/**
 * Generate a ticket for an event registration
 * @param {Object} params - Ticket generation parameters
 * @param {String} params.userId - User ID
 * @param {String} params.eventId - Event ID
 * @param {Number} params.amount - Ticket price
 * @param {String} params.paymentId - Payment transaction ID
 * @param {String} params.ticketType - Type of ticket (general, vip, etc.)
 * @returns {Promise<Object>} Generated ticket
 */
const generateTicket = async ({ userId, eventId, amount, paymentId, ticketType = 'general', quantity = 1, metadata = {} }) => {
  try {
    // Check if ticket already exists for this user and event
    const existingTicket = await Ticket.findOne({
      user: userId,
      event: eventId
    }).populate([
      { path: 'event', select: 'title date time location categories maxParticipants host' },
      { path: 'user', select: 'name email phoneNumber' }
    ]);

    if (existingTicket) {
      console.log(`⚠️ Ticket already exists for user ${userId} and event ${eventId}: ${existingTicket.ticketNumber}`);
      return existingTicket;
    }

    // Validate event and user
    const event = await Event.findById(eventId).populate('host', 'name email');
    if (!event) {
      throw new Error('Event not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate unique ticket number
    const ticketNumber = await Ticket.generateTicketNumber();

    // Create QR code data (JSON string with ticket info)
    const qrData = JSON.stringify({
      ticketNumber,
      eventId: event._id.toString(),
      userId: user._id.toString(),
      eventName: event.title,
      userName: user.name,
      date: event.date,
      checkInUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/check-in/${ticketNumber}`
    });

    // Generate QR code as base64 image
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create ticket in database
    const ticket = new Ticket({
      ticketNumber,
      event: eventId,
      user: userId,
      qrCode: qrCodeImage,
      status: 'active',
      quantity: quantity || 1,
      price: {
        amount,
        currency: 'INR'
      },
      paymentId,
      metadata: {
        ticketType,
        ...metadata
      }
    });
    
    console.log(`🎫 Generating ticket with ${quantity} slot(s) for ${user.name}`);

    await ticket.save();

    // Populate ticket with event and user details
    await ticket.populate([
      { path: 'event', select: 'title date time location categories maxParticipants host' },
      { path: 'user', select: 'name email phoneNumber' }
    ]);

    return ticket;
  } catch (error) {
    console.error('Error generating ticket:', error);
    throw error;
  }
};

/**
 * Get ticket details with full information
 * @param {String} ticketId - Ticket ID or ticket number
 * @returns {Promise<Object>} Ticket with populated data
 */
const getTicketDetails = async (ticketId) => {
  try {
    let ticket = null;
    
    // Check if ticketId is a valid ObjectId format
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(ticketId) && ticketId.length === 24) {
      // Try to find by ID first
      ticket = await Ticket.findById(ticketId)
        .populate('event', 'title date time location categories maxParticipants host coHosts')
        .populate('user', 'name email phoneNumber')
        .populate('event.host', 'name email');
    }

    // If not found by ID, try by ticket number
    if (!ticket) {
      ticket = await Ticket.findOne({ ticketNumber: ticketId })
        .populate('event', 'title date time location categories maxParticipants host coHosts')
        .populate('user', 'name email phoneNumber')
        .populate('event.host', 'name email');
    }

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  } catch (error) {
    console.error('Error getting ticket details:', error);
    throw error;
  }
};

/**
 * Get all tickets for a user
 * @param {String} userId - User ID
 * @param {String} status - Filter by status (optional)
 * @returns {Promise<Array>} Array of tickets
 */
const getUserTickets = async (userId, status = null) => {
  try {
    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const tickets = await Ticket.find(query)
      .populate('event', 'title date time location categories maxParticipants')
      .sort({ purchaseDate: -1 });

    return tickets;
  } catch (error) {
    console.error('Error getting user tickets:', error);
    throw error;
  }
};

/**
 * Get all tickets for an event
 * @param {String} eventId - Event ID
 * @param {String} status - Filter by status (optional)
 * @returns {Promise<Array>} Array of tickets
 */
const getEventTickets = async (eventId, status = null) => {
  try {
    const query = { event: eventId };
    if (status) {
      query.status = status;
    }

    const tickets = await Ticket.find(query)
      .populate('user', 'name email phoneNumber')
      .sort({ purchaseDate: -1 });

    return tickets;
  } catch (error) {
    console.error('Error getting event tickets:', error);
    throw error;
  }
};

/**
 * Check in a ticket at the event
 * @param {String} ticketNumber - Ticket number
 * @param {String} staffUserId - ID of staff checking in the ticket
 * @returns {Promise<Object>} Updated ticket
 */
const checkInTicket = async (ticketNumber, staffUserId) => {
  try {
    const ticket = await Ticket.findOne({ ticketNumber })
      .populate('event', 'title date time location');

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status !== 'active') {
      throw new Error(`Ticket is ${ticket.status}, cannot check in`);
    }

    // TEMPORARILY DISABLED: Check if event has started (within 2 hours before start time)
    // const eventDate = new Date(ticket.event.date);
    // const now = new Date();
    // const twoHoursBefore = new Date(eventDate.getTime() - (2 * 60 * 60 * 1000));

    // if (now < twoHoursBefore) {
    //   throw new Error('Check-in not available yet. Opens 2 hours before event.');
    // }

    await ticket.checkIn(staffUserId);
    return ticket;
  } catch (error) {
    console.error('Error checking in ticket:', error);
    throw error;
  }
};

/**
 * Cancel a ticket
 * @param {String} ticketId - Ticket ID
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated ticket
 */
const cancelTicket = async (ticketId, userId) => {
  try {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.user.toString() !== userId) {
      throw new Error('Unauthorized to cancel this ticket');
    }

    await ticket.cancel();
    return ticket;
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    throw error;
  }
};

/**
 * Regenerate QR code for a ticket (if needed)
 * @param {String} ticketId - Ticket ID
 * @returns {Promise<String>} New QR code base64 image
 */
const regenerateQRCode = async (ticketId) => {
  try {
    const ticket = await getTicketDetails(ticketId);

    const qrData = JSON.stringify({
      ticketNumber: ticket.ticketNumber,
      eventId: ticket.event._id.toString(),
      userId: ticket.user._id.toString(),
      eventName: ticket.event.title,
      userName: ticket.user.name,
      date: ticket.event.date,
      checkInUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/check-in/${ticket.ticketNumber}`
    });

    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    ticket.qrCode = qrCodeImage;
    await ticket.save();

    return qrCodeImage;
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    throw error;
  }
};

module.exports = {
  generateTicket,
  getTicketDetails,
  getUserTickets,
  getEventTickets,
  checkInTicket,
  cancelTicket,
  regenerateQRCode
};
