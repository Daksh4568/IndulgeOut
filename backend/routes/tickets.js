const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../utils/authUtils');
const ticketService = require('../services/ticketService');
const Ticket = require('../models/Ticket');

// @route   GET /api/tickets/my-tickets
// @desc    Get all tickets for logged-in user
// @access  Private
router.get('/my-tickets', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // Optional status filter

    const tickets = await ticketService.getUserTickets(userId, status);

    res.json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message
    });
  }
});

// @route   GET /api/tickets/:ticketId
// @desc    Get ticket details by ID or ticket number
// @access  Private
router.get('/:ticketId', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await ticketService.getTicketDetails(ticketId);

    // Verify user owns this ticket
    if (ticket.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this ticket'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(404).json({
      success: false,
      message: 'Ticket not found',
      error: error.message
    });
  }
});

// @route   GET /api/tickets/:ticketId/qr
// @desc    Get QR code for a ticket
// @access  Private
router.get('/:ticketId/qr', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await ticketService.getTicketDetails(ticketId);

    // Verify user owns this ticket
    if (ticket.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this ticket'
      });
    }

    res.json({
      success: true,
      qrCode: ticket.qrCode,
      ticketNumber: ticket.ticketNumber
    });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    res.status(404).json({
      success: false,
      message: 'QR code not found',
      error: error.message
    });
  }
});

// @route   POST /api/tickets/generate
// @desc    Generate a ticket (for registered events without tickets)
// @access  Private
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { eventId, amount, paymentId, ticketType, metadata } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Fetch event details to check registration and get price
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is registered for this event
    const isRegistered = event.participants.some(
      participant => participant.user && participant.user.toString() === req.user.id
    );

    if (!isRegistered) {
      return res.status(403).json({
        success: false,
        message: 'You are not registered for this event'
      });
    }

    // Check if ticket already exists
    const Ticket = require('../models/Ticket');
    const existingTicket = await Ticket.findOne({
      user: req.user.id,
      event: eventId
    });

    if (existingTicket) {
      return res.json({
        success: true,
        message: 'Ticket already exists',
        ticket: existingTicket
      });
    }

    // Generate new ticket
    const ticketAmount = amount !== undefined ? amount : (event.price?.amount || 0);

    const ticket = await ticketService.generateTicket({
      userId: req.user.id,
      eventId,
      amount: ticketAmount,
      paymentId,
      ticketType: ticketType || 'general',
      metadata: metadata || { generatedFor: 'past-registration' }
    });

    res.status(201).json({
      success: true,
      message: 'Ticket generated successfully',
      ticket
    });
  } catch (error) {
    console.error('❌ Error generating ticket:', error);
    
    // Handle duplicate key error
    if (error.code === 11000 || error.message.includes('duplicate')) {
      // Fetch the existing ticket and return it
      const Ticket = require('../models/Ticket');
      const existingTicket = await Ticket.findOne({
        user: req.user.id,
        event: req.body.eventId
      }).populate([
        { path: 'event', select: 'title date time location categories maxParticipants host' },
        { path: 'user', select: 'name email phoneNumber' }
      ]);
      
      return res.json({
        success: true,
        message: 'Ticket already exists',
        ticket: existingTicket
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error generating ticket',
      error: error.message
    });
  }
});

// @route   POST /api/tickets/:ticketId/cancel
// @desc    Cancel a ticket (DISABLED - Feature will be added later for B2C users)
// @access  Private
// DISABLED: Ticket cancellation feature removed for now
/*
router.post('/:ticketId/cancel', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await ticketService.cancelTicket(ticketId, req.user.id);

    res.json({
      success: true,
      message: 'Ticket cancelled successfully',
      ticket
    });
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    res.status(400).json({
      success: false,
      message: 'Error cancelling ticket',
      error: error.message
    });
  }
});
*/

// @route   GET /api/tickets/info/:ticketNumber
// @desc    Get ticket information without checking in (organizer/staff only)
// @access  Private
router.get('/info/:ticketNumber', authMiddleware, async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const ticketDetails = await ticketService.getTicketDetails(ticketNumber);

    // Verify that the user is authorized (event host or co-host)
    const isAuthorized = 
      ticketDetails.event.host.toString() === req.user.id ||
      ticketDetails.event.coHosts?.some(coHost => coHost.toString() === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this ticket'
      });
    }

    res.json({
      success: true,
      ticket: ticketDetails
    });
  } catch (error) {
    console.error('Error fetching ticket info:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Ticket not found',
      error: error.message
    });
  }
});

// @route   POST /api/tickets/check-in/:ticketNumber
// @desc    Check in a ticket at the event (organizer/staff only)
// @access  Private
router.post('/check-in/:ticketNumber', authMiddleware, async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    
    // Find the ticket to get event details
    const ticketDetails = await Ticket.findOne({ ticketNumber })
      .populate('event', 'host coHosts');
    
    if (!ticketDetails) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    // Authorization: Only event host or co-hosts can check in tickets
    const isAuthorized = 
      ticketDetails.event.host.toString() === req.user.id ||
      (ticketDetails.event.coHosts && ticketDetails.event.coHosts.some(coHost => coHost.toString() === req.user.id));
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to check in tickets for this event'
      });
    }
    
    const ticket = await ticketService.checkInTicket(ticketNumber, req.user.id);
    
    // Populate ticket with user details for response
    await ticket.populate('user', 'name email phoneNumber profilePicture');

    res.json({
      success: true,
      message: `✅ ${ticket.user.name} checked in successfully!`,
      ticket
    });
  } catch (error) {
    console.error('❌ Error checking in ticket:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error checking in ticket',
      error: error.message
    });
  }
});

// @route   GET /api/tickets/event/:eventId
// @desc    Get all tickets for an event (organizer only)
// @access  Private
router.get('/event/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.query;

    // Verify user is the event organizer or has permission
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Authorization: Only event host or co-hosts can view tickets
    const isAuthorized = 
      event.host.toString() === req.user.id ||
      (event.coHosts && event.coHosts.some(coHost => coHost.toString() === req.user.id));
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view tickets for this event'
      });
    }
    
    const tickets = await ticketService.getEventTickets(eventId, status);

    // Calculate statistics
    const stats = {
      total: tickets.length,
      active: tickets.filter(t => t.status === 'active').length,
      checkedIn: tickets.filter(t => t.status === 'checked_in').length,
      cancelled: tickets.filter(t => t.status === 'cancelled').length,
      refunded: tickets.filter(t => t.status === 'refunded').length
    };

    res.json({
      success: true,
      count: tickets.length,
      stats,
      tickets
    });
  } catch (error) {
    console.error('Error fetching event tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event tickets',
      error: error.message
    });
  }
});

// @route   PUT /api/tickets/:ticketId/regenerate-qr
// @desc    Regenerate QR code for a ticket
// @access  Private
router.put('/:ticketId/regenerate-qr', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await ticketService.getTicketDetails(ticketId);

    // Verify user owns this ticket
    if (ticket.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this ticket'
      });
    }

    const qrCode = await ticketService.regenerateQRCode(ticketId);

    res.json({
      success: true,
      message: 'QR code regenerated successfully',
      qrCode
    });
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Error regenerating QR code',
      error: error.message
    });
  }
});

module.exports = router;
