const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Event = require('../models/Event.js');
const User = require('../models/User.js');
const { sendEventRegistrationEmail, sendEventNotificationToHost } = require('../utils/emailService.js');
const { authMiddleware } = require('../utils/authUtils.js');
const recommendationEngine = require('../services/recommendationEngine.js');
const ticketService = require('../services/ticketService.js');

const router = express.Router();

// Rate limiter for event registration to prevent abuse
// Allows 5 registration attempts per 15 minutes per IP
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many registration attempts. Please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many registration attempts. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Get all events (with filtering)
router.get('/', async (req, res) => {
  try {
    const { categories, city, date, page = 1, limit = 10 } = req.query;
    
    let filter = { status: 'published' };
    
    if (categories) {
      filter.categories = { $in: categories.split(',') };
    }
    
    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const now = new Date();
    const skip = (page - 1) * limit;
    
    // Get upcoming events (sorted by date ascending - soonest first)
    const upcomingEvents = await Event.find({
      ...filter,
      date: { $gte: now }
    })
      .populate('host', 'name email profilePicture')
      .populate('participants.user', 'name email')
      .sort({ date: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get past events (sorted by date descending - most recent first)
    const pastEvents = await Event.find({
      ...filter,
      date: { $lt: now }
    })
      .populate('host', 'name email profilePicture')
      .populate('participants.user', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .skip(Math.max(0, skip - upcomingEvents.length))
      .limit(Math.max(0, parseInt(limit) - upcomingEvents.length));
    
    // Combine: upcoming events first, then past events
    const events = [...upcomingEvents, ...pastEvents];
    
    // Get total counts
    const totalUpcoming = await Event.countDocuments({
      ...filter,
      date: { $gte: now }
    });
    const totalPast = await Event.countDocuments({
      ...filter,
      date: { $lt: now }
    });
    const total = totalUpcoming + totalPast;

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get events hosted by the authenticated user
router.get('/my-hosted', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ host: req.user.id })
      .populate('host', 'name email')
      .populate('participants.user', 'name email')
      .sort({ date: 1 });

    res.json({
      events,
      total: events.length
    });
  } catch (error) {
    console.error('Get hosted events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('host', 'name email bio profilePicture')
      .populate('coHosts', 'name email bio profilePicture')
      .populate('participants.user', 'name email profilePicture');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new event (community members only)
router.post('/', authMiddleware, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('categories').isArray({ min: 1 }).withMessage('At least one category is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('location.city').notEmpty().withMessage('City is required'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    // Check if user is community member
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'community_member') {
      return res.status(403).json({ message: 'Only community members can create events' });
    }

    const eventData = {
      ...req.body,
      host: req.user.id,
      createdBy: req.user.id
    };

    const event = new Event(eventData);
    await event.save();

    // Add event to user's hosted events
    user.hostedEvents.push(event._id);
    await user.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('host', 'name email');

    res.status(201).json({
      message: 'Event created successfully',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register for event - with rate limiting
router.post('/:id/register', registrationLimiter, authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { quantity = 1 } = req.body; // Get quantity from request, default to 1
    
    // Check if user is allowed to register (only regular users, not host_partner or admin)
    const User = require('../models/User');
    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (currentUser.role !== 'user') {
      return res.status(403).json({ 
        message: 'Only regular users can register for events. Organizers, venues, and sponsors cannot register as attendees.' 
      });
    }
    
    // Validate quantity
    const ticketQuantity = Math.min(Math.max(parseInt(quantity) || 1, 1), 10);
    console.log(`📊 Registration request: quantity=${quantity}, ticketQuantity=${ticketQuantity}`);
    
    // First check if user is already registered
    const existingEvent = await Event.findById(req.params.id);
    
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const alreadyRegistered = existingEvent.participants.some(
      p => p.user.toString() === userId
    );
    
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }
    
    // Check if enough spots are available (use currentParticipants to account for quantity)
    const availableSpots = existingEvent.maxParticipants - (existingEvent.currentParticipants || 0);
    if (ticketQuantity > availableSpots) {
      return res.status(400).json({ 
        message: `Only ${availableSpots} spot(s) available. You requested ${ticketQuantity}.`
      });
    }
    
    // Use findOneAndUpdate with atomic operations to prevent race conditions
    console.log(`🔄 Incrementing currentParticipants by ${ticketQuantity} for event ${req.params.id}`);
    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        // Ensure user isn't already registered
        'participants.user': { $ne: userId }
      },
      {
        // Atomic update: add participant with quantity AND increment currentParticipants by quantity
        $push: {
          participants: {
            user: userId,
            registeredAt: new Date(),
            status: 'registered',
            quantity: ticketQuantity
          }
        },
        $inc: { currentParticipants: ticketQuantity }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('host', 'name email');
    
    console.log(`✅ Event updated: currentParticipants is now ${event?.currentParticipants}`);

    if (!event) {
      // Check which condition failed
      const existingEvent = await Event.findById(req.params.id);
      
      if (!existingEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const alreadyRegistered = existingEvent.participants.some(
        p => p.user.toString() === userId
      );
      
      if (alreadyRegistered) {
        return res.status(400).json({ message: 'Already registered for this event' });
      }
      
      if (existingEvent.participants.length >= existingEvent.maxParticipants) {
        return res.status(400).json({ message: 'Event is full' });
      }
      
      return res.status(400).json({ message: 'Registration failed. Please try again.' });
    }

    // currentParticipants already incremented atomically in the update query above
    // No need to call updateParticipantCount()

    const user = await User.findById(req.user.userId);
    user.registeredEvents.push(event._id);
    await user.save();

    // Update analytics for recommendation engine
    try {
      await recommendationEngine.updateEventRegistrationAnalytics(req.user.userId, event._id);
    } catch (analyticsError) {
      console.error('Failed to update analytics:', analyticsError);
      // Continue without failing the registration
    }

    // Update analytics for recommendation system
    try {
      await recommendationEngine.updateEventRegistrationAnalytics(userId, event._id);
    } catch (analyticsError) {
      console.error('Failed to update analytics:', analyticsError);
      // Don't fail the registration if analytics update fails
    }

    // Generate ticket for the event
    let ticket = null;
    try {
      ticket = await ticketService.generateTicket({
        userId: userId,
        eventId: event._id,
        amount: (event.price?.amount || 0) * ticketQuantity, // Total price based on quantity
        paymentId: req.body.paymentId || null,
        ticketType: ticketQuantity > 1 ? 'group' : 'general',
        quantity: ticketQuantity,
        metadata: {
          registrationSource: 'web',
          registeredAt: new Date(),
          slotsBooked: ticketQuantity
        }
      });
      console.log(`✅ Ticket generated: ${ticket.ticketNumber} (${ticketQuantity} slot${ticketQuantity > 1 ? 's' : ''})`);
    } catch (ticketError) {
      console.error('❌ Failed to generate ticket:', ticketError);
      // Continue without failing the registration
    }

    // Send emails asynchronously without blocking the response
    // This prevents email delays from slowing down registration
    setImmediate(async () => {
      try {
        await sendEventRegistrationEmail(user.email, user.name, event, ticket);
      } catch (emailError) {
        console.error('Failed to send registration email:', emailError);
      }
    });

    setImmediate(async () => {
      try {
        await sendEventNotificationToHost(event.host.email, event.host.name, user, event);
      } catch (emailError) {
        console.error('Failed to send host notification:', emailError);
      }
    });

    res.json({
      message: 'Successfully registered for event',
      ticket: ticket ? {
        ticketNumber: ticket.ticketNumber,
        qrCode: ticket.qrCode,
        id: ticket._id
      } : null,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        currentParticipants: event.currentParticipants
      }
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get events by user interests
router.get('/recommended/for-me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.interests.length) {
      return res.status(400).json({ message: 'No interests found for user' });
    }

    const events = await Event.find({
      categories: { $in: user.interests },
      status: 'published',
      date: { $gte: new Date() }
    })
    .populate('host', 'name email')
    .sort({ date: 1 })
    .limit(20);

    res.json({ events });
  } catch (error) {
    console.error('Get recommended events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update event (host only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the host
    if (event.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only event host can update this event' });
    }

    // Prevent editing past events
    const eventDate = new Date(event.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of today
    
    if (eventDate < now) {
      return res.status(400).json({ 
        message: '❌ Cannot edit past events. This event has already occurred.' 
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('host', 'name email');

    console.log(`✅ Event updated: ${updatedEvent.title}`);
    
    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('❌ Update event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete event (host only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the host
    if (event.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only event host can delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Track event click for analytics
router.post('/:id/click', authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.userId;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Use the trackClick method from Event model
    await event.trackClick(userId, 'event_discovery');

    res.json({ 
      message: 'Click tracked successfully',
      totalClicks: event.analytics.clicks 
    });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Track event view for analytics
router.post('/:id/view', async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user?.userId || null; // Optional auth
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Use the trackView method from Event model
    await event.trackView(userId);

    res.json({ 
      message: 'View tracked successfully',
      totalViews: event.analytics.views,
      uniqueViews: event.analytics.uniqueViews
    });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/events/:id/analytics
// @desc    Get event attendance analytics with check-in status (organizer only)
// @access  Private
router.get('/:id/analytics', authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }
    
    // Authorization: Only event host or co-hosts can view analytics
    const isAuthorized = 
      event.host.toString() === req.user.id ||
      (event.coHosts && event.coHosts.some(coHost => coHost.toString() === req.user.id));
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view analytics for this event'
      });
    }
    
    // Get all tickets for this event with user details
    const Ticket = require('../models/Ticket');
    const tickets = await Ticket.find({ event: eventId })
      .populate('user', 'name email phoneNumber profilePicture')
      .populate('checkInBy', 'name')
      .sort({ purchaseDate: -1 });
    
    // Calculate statistics
    const totalRegistered = tickets.length;
    const checkedIn = tickets.filter(t => t.status === 'checked_in').length;
    const notCheckedIn = tickets.filter(t => t.status === 'active').length;
    const cancelled = tickets.filter(t => t.status === 'cancelled').length;
    
    // Format attendee data
    const attendees = tickets.map(ticket => ({
      ticketId: ticket._id, // Unique ticket ID for React key
      userId: ticket.user._id,
      name: ticket.user.name,
      email: ticket.user.email,
      phoneNumber: ticket.user.phoneNumber,
      profilePicture: ticket.user.profilePicture,
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.metadata?.ticketType || 'general',
      quantity: ticket.quantity || 1,
      status: ticket.status,
      purchaseDate: ticket.purchaseDate,
      checkInTime: ticket.checkInTime,
      checkInBy: ticket.checkInBy?.name || null
    }));
    
    // Calculate total slots (sum of all quantities)
    const totalSlots = tickets.reduce((sum, ticket) => sum + (ticket.quantity || 1), 0);
    
    console.log(`✅ Analytics fetched for event: ${event.title} - ${checkedIn}/${totalRegistered} tickets, ${totalSlots} total slots`);
    
    res.json({
      success: true,
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      statistics: {
        totalTickets: totalRegistered,
        totalSlots,
        checkedIn,
        notCheckedIn,
        cancelled,
        attendanceRate: totalRegistered > 0 ? ((checkedIn / totalRegistered) * 100).toFixed(1) : 0
      },
      attendees
    });
  } catch (error) {
    console.error('❌ Error fetching event analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;