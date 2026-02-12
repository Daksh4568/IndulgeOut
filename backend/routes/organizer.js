const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../utils/authUtils');
const { checkAndGenerateActionRequiredNotifications } = require('../utils/checkUserActionRequirements');

// ==================== ACTION REQUIRED ====================
/**
 * GET /api/organizer/action-required
 * Get all pending action items for the organizer
 */
router.get('/action-required', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a community organizer
    const user = await User.findById(userId);
    if (!user || !(user.role === 'host_partner' && user.hostPartnerType === 'community_organizer')) {
      return res.status(403).json({ message: 'Only community organizers can access this resource' });
    }

    // Check and cleanup action notifications (removes completed items like KYC)
    await checkAndGenerateActionRequiredNotifications(userId);

    console.log('[Action Required] Fetching for user:', userId);
    const actionItems = [];

    // 1. Check for draft events not published
    const draftEvents = await Event.find({
      host: userId,
      status: 'draft'
    }).select('title date');
    console.log('[Action Required] Draft events found:', draftEvents.length);

    draftEvents.forEach(event => {
      const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 30 && daysUntil > 0) {
        actionItems.push({
          id: `draft_${event._id}`,
          type: 'draft_event',
          priority: daysUntil <= 7 ? 'high' : 'medium',
          title: 'Draft Event Not Published',
          description: `"${event.title}" is scheduled in ${daysUntil} days but still in draft mode.`,
          ctaText: 'Publish Now',
          eventId: event._id,
          metadata: {
            eventName: event.title,
            daysUntil
          }
        });
      }
    });

    // 2. Check for low-fill alerts (events with <40% booking within 7 days)
    const upcomingEvents = await Event.find({
      host: userId,
      status: 'published',
      date: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    }).select('title date maxParticipants currentParticipants');
    console.log('[Action Required] Upcoming events for low-fill check:', upcomingEvents.length);

    upcomingEvents.forEach(event => {
      const fillPercentage = (event.currentParticipants / event.maxParticipants) * 100;
      if (fillPercentage < 40) {
        const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
        actionItems.push({
          id: `lowfill_${event._id}`,
          type: 'low_fill',
          priority: daysUntil <= 3 ? 'high' : 'medium',
          title: 'Low Booking Alert',
          description: `"${event.title}" is only ${Math.round(fillPercentage)}% filled with ${daysUntil} days to go.`,
          ctaText: 'Promote Event',
          eventId: event._id,
          metadata: {
            eventName: event.title,
            daysUntil,
            fillPercentage: Math.round(fillPercentage)
          }
        });
      }
    });

    // 3. Get KYC/Profile notifications from the database
    const systemNotifications = await Notification.find({
      recipient: userId,
      category: 'action_required'
    }).select('type title message actionButton priority createdAt').sort({ createdAt: -1 });

    // Deduplicate notifications by type - keep only the most recent of each type
    const seenTypes = new Set();
    systemNotifications.forEach(notif => {
      if (!seenTypes.has(notif.type)) {
        seenTypes.add(notif.type);
        actionItems.push({
          id: notif._id.toString(),
          type: notif.type,
          priority: notif.priority || 'medium',
          title: notif.title,
          description: notif.message,
          ctaText: notif.actionButton?.text || 'Take Action',
          createdAt: notif.createdAt
        });
      }
    });

    // 4. TODO: Check for pending collaboration requests (venues/brands)
    // This requires a Collaboration model to be created

    // Sort by priority: high -> medium -> low
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    actionItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    res.json(actionItems);
  } catch (error) {
    console.error('Error fetching action items:', error);
    res.status(500).json({ message: 'Server error fetching action items' });
  }
});

