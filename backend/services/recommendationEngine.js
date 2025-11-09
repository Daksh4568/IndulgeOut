const User = require('../models/User');
const Event = require('../models/Event');
const Community = require('../models/Community');

class RecommendationEngine {
  constructor() {
    this.weights = {
      interests: 0.35,        // 35% - User's selected interests
      location: 0.25,         // 25% - Location proximity
      recentActivity: 0.20,   // 20% - Recent event registrations
      communityBasedFiltering: 0.20  // 20% - Communities joined
    };
  }

  /**
   * Generate personalized event recommendations for a user
   * @param {String} userId - The user ID
   * @param {Number} limit - Number of recommendations to return
   * @returns {Array} Recommended events with scores
   */
  async getEventRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId)
        .populate('analytics.registeredEvents.event')
        .populate('analytics.joinedCommunities.community');
      
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize analytics if not present (for existing users)
      if (!user.analytics) {
        console.log('Initializing analytics for existing user:', userId);
        await User.findByIdAndUpdate(userId, {
          $set: {
            analytics: {
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
            }
          }
        });
        
        // Refetch user with updated analytics
        const updatedUser = await User.findById(userId);
        return this.generateRecommendationsForUser(updatedUser, limit);
      }

      return this.generateRecommendationsForUser(user, limit);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Generate recommendations for a user with analytics
   */
  async generateRecommendationsForUser(user, limit = 10) {
    try {
      // Get all available events (excluding already registered ones)
      const registeredEventIds = user.registeredEvents || [];
      const availableEvents = await Event.find({
        _id: { $nin: registeredEventIds },
        date: { $gte: new Date() }, // Only future events
        isActive: { $ne: false }
      }).populate('host', 'name location');

      if (availableEvents.length === 0) {
        return [];
      }

      // Calculate scores for each event using enhanced algorithm
      const eventScores = await Promise.all(
        availableEvents.map(event => this.calculateEnhancedEventScore(user, event))
      );

      // Sort by score and return top recommendations
      const recommendations = eventScores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          event: item.event,
          score: Math.round(item.score * 100) / 100, // Round to 2 decimal places
          reasons: item.reasons,
          confidence: this.calculateConfidence(item.score, item.reasons)
        }));

      // Note: Recommendation metrics will be updated when served to user
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations for user:', error);
      return [];
    }
  }

  /**
   * Enhanced event scoring with machine learning-like behavior
   */
  async calculateEnhancedEventScore(user, event) {
    let totalScore = 0;
    let reasons = [];

    // 1. Interest matching with historical preference learning (40%)
    const interestScore = this.calculateInterestScore(user, event);
    totalScore += interestScore * 0.4;
    if (interestScore > 0.5) {
      reasons.push(`Matches your interest in ${event.categories?.[0] || 'this activity'}`);
    }

    // 2. Location proximity with travel patterns (25%)
    const locationScore = await this.calculateLocationScore(user, event);
    totalScore += locationScore * 0.25;
    if (locationScore > 0.6) {
      reasons.push(`Near your location or preferred areas`);
    }

    // 3. Behavioral pattern matching (20%)
    const behaviorScore = await this.calculateBehavioralScore(user, event);
    totalScore += behaviorScore * 0.2;
    if (behaviorScore > 0.5) {
      reasons.push(`Similar to events you've enjoyed before`);
    }

    // 4. Community and social connections (15%)
    const socialScore = await this.calculateSocialScore(user, event);
    totalScore += socialScore * 0.15;
    if (socialScore > 0.5) {
      reasons.push(`Popular in your communities`);
    }

    // 5. Temporal preferences and availability
    const timeScore = this.calculateTimeScore(user, event);
    totalScore += timeScore * 0.1;

    // 6. Engagement and popularity boost
    const popularityScore = await this.calculatePopularityScore(event);
    totalScore += popularityScore * 0.05;

    // Apply user-specific learning adjustments
    const learningAdjustment = this.calculateLearningAdjustment(user, event);
    totalScore = totalScore * learningAdjustment;

    return {
      event,
      score: Math.min(totalScore, 1), // Cap at 1.0
      reasons
    };
  }

  /**
   * Calculate behavioral pattern score based on user's past actions
   */
  async calculateBehavioralScore(user, event) {
    const userAnalytics = user.analytics;
    if (!userAnalytics) return 0.1;

    let score = 0;

    // Check similar event types user has registered for
    const registeredEvents = userAnalytics.registeredEvents || [];
    const similarEvents = registeredEvents.filter(reg => {
      return event.categories?.some(cat => reg.category === cat);
    });

    if (similarEvents.length > 0) {
      score += Math.min(similarEvents.length * 0.15, 0.6);
    }

    // Check time-of-day preferences
    const eventHour = new Date(event.date).getHours();
    const userEventTimes = registeredEvents.map(reg => new Date(reg.registeredAt).getHours());
    const preferredHours = this.getPreferredHours(userEventTimes);
    
    if (preferredHours.includes(eventHour)) {
      score += 0.2;
    }

    // Check consistency in event frequency
    const recentEvents = registeredEvents.filter(reg => 
      new Date(reg.registeredAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    if (recentEvents.length > 0) {
      score += 0.2; // User is actively engaging
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate social score based on community connections
   */
  async calculateSocialScore(user, event) {
    let score = 0;

    // Check if event is in user's joined communities
    const userCommunities = user.analytics?.joinedCommunities || [];
    const eventCommunityId = event.community?.toString();
    
    if (eventCommunityId && userCommunities.some(comm => 
      comm.community?.toString() === eventCommunityId)) {
      score += 0.7;
    }

    // Check if event category matches user's community interests
    const communityCategories = userCommunities.map(comm => comm.category);
    const eventCategories = event.categories || [];
    
    const categoryMatch = eventCategories.some(cat => 
      communityCategories.includes(cat)
    );
    
    if (categoryMatch) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate time-based preferences
   */
  calculateTimeScore(user, event) {
    const eventDate = new Date(event.date);
    const eventDay = eventDate.getDay(); // 0 = Sunday, 6 = Saturday
    const eventHour = eventDate.getHours();

    let score = 0.5; // Base score

    // Weekend events generally have higher engagement
    if (eventDay === 0 || eventDay === 6) {
      score += 0.2;
    }

    // Evening events (6-9 PM) are popular
    if (eventHour >= 18 && eventHour <= 21) {
      score += 0.2;
    }

    // Avoid very early or very late events
    if (eventHour < 7 || eventHour > 22) {
      score -= 0.3;
    }

    return Math.max(score, 0.1);
  }

  /**
   * Calculate popularity score based on event engagement
   */
  async calculatePopularityScore(event) {
    const analytics = event.analytics || {};
    const registrations = event.registrations?.length || 0;
    const clicks = analytics.clicks || 0;
    const maxCapacity = event.maxAttendees || 100;

    let score = 0;

    // High registration rate
    const registrationRate = registrations / maxCapacity;
    if (registrationRate > 0.7) {
      score += 0.4;
    } else if (registrationRate > 0.5) {
      score += 0.2;
    }

    // High click-through rate
    if (clicks > 10) {
      score += 0.3;
    } else if (clicks > 5) {
      score += 0.1;
    }

    return Math.min(score, 0.5); // Cap at 0.5 to not overwhelm other factors
  }

  /**
   * Apply learning adjustments based on user's historical behavior
   */
  calculateLearningAdjustment(user, event) {
    const metrics = user.analytics?.recommendationMetrics;
    if (!metrics) return 1.0;

    const { clickThroughRate, conversionRate } = metrics;
    
    // If user has low engagement, slightly boost diverse recommendations
    if (clickThroughRate < 0.1) {
      return 1.1; // Slight boost to encourage exploration
    }

    // If user has high conversion, maintain strong recommendations
    if (conversionRate > 0.3) {
      return 1.05;
    }

    return 1.0; // No adjustment
  }

  /**
   * Calculate confidence level for the recommendation
   */
  calculateConfidence(score, reasons) {
    const reasonCount = reasons.length;
    const baseConfidence = score * 100;
    
    // Boost confidence with more reasons
    const reasonBoost = Math.min(reasonCount * 5, 20);
    
    return Math.min(baseConfidence + reasonBoost, 100);
  }

  /**
   * Get user's preferred event hours based on historical data
   */
  getPreferredHours(eventTimes) {
    if (eventTimes.length === 0) return [18, 19, 20]; // Default evening hours
    
    const hourCounts = {};
    eventTimes.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    // Return hours with highest frequency
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  /**
   * Calculate score based on user interests
   */
  calculateInterestScore(user, event) {
    const userInterests = user.interests || [];
    const eventCategories = event.categories || [];
    
    // Check if event category matches user interests
    const matchingInterests = eventCategories.filter(category => 
      userInterests.includes(category)
    );

    if (matchingInterests.length === 0) return 0;

    // Check user's category preferences from analytics
    const categoryPrefs = user.analytics?.categoryPreferences || [];
    const eventCategory = eventCategories[0];
    const userCategoryPref = categoryPrefs.find(pref => pref.category === eventCategory);

    // Base score for interest match
    let score = 0.7;

    // Boost score based on user's historical preference for this category
    if (userCategoryPref) {
      const preferenceBoost = Math.min(userCategoryPref.score / 10, 0.3);
      score += preferenceBoost;
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate score based on location proximity
   */
  async calculateLocationScore(user, event) {
    const userLocation = user.location;
    const eventLocation = event.location;

    if (!userLocation?.city || !eventLocation?.city) {
      return 0.1; // Low score if location data is missing
    }

    // Exact city match
    if (userLocation.city.toLowerCase() === eventLocation.city.toLowerCase()) {
      return 1.0;
    }

    // Same state match
    if (userLocation.state && eventLocation.state && 
        userLocation.state.toLowerCase() === eventLocation.state.toLowerCase()) {
      return 0.6;
    }

    // Check location history for frequent cities
    const locationHistory = user.analytics?.locationHistory || [];
    const frequentLocation = locationHistory.find(loc => 
      loc.city.toLowerCase() === eventLocation.city.toLowerCase()
    );

    if (frequentLocation) {
      return Math.min(0.4 + (frequentLocation.frequency * 0.1), 0.8);
    }

    // Check if within user's preferred travel distance
    const maxDistance = user.preferences?.maxTravelDistance || 50;
    // In a real app, you'd calculate actual distance using coordinates
    // For now, we'll use a simple heuristic
    
    return 0.2; // Low score for distant locations
  }

  /**
   * Calculate score based on recent activity patterns
   */
  calculateRecentActivityScore(user, event) {
    const recentEvents = user.analytics?.registeredEvents || [];
    
    if (recentEvents.length === 0) return 0.1;

    // Get events from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentActivity = recentEvents.filter(reg => 
      new Date(reg.registeredAt) > threeMonthsAgo
    );

    if (recentActivity.length === 0) return 0.1;

    // Check if event category matches recent activity
    const eventCategory = event.categories?.[0];
    const recentCategories = recentActivity.map(reg => reg.category);
    
    const categoryMatches = recentCategories.filter(cat => cat === eventCategory).length;
    const categoryScore = categoryMatches / recentActivity.length;

    // Check if event location matches recent activity
    const recentLocations = recentActivity.map(reg => reg.location?.city).filter(Boolean);
    const locationMatches = recentLocations.filter(city => 
      city.toLowerCase() === event.location?.city?.toLowerCase()
    ).length;
    const locationScore = recentLocations.length > 0 ? locationMatches / recentLocations.length : 0;

    // Weighted combination
    return (categoryScore * 0.7) + (locationScore * 0.3);
  }

  /**
   * Calculate score based on community affiliations
   */
  async calculateCommunityScore(user, event) {
    const userCommunities = user.analytics?.joinedCommunities || [];
    
    if (userCommunities.length === 0) return 0.1;

    // Check if event host is from user's communities
    const hostCommunities = userCommunities.filter(comm => 
      comm.community.host?.toString() === event.host._id?.toString()
    );

    if (hostCommunities.length > 0) {
      return 0.9; // High score for events from community hosts
    }

    // Check if event category matches user's community categories
    const eventCategory = event.categories?.[0];
    const communityCategoryMatches = userCommunities.filter(comm => 
      comm.category === eventCategory
    ).length;

    if (communityCategoryMatches === 0) return 0.1;

    // Score based on activity level in matching communities
    const activeCommunitiesScore = userCommunities
      .filter(comm => comm.category === eventCategory)
      .reduce((score, comm) => {
        const activityMultiplier = comm.activityLevel === 'high' ? 1 : 
                                 comm.activityLevel === 'medium' ? 0.7 : 0.4;
        return score + activityMultiplier;
      }, 0) / communityCategoryMatches;

    return Math.min(activeCommunitiesScore, 0.8);
  }

  /**
   * Calculate bonus factors
   */
  calculateBonusFactors(user, event) {
    let bonus = 0;

    // Time preference bonus
    const preferredTimes = user.preferences?.preferredEventTimes || [];
    const eventTime = event.time?.toLowerCase() || '';
    
    if (preferredTimes.length > 0) {
      const timeMatch = preferredTimes.some(time => {
        if (time === 'morning' && eventTime.includes('am')) return true;
        if (time === 'afternoon' && (eventTime.includes('pm') && !eventTime.includes('evening'))) return true;
        if (time === 'evening' && eventTime.includes('evening')) return true;
        if (time === 'night' && eventTime.includes('night')) return true;
        return false;
      });
      
      if (timeMatch) bonus += 0.05;
    }

    // Price preference bonus
    const priceRange = user.preferences?.priceRange;
    const eventPrice = event.price?.amount || 0;
    
    if (priceRange && eventPrice >= priceRange.min && eventPrice <= priceRange.max) {
      bonus += 0.05;
    }

    // Popular event bonus (based on registration count)
    const registrationRatio = (event.currentParticipants || 0) / (event.maxParticipants || 1);
    if (registrationRatio > 0.5 && registrationRatio < 0.9) {
      bonus += 0.03; // Popular but not full
    }

    return bonus;
  }

  /**
   * Update user's recommendation metrics
   */
  async updateRecommendationMetrics(userId, recommendationsCount) {
    try {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'analytics.recommendationMetrics.totalRecommendationsShown': recommendationsCount },
        $set: { 'analytics.recommendationMetrics.lastCalculated': new Date() }
      });
    } catch (error) {
      console.error('Error updating recommendation metrics:', error);
    }
  }

  /**
   * Track recommendation interaction (click/register) with enhanced analytics
   */
  async trackRecommendationInteraction(userId, eventId, action) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Initialize analytics if not present
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
      }

      // Update metrics based on action
      if (action === 'click') {
        user.analytics.recommendationMetrics.recommendationsClicked += 1;
        
        // Track the clicked event for learning
        await this.trackEventInteraction(userId, eventId, 'click');
      } else if (action === 'register') {
        user.analytics.recommendationMetrics.recommendationsRegistered += 1;
        
        // Track the registration for learning
        await this.trackEventInteraction(userId, eventId, 'register');
      }

      // Recalculate rates
      const metrics = user.analytics.recommendationMetrics;
      if (metrics.totalRecommendationsShown > 0) {
        metrics.clickThroughRate = metrics.recommendationsClicked / metrics.totalRecommendationsShown;
        metrics.conversionRate = metrics.recommendationsClicked > 0 ? 
          metrics.recommendationsRegistered / metrics.recommendationsClicked : 0;
      }

      // Update lastCalculated before saving
      user.analytics.recommendationMetrics.lastCalculated = new Date();
      
      // Save updated analytics
      await User.findByIdAndUpdate(userId, {
        $set: { 
          analytics: user.analytics
        }
      });

      console.log(`Tracked ${action} for user ${userId}, event ${eventId}`);
    } catch (error) {
      console.error('Error tracking recommendation interaction:', error);
    }
  }

  /**
   * Track specific event interactions for machine learning
   */
  async trackEventInteraction(userId, eventId, action) {
    try {
      const event = await Event.findById(eventId);
      if (!event) return;

      const user = await User.findById(userId);
      if (!user) return;

      // Track user's category preferences
      if (event.categories && event.categories.length > 0) {
        const category = event.categories[0];
        await this.updateCategoryPreference(userId, category, action);
      }

      // Track location preferences
      if (event.location && event.location.city) {
        await this.updateLocationHistory(userId, event.location, action);
      }

      // Update event analytics
      await this.updateEventAnalytics(eventId, action);

    } catch (error) {
      console.error('Error tracking event interaction:', error);
    }
  }

  /**
   * Update user's category preferences based on interactions
   */
  async updateCategoryPreference(userId, category, action) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.analytics) return;

      let categoryPrefs = user.analytics.categoryPreferences || [];
      let existingPref = categoryPrefs.find(pref => pref.category === category);

      if (existingPref) {
        // Update existing preference
        const scoreIncrease = action === 'register' ? 2 : 1;
        existingPref.score += scoreIncrease;
        existingPref.interactions += 1;
        existingPref.lastInteraction = new Date();
      } else {
        // Add new preference
        categoryPrefs.push({
          category: category,
          score: action === 'register' ? 2 : 1,
          interactions: 1,
          lastInteraction: new Date()
        });
      }

      // Sort by score and keep top 10 preferences
      categoryPrefs = categoryPrefs
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      await User.findByIdAndUpdate(userId, {
        $set: { 'analytics.categoryPreferences': categoryPrefs }
      });

    } catch (error) {
      console.error('Error updating category preference:', error);
    }
  }

  /**
   * Update user's location history and preferences
   */
  async updateLocationHistory(userId, location, action) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.analytics) return;

      let locationHistory = user.analytics.locationHistory || [];
      let existingLocation = locationHistory.find(loc => 
        loc.city.toLowerCase() === location.city.toLowerCase()
      );

      if (existingLocation) {
        existingLocation.frequency += action === 'register' ? 2 : 1;
        existingLocation.lastVisit = new Date();
      } else {
        locationHistory.push({
          city: location.city,
          state: location.state || '',
          frequency: action === 'register' ? 2 : 1,
          lastVisit: new Date()
        });
      }

      // Keep top 15 locations
      locationHistory = locationHistory
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 15);

      await User.findByIdAndUpdate(userId, {
        $set: { 'analytics.locationHistory': locationHistory }
      });

    } catch (error) {
      console.error('Error updating location history:', error);
    }
  }

  /**
   * Update event-specific analytics
   */
  async updateEventAnalytics(eventId, action) {
    try {
      const event = await Event.findById(eventId);
      if (!event) return;

      if (!event.analytics) {
        event.analytics = {
          views: 0,
          clicks: 0,
          registrations: 0,
          clickThroughRate: 0,
          conversionRate: 0,
          lastUpdated: new Date()
        };
      }

      if (action === 'click') {
        event.analytics.clicks += 1;
      } else if (action === 'register') {
        event.analytics.registrations += 1;
      }

      // Calculate rates
      if (event.analytics.views > 0) {
        event.analytics.clickThroughRate = event.analytics.clicks / event.analytics.views;
        if (event.analytics.clicks > 0) {
          event.analytics.conversionRate = event.analytics.registrations / event.analytics.clicks;
        }
      }

      event.analytics.lastUpdated = new Date();
      await event.save();

    } catch (error) {
      console.error('Error updating event analytics:', error);
    }
  }

  /**
   * Update user analytics when they register for an event
   */
  async updateEventRegistrationAnalytics(userId, eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) return;

      const analyticsData = {
        event: eventId,
        category: event.categories?.[0],
        location: event.location,
        registeredAt: new Date()
      };

      // Add to registered events analytics
      await User.findByIdAndUpdate(userId, {
        $push: { 'analytics.registeredEvents': analyticsData }
      });

      // Update category preferences
      await this.updateCategoryPreference(userId, event.categories?.[0]);

      // Update location history
      if (event.location?.city) {
        await this.updateLocationHistory(userId, event.location);
      }
    } catch (error) {
      console.error('Error updating event registration analytics:', error);
    }
}
}

module.exports = new RecommendationEngine();