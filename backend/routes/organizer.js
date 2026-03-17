const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Collaboration = require('../models/Collaboration');
const { authMiddleware } = require('../utils/authUtils');
const notificationService = require('../services/notificationService');

// ==================== ACTION REQUIRED ====================
/**
 * GET /api/organizer/action-required
 * Get all pending action items for the organizer
 */
router.get('/action-required', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
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

    // 3. Check for missing KYC/Payout details (if user has earnings but no payout info)
    const user = await User.findById(userId);
    const totalEarnings = 50000; // TODO: Calculate from actual earnings model
    if (totalEarnings > 0 && !user.payoutDetails) {
      actionItems.push({
        id: 'missing_kyc',
        type: 'missing_kyc',
        priority: 'high',
        title: 'Complete Payment Setup',
        description: 'You have earnings pending. Complete KYC and add bank details to receive payouts.',
        ctaText: 'Complete Setup'
      });
    }

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

// @route   GET /api/organizer/dashboard
// @desc    Get community organizer dashboard data
// @access  Private (Community Organizer only)
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔍 [Dashboard] Fetching dashboard for userId:', userId);
    
    // Verify user is a community organizer
    const community = await User.findById(userId);
    if (!community || community.hostPartnerType !== 'community_organizer') {
      console.log('❌ [Dashboard] User is not a community organizer:', community?.hostPartnerType);
      return res.status(403).json({ message: 'Access denied. Community organizer account required.' });
    }

    console.log('✅ [Dashboard] User verified as community organizer');

    // ========== GENERATE ACTION ITEMS ==========
    const actionsRequired = [];

    // 1. Check for draft events not published
    const draftEvents = await Event.find({
      host: userId,
      status: 'draft'
    }).select('title date');
    console.log(`📝 [Dashboard] Found ${draftEvents.length} draft events`);

    draftEvents.forEach(event => {
      const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 30 && daysUntil > 0) {
        actionsRequired.push({
          id: `draft_${event._id}`,
          type: 'draft_event',
          priority: daysUntil <= 7 ? 'high' : 'medium',
          title: 'Draft Event Not Published',
          description: `"${event.title}" is scheduled in ${daysUntil} days but still in draft mode.`,
          ctaText: 'Publish Now',
          itemId: event._id,
          metadata: {
            eventName: event.title,
            daysUntil
          }
        });
      }
    });

    // 2. Check for low-fill alerts (events with <40% booking within 7 days)
    const upcomingEventsForAlert = await Event.find({
      host: userId,
      status: { $in: ['published', 'live'] },
      date: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    }).select('title date maxParticipants currentParticipants');
    console.log(`🎯 [Dashboard] Found ${upcomingEventsForAlert.length} upcoming events for low-fill check`);

    upcomingEventsForAlert.forEach(event => {
      if (event.maxParticipants > 0) {
        const fillPercentage = (event.currentParticipants / event.maxParticipants) * 100;
        if (fillPercentage < 40) {
          const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
          actionsRequired.push({
            id: `lowfill_${event._id}`,
            type: 'low_fill',
            priority: daysUntil <= 3 ? 'high' : 'medium',
            title: 'Low Booking Alert',
            description: `Your event "${event.title}" is only ${Math.round(fillPercentage)}% filled with ${daysUntil} days to go.`,
            ctaText: 'Promote Event',
            itemId: event._id,
            metadata: {
              eventName: event.title,
              daysUntil,
              fillPercentage: Math.round(fillPercentage)
            }
          });
        }
      }
    });

    // 3. Check for incomplete profile
    const profileCheck = {
      missingFields: []
    };
    if (!community.communityProfile?.communityName) profileCheck.missingFields.push('communityName');
    if (!community.communityProfile?.communityDescription) profileCheck.missingFields.push('communityDescription');
    if (!community.communityProfile?.pastEventPhotos || community.communityProfile?.pastEventPhotos.length === 0) {
      profileCheck.missingFields.push('pastEventPhotos');
    }
    // Hosting Preferences
    if (!community.communityProfile?.preferredCities || community.communityProfile?.preferredCities.length === 0) profileCheck.missingFields.push('preferredCities');
    if (!community.communityProfile?.preferredCategories || community.communityProfile?.preferredCategories.length === 0) profileCheck.missingFields.push('preferredCategories');
    if (!community.communityProfile?.preferredEventFormats || community.communityProfile?.preferredEventFormats.length === 0) profileCheck.missingFields.push('preferredEventFormats');
    if (!community.communityProfile?.preferredAudienceTypes || community.communityProfile?.preferredAudienceTypes.length === 0) profileCheck.missingFields.push('preferredAudienceTypes');

    if (profileCheck.missingFields.length > 0) {
      console.log(`👤 [Dashboard] Profile incomplete, missing: ${profileCheck.missingFields.join(', ')}`);
      actionsRequired.push({
        id: 'profile_incomplete',
        type: 'profile_incomplete',
        priority: 'high',
        title: 'Complete Your Profile',
        description: `Complete your profile to attract more attendees. Missing: ${profileCheck.missingFields.join(', ')}.`,
        ctaText: 'Complete Profile',
        itemId: null,
        metadata: {
          missingFields: profileCheck.missingFields
        }
      });
      
      // Check if notification was already created within last 24 hours before creating a new one
      const recentProfileNotif = await Notification.findOne({
        recipient: userId,
        type: 'profile_incomplete_community_organizer',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      if (!recentProfileNotif) {
        try {
          await notificationService.notifyProfileIncompleteHost(userId);
          console.log('📬 [Dashboard] Profile incomplete notification created');
        } catch (notifError) {
          console.error('Failed to create profile incomplete notification:', notifError);
        }
      } else {
        console.log('⏭️ [Dashboard] Skipping profile notification - already sent within 24h');
      }
    }

    // 4. Check for missing KYC/Payout details
    const hasPayoutDetails = community.payoutDetails?.accountHolderName && 
                            community.payoutDetails?.accountNumber && 
                            community.payoutDetails?.ifscCode &&
                            community.payoutDetails?.billingAddress;
    
    if (!hasPayoutDetails) {
      console.log('💳 [Dashboard] Payout details missing');
      actionsRequired.push({
        id: 'missing_kyc',
        type: 'missing_kyc',
        priority: 'high',
        title: 'Add Payout Details',
        description: 'Add your payout details to receive revenue from ticket sales.',
        ctaText: 'Add Payout Details',
        itemId: null
      });
      
      // Check if notification was already created within last 24 hours before creating a new one
      const recentKYCNotif = await Notification.findOne({
        recipient: userId,
        type: 'kyc_pending',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      if (!recentKYCNotif) {
        try {
          await notificationService.notifyKYCPending(userId);
          console.log('📬 [Dashboard] KYC pending notification created');
        } catch (notifError) {
          console.error('Failed to create KYC pending notification:', notifError);
        }
      } else {
        console.log('⏭️ [Dashboard] Skipping KYC notification - already sent within 24h');
      }
    }

    // 5. Fetch collaboration-related notifications (from Notification model)
    const notifications = await Notification.find({
      recipient: userId,
      category: 'action_required',
      type: { $in: ['venue_response_received', 'communityToVenue_received', 'brand_response_received', 'communityToBrand_received', 'venue_counter_received', 'brand_counter_received', 'counter_proposal_received'] },
      isRead: false
    })
    .sort({ createdAt: -1 })
    .lean();
    
    console.log(`📊 [Dashboard] Found ${notifications.length} collaboration notifications`);

    // Add collaboration notifications to action items
    notifications.forEach(notif => {
      let ctaText = 'Review Response';
      if (notif.type.includes('counter')) {
        ctaText = 'Review Counter';
      }
      
      actionsRequired.push({
        id: notif._id.toString(),
        type: 'collaboration_request',
        title: notif.title,
        description: notif.message,
        ctaText: notif.actionText || ctaText,
        itemId: notif.relatedCollaboration || notif.relatedEvent || null,
        priority: notif.priority || 'medium'
      });
    });
    
    console.log(`✅ [Dashboard] Total action items: ${actionsRequired.length}`);

    // Get upcoming events
    const upcomingEvents = await Event.find({
      host: userId,
      date: { $gte: new Date() },
      status: { $in: ['live', 'published'] }
    })
    .sort({ date: 1 })
    .limit(6)
    .select('title date capacity ticketsSold category')
    .lean();

    const transformedEvents = upcomingEvents.map(event => ({
      _id: event._id,
      eventName: event.title,
      date: event.date,
      capacity: event.capacity,
      ticketsSold: event.ticketsSold || 0,
      fillPercentage: event.capacity ? Math.round((event.ticketsSold || 0) / event.capacity * 100) : 0,
      category: event.category
    }));

    // Calculate performance metrics
    const completedEvents = await Event.countDocuments({
      host: userId,
      status: 'completed'
    });

    // Calculate total revenue (simplified)
    const totalRevenue = completedEvents * 10000; // Placeholder
    const monthlyRevenue = completedEvents * 1000; // Placeholder

    // Average attendance
    const eventsWithAttendance = await Event.find({
      host: userId,
      status: 'completed',
      'analytics.actualAttendance': { $exists: true }
    }).select('analytics.actualAttendance');

    let avgAttendance = 0;
    if (eventsWithAttendance.length > 0) {
      const totalAttendance = eventsWithAttendance.reduce((sum, e) => sum + (e.analytics?.actualAttendance || 0), 0);
      avgAttendance = Math.round(totalAttendance / eventsWithAttendance.length);
    }

    // Generate insights
    const insights = {
      working: [],
      suggestions: []
    };

    if (completedEvents > 5) {
      insights.working.push('Consistent event execution');
    }
    if (avgAttendance > 50) {
      insights.working.push('Strong community engagement');
    }
    if (upcomingEvents.length < 2) {
      insights.suggestions.push('Schedule more events to maintain momentum');
    }

    // Response
    console.log(`✨ [Dashboard] Sending response with ${actionsRequired.length} actionsRequired items`);
    console.log('📦 [Dashboard] Actions Required:', JSON.stringify(actionsRequired, null, 2));
    
    res.json({
      actionsRequired,
      upcomingEvents: transformedEvents,
      performance: {
        totalEvents: completedEvents,
        totalRevenue,
        monthlyRevenue,
        avgAttendance
      },
      insights
    });

  } catch (err) {
    console.error('Error fetching community dashboard:', err);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
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

    // Helper function to parse time string (e.g., "08:30 PM") and create full datetime
    const parseEventEndTime = (event) => {
      const eventDate = new Date(event.date);
      
      if (event.endTime) {
        // Parse time like "08:30 PM"
        const timeMatch = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const period = timeMatch[3].toUpperCase();
          
          // Convert to 24-hour format
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          
          eventDate.setHours(hours, minutes, 0, 0);
          return eventDate;
        }
      }
      
      // If no end time, consider event lasts until end of day
      eventDate.setHours(23, 59, 59, 999);
      return eventDate;
    };

    // Live: Published events that haven't ended yet
    // First get all published events (don't filter by date in query)
    const allPublishedEvents = await Event.find({
      host: userId,
      status: 'published'
    }).sort({ date: 1 });
    
    // Filter to only events that haven't ended yet
    const liveEvents = allPublishedEvents.filter(event => {
      const eventEndDateTime = parseEventEndTime(event);
      return eventEndDateTime >= now;
    });
    console.log('[Events] Live events found:', liveEvents.length);

    // Past: All events that have ended
    const allEventsForPast = await Event.find({
      host: userId
    }).sort({ date: -1 });
    
    const pastEvents = allEventsForPast.filter(event => {
      // Skip draft events from past (they stay in draft)
      if (event.status === 'draft') return false;
      
      const eventEndDateTime = parseEventEndTime(event);
      return eventEndDateTime < now;
    });
    console.log('[Events] Past events found:', pastEvents.length);

    // Calculate fill percentage and revenue for each event
    const Ticket = require('../models/Ticket');
    
    const enrichEvent = async (event) => {
      const fillPercentage = event.maxParticipants > 0
        ? Math.round((event.currentParticipants / event.maxParticipants) * 100)
        : 0;
      
      // Calculate revenue from actual tickets (using basePrice from metadata minus coupon discounts)
      const tickets = await Ticket.find({ event: event._id, status: { $ne: 'cancelled' } });
      const revenueBeforeDiscount = tickets.reduce((sum, ticket) => {
        // Use basePrice from metadata (order amount without fees)
        const ticketRevenue = ticket.metadata?.basePrice || ticket.price?.amount || 0;
        return sum + ticketRevenue;
      }, 0);
      
      // Calculate total coupon discounts from participants
      const totalCouponDiscount = event.participants
        .filter(p => p.couponUsed && p.couponUsed.discountApplied)
        .reduce((sum, p) => sum + (p.couponUsed.discountApplied || 0), 0);
      
      // Final revenue = basePrice - coupon discounts
      const revenue = revenueBeforeDiscount - totalCouponDiscount;

      return {
        _id: event._id,
        title: event.title,
        date: event.date,
        time: event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : 'TBD',
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        status: event.status,
        image: event.images?.[0] || null,
        currentParticipants: event.currentParticipants || 0,
        maxParticipants: event.maxParticipants,
        fillPercentage,
        revenue
      };
    };

    // Process events in parallel with Promise.all
    const [enrichedDraft, enrichedLive, enrichedPast] = await Promise.all([
      Promise.all(draftEvents.map(enrichEvent)),
      Promise.all(liveEvents.map(enrichEvent)),
      Promise.all(pastEvents.map(enrichEvent))
    ]);

    res.json({
      draft: enrichedDraft,
      live: enrichedLive,
      past: enrichedPast
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
    const userId = req.user.userId || req.user.id;
    console.log('💰 [Earnings] Fetching earnings for userId:', userId);

    // Fetch ALL events (including future ones for total lifetime calculation)
    const allEvents = await Event.find({
      host: userId
    }).select('_id currentParticipants maxParticipants price ticketPrice date status').lean();
    
    console.log(`💰 [Earnings] Total events found: ${allEvents.length}`);

    // Import Ticket model to calculate actual revenue
    const Ticket = require('../models/Ticket');

    // Helper function to calculate revenue for an event using actual tickets (minus coupon discounts)
    const calculateEventRevenue = async (eventId) => {
      const tickets = await Ticket.find({ event: eventId, status: { $ne: 'cancelled' } });
      const revenueBeforeDiscount = tickets.reduce((sum, ticket) => {
        // Use basePrice from metadata (organizer's revenue - ticket price only, NO fees deducted)
        const ticketRevenue = ticket.metadata?.basePrice || ticket.price?.amount || 0;
        return sum + ticketRevenue;
      }, 0);
      
      // Get event to access participants for coupon data
      const event = await Event.findById(eventId).select('participants');
      if (!event) return revenueBeforeDiscount;
      
      // Calculate total coupon discounts
      const totalCouponDiscount = event.participants
        .filter(p => p.couponUsed && p.couponUsed.discountApplied)
        .reduce((sum, p) => sum + (p.couponUsed.discountApplied || 0), 0);
      
      return revenueBeforeDiscount - totalCouponDiscount;
    };

    // Calculate total lifetime earnings (from ALL events with participants)
    const eventsWithRevenue = allEvents.filter(e => (e.currentParticipants || 0) > 0);
    const revenuePromises = eventsWithRevenue.map(event => calculateEventRevenue(event._id));
    const revenues = await Promise.all(revenuePromises);
    const totalLifetime = revenues.reduce((sum, rev) => sum + rev, 0);
    console.log(`💰 [Earnings] Total Lifetime: ₹${totalLifetime} from ${eventsWithRevenue.length} events`);

    // Calculate this month's earnings (events that happened this month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const thisMonthEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    });

    const thisMonthRevenuePromises = thisMonthEvents.map(event => calculateEventRevenue(event._id));
    const thisMonthRevenues = await Promise.all(thisMonthRevenuePromises);
    const thisMonth = thisMonthRevenues.reduce((sum, rev) => sum + rev, 0);
    console.log(`💰 [Earnings] This Month: ₹${thisMonth} from ${thisMonthEvents.length} events`);

    // Calculate last month for growth percentage
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const lastMonthEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfLastMonth && eventDate <= endOfLastMonth;
    });

    const lastMonthRevenuePromises = lastMonthEvents.map(event => calculateEventRevenue(event._id));
    const lastMonthRevenues = await Promise.all(lastMonthRevenuePromises);
    const lastMonth = lastMonthRevenues.reduce((sum, rev) => sum + rev, 0);
    console.log(`💰 [Earnings] Last Month: ₹${lastMonth} from ${lastMonthEvents.length} events`);

    // Calculate month-over-month growth
    let monthGrowth = 0;
    if (lastMonth > 0) {
      monthGrowth = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    } else if (thisMonth > 0) {
      monthGrowth = 100; // 100% growth if no revenue last month but revenue this month
    }
    console.log(`📈 [Earnings] Month Growth: ${monthGrowth}%`);

    // Calculate total attendees across all events (currentParticipants already tracks spots booked)
    const totalAttendees = allEvents.reduce((sum, event) => sum + (event.currentParticipants || 0), 0);
    const avgRevenuePerAttendee = totalAttendees > 0 ? Math.round(totalLifetime / totalAttendees) : 0;
    console.log(`👥 [Earnings] Total Attendees: ${totalAttendees}, Avg Revenue/Attendee: ₹${avgRevenuePerAttendee}`);

    res.json({
      totalLifetime,
      thisMonth,
      monthGrowth,
      totalAttendees,
      avgRevenuePerAttendee,
      totalEvents: allEvents.length,
      eventsWithRevenue: eventsWithRevenue.length,
      thisMonthEventCount: thisMonthEvents.length,
      lastMonthEventCount: lastMonthEvents.length
    });
  } catch (error) {
    console.error('❌ [Earnings] Error fetching earnings:', error);
    res.status(500).json({ message: 'Server error fetching earnings' });
  }
});