// ==================== MANAGE EVENTS ====================
/**
 * GET /api/organizer/events
 * Get all events organized by status (draft, live, past)
 */
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a community organizer
    const user = await User.findById(userId);
    if (!user || !(user.role === 'host_partner' && user.hostPartnerType === 'community_organizer')) {
      return res.status(403).json({ message: 'Only community organizers can access this resource' });
    }

    const now = new Date();
    console.log('[Events] Fetching events for user:', userId);
    console.log('[Events] Current time:', now);

    // First, check if ANY events exist for this user
    const allUserEvents = await Event.find({ host: userId });
    console.log('[Events] Total events by this user:', allUserEvents.length);
    if (allUserEvents.length > 0) {
      console.log('[Events] Sample event:', {
        id: allUserEvents[0]._id,
        title: allUserEvents[0].title,
        status: allUserEvents[0].status,
        date: allUserEvents[0].date,
        host: allUserEvents[0].host
      });
    }

    // Fetch all events by host
    // Draft: Draft events with future dates only
    const draftEvents = await Event.find({
      host: userId,
      status: 'draft',
      date: { $gte: now }
    }).sort({ date: 1 });
    console.log('[Events] Draft events found:', draftEvents.length);

    // Live: Published events with future dates
    const liveEvents = await Event.find({
      host: userId,
      status: 'published',
      date: { $gte: now }
    }).sort({ date: 1 });
    console.log('[Events] Live events found:', liveEvents.length);

    // Past: All events (draft, published, completed, cancelled) with past dates
    const pastEvents = await Event.find({
      host: userId,
      date: { $lt: now }
    }).sort({ date: -1 });
    console.log('[Events] Past events found:', pastEvents.length);

    // Calculate fill percentage and revenue for each event
    const enrichEvent = (event) => {
      const fillPercentage = event.maxParticipants > 0
        ? Math.round((event.currentParticipants / event.maxParticipants) * 100)
        : 0;

      const revenue = event.ticketPrice
        ? event.currentParticipants * event.ticketPrice
        : 0;

      return {
        _id: event._id,
        title: event.title,
        date: event.date,
        status: event.status,
        image: event.images?.[0] || null,
        currentParticipants: event.currentParticipants || 0,
        maxParticipants: event.maxParticipants,
        fillPercentage,
        revenue
      };
    };

    res.json({
      draft: draftEvents.map(enrichEvent),
      live: liveEvents.map(enrichEvent),
      past: pastEvents.map(enrichEvent)
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

/**
 * POST /api/organizer/events/:eventId/duplicate
 * Duplicate an existing event
 */
router.post('/events/:eventId/duplicate', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Find original event
    const originalEvent = await Event.findOne({ _id: eventId, host: userId });
    if (!originalEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Create duplicate
    const duplicatedEvent = new Event({
      ...originalEvent.toObject(),
      _id: undefined,
      title: `${originalEvent.title} (Copy)`,
      status: 'draft',
      currentParticipants: 0,
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await duplicatedEvent.save();

    res.json({
      message: 'Event duplicated successfully',
      event: duplicatedEvent
    });
  } catch (error) {
    console.error('Error duplicating event:', error);
    res.status(500).json({ message: 'Server error duplicating event' });
  }
});

// ==================== EARNINGS OVERVIEW ====================
/**
 * GET /api/organizer/earnings
 * Get earnings overview for the organizer
 */
router.get('/earnings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a community organizer
    const user = await User.findById(userId);
    if (!user || !(user.role === 'host_partner' && user.hostPartnerType === 'community_organizer')) {
      return res.status(403).json({ message: 'Only community organizers can access this resource' });
    }

    // TODO: This requires an Earnings/Transactions model
    // For now, calculating from events
    const completedEvents = await Event.find({
      host: userId,
      status: { $in: ['completed', 'published'] },
      date: { $lt: new Date() }
    }).select('currentParticipants ticketPrice date');
    console.log('[Earnings] Completed events found:', completedEvents.length);

    // Calculate total lifetime earnings
    const totalLifetime = completedEvents.reduce((sum, event) => {
      return sum + (event.currentParticipants * event.ticketPrice);
    }, 0);

    // Calculate this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthEvents = completedEvents.filter(event =>
      new Date(event.date) >= startOfMonth
    );

    const thisMonth = thisMonthEvents.reduce((sum, event) => {
      return sum + (event.currentParticipants * event.ticketPrice);
    }, 0);

    // Calculate last month for growth percentage
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const lastMonthEvents = completedEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfLastMonth && eventDate < startOfMonth;
    });

    const lastMonth = lastMonthEvents.reduce((sum, event) => {
      return sum + (event.currentParticipants * event.ticketPrice);
    }, 0);

    const monthGrowth = lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : 0;

    // TODO: Implement actual payout system
    const pendingPayout = totalLifetime * 0.15; // Example: 15% platform fee, rest is pending
    const lastPayoutAmount = 0; // TODO: Get from Payout model
    const lastPayoutDate = null; // TODO: Get from Payout model
    const nextPayoutDate = null; // TODO: Calculate based on payout schedule

    res.json({
      totalLifetime,
      thisMonth,
      monthGrowth,
      pendingPayout,
      lastPayoutAmount,
      lastPayoutDate,
      nextPayoutDate
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ message: 'Server error fetching earnings' });
  }
});

