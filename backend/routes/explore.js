const express = require('express');
const Event = require('../models/Event.js');
const Community = require('../models/Community.js');
const User = require('../models/User.js');
const { authMiddleware, optionalAuthMiddleware } = require('../utils/authUtils.js');

const router = express.Router();

// Search events with autocomplete
router.get('/events/search', async (req, res) => {
  console.log('🔍 Search endpoint hit:', req.query);
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim() === '') {
      console.log('⚠️ Empty search query, returning empty results');
      return res.json({ events: [], suggestions: [] });
    }

    // Enhanced search with word boundaries and partial matching
    const searchTerm = q.trim();
    const searchWords = searchTerm.split(' ').filter(word => word.length > 0);
    
    // Create flexible regex patterns for better matching
    const exactRegex = new RegExp(searchTerm, 'i');
    const wordRegexes = searchWords.map(word => new RegExp(word, 'i'));
    
    // Category synonyms mapping for semantic search
    const categoryMappings = {
      'sports': ['Sweat & Play', 'cricket', 'football', 'basketball', 'tennis', 'badminton', 'sports'],
      'food': ['Sip & Savor', 'restaurant', 'dining', 'food', 'cuisine', 'cooking'],
      'art': ['Art & DIY', 'Make & Create', 'painting', 'craft', 'creative', 'art'],
      'music': ['Music & Performance', 'Battle of the Beats', 'Open Mics & Jams', 'concert', 'band', 'music'],
      'outdoor': ['Adventure & Outdoors', 'hiking', 'camping', 'trekking', 'nature', 'outdoor'],
      'fitness': ['Sweat & Play', 'Mind & Body Recharge', 'yoga', 'gym', 'workout', 'fitness'],
      'tech': ['Tech Unplugged', 'Learn & Network', 'technology', 'coding', 'programming', 'tech'],
      'social': ['Meet & Mingle', 'Social Mixers', 'networking', 'meetup', 'social'],
      'movies': ['Epic Screenings', 'film', 'cinema', 'movies', 'screening'],
      'games': ['Indoor & Board Games', 'gaming', 'board games', 'video games']
    };
    
    // Check if search term matches any category mapping
    let expandedSearchTerms = [searchTerm];
    for (const [key, values] of Object.entries(categoryMappings)) {
      if (searchTerm.toLowerCase().includes(key)) {
        expandedSearchTerms.push(...values);
      }
    }
    
    // Build comprehensive search query with relevance scoring
    const searchQuery = {
      status: 'published',
      $or: [
        // Exact title match (highest priority)
        { title: exactRegex },
        // Description match
        { description: exactRegex },
        // Tags match
        { tags: { $in: wordRegexes } },
        // Categories match (with expanded terms)
        { categories: { $in: expandedSearchTerms.map(term => new RegExp(term, 'i')) } },
        // Location match
        { 'location.city': exactRegex },
        { 'location.address': exactRegex },
        // Individual word matches
        ...wordRegexes.map(regex => ({ title: regex })),
        ...wordRegexes.map(regex => ({ description: regex }))
      ]
    };
    
    // Search with population and sorting by relevance
    let events = await Event.find(searchQuery)
      .populate('host', 'name email')
      .limit(parseInt(limit) * 2); // Get more to filter and sort
    
    // Calculate relevance score for each event
    events = events.map(event => {
      let score = 0;
      const eventData = event.toObject();
      
      // Title exact match (highest score)
      if (exactRegex.test(eventData.title)) score += 100;
      
      // Category match
      if (eventData.categories?.some(cat => exactRegex.test(cat))) score += 50;
      
      // Tag match
      if (eventData.tags?.some(tag => exactRegex.test(tag))) score += 40;
      
      // Description match
      if (exactRegex.test(eventData.description)) score += 30;
      
      // Location match
      if (exactRegex.test(eventData.location?.city)) score += 20;
      
      // Word matches
      wordRegexes.forEach(regex => {
        if (regex.test(eventData.title)) score += 15;
        if (eventData.categories?.some(cat => regex.test(cat))) score += 10;
        if (eventData.tags?.some(tag => regex.test(tag))) score += 8;
      });
      
      // Boost for upcoming events
      if (new Date(eventData.date) > new Date()) score += 10;
      
      // Boost for popular events
      score += (eventData.currentParticipants || 0) * 0.5;
      
      return { ...eventData, _id: event._id, relevanceScore: score };
    });
    
    // Sort by relevance and limit
    events = events
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, parseInt(limit));

    console.log(`✅ Found ${events.length} events matching "${q}" (expanded: ${expandedSearchTerms.join(', ')})`);

    // Generate smart autocomplete suggestions
    const suggestions = [
      ...new Set([
        ...events.map(e => e.title),
        ...events.flatMap(e => e.categories || []),
        ...events.flatMap(e => e.tags || []),
        ...events.map(e => e.location?.city).filter(Boolean)
      ])
    ]
      .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 8);

    console.log('💡 Suggestions:', suggestions);
    res.json({ events, suggestions });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get popular events