// ==================== REVENUE AUDIT ====================
/**
 * GET /api/organizer/revenue-audit
 * Audit revenue accuracy by cross-verifying with Cashfree payment records
 */
router.get('/revenue-audit', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('🔍 [Revenue Audit] Starting audit for userId:', userId);

    // Import required models
    const Ticket = require('../models/Ticket');
    const axios = require('axios');

    // Get all events by this organizer
    const events = await Event.find({ host: userId }).select('_id title');
    const eventIds = events.map(e => e._id);

    // Get all non-cancelled tickets for these events
    const tickets = await Ticket.find({
      event: { $in: eventIds },
      status: { $ne: 'cancelled' }
    }).populate('event', 'title');

    console.log(`🔍 [Revenue Audit] Found ${tickets.length} tickets across ${events.length} events`);

    // Calculate internal revenue from tickets (basePrice minus coupon discounts)
    const internalRevenueBeforeDiscount = tickets.reduce((sum, ticket) => {
      const ticketRevenue = ticket.metadata?.basePrice || 0;
      return sum + ticketRevenue;
    }, 0);
    
    // Get all events with participants data to calculate coupon discounts
    const eventsWithParticipants = await Event.find({ 
      _id: { $in: eventIds } 
    }).select('participants');
    
    // Calculate total coupon discounts across all events
    const totalCouponDiscount = eventsWithParticipants.reduce((sum, event) => {
      const eventDiscount = event.participants
        .filter(p => p.couponUsed && p.couponUsed.discountApplied)
        .reduce((discountSum, p) => discountSum + (p.couponUsed.discountApplied || 0), 0);
      return sum + eventDiscount;
    }, 0);
    
    // Final internal revenue = basePrice - coupon discounts
    const internalRevenue = internalRevenueBeforeDiscount - totalCouponDiscount;
    
    console.log(`💰 [Revenue Audit] Revenue before discount: ₹${internalRevenueBeforeDiscount}, Coupon discounts: ₹${totalCouponDiscount}, Final revenue: ₹${internalRevenue}`);

    // Track tickets without basePrice (potential issue)
    const ticketsWithoutBasePrice = tickets.filter(t => !t.metadata?.basePrice);
    
    // Track tickets without orderId (potential issue)
    const ticketsWithoutOrderId = tickets.filter(t => !t.metadata?.orderId);

    // Get unique order IDs
    const orderIds = [...new Set(tickets.map(t => t.metadata?.orderId).filter(Boolean))];
    
    console.log(`🔍 [Revenue Audit] Verifying ${orderIds.length} Cashfree orders...`);

    // Determine Cashfree API URL
    const CASHFREE_API_URL = process.env.CASHFREE_SECRET_KEY?.startsWith('cfsk_ma_prod_')
      ? 'https://api.cashfree.com'
      : 'https://sandbox.cashfree.com';

    let cashfreeVerifiedTotal = 0;
    let cashfreeOrdersChecked = 0;
    let cashfreeOrdersFailed = 0;
    const mismatches = [];

    // Verify each order with Cashfree (with rate limiting)
    for (const orderId of orderIds) {
      try {
        const cashfreeResponse = await axios.get(
          `${CASHFREE_API_URL}/pg/orders/${orderId}`,
          {
            headers: {
              'x-client-id': process.env.CASHFREE_APP_ID,
              'x-client-secret': process.env.CASHFREE_SECRET_KEY,
              'x-api-version': '2023-08-01'
            }
          }
        );

        cashfreeOrdersChecked++;

        if (cashfreeResponse.data.order_status === 'PAID') {
          const cashfreeAmount = cashfreeResponse.data.order_amount;
          cashfreeVerifiedTotal += cashfreeAmount;

          // Find matching ticket(s) for this order
          const matchingTickets = tickets.filter(t => t.metadata?.orderId === orderId);
          
          if (matchingTickets.length > 0) {
            const ticketBasePriceTotal = matchingTickets.reduce((sum, t) => {
              return sum + (t.metadata?.basePrice || 0);
            }, 0);

            // Calculate expected total with fees (basePrice + 2.6% GST + 3% gateway)
            const expectedTotal = ticketBasePriceTotal * 1.056; // 5.6% total fees

            // Allow 2 rupees difference for rounding
            if (Math.abs(expectedTotal - cashfreeAmount) > 2) {
              mismatches.push({
                orderId,
                eventTitle: matchingTickets[0].event?.title,
                ticketNumbers: matchingTickets.map(t => t.ticketNumber),
                ticketBasePrice: ticketBasePriceTotal,
                expectedTotalWithFees: parseFloat(expectedTotal.toFixed(2)),
                cashfreeAmount,
                difference: parseFloat((cashfreeAmount - expectedTotal).toFixed(2))
              });
            }
          }
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        cashfreeOrdersFailed++;
        console.error(`❌ [Revenue Audit] Failed to verify orderId ${orderId}:`, error.message);
      }
    }

    // Calculate expected Cashfree total (with fees)
    const expectedCashfreeTotal = internalRevenue * 1.056; // basePrice + 5.6% fees

    // Warnings
    const warnings = [];
    if (ticketsWithoutBasePrice.length > 0) {
      warnings.push(`${ticketsWithoutBasePrice.length} tickets missing basePrice in metadata`);
    }
    if (ticketsWithoutOrderId.length > 0) {
      warnings.push(`${ticketsWithoutOrderId.length} tickets missing orderId in metadata`);
    }
    if (cashfreeOrdersFailed > 0) {
      warnings.push(`${cashfreeOrdersFailed} Cashfree orders failed to verify`);
    }
    if (mismatches.length > 0) {
      warnings.push(`${mismatches.length} order amount mismatches found`);
    }

    const auditPassed = 
      mismatches.length === 0 && 
      ticketsWithoutBasePrice.length === 0 && 
      Math.abs(cashfreeVerifiedTotal - expectedCashfreeTotal) < 10;

    console.log(`✅ [Revenue Audit] Complete - Status: ${auditPassed ? 'PASS' : 'FAIL'}`);

    res.json({
      auditPassed,
      summary: {
        organizerRevenue: internalRevenue, // What organizer earns (basePrice only)
        expectedCashfreeTotal: parseFloat(expectedCashfreeTotal.toFixed(2)), // With fees
        cashfreeVerifiedTotal: parseFloat(cashfreeVerifiedTotal.toFixed(2)),
        difference: parseFloat((cashfreeVerifiedTotal - expectedCashfreeTotal).toFixed(2))
      },
      tickets: {
        total: tickets.length,
        withoutBasePrice: ticketsWithoutBasePrice.length,
        withoutOrderId: ticketsWithoutOrderId.length
      },
      cashfree: {
        ordersToVerify: orderIds.length,
        ordersVerified: cashfreeOrdersChecked,
        ordersFailed: cashfreeOrdersFailed
      },
      mismatches,
      warnings,
      ticketsWithIssues: {
        missingBasePrice: ticketsWithoutBasePrice.map(t => ({
          ticketNumber: t.ticketNumber,
          eventTitle: t.event?.title,
          priceAmount: t.price?.amount
        })),
        missingOrderId: ticketsWithoutOrderId.map(t => ({
          ticketNumber: t.ticketNumber,
          eventTitle: t.event?.title
        }))
      }
    });

  } catch (error) {
    console.error('❌ [Revenue Audit] Error:', error);
    res.status(500).json({ 
      message: 'Revenue audit failed',
      error: error.message 
    });
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

// ==================== REPORTS & EXPORTS ====================
/**
 * GET /api/organizer/reports/event/:eventId
 * Generate detailed event report with payment audit trail
 */
router.get('/reports/event/:eventId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { eventId } = req.params;
    const { format = 'json' } = req.query; // json or csv
    
    console.log('📊 [Reports] Generating event report:', { eventId, userId, format });
    
    // Verify event ownership
    const event = await Event.findOne({ _id: eventId, host: userId })
      .populate('host', 'name email communityProfile');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found or access denied' });
    }
    
    // Import Ticket model
    const Ticket = require('../models/Ticket');
    
    // Get all tickets for this event
    const tickets = await Ticket.find({
      event: eventId,
      status: { $ne: 'cancelled' }
    }).populate('user', 'name email phoneNumber')
      .sort({ purchaseDate: -1 });
    
    console.log(`📊 [Reports] Found ${tickets.length} tickets for event: ${event.title}`);
    
    // Calculate summary metrics (basePrice minus coupon discounts)
    const totalRevenueBeforeDiscount = tickets.reduce((sum, t) => sum + (t.metadata?.basePrice || 0), 0);
    
    // Calculate total coupon discounts from participants
    const totalCouponDiscount = event.participants
      .filter(p => p.couponUsed && p.couponUsed.discountApplied)
      .reduce((sum, p) => sum + (p.couponUsed.discountApplied || 0), 0);
    
    // Final revenue = basePrice - coupon discounts
    const totalRevenue = totalRevenueBeforeDiscount - totalCouponDiscount;
    
    console.log(`💰 [Reports] Revenue: ₹${totalRevenueBeforeDiscount} - ₹${totalCouponDiscount} = ₹${totalRevenue}`);
    
    // Calculate total paid by summing base + fees for each ticket
    const totalPaid = tickets.reduce((sum, t) => {
      const basePrice = t.metadata?.basePrice || 0;
      let gstCharges = t.metadata?.gstAndOtherCharges || 0;
      let platformFees = t.metadata?.platformFees || 0;
      
      // If fees missing, estimate from price difference
      if (gstCharges === 0 && platformFees === 0 && basePrice > 0) {
        const actualPrice = typeof t.price === 'number' ? t.price : (t.price?.amount || 0);
        const diff = actualPrice - basePrice;
        if (diff > basePrice * 0.01) {
          gstCharges = diff * 0.46;
          platformFees = diff * 0.54;
        }
      }
      
      return sum + basePrice + gstCharges + platformFees;
    }, 0);
    
    const totalGatewayFees = totalPaid - totalRevenue; // Total fees = total paid - base revenue
    
    const settledCount = tickets.filter(t => t.settlementStatus === 'settled').length;
    const pendingCount = tickets.filter(t => t.settlementStatus === 'pending' || t.settlementStatus === 'captured').length;
    const verifiedCount = tickets.filter(t => t.reconciliationStatus === 'verified').length;
    const mismatchCount = tickets.filter(t => t.reconciliationStatus === 'mismatch').length;
    
    const totalSettledAmount = tickets
      .filter(t => t.settlementStatus === 'settled')
      .reduce((sum, t) => sum + (t.settlementAmount || 0), 0);
    
    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: userId,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants
      },
      organizer: {
        name: event.host.name,
        email: event.host.email,
        communityName: event.host.communityProfile?.communityName
      },
      summary: {
        totalTickets: tickets.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalPaidByUsers: parseFloat(totalPaid.toFixed(2)),
        totalGatewayFees: parseFloat(totalGatewayFees.toFixed(2)),
        avgTicketPrice: tickets.length > 0 ? parseFloat((totalRevenue / tickets.length).toFixed(2)) : 0,
        settlement: {
          settled: settledCount,
          pending: pendingCount,
          totalSettledAmount: parseFloat(totalSettledAmount.toFixed(2)),
          settledPercentage: tickets.length > 0 ? parseFloat(((settledCount / tickets.length) * 100).toFixed(1)) : 0
        },
        reconciliation: {
          verified: verifiedCount,
          mismatches: mismatchCount,
          pending: tickets.length - verifiedCount - mismatchCount,
          verifiedPercentage: tickets.length > 0 ? parseFloat(((verifiedCount / tickets.length) * 100).toFixed(1)) : 0
        }
      },
      tickets: tickets.map(t => {
        const basePrice = t.metadata?.basePrice || 0;
        
        // Get stored fee values if they exist
        let gstCharges = t.metadata?.gstAndOtherCharges || 0;
        let platformFees = t.metadata?.platformFees || 0;
        
        // If fees are not recorded, try to calculate from price difference
        if (gstCharges === 0 && platformFees === 0 && basePrice > 0) {
          const actualPrice = typeof t.price === 'number' ? t.price : (t.price?.amount || 0);
          const priceDifference = actualPrice - basePrice;
          
          // Only estimate fees if there's a meaningful difference (more than 1% of base)
          if (priceDifference > basePrice * 0.01) {
            // Split the difference: 46% GST, 54% platform fee
            gstCharges = parseFloat((priceDifference * 0.46).toFixed(2));
            platformFees = parseFloat((priceDifference * 0.54).toFixed(2));
          }
        }
        
        // Calculate total paid = base + all fees (this is what customer actually paid)
        const totalPaidByUser = parseFloat((basePrice + gstCharges + platformFees).toFixed(2));
        
        return {
        ticketNumber: t.ticketNumber,
        userName: t.user?.name || 'N/A',
        userEmail: t.user?.email || 'N/A',
        userPhone: t.user?.phoneNumber || 'N/A',
        purchaseDate: t.purchaseDate,
        quantity: t.quantity || 1,
        ticketType: t.metadata?.ticketType || 'general',
        basePrice: basePrice,
        gstAndOtherCharges: gstCharges,
        platformFees: platformFees,
        totalPaidByUser: totalPaidByUser,
        orderId: t.metadata?.orderId,
        paymentId: t.paymentId,
        paymentMethod: t.gatewayResponse?.paymentMethod || 'N/A',
        paymentStatus: t.gatewayResponse?.paymentStatus || 'N/A',
        gatewayPaymentAmount: totalPaidByUser, // Amount received by gateway from customer
        settlementStatus: t.settlementStatus,
        settlementDate: t.settlementDate,
        settlementUTR: t.settlementUTR,
        settlementAmount: t.settlementAmount || 0, // Amount transferred to your bank
        reconciliationStatus: t.reconciliationStatus,
        lastReconciliationDate: t.lastReconciliationDate,
        reconciliationNotes: t.reconciliationNotes,
        checkInStatus: t.status,
        checkInTime: t.checkInTime
      };})
    };
    
    // Return JSON or CSV based on format
    if (format === 'csv') {
      // Convert to CSV
      const fields = [
        'ticketNumber', 'userName', 'userEmail', 'userPhone', 'purchaseDate',
        'quantity', 'ticketType', 'basePrice', 'gstAndOtherCharges', 'platformFees',
        'totalPaidByUser', 'orderId', 'paymentId', 'paymentMethod', 'paymentStatus',
        'gatewayPaymentAmount', 'settlementStatus', 'settlementDate', 'settlementUTR', 'settlementAmount',
        'reconciliationStatus', 'lastReconciliationDate', 'reconciliationNotes',
        'checkInStatus', 'checkInTime'
      ];
      
      const csvRows = [];
      
      // Add summary as header comments
      csvRows.push(`# ========================================`);
      csvRows.push(`# EVENT AUDIT REPORT`);
      csvRows.push(`# ========================================`);
      csvRows.push(`# Event: ${event.title}`);
      csvRows.push(`# Generated: ${new Date().toISOString()}`);
      csvRows.push(`# Total Tickets: ${tickets.length}`);
      csvRows.push(`# Total Revenue (User Paid): ₹${totalPaid.toFixed(2)}`);
      csvRows.push(`# Base Revenue (Your Share): ₹${totalRevenue.toFixed(2)}`);
      csvRows.push(`# Gateway Fees Deducted: ₹${totalGatewayFees.toFixed(2)}`);
      csvRows.push(`#`);
      csvRows.push(`# SETTLEMENT STATUS:`);
      csvRows.push(`#   - Settled: ${settledCount} tickets (${report.summary.settlement.settledPercentage}%)`);
      csvRows.push(`#   - Amount Settled to Bank: ₹${totalSettledAmount.toFixed(2)}`);
      csvRows.push(`#   - Pending Settlement: ${pendingCount} tickets`);
      csvRows.push(`#   - Settlement = When Cashfree transfers money to your bank account`);
      csvRows.push(`#`);
      csvRows.push(`# RECONCILIATION STATUS:`);
      csvRows.push(`#   - Verified with Cashfree: ${verifiedCount} (${report.summary.reconciliation.verifiedPercentage}%)`);
      csvRows.push(`#   - Mismatches Found: ${mismatchCount}`);
      csvRows.push(`#   - Pending Verification: ${tickets.length - verifiedCount - mismatchCount}`);
      csvRows.push(`#   - Reconciliation = Daily verification that payment was actually received by Cashfree`);
      csvRows.push(`#`);
      csvRows.push(`# FIELD EXPLANATIONS:`);
      csvRows.push(`#   - totalPaidByUser: Total amount customer paid (includes all fees)`);
      csvRows.push(`#   - gatewayPaymentAmount: Amount received by Cashfree from customer`);
      csvRows.push(`#   - basePrice: Your share before gateway fees`);
      csvRows.push(`#   - settlementAmount: Final amount transferred to your bank`);
      csvRows.push(`#   - orderId: Cashfree order ID for verification`);
      csvRows.push(`#   - reconciliationStatus: verified = Payment confirmed with Cashfree API`);
      csvRows.push(`#   - lastReconciliationDate: When we last verified this payment with Cashfree`);
      csvRows.push(`# ========================================`);
      csvRows.push('');
      
      // Add header row
      csvRows.push(fields.join(','));
      
      // Add data rows
      report.tickets.forEach(ticket => {
        const row = fields.map(field => {
          let value = ticket[field];
          
          // Format dates
          if (field.includes('Date') || field.includes('Time')) {
            value = value ? new Date(value).toISOString() : '';
          }
          
          // Escape commas and quotes in strings
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value !== null && value !== undefined ? value : '';
        });
        
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="event-report-${eventId}-${Date.now()}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      res.json(report);
    }
    
  } catch (error) {
    console.error('❌ [Reports] Error generating event report:', error);
    res.status(500).json({
      message: 'Failed to generate event report',
      error: error.message
    });
  }
});

