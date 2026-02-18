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
const notificationService = require('../services/notificationService.js');

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

    // Calculate revenue for each event from tickets
    const Ticket = require('../models/Ticket');
    const eventsWithRevenue = await Promise.all(events.map(async (event) => {
      const tickets = await Ticket.find({ event: event._id, status: { $ne: 'cancelled' } });
      
      // Calculate revenue using basePrice from metadata (order amount without fees)
      const revenue = tickets.reduce((sum, ticket) => {
        const ticketRevenue = ticket.metadata?.basePrice || ticket.price?.amount || 0;
        return sum + ticketRevenue;
      }, 0);
      
      // Convert to plain object and add revenue
      const eventObj = event.toObject();
      eventObj.revenue = revenue;
      return eventObj;
    }));

    res.json({
      events: eventsWithRevenue,
      total: eventsWithRevenue.length
    });
  } catch (error) {
    console.error('Get hosted events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }
    
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

    // Check if user is regular user or community organizer
    const userId = req.user.userId || req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Allow regular users (role: 'user') and community organizers (role: 'host_partner' with hostPartnerType: 'community_organizer') to create events
    const isAllowed = user.role === 'user' || 
                     (user.role === 'host_partner' && user.hostPartnerType === 'community_organizer');
    
    if (!isAllowed) {
      return res.status(403).json({ message: 'Only users and community organizers can create events' });
    }

    const eventData = {
      ...req.body,
      host: userId,
      createdBy: userId
    };

    const event = new Event(eventData);
    await event.save();

    // Add event to user's hosted events
    user.hostedEvents.push(event._id);
    await user.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('host', 'name email');

    // Send event published notification if status is published
    if (event.status === 'published') {
      setImmediate(async () => {
        try {
          await notificationService.notifyEventPublished(user._id, populatedEvent);
          console.log(`✅ Event published notification sent to ${user.name}`);
        } catch (notifError) {
          console.error('Failed to send event published notification:', notifError);
        }
      });
    }

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
    const { 
      quantity = 1,
      groupingOffer,
      additionalPersons = [],
      basePrice,
      gstAndOtherCharges,
      platformFees,
      totalAmount
    } = req.body;
    
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
    
    // Determine ticket quantity based on grouping offer or manual quantity
    let ticketQuantity;
    if (groupingOffer && groupingOffer.tierPeople > 0) {
      ticketQuantity = groupingOffer.tierPeople;
    } else {
      ticketQuantity = Math.min(Math.max(parseInt(quantity) || 1, 1), 10);
    }
    
    console.log(`📊 Registration request: quantity=${quantity}, ticketQuantity=${ticketQuantity}, groupingOffer=${JSON.stringify(groupingOffer)}`);
    
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
    
    // Prepare participant data
    const participantData = {
      user: userId,
      registeredAt: new Date(),
      status: 'registered',
      quantity: ticketQuantity
    };
    
    // Add grouping offer details if applicable
    if (groupingOffer) {
      participantData.groupingOffer = {
        tierLabel: groupingOffer.tierLabel,
        tierPeople: groupingOffer.tierPeople,
        tierPrice: groupingOffer.tierPrice
      };
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
        $push: { participants: participantData },
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

    // Generate ticket for the primary user
    let ticket = null;
    console.log(`🎫 [Ticket] Starting ticket generation for user ${userId}, event ${event._id}`);
    try {
      const ticketMetadata = {
        registrationSource: 'web',
        registeredAt: new Date(),
        slotsBooked: ticketQuantity,
        basePrice: basePrice || (event.price?.amount || 0) * ticketQuantity,
        gstAndOtherCharges: gstAndOtherCharges || 0,
        platformFees: platformFees || 0
      };
      
      if (groupingOffer) {
        ticketMetadata.groupingOffer = groupingOffer.tierLabel;
        ticketMetadata.tierPeople = groupingOffer.tierPeople;
      }
      
      ticket = await ticketService.generateTicket({
        userId: userId,
        eventId: event._id,
        amount: totalAmount || (event.price?.amount || 0) * ticketQuantity,
        paymentId: req.body.paymentId || null,
        ticketType: groupingOffer ? 'group' : (ticketQuantity > 1 ? 'group' : 'general'),
        quantity: ticketQuantity,
        metadata: ticketMetadata
      });
      console.log(`✅ Ticket generated: ${ticket.ticketNumber} (${ticketQuantity} slot${ticketQuantity > 1 ? 's' : ''})`);
      console.log(`🎫 [Ticket Generated] QR Code present: ${!!ticket?.qrCode}, Length: ${ticket?.qrCode?.length || 0}`);
    } catch (ticketError) {
      console.error('❌ [TICKET ERROR] Failed to generate ticket:', ticketError.message);
      console.error('❌ [TICKET ERROR STACK]:', ticketError.stack);
      console.error('❌ [TICKET ERROR] User:', userId, 'Event:', event._id);
      // Continue without failing the registration
    }

    // Send emails asynchronously without blocking the response
    console.log(`📧 [Event Registration] Preparing to send confirmation email to: ${user.email}`);
    console.log(`🎫 [Ticket Debug] Ticket exists: ${!!ticket}, Ticket Number: ${ticket?.ticketNumber}, QR Code exists: ${!!ticket?.qrCode}, QR Length: ${ticket?.qrCode?.length}`);
    setImmediate(async () => {
      try {
        console.log(`📬 [Email Send] Sending registration email for event: ${event.title}`);
        console.log(`🎫 [Email Ticket] About to send ticket:`, {
          hasTicket: !!ticket,
          ticketNumber: ticket?.ticketNumber,
          hasQrCode: !!ticket?.qrCode,
          qrCodeLength: ticket?.qrCode?.length
        });
        await sendEventRegistrationEmail(user.email, user.name, event, ticket);
        console.log(`✅ [Email Success] Registration email sent to: ${user.email}`);
      } catch (emailError) {
        console.error('❌ [Email Failed] Registration email error:', emailError.message);
        console.error('❌ [Email Details] User:', user.email, '| Event:', event.title);
      }
    });

    // Send tickets to additional persons if provided
    if (additionalPersons && additionalPersons.length > 0) {
      console.log(`📧 [Additional Persons] Sending tickets to ${additionalPersons.length} additional person(s)`);
      setImmediate(async () => {
        for (const person of additionalPersons) {
          if (person.email && person.name) {
            try {
              // Generate separate ticket for each additional person
              const additionalTicket = await ticketService.generateTicket({
                userId: userId, // Associate with primary user
                eventId: event._id,
                amount: 0, // No additional charge
                paymentId: req.body.paymentId || null,
                ticketType: 'guest',
                quantity: 1,
                metadata: {
                  registrationSource: 'web',
                  registeredAt: new Date(),
                  guestName: person.name,
                  guestEmail: person.email,
                  primaryUserId: userId,
                  slotsBooked: 1
                }
              });
              
              await sendEventRegistrationEmail(person.email, person.name, event, additionalTicket);
              console.log(`✅ [Additional Person] Ticket sent to: ${person.email}`);
            } catch (guestError) {
              console.error(`❌ [Additional Person] Failed to send ticket to ${person.email}:`, guestError.message);
            }
          }
        }
      });
    }

    setImmediate(async () => {
      try {
        await sendEventNotificationToHost(event.host.email, event.host.name, user, event);
      } catch (emailError) {
        console.error('Failed to send host notification:', emailError);
      }
    });

    // Send in-app booking confirmation notification to user
    setImmediate(async () => {
      try {
        await notificationService.notifyBookingConfirmed(userId, event, ticket);
        console.log(`✅ Booking confirmation notification sent to user ${userId}`);
      } catch (notifError) {
        console.error('Failed to send booking confirmation notification:', notifError);
      }
    });

    res.json({
      success: true,
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
      },
      additionalTicketsSent: additionalPersons.length
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
    
    // Calculate total slots (sum of all quantities for actual attendee count)
    const totalSlots = tickets.reduce((sum, ticket) => sum + (ticket.quantity || 1), 0);
    
    // Calculate statistics - use totalSlots for actual attendee/booking count
    const totalRegistered = totalSlots; // Total bookings = total spots booked
    const checkedIn = tickets.filter(t => t.status === 'checked_in').reduce((sum, t) => sum + (t.quantity || 1), 0);
    const notCheckedIn = tickets.filter(t => t.status === 'active').reduce((sum, t) => sum + (t.quantity || 1), 0);
    const cancelled = tickets.filter(t => t.status === 'cancelled').reduce((sum, t) => sum + (t.quantity || 1), 0);
    
    // Format attendee data - filter out tickets with null users (deleted accounts)
    const attendees = tickets
      .filter(ticket => ticket.user != null) // Skip tickets with deleted users
      .map(ticket => ({
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
    
    // Calculate revenue metrics (use basePrice from metadata, don't multiply by quantity as it's already the total)
    const totalRevenue = tickets
      .filter(t => t.status !== 'cancelled')
      .reduce((sum, ticket) => {
        // Use basePrice from metadata (order amount without fees)
        // If not available, fall back to ticket.price.amount (but don't multiply by quantity)
        const ticketRevenue = ticket.metadata?.basePrice || ticket.price?.amount || 0;
        return sum + ticketRevenue;
      }, 0);
    
    const avgPerAttendee = totalRegistered > 0 ? (totalRevenue / totalRegistered).toFixed(2) : 0;
    
    // Group revenue by ticket type
    const revenueByType = {};
    tickets.forEach(ticket => {
      if (ticket.status !== 'cancelled') {
        const ticketType = ticket.metadata?.ticketType || 'general';
        if (!revenueByType[ticketType]) {
          revenueByType[ticketType] = { type: ticketType, count: 0, revenue: 0 };
        }
        revenueByType[ticketType].count += ticket.quantity || 1;
        // Use basePrice from metadata (order amount without fees)
        const ticketRevenue = ticket.metadata?.basePrice || ticket.price?.amount || 0;
        revenueByType[ticketType].revenue += ticketRevenue;
      }
    });
    
    // Calculate fill percentage
    const fillPercentage = event.maxParticipants > 0 
      ? ((totalRegistered / event.maxParticipants) * 100).toFixed(1) 
      : 0;
    
    // Calculate conversion rate
    const views = event.analytics?.views || 0;
    const conversionRate = views > 0 ? ((totalRegistered / views) * 100).toFixed(2) : 0;
    
    // Calculate show-up rate and no-shows
    const showUpRate = totalRegistered > 0 ? ((checkedIn / totalRegistered) * 100).toFixed(1) : 0;
    const noShows = totalRegistered - checkedIn;
    
    // Calculate Demand Timing & Sales Velocity
    let demandTiming = null;
    if (tickets.length > 0) {
      const sortedByPurchase = [...tickets].sort((a, b) => 
        new Date(a.purchaseDate) - new Date(b.purchaseDate)
      );
      const firstBookingDate = sortedByPurchase[0].purchaseDate;
      const lastBookingDate = sortedByPurchase[sortedByPurchase.length - 1].purchaseDate;
      
      // Calculate booking period in days
      const bookingPeriodMs = new Date(lastBookingDate) - new Date(firstBookingDate);
      const bookingPeriodDays = Math.ceil(bookingPeriodMs / (1000 * 60 * 60 * 24));
      
      // Check if there was a last-minute surge (>30% in last 72 hours before event)
      const eventDate = new Date(event.date);
      const last72Hours = new Date(eventDate.getTime() - (72 * 60 * 60 * 1000));
      const lastMinuteBookings = tickets.filter(t => 
        new Date(t.purchaseDate) >= last72Hours
      ).length;
      const lastMinutePercentage = totalRegistered > 0 ? (lastMinuteBookings / totalRegistered) * 100 : 0;
      
      demandTiming = {
        firstBookingDate,
        bookingPeriodDays: bookingPeriodDays || 0,
        peakBookingMessage: lastMinutePercentage > 30 
          ? `${Math.round(lastMinutePercentage)}% bookings in last 72 hrs`
          : 'Steady bookings'
      };
    }
    
    // Calculate Audience Quality Snapshot
    let audienceQuality = null;
    if (totalRegistered > 0) {
      // Get all attendees' user IDs
      const attendeeUserIds = tickets
        .filter(t => t.user != null)
        .map(t => t.user._id);
      
      // Count how many are first-time vs repeat attendees
      // First-time: users who have only been to this event
      // Repeat: users who have been to other events on the platform
      const Ticket = require('../models/Ticket');
      const userEventCounts = await Ticket.aggregate([
        {
          $match: {
            user: { $in: attendeeUserIds },
            event: { $ne: event._id }
          }
        },
        {
          $group: {
            _id: '$user',
            eventCount: { $sum: 1 }
          }
        }
      ]);
      
      const repeatAttendeeIds = new Set(userEventCounts.map(u => u._id.toString()));
      const repeatCount = attendeeUserIds.filter(id => 
        repeatAttendeeIds.has(id.toString())
      ).length;
      const firstTimeCount = totalRegistered - repeatCount;
      
      // Calculate interest conversion (users whose interests match event categories)
      const attendeeUsers = await User.find({ _id: { $in: attendeeUserIds } })
        .select('interests location');
      
      const matchingInterests = attendeeUsers.filter(user => 
        user.interests && user.interests.some(interest => 
          event.categories.includes(interest)
        )
      ).length;
      
      // Calculate local distribution (users from same city as event)
      const localAttendees = attendeeUsers.filter(user => 
        user.location?.city && user.location.city.toLowerCase() === event.location.city.toLowerCase()
      ).length;
      
      audienceQuality = {
        firstTimeAttendees: Math.round((firstTimeCount / totalRegistered) * 100),
        repeatAttendees: Math.round((repeatCount / totalRegistered) * 100),
        interestConversion: Math.round((matchingInterests / totalRegistered) * 100),
        localDistribution: Math.round((localAttendees / totalRegistered) * 100)
      };
    }
    
    // Get Event Feedback & Reviews
    const Review = require('../models/Review');
    const reviews = await Review.find({ event: eventId })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const totalReviews = reviews.length;
    let avgRating = 0;
    let ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    if (totalReviews > 0) {
      avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
      reviews.forEach(r => {
        ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] || 0) + 1;
      });
    }
    
    const feedback = {
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalReviews,
      ratingBreakdown,
      recentReviews: reviews.slice(0, 3).map(r => ({
        id: r._id,
        userName: r.user?.name || 'Anonymous',
        userAvatar: r.user?.profilePicture,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt
      }))
    };
    
    console.log(`✅ Analytics fetched for event: ${event.title} - ${checkedIn}/${totalRegistered} attendees checked in, ${totalSlots} total slots`);
    
    res.json({
      success: true,
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      coreMetrics: {
        eventViews: views,
        uniqueViews: event.analytics?.uniqueViews || 0,
        totalBookings: totalRegistered,
        bookingsVsCapacity: `${totalRegistered}/${event.maxParticipants}`,
        fillPercentage: parseFloat(fillPercentage),
        conversionRate: parseFloat(conversionRate)
      },
      revenue: {
        totalRevenue,
        avgPerAttendee: parseFloat(avgPerAttendee),
        revenueByTicketType: Object.values(revenueByType)
      },
      attendance: {
        ticketsSold: tickets.length,
        totalAttendees: totalRegistered,
        actualCheckIns: checkedIn,
        showUpRate: parseFloat(showUpRate),
        noShows: noShows
      },
      demandTiming,
      audienceQuality,
      feedback,
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

// Get attendees for a specific event (only for registered users)
router.get('/:id/attendees', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const eventId = req.params.id;
    
    // Find the event
    const event = await Event.findById(eventId)
      .populate('participants.user', 'name email profilePicture bio interests');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if the requesting user is registered for this event
    const isRegistered = event.participants.some(
      p => p.user._id.toString() === userId
    );
    
    if (!isRegistered) {
      return res.status(403).json({ 
        message: 'You must be registered for this event to view attendees' 
      });
    }
    
    // Return list of attendees (excluding cancelled registrations)
    const attendees = event.participants
      .filter(p => p.status !== 'cancelled')
      .map(p => ({
        userId: p.user._id,
        name: p.user.name,
        profilePicture: p.user.profilePicture,
        bio: p.user.bio,
        interests: p.user.interests,
        registeredAt: p.registeredAt,
        status: p.status
      }));
    
    res.json({
      success: true,
      eventId: event._id,
      eventTitle: event.title,
      totalAttendees: attendees.length,
      attendees
    });
  } catch (error) {
    console.error('❌ Error fetching event attendees:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;