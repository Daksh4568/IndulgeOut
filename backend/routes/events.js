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

    // Check if user is community organizer
    const user = await User.findById(req.user.id);
    if (!user || !(user.role === 'host_partner' && user.hostPartnerType === 'community_organizer')) {
      return res.status(403).json({ message: 'Only community organizers can create events' });
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

    // Send notification if event is published
    if (populatedEvent.status === 'published') {
      setImmediate(async () => {
        try {
          await notificationService.notifyEventPublished(req.user.id, populatedEvent);
        } catch (error) {
          console.error('Failed to send event published notification:', error);
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

    // Send in-app notifications
    setImmediate(async () => {
      try {
        // Notify user of booking confirmation
        await notificationService.notifyBookingConfirmed(userId, event, ticket);

        // Notify user that QR code is ready
        if (ticket) {
          await notificationService.notifyCheckinQRReady(userId, event, ticket);
        }

        // Check if this is the first booking for the host
        if (event.currentParticipants === ticketQuantity) {
          await notificationService.notifyFirstBookingReceived(
            event.host._id,
            event,
            user.name
          );
        }

        // Check for milestone notifications
        const milestones = [10, 25, 50, 100, 200, 500];
        if (milestones.includes(event.currentParticipants)) {
          await notificationService.notifyMilestoneReached(
            event.host._id,
            event,
            event.currentParticipants
          );
        }

        // Check capacity alerts
        const percentageFull = (event.currentParticipants / event.maxParticipants) * 100;

        if (percentageFull >= 80 && percentageFull < 100) {
          // Check if we haven't sent this notification before
          const previousParticipants = event.currentParticipants - ticketQuantity;
          const previousPercentage = (previousParticipants / event.maxParticipants) * 100;

          if (previousPercentage < 80) {
            await notificationService.notifyEventNearingFull(
              event.host._id,
              event,
              Math.round(percentageFull)
            );
          }
        }

        // Check if sold out
        if (event.currentParticipants >= event.maxParticipants) {
          await notificationService.notifyCapacityReached(event.host._id, event);
        }
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
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
// @desc    Get comprehensive event analytics (organizer only)
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
    const Review = require('../models/Review');
    const User = require('../models/User');

    const tickets = await Ticket.find({ event: eventId })
      .populate('user', 'name email phoneNumber profilePicture createdAt interests location')
      .populate('checkInBy', 'name')
      .sort({ purchaseDate: -1 });

    // Get reviews for this event
    const reviews = await Review.find({ event: eventId })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalTickets = tickets.length;
    const totalSlots = tickets.reduce((sum, ticket) => sum + (ticket.quantity || 1), 0);
    const checkedIn = tickets.filter(t => t.status === 'checked_in').length;
    const notCheckedIn = tickets.filter(t => t.status === 'active').length;
    const cancelled = tickets.filter(t => t.status === 'cancelled').length;

    // Core Performance Metrics
    const eventViews = event.analytics?.views || 0;
    const conversionRate = eventViews > 0 ? ((totalTickets / eventViews) * 100).toFixed(2) : 0;
    const avgFillRate = event.maxParticipants > 0
      ? Math.round((totalSlots / event.maxParticipants) * 100)
      : 0;

    // Revenue Performance
    const ticketRevenue = tickets
      .filter(t => t.status !== 'cancelled')
      .reduce((sum, ticket) => sum + (ticket.price?.amount || 0), 0);

    const avgRevenuePerAttendee = totalTickets > 0
      ? Math.round(ticketRevenue / totalTickets)
      : 0;

    // Revenue by ticket type
    const revenueByType = {};
    tickets.filter(t => t.status !== 'cancelled').forEach(ticket => {
      const type = ticket.metadata?.ticketType || 'general';
      if (!revenueByType[type]) {
        revenueByType[type] = { count: 0, revenue: 0 };
      }
      revenueByType[type].count += 1;
      revenueByType[type].revenue += ticket.price?.amount || 0;
    });

    // Attendance & Show-up Quality
    const showUpRate = totalTickets > 0
      ? ((checkedIn / totalTickets) * 100).toFixed(1)
      : 0;
    const noShows = notCheckedIn;

    // Demand Timing & Sales Velocity
    const firstBooking = tickets.length > 0
      ? tickets[tickets.length - 1].purchaseDate
      : null;

    // Calculate bookings in last 72 hours
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const recentBookings = tickets.filter(t =>
      new Date(t.purchaseDate) > seventyTwoHoursAgo
    ).length;
    const recentBookingPercentage = totalTickets > 0
      ? Math.round((recentBookings / totalTickets) * 100)
      : 0;

    // Booking period (days between first and last booking)
    const lastBooking = tickets.length > 0 ? tickets[0].purchaseDate : null;
    const bookingPeriodDays = firstBooking && lastBooking
      ? Math.ceil((new Date(lastBooking) - new Date(firstBooking)) / (1000 * 60 * 60 * 24))
      : 0;

    // Audience Quality Snapshot
    const uniqueAttendees = new Set(tickets.map(t => t.user._id.toString()));

    // Get all tickets by these users to determine first-time vs repeat
    const allUserTickets = await Ticket.find({
      user: { $in: Array.from(uniqueAttendees) },
      event: { $ne: eventId },
      status: { $ne: 'cancelled' }
    });

    const repeatAttendees = new Set();
    allUserTickets.forEach(ticket => {
      repeatAttendees.add(ticket.user.toString());
    });

    const firstTimeCount = uniqueAttendees.size - repeatAttendees.size;
    const repeatCount = repeatAttendees.size;
    const firstTimePercentage = uniqueAttendees.size > 0
      ? Math.round((firstTimeCount / uniqueAttendees.size) * 100)
      : 0;
    const repeatPercentage = uniqueAttendees.size > 0
      ? Math.round((repeatCount / uniqueAttendees.size) * 100)
      : 0;

    // Interest conversion (percentage of attendees whose interests match event categories)
    let interestMatchCount = 0;
    tickets.forEach(ticket => {
      if (ticket.user.interests && ticket.user.interests.length > 0) {
        const hasMatch = ticket.user.interests.some(interest =>
          event.categories.some(cat => cat.toLowerCase().includes(interest.toLowerCase()))
        );
        if (hasMatch) interestMatchCount++;
      }
    });
    const interestConversion = totalTickets > 0
      ? Math.round((interestMatchCount / totalTickets) * 100)
      : 0;

    // Local distribution (percentage from same city)
    const localCount = tickets.filter(ticket =>
      ticket.user.location?.city?.toLowerCase() === event.location?.city?.toLowerCase()
    ).length;
    const localPercentage = totalTickets > 0
      ? Math.round((localCount / totalTickets) * 100)
      : 0;

    // Event Outcome & Feedback
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;
    const totalReviews = reviews.length;

    // Rating breakdown
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingBreakdown[review.rating]++;
    });

    // Recent reviews (top 5)
    const recentReviews = reviews.slice(0, 5).map(review => ({
      id: review._id,
      userName: review.user.name,
      userProfilePicture: review.user.profilePicture,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      photos: review.photos
    }));

    // Format attendee data
    const attendees = tickets.map(ticket => ({
      ticketId: ticket._id,
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

    console.log(`✅ Comprehensive analytics fetched for event: ${event.title}`);

    res.json({
      success: true,
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      eventCategory: event.categories?.[0] || 'Event',

      // Core Performance Metrics
      coreMetrics: {
        eventViews,
        totalBookings: totalTickets,
        bookingsVsCapacity: `${totalSlots}/${event.maxParticipants}`,
        fillPercentage: avgFillRate,
        conversionRate
      },

      // Revenue Performance
      revenue: {
        totalRevenue: ticketRevenue,
        avgPerAttendee: avgRevenuePerAttendee,
        revenueByTicketType: Object.entries(revenueByType).map(([type, data]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count: data.count,
          revenue: data.revenue
        }))
      },

      // Attendance & Show-up Quality
      attendance: {
        ticketsSold: totalTickets,
        actualCheckIns: checkedIn,
        showUpRate,
        noShows
      },

      // Demand Timing & Sales Velocity
      demandTiming: {
        firstBookingDate: firstBooking,
        peakBookingMessage: recentBookingPercentage > 0
          ? `${recentBookingPercentage}% bookings in last 72 hrs`
          : null,
        bookingPeriodDays
      },

      // Audience Quality
      audienceQuality: {
        firstTimeAttendees: firstTimePercentage,
        repeatAttendees: repeatPercentage,
        interestConversion,
        localDistribution: localPercentage
      },

      // Event Outcome & Feedback
      feedback: {
        avgRating,
        totalReviews,
        ratingBreakdown,
        recentReviews
      },

      // Basic statistics (for backward compatibility)
      statistics: {
        totalTickets,
        totalSlots,
        checkedIn,
        notCheckedIn,
        cancelled,
        attendanceRate: totalTickets > 0 ? ((checkedIn / totalTickets) * 100).toFixed(1) : 0
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