/**
 * GET /api/organizer/reports/monthly
 * Generate monthly settlement report for organizer
 */
router.get('/reports/monthly', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { month, year, format = 'json' } = req.query;
    
    // Default to last month if not specified
    const now = new Date();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth() - 1;
    const targetYear = year ? parseInt(year) : (targetMonth < 0 ? now.getFullYear() - 1 : now.getFullYear());
    const adjustedMonth = targetMonth < 0 ? 11 : targetMonth;
    
    const startDate = new Date(targetYear, adjustedMonth, 1);
    const endDate = new Date(targetYear, adjustedMonth + 1, 1);
    
    const monthName = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    console.log('📊 [Monthly Report] Generating for:', { userId, monthName, format });
    
    // Import Ticket model
    const Ticket = require('../models/Ticket');
    
    // Get all events by this organizer
    const events = await Event.find({ host: userId }).select('_id title date');
    const eventIds = events.map(e => e._id);
    
    // Get all tickets in date range
    const tickets = await Ticket.find({
      event: { $in: eventIds },
      purchaseDate: { $gte: startDate, $lt: endDate },
      status: { $ne: 'cancelled' }
    }).populate('event', 'title date')
      .populate('user', 'name email');
    
    console.log(`📊 [Monthly Report] Found ${tickets.length} tickets for ${monthName}`);
    
    // Calculate metrics (basePrice minus coupon discounts)
    const totalRevenueBeforeDiscount = tickets.reduce((sum, t) => sum + (t.metadata?.basePrice || 0), 0);
    
    // Get all events with participants data to calculate coupon discounts
    const eventsWithParticipants = await Event.find({ 
      _id: { $in: eventIds } 
    }).select('participants');
    
    // Calculate total coupon discounts across all events
    const totalCouponDiscount = eventsWithParticipants.reduce((sum, event) => {
      const eventDiscount = event.participants
        .filter(p => p.couponUsed && p.couponUsed.discountApplied)
        .reduce((discountSum, p) => discountSum + (p.couponUsed.discountApplied || 0), 0);
      return sum + eventDiscount;
    }, 0);
    
    // Final revenue = basePrice - coupon discounts
    const totalRevenue = totalRevenueBeforeDiscount - totalCouponDiscount;
    
    console.log(`💰 [Monthly Report] Revenue: ₹${totalRevenueBeforeDiscount} - ₹${totalCouponDiscount} = ₹${totalRevenue}`);
    
    const totalSettled = tickets.filter(t => t.settlementStatus === 'settled').length;
    const totalSettledAmount = tickets
      .filter(t => t.settlementStatus === 'settled')
      .reduce((sum, t) => sum + (t.settlementAmount || 0), 0);
    
    // Group by event
    const eventBreakdown = {};
    tickets.forEach(ticket => {
      const eventId = ticket.event._id.toString();
      const eventTitle = ticket.event.title;
      
      if (!eventBreakdown[eventId]) {
        eventBreakdown[eventId] = {
          eventTitle,
          eventDate: ticket.event.date,
          tickets: 0,
          revenue: 0,
          settled: 0
        };
      }
      
      eventBreakdown[eventId].tickets++;
      eventBreakdown[eventId].revenue += (ticket.metadata?.basePrice || 0);
      if (ticket.settlementStatus === 'settled') {
        eventBreakdown[eventId].settled++;
      }
    });
    
    const report = {
      month: monthName,
      generatedAt: new Date().toISOString(),
      organizerId: userId,
      summary: {
        totalTickets: tickets.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalEvents: Object.keys(eventBreakdown).length,
        settled: {
          tickets: totalSettled,
          amount: parseFloat(totalSettledAmount.toFixed(2)),
          percentage: tickets.length > 0 ? parseFloat(((totalSettled / tickets.length) * 100).toFixed(1)) : 0
        }
      },
      eventBreakdown: Object.values(eventBreakdown).map(e => ({
        ...e,
        revenue: parseFloat(e.revenue.toFixed(2))
      })),
      tickets: tickets.map(t => ({
        ticketNumber: t.ticketNumber,
        eventTitle: t.event?.title,
        userName: t.user?.name,
        purchaseDate: t.purchaseDate,
        basePrice: t.metadata?.basePrice,
        orderId: t.metadata?.orderId,
        settlementStatus: t.settlementStatus,
        settlementDate: t.settlementDate,
        settlementUTR: t.settlementUTR,
        settlementAmount: t.settlementAmount
      }))
    };
    
    if (format === 'csv') {
      const fields = [
        'ticketNumber', 'eventTitle', 'userName', 'purchaseDate', 'basePrice',
        'orderId', 'settlementStatus', 'settlementDate', 'settlementUTR', 'settlementAmount'
      ];
      
      const csvRows = [];
      csvRows.push(`# Monthly Settlement Report: ${monthName}`);
      csvRows.push(`# Total Revenue: ₹${totalRevenue.toFixed(2)}`);
      csvRows.push(`# Settled: ${totalSettled}/${tickets.length} tickets`);
      csvRows.push('');
      csvRows.push(fields.join(','));
      
      report.tickets.forEach(ticket => {
        const row = fields.map(field => {
          let value = ticket[field];
          if (field.includes('Date')) {
            value = value ? new Date(value).toISOString() : '';
          }
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value !== null && value !== undefined ? value : '';
        });
        csvRows.push(row.join(','));
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${monthName.replace(' ', '-')}.csv"`);
      res.send(csvRows.join('\n'));
    } else {
      res.json(report);
    }
    
  } catch (error) {
    console.error('❌ [Monthly Report] Error:', error);
    res.status(500).json({
      message: 'Failed to generate monthly report',
      error: error.message
    });
  }
});

module.exports = router;
