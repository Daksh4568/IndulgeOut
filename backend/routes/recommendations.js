const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../utils/authUtils');
const recommendationEngine = require('../services/recommendationEngine');
const User = require('../models/User');

/**
 * GET /api/recommendations/events
 * Get personalized event recommendations for the authenticated user
 */
router.get('/events', authMiddleware, async (req, res) => {
  try {
    console.log('req.user object:', req.user);
    const userId = req.user.userId || req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('Fetching recommendations for user:', userId);
    
    const recommendations = await recommendationEngine.getEventRecommendations(userId, limit);
    
    console.log('Recommendations generated:', recommendations.length);
    
    // Track that recommendations were shown to the user
    if (recommendations.length > 0) {
      try {
        await recommendationEngine.updateRecommendationMetrics(userId, recommendations.length);
        console.log(`Tracked ${recommendations.length} recommendations shown to user ${userId}`);
      } catch (trackingError) {
        console.error('Error tracking recommendations shown:', trackingError);
        // Don't fail the request if tracking fails
      }
    }
    
    res.json({
      success: true,
      data: recommendations,
      meta: {
        total: recommendations.length,
        userId: userId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting event recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
});

/**
 * POST /api/recommendations/track/click
 * Track when user clicks on a recommended event
 */
router.post('/track/click', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.userId;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }
    
    await recommendationEngine.trackRecommendationInteraction(userId, eventId, 'click');
    
    res.json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking recommendation click:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track click',
      error: error.message
    });
  }
});

/**
 * POST /api/recommendations/track/register
 * Track when user registers for a recommended event
 */
router.post('/track/register', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.userId;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }
    
    // Track both recommendation interaction and update analytics
    await Promise.all([
      recommendationEngine.trackRecommendationInteraction(userId, eventId, 'register'),
      recommendationEngine.updateEventRegistrationAnalytics(userId, eventId)
    ]);
    
    res.json({
      success: true,
      message: 'Registration tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking recommendation registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track registration',
      error: error.message
    });
  }
});

/**
 * GET /api/recommendations/analytics
 * Get user's recommendation analytics and metrics
 */
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('Fetching analytics for user:', userId);
    
    const user = await User.findById(userId)
      .select('analytics preferences interests location')
      .populate('analytics.registeredEvents.event', 'title categories location date')
      .populate('analytics.joinedCommunities.community', 'name category');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize analytics if it doesn't exist
    if (!user.analytics) {
      user.analytics = {
        registeredEvents: [],
        joinedCommunities: [],
        locationHistory: [],
        categoryPreferences: [],
        searchHistory: [],
        recommendationMetrics: {
          totalRecommendationsShown: 0,
          recommendationsClicked: 0,
          recommendationsRegistered: 0,
          clickThroughRate: 0,
          conversionRate: 0,
          lastCalculated: new Date()
        }
      };
      await user.save();
    }
    
    const analytics = {
      recommendationMetrics: user.analytics?.recommendationMetrics || {
        totalRecommendationsShown: 0,
        recommendationsClicked: 0,
        recommendationsRegistered: 0,
        clickThroughRate: 0,
        conversionRate: 0
      },
      categoryPreferences: user.analytics?.categoryPreferences || [],
      locationHistory: user.analytics?.locationHistory || [],
      recentActivity: {
        registeredEvents: user.analytics?.registeredEvents?.slice(-10) || [],
        joinedCommunities: user.analytics?.joinedCommunities?.slice(-5) || []
      },
      userProfile: {
        interests: user.interests || [],
        location: user.location,
        preferences: user.preferences
      }
    };
    
    console.log('Analytics data prepared for user:', userId);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting recommendation analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

/**
 * POST /api/recommendations/preferences
 * Update user's recommendation preferences
 */
router.post('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      maxTravelDistance,
      preferredEventTimes,
      priceRange,
      notificationSettings
    } = req.body;
    
    const updateData = {};
    
    if (maxTravelDistance !== undefined) {
      updateData['preferences.maxTravelDistance'] = maxTravelDistance;
    }
    
    if (preferredEventTimes) {
      updateData['preferences.preferredEventTimes'] = preferredEventTimes;
    }
    
    if (priceRange) {
      updateData['preferences.priceRange'] = priceRange;
    }
    
    if (notificationSettings) {
      updateData['preferences.notificationSettings'] = notificationSettings;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('preferences');
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedUser.preferences
    });
  } catch (error) {
    console.error('Error updating recommendation preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
});

/**
 * POST /api/recommendations/search/track
 * Track user search queries for analytics
 */
router.post('/search/track', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { query, filters, resultsCount } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const searchData = {
      query: query.toLowerCase(),
      filters: filters || {},
      resultsCount: resultsCount || 0,
      timestamp: new Date()
    };
    
    await User.findByIdAndUpdate(userId, {
      $push: {
        'analytics.searchHistory': {
          $each: [searchData],
          $slice: -50 // Keep only last 50 searches
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Search tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track search',
      error: error.message
    });
  }
});

/**
 * GET /api/recommendations/insights
 * Get user insights and personalized statistics
 */
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId)
      .select('analytics interests location')
      .populate('analytics.registeredEvents.event', 'title categories location date price');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const analytics = user.analytics || {};
    const registeredEvents = analytics.registeredEvents || [];
    
    // Calculate insights
    const insights = {
      totalEventsAttended: registeredEvents.length,
      favoriteCategories: calculateFavoriteCategories(analytics.categoryPreferences),
      mostVisitedCities: calculateMostVisitedCities(analytics.locationHistory),
      attendancePattern: calculateAttendancePattern(registeredEvents),
      recommendationPerformance: analytics.recommendationMetrics,
      monthlyActivity: calculateMonthlyActivity(registeredEvents),
      upcomingRecommendations: await recommendationEngine.getEventRecommendations(userId, 3)
    };
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting user insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insights',
      error: error.message
    });
  }
});

// Helper functions for insights calculation
function calculateFavoriteCategories(categoryPreferences = []) {
  return categoryPreferences
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(pref => ({
      category: pref.category,
      score: pref.score,
      lastInteraction: pref.lastInteraction
    }));
}

function calculateMostVisitedCities(locationHistory = []) {
  return locationHistory
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5)
    .map(loc => ({
      city: loc.city,
      state: loc.state,
      frequency: loc.frequency,
      lastSeen: loc.lastSeen
    }));
}

function calculateAttendancePattern(registeredEvents = []) {
  const last12Months = new Date();
  last12Months.setMonth(last12Months.getMonth() - 12);
  
  const recentEvents = registeredEvents.filter(event => 
    new Date(event.registeredAt) > last12Months
  );
  
  const monthlyPattern = {};
  recentEvents.forEach(event => {
    const month = new Date(event.registeredAt).getMonth();
    monthlyPattern[month] = (monthlyPattern[month] || 0) + 1;
  });
  
  return {
    totalLastYear: recentEvents.length,
    averagePerMonth: recentEvents.length / 12,
    mostActiveMonth: Object.keys(monthlyPattern).reduce((a, b) => 
      monthlyPattern[a] > monthlyPattern[b] ? a : b, 0
    ),
    monthlyBreakdown: monthlyPattern
  };
}

function calculateMonthlyActivity(registeredEvents = []) {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const monthlyData = monthNames.map(month => ({ month, events: 0 }));
  
  registeredEvents.forEach(event => {
    const month = new Date(event.registeredAt).getMonth();
    monthlyData[month].events++;
  });
  
  return monthlyData;
}

module.exports = router;