const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Community = require('../models/Community');
const { authMiddleware } = require('../utils/authUtils');

// @route   GET /users/my-events
// @desc    Get user's events (upcoming, past, saved)
// @access  Private
router.get('/my-events', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Find all events where user is a participant
    const allEvents = await Event.find({
      'participants.user': userId
    })
    .populate('host', 'name')
    .sort({ date: 1 });

    // Separate into upcoming and past
    const upcoming = [];
    const past = [];

    allEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const participant = event.participants.find(p => p.user.toString() === userId);
      
      const eventData = {
        _id: event._id,
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.location?.address || 'TBD',
        city: event.location?.city,
        status: participant?.status === 'registered' ? 'Booked' : 
                participant?.status === 'attended' ? 'Attended' : 
                participant?.status === 'cancelled' ? 'Cancelled' : 'RSVP\'d',
        hostName: event.host?.name,
        categories: event.categories,
        price: event.price?.amount || 0
      };

      if (eventDate >= now && participant?.status !== 'attended' && participant?.status !== 'cancelled') {
        upcoming.push(eventData);
      } else if (eventDate < now || participant?.status === 'attended') {
        past.push(eventData);
      }
    });

    // Get saved events (from user's analytics)
    const user = await User.findById(userId);
    const savedEventIds = user.savedEvents || []; // We'll add this field to User model
    
    let saved = [];
    if (savedEventIds.length > 0) {
      const savedEventsData = await Event.find({
        _id: { $in: savedEventIds }
      })
      .populate('host', 'name')
      .sort({ date: -1 });

      saved = savedEventsData.map(event => ({
        _id: event._id,
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.location?.address || 'TBD',
        city: event.location?.city,
        location: event.location,
        images: event.images,
        status: 'Saved',
        hostName: event.host?.name,
        categories: event.categories,
        price: event.price?.amount || 0
      }));
    }

    res.json({
      upcoming,
      past,
      saved
    });

  } catch (error) {
    console.error('Error fetching my events:', error);
    res.status(500).json({ 
      message: 'Error fetching events', 
      error: error.message 
    });
  }
});

// @route   GET /users/my-interests
// @desc    Get user's selected interests/categories
// @access  Private
router.get('/my-interests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get interests from user's preferences
    const interests = user.interests || [];
    
    // If no interests set, try to derive from analytics
    let derivedInterests = [];
    if (interests.length === 0 && user.analytics?.categoryPreferences) {
      derivedInterests = user.analytics.categoryPreferences
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(cp => cp.category);
    }

    res.json({
      interests: interests.length > 0 ? interests : derivedInterests,
      source: interests.length > 0 ? 'manual' : 'derived'
    });

  } catch (error) {
    console.error('Error fetching interests:', error);
    res.status(500).json({ 
      message: 'Error fetching interests', 
      error: error.message 
    });
  }
});

// @route   GET /users/my-communities
// @desc    Get user's joined communities
// @access  Private
router.get('/my-communities', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Find communities where user is a member
    const communities = await Community.find({
      'members.user': userId
    })
    .populate('host', 'name')
    .sort({ createdAt: -1 });

    // For each community, count upcoming events
    const communitiesWithEvents = await Promise.all(
      communities.map(async (community) => {
        const upcomingEventsCount = await Event.countDocuments({
          community: community._id,
          date: { $gte: now },
          status: 'published'
        });

        return {
          _id: community._id,
          name: community.name,
          category: community.category,
          description: community.description,
          membersCount: community.members?.length || 0,
          upcomingEventsCount,
          organizer: community.host?.name,
          createdAt: community.createdAt
        };
      })
    );

    res.json({
      communities: communitiesWithEvents
    });

  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ 
      message: 'Error fetching communities', 
      error: error.message 
    });
  }
});

// @route   GET /users/people-recommendations
// @desc    Get people recommendations (locked for web - requires app)
// @access  Private
router.get('/people-recommendations', authMiddleware, async (req, res) => {
  try {
    // For now, return empty as this feature is app-only
    // In the future, this could return basic info about similar users
    res.json({
      people: [],
      message: 'This feature is available on our mobile app',
      requiresApp: true
    });

  } catch (error) {
    console.error('Error fetching people recommendations:', error);
    res.status(500).json({ 
      message: 'Error fetching recommendations', 
      error: error.message 
    });
  }
});

// @route   GET /users/my-rewards
// @desc    Get user's rewards, credits, tier, referrals
// @access  Private
router.get('/my-rewards', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get or initialize rewards data
    const rewardsData = user.rewards || {};
    
    // Count attended events
    const eventsAttended = user.analytics?.registeredEvents?.filter(
      e => e.attended === true
    ).length || 0;

    // Calculate tier based on points
    const points = rewardsData.points || 0;
    let tier = 'Bronze';
    if (points >= 5000) tier = 'Diamond';
    else if (points >= 2000) tier = 'Platinum';
    else if (points >= 1000) tier = 'Gold';
    else if (points >= 500) tier = 'Silver';

    // Check for expiring credits
    const expiringCredits = rewardsData.expiringCredits || 0;
    const expiryDate = rewardsData.expiryDate || null;

    res.json({
      credits: rewardsData.credits || 0,
      points: points,
      tier: tier,
      referrals: rewardsData.referrals || 0,
      eventsAttended: eventsAttended,
      expiringCredits: expiringCredits,
      expiryDate: expiryDate
    });

  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ 
      message: 'Error fetching rewards', 
      error: error.message 
    });
  }
});

// @route   POST /users/save-event/:eventId
// @desc    Save an event for later
// @access  Private
router.post('/save-event/:eventId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Add to saved events
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { savedEvents: eventId } },
      { new: true }
    );

    res.json({
      message: 'Event saved successfully',
      savedEvents: user.savedEvents
    });

  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).json({ 
      message: 'Error saving event', 
      error: error.message 
    });
  }
});

// @route   DELETE /users/unsave-event/:eventId
// @desc    Remove event from saved
// @access  Private
router.delete('/unsave-event/:eventId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.params;

    // Remove from saved events
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { savedEvents: eventId } },
      { new: true }
    );

    res.json({
      message: 'Event removed from saved',
      savedEvents: user.savedEvents
    });

  } catch (error) {
    console.error('Error removing saved event:', error);
    res.status(500).json({ 
      message: 'Error removing saved event', 
      error: error.message 
    });
  }
});

module.exports = router;
