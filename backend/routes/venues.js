const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Collaboration = require('../models/Collaboration');
const Event = require('../models/Event');
const { authMiddleware } = require('../utils/authUtils');

// @route   GET /api/venues/browse
// @desc    Get all venues with optional filters
// @access  Public
router.get('/browse', async (req, res) => {
  try {
    const {
      city,
      venueType,
      capacityRange,
      amenities,
      availability,
      search
    } = req.query;

    // Build query for users with hostPartnerType: 'venue'
    let query = { hostPartnerType: 'venue' };

    // City filter
    if (city) {
      query['venueProfile.city'] = city;
    }

    // Venue type filter
    if (venueType) {
      query['venueProfile.venueType'] = venueType;
    }

    // Capacity range filter
    if (capacityRange) {
      query['venueProfile.capacityRange'] = capacityRange;
    }

    // Amenities filter (must have ALL selected amenities)
    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      query['venueProfile.amenities'] = { $all: amenitiesArray };
    }

    // Availability filter
    if (availability === 'available') {
      query['venueProfile.availability'] = 'open_for_collaborations';
    }

    // Search filter
    if (search) {
      query.$or = [
        { 'venueProfile.venueName': { $regex: search, $options: 'i' } },
        { 'venueProfile.locality': { $regex: search, $options: 'i' } },
        { 'venueProfile.description': { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch venues
    const venues = await User.find(query)
      .select('venueProfile')
      .lean();

    // Transform data for frontend
    const transformedVenues = venues.map(venue => ({
      _id: venue._id,
      venueName: venue.venueProfile?.venueName,
      locality: venue.venueProfile?.locality,
      city: venue.venueProfile?.city,
      venueType: venue.venueProfile?.venueType,
      capacityRange: venue.venueProfile?.capacityRange,
      amenities: venue.venueProfile?.amenities || [],
      eventSuitabilityTags: venue.venueProfile?.eventSuitabilityTags || [],
      photos: venue.venueProfile?.photos || [],
      availability: venue.venueProfile?.availability,
      eventsHosted: venue.venueProfile?.eventsHosted || 0,
      description: venue.venueProfile?.description
    }));

    res.json(transformedVenues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ message: 'Server error while fetching venues' });
  }
});

// @route   GET /api/venues/dashboard
// @desc    Get venue dashboard data
// @access  Private (Venue only)
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Verify user is a venue
    const venue = await User.findById(userId);
    if (!venue || venue.hostPartnerType !== 'venue') {
      return res.status(403).json({ message: 'Access denied. Venue account required.' });
    }

    // Get actions required
    const actionsRequired = [];
    
    // Check for pending collaborations
    const pendingCollaborations = await Collaboration.find({
      'recipient.user': userId,
      status: 'admin_approved'
    }).limit(5);
    
    pendingCollaborations.forEach(collab => {
      actionsRequired.push({
        type: 'collaboration_request',
        title: `New collaboration request from ${collab.initiator.name}`,
        description: `${collab.initiator.name} wants to host an event at your venue`,
        ctaText: 'Review Request',
        itemId: collab._id,
        priority: collab.priority
      });
    });
    
    // Check profile completion
    const profileComplete = venue.venueProfile?.venueName && 
                           venue.venueProfile?.city && 
                           venue.venueProfile?.photos?.length > 0;
    
    if (!profileComplete) {
      actionsRequired.push({
        type: 'profile_incomplete',
        title: 'Complete your venue profile',
        description: 'Add photos, amenities, and venue details to attract more organizers',
        ctaText: 'Complete Profile',
        priority: 'high'
      });
    }

    // Get upcoming events at this venue
    const upcomingEvents = await Event.find({
      venue: userId,
      date: { $gte: new Date() },
      status: 'live'
    })
    .sort({ date: 1 })
    .limit(6)
    .populate('host', 'name communityProfile')
    .lean();

    const transformedEvents = upcomingEvents.map(event => ({
      _id: event._id,
      eventName: event.title,
      organizerName: event.host?.communityProfile?.communityName || event.host?.name,
      date: event.date,
      time: event.time,
      expectedAttendance: event.capacity || event.maxParticipants,
      eventType: event.category
    }));

    // Calculate performance metrics
    const completedEvents = await Event.countDocuments({
      venue: userId,
      status: 'completed'
    });

    // Calculate total earnings (simplified - should come from Payout model)
    const totalEarnings = completedEvents * 5000; // Placeholder calculation
    const monthlyEarnings = completedEvents * 500; // Placeholder

    // Calculate average attendance
    const eventsWithAttendance = await Event.find({
      venue: userId,
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

    // Analyze event patterns
    const eventsByCategory = await Event.aggregate([
      { $match: { venue: userId, status: 'completed' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    if (eventsByCategory.length > 0) {
      insights.working.push(`${eventsByCategory[0]._id} events perform best at your venue`);
    }

    // Analyze day patterns
    const eventsByDay = await Event.aggregate([
      { $match: { venue: userId, status: 'completed' } },
      { $group: { _id: { $dayOfWeek: '$date' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    if (eventsByDay.length > 0) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      insights.working.push(`${days[eventsByDay[0]._id - 1]} evenings have the highest turnout`);
    }

    // Add suggestions
    if (completedEvents < 5) {
      insights.suggestions.push('Consider opening weekday evenings for workshops to increase bookings');
    }

    if (venue.venueProfile?.capacityRange === '20-40') {
      insights.suggestions.push('Smaller groups (20–40) fill more consistently for your venue size');
    }

    insights.suggestions.push('Venues like yours collaborate with fitness and music communities');

    res.json({
      actionsRequired,
      upcomingEvents: transformedEvents,
      performance: {
        totalEvents: completedEvents,
        totalEarnings,
        monthlyEarnings,
        avgAttendance
      },
      insights
    });

  } catch (error) {
    console.error('Error fetching venue dashboard:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// @route   GET /api/venues/:id
// @desc    Get venue profile detail
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const venue = await User.findOne({
      _id: req.params.id,
      hostPartnerType: 'venue'
    })
      .select('venueProfile email')
      .lean();

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Transform data
    const venueDetail = {
      _id: venue._id,
      email: venue.email,
      venueName: venue.venueProfile?.venueName,
      locality: venue.venueProfile?.locality,
      city: venue.venueProfile?.city,
      venueType: venue.venueProfile?.venueType,
      capacityRange: venue.venueProfile?.capacityRange,
      amenities: venue.venueProfile?.amenities || [],
      eventSuitabilityTags: venue.venueProfile?.eventSuitabilityTags || [],
      photos: venue.venueProfile?.photos || [],
      availability: venue.venueProfile?.availability,
      eventsHosted: venue.venueProfile?.eventsHosted || 0,
      description: venue.venueProfile?.description,
      pastEvents: venue.venueProfile?.pastEvents || [],
      commercialTerms: venue.venueProfile?.commercialTerms || {},
      collaborationPreferences: venue.venueProfile?.collaborationPreferences || [],
      rulesAndRestrictions: venue.venueProfile?.rulesAndRestrictions,
      layout: venue.venueProfile?.layout,
      operatingHours: venue.venueProfile?.operatingHours
    };

    res.json(venueDetail);
  } catch (error) {
    console.error('Error fetching venue detail:', error);
    res.status(500).json({ message: 'Server error while fetching venue detail' });
  }
});

// @route   POST /api/venues/:id/request-collaboration
// @desc    Submit collaboration request to admin for review
// @access  Private
router.post('/:id/request-collaboration', authMiddleware, async (req, res) => {
  try {
    const venueId = req.params.id;
    const {
      eventId,
      eventName,
      eventDate,
      message,
      date,
      timeSlot,
      expectedAttendees,
      eventType,
      budgetRange
    } = req.body;

    // Validate venue exists
    const venue = await User.findOne({
      _id: venueId,
      hostPartnerType: 'venue'
    });

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Validate initiator (must be community organizer)
    const initiator = await User.findById(req.user.userId);
    if (!initiator) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create collaboration request (goes to admin first)
    const collaboration = new Collaboration({
      type: 'venue_request',
      initiator: {
        user: initiator._id,
        userType: initiator.hostPartnerType || 'community',
        name: initiator.communityProfile?.communityName || initiator.name,
        profileImage: initiator.communityProfile?.logo || initiator.profilePicture
      },
      recipient: {
        user: venue._id,
        userType: 'venue',
        name: venue.venueProfile?.venueName,
        profileImage: venue.venueProfile?.photos?.[0]
      },
      requestDetails: {
        eventId,
        eventName,
        eventDate,
        message
      },
      venueRequest: {
        date,
        timeSlot,
        expectedAttendees,
        eventType,
        budgetRange
      },
      status: 'submitted',  // Changed: Goes to admin first
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    });

    // Calculate priority based on event date
    if (eventDate) {
      const daysUntilEvent = Math.ceil((new Date(eventDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilEvent < 7) {
        collaboration.priority = 'high';
      } else if (daysUntilEvent < 14) {
        collaboration.priority = 'medium';
      }
    }

    await collaboration.save();

    // Send notification to admin instead of venue
    // TODO: Notify admin of new collaboration request

    res.status(201).json({
      message: 'Collaboration request submitted for admin review',
      collaboration
    });
  } catch (error) {
    console.error('Error creating venue collaboration request:', error);
    res.status(500).json({ message: 'Server error while creating collaboration request' });
  }
});

module.exports = router;