// ==================== ANALYTICS ====================
/**
 * GET /api/organizer/analytics
 * Get event analytics for the organizer
 */
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a community organizer
    const user = await User.findById(userId);
    if (!user || !(user.role === 'host_partner' && user.hostPartnerType === 'community_organizer')) {
      return res.status(403).json({ message: 'Only community organizers can access this resource' });
    }

    const { dateRange = '30days' } = req.query;
    const now = new Date();

    // Calculate date filter based on event date, not creation date
    let eventDateFilter = {};
    let pastDateCutoff;

    if (dateRange === '7days') {
      pastDateCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '30days') {
      pastDateCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '90days') {
      pastDateCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }

    // Query for events:
    // 1. Past events within the date range (date >= cutoff AND date < now)
    // 2. All live/upcoming events (date >= now)
    const query = {
      host: userId
    };

    if (dateRange !== 'all' && pastDateCutoff) {
      // Include past events within range OR future events
      query.$or = [
        { date: { $gte: pastDateCutoff, $lt: now } }, // Past events in range
        { date: { $gte: now } } // All future/live events
      ];
    }

    const events = await Event.find(query)
      .select('title date currentParticipants maxParticipants analytics status')
      .sort({ date: -1 });

    console.log('[Analytics] Events found for user:', events.length);
    console.log('[Analytics] Date range:', dateRange);
    console.log('[Analytics] Past cutoff:', pastDateCutoff);
    console.log('[Analytics] Events breakdown:', events.map(e => ({
      title: e.title,
      date: e.date,
      status: e.status,
      isPast: new Date(e.date) < now
    })));

    // Calculate aggregate metrics
    const totalViews = events.reduce((sum, event) => sum + (event.analytics?.views || 0), 0);
    const totalBookings = events.reduce((sum, event) => sum + (event.currentParticipants || 0), 0);

    const avgFillRate = events.length > 0
      ? Math.round(events.reduce((sum, event) => {
        const fill = event.maxParticipants > 0
          ? (event.currentParticipants / event.maxParticipants) * 100
          : 0;
        return sum + fill;
      }, 0) / events.length)
      : 0;

    const conversionRate = totalViews > 0
      ? ((totalBookings / totalViews) * 100).toFixed(2)
      : 0;

    // Per-event breakdown
    const eventBreakdown = events.map(event => {
      const views = event.analytics?.views || 0;
      const bookings = event.currentParticipants || 0;
      const fillPercentage = event.maxParticipants > 0
        ? Math.round((bookings / event.maxParticipants) * 100)
        : 0;
      const eventConversionRate = views > 0
        ? ((bookings / views) * 100).toFixed(2)
        : 0;

      return {
        eventId: event._id,
        eventName: event.title,
        views,
        bookings,
        fillPercentage,
        conversionRate: eventConversionRate
      };
    });

    res.json({
      totalViews,
      totalBookings,
      avgFillRate,
      conversionRate,
      eventBreakdown
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// ==================== INSIGHTS & RECOMMENDATIONS ====================
/**
 * GET /api/organizer/insights
 * Get strategic insights and recommendations
 */
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a community organizer
    const user = await User.findById(userId);
    if (!user || !(user.role === 'host_partner' && user.hostPartnerType === 'community_organizer')) {
      return res.status(403).json({ message: 'Only community organizers can access this resource' });
    }

    const events = await Event.find({
      host: userId
    }).select('title date currentParticipants maxParticipants categories location ticketPrice');
    console.log('[Insights] Events found for user:', events.length);

    // Calculate insights
    const recommendations = [];

    // 1. Best performing day
    const dayCount = {};
    events.forEach(event => {
      const day = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const bestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Saturday';

    recommendations.push({
      title: `Your events perform best on ${bestDay}s`,
      description: `${dayCount[bestDay] || 0} of your events are scheduled on ${bestDay}s. Consider hosting more events on this day.`,
      action: 'Schedule Event',
      actionLink: '/organizer/events/create'
    });

    // 2. Price point analysis
    const avgTicketPrice = events.length > 0
      ? events.reduce((sum, e) => sum + (e.ticketPrice || 0), 0) / events.length
      : 0;

    if (avgTicketPrice > 0) {
      const affordableEvents = events.filter(e => e.ticketPrice < 999);
      const fillRateAffordable = affordableEvents.length > 0
        ? affordableEvents.reduce((sum, e) => {
          return sum + (e.maxParticipants > 0 ? (e.currentParticipants / e.maxParticipants) : 0);
        }, 0) / affordableEvents.length
        : 0;

      if (fillRateAffordable > 0.6) {
        recommendations.push({
          title: 'Events under ₹999 fill faster',
          description: 'Your affordable events have a 60%+ fill rate. Consider pricing strategically.',
          action: 'View Pricing Tips',
          actionLink: '/organizer/help/pricing'
        });
      }
    }

    // 3. Category performance
    const categoryCount = {};
    events.forEach(event => {
      event.categories?.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0];

    if (topCategory) {
      recommendations.push({
        title: `${topCategory} is your strongest category`,
        description: 'Your audience loves this category. Double down on similar themes.',
        action: 'Browse Venues',
        actionLink: '/organizer/venues'
      });
    }

    // Community Stats
    const totalParticipants = events.reduce((sum, e) => sum + (e.currentParticipants || 0), 0);
    const avgEventSize = events.length > 0
      ? Math.round(totalParticipants / events.length)
      : 0;

    // TODO: Calculate repeat attendees from user analytics
    const repeatAttendeePercentage = 35; // Placeholder

    const communityStats = {
      repeatAttendeePercentage,
      avgEventSize,
      bestDay
    };

    res.json({
      recommendations,
      communityStats
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ message: 'Server error fetching insights' });
  }
});

module.exports = router;