router.get('/events/popular', async (req, res) => {
  console.log('🔥 Popular events endpoint hit:', req.query);
  try {
    const { limit = 15, page = 1 } = req.query;
    const now = new Date();
    const skip = (page - 1) * limit;
    
    // Get upcoming events sorted by popularity
    const upcomingEvents = await Event.find({
      status: 'published',
      date: { $gte: now }
    })
      .populate('host', 'name email')
      .sort({ 
        currentParticipants: -1,
        'analytics.views': -1,
        date: 1
      })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get past events sorted by date (most recent first) then popularity
    const pastEvents = await Event.find({
      status: 'published',
      date: { $lt: now }
    })
      .populate('host', 'name email')
      .sort({ 
        date: -1,
        currentParticipants: -1,
        'analytics.views': -1
      })
      .skip(Math.max(0, skip - upcomingEvents.length))
      .limit(Math.max(0, parseInt(limit) - upcomingEvents.length));
    
    // Combine: upcoming events first, then past events
    const events = [...upcomingEvents, ...pastEvents];
    
    // Get total counts for pagination
    const totalUpcoming = await Event.countDocuments({
      status: 'published',
      date: { $gte: now }
    });
    const totalPast = await Event.countDocuments({
      status: 'published',
      date: { $lt: now }
    });
    const total = totalUpcoming + totalPast;

    console.log(`✅ Found ${events.length} popular events (${upcomingEvents.length} upcoming, ${pastEvents.length} past)`);
    res.json({ 
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Popular events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get recommended events (requires auth)
router.get('/events/recommended', authMiddleware, async (req, res) => {
  try {
    const { limit = 15, page = 1 } = req.query;
    const now = new Date();
    const skip = (page - 1) * limit;
    
    // Get user interests
    const user = await User.findById(req.user.userId);
    if (!user || !user.interests || user.interests.length === 0) {
      // If no interests, return popular events
      const upcomingEvents = await Event.find({
        status: 'published',
        date: { $gte: now }
      })
        .populate('host', 'name email')
        .sort({ currentParticipants: -1, date: 1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const pastEvents = await Event.find({
        status: 'published',
        date: { $lt: now }
      })
        .populate('host', 'name email')
        .sort({ date: -1, currentParticipants: -1 })
        .skip(Math.max(0, skip - upcomingEvents.length))
        .limit(Math.max(0, parseInt(limit) - upcomingEvents.length));
      
      const events = [...upcomingEvents, ...pastEvents];
      return res.json({ events, pagination: { page: parseInt(page), limit: parseInt(limit) } });
    }

    // Find upcoming events matching user interests
    const upcomingEvents = await Event.find({
      status: 'published',
      categories: { $in: user.interests },
      date: { $gte: now }
    })
      .populate('host', 'name email')
      .sort({ date: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Find past events matching user interests
    const pastEvents = await Event.find({
      status: 'published',
      categories: { $in: user.interests },
      date: { $lt: now }
    })
      .populate('host', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .skip(Math.max(0, skip - upcomingEvents.length))
      .limit(Math.max(0, parseInt(limit) - upcomingEvents.length));
    
    const events = [...upcomingEvents, ...pastEvents];
    const total = await Event.countDocuments({
      status: 'published',
      categories: { $in: user.interests }
    });

    res.json({ 
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Recommended events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get nearby events based on geolocation
router.get('/events/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50, limit = 12 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInKm = parseFloat(radius);

    // Calculate bounding box
    const latDelta = radiusInKm / 111;
    const lngDelta = radiusInKm / (111 * Math.cos(latitude * Math.PI / 180));

    const events = await Event.find({
      status: 'published',
      'location.coordinates.latitude': {
        $gte: latitude - latDelta,
        $lte: latitude + latDelta
      },
      'location.coordinates.longitude': {
        $gte: longitude - lngDelta,
        $lte: longitude + lngDelta
      }
    })
      .populate('host', 'name email')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    // Calculate distances using Haversine formula
    const eventsWithDistance = events.map(event => {
      const eventLat = event.location.coordinates?.latitude;
      const eventLng = event.location.coordinates?.longitude;
      
      if (eventLat && eventLng) {
        const R = 6371;
        const dLat = (eventLat - latitude) * Math.PI / 180;
        const dLng = (eventLng - longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(eventLat * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return {
          ...event.toObject(),
          distance: Math.round(distance * 10) / 10
        };
      }
      
      return {
        ...event.toObject(),
        distance: null
      };
    }).sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    res.json({ events: eventsWithDistance });
  } catch (error) {
    console.error('Nearby events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get featured communities (limited to 15 for explore page)
router.get('/communities/featured', async (req, res) => {
  console.log('✨ Featured communities endpoint hit:', req.query);
  try {
    const { limit = 15, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const communities = await Community.find({
      isPrivate: false
    })
      .populate('host', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Sort by member count (since memberCount is now a virtual field)
    communities.sort((a, b) => {
      const countA = a.members?.length || 0;
      const countB = b.members?.length || 0;
      if (countB !== countA) return countB - countA;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Add memberCount virtual field manually for lean queries
    communities.forEach(c => {
      c.memberCount = c.members?.length || 0;
    });
    
    const total = await Community.countDocuments({ isPrivate: false });

    console.log(`✅ Found ${communities.length} featured communities`);
    res.json({ 
      communities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Featured communities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get communities with filtering
router.get('/communities/search', async (req, res) => {
  try {
    const { category, city, q, limit = 15, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = { isPrivate: false };
    
    if (category) {
      filter.category = category;
    }
    
    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }
    
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    const communities = await Community.find(filter)
      .populate('host', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Sort by member count (since memberCount is now a virtual field)
    communities.sort((a, b) => {
      const countA = a.members?.length || 0;
      const countB = b.members?.length || 0;
      return countB - countA;
    });
    
    // Add memberCount virtual field manually for lean queries
    communities.forEach(c => {
      c.memberCount = c.members?.length || 0;
    });
    
    const total = await Community.countDocuments(filter);

    res.json({ 
      communities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Communities search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
