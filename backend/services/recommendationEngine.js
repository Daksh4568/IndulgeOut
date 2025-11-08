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

      // Calculate scores for each event
      const eventScores = await Promise.all(
        availableEvents.map(event => this.calculateEventScore(user, event))
      );

      // Sort by score and return top recommendations
      const recommendations = eventScores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          event: item.event,
          score: item.score,
          reasons: item.reasons
        }));

      // Update user's recommendation metrics
      await this.updateRecommendationMetrics(user._id, recommendations.length);

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations for user:', error);
      return [];
    }
  }

  /**
   * Calculate recommendation score for a specific event
   * @param {Object} user - User object with analytics
   * @param {Object} event - Event object
   * @returns {Object} Event with calculated score and reasons
   */
  async calculateEventScore(user, event) {
    let totalScore = 0;
    const reasons = [];

    // 1. INTERESTS SCORE (35%)
    const interestScore = this.calculateInterestScore(user, event);
    totalScore += interestScore * this.weights.interests;
    if (interestScore > 0) {
      reasons.push(`Matches your interest in ${event.categories?.[0] || 'this category'}`);
    }

    // 2. LOCATION SCORE (25%)
    const locationScore = await this.calculateLocationScore(user, event);
    totalScore += locationScore * this.weights.location;
    if (locationScore > 0.7) {
      reasons.push(`Near your preferred locations`);
    }

    // 3. RECENT ACTIVITY SCORE (20%)
    const activityScore = this.calculateRecentActivityScore(user, event);
    totalScore += activityScore * this.weights.recentActivity;
    if (activityScore > 0.5) {
      reasons.push(`Similar to events you've attended recently`);
    }

    // 4. COMMUNITY-BASED FILTERING SCORE (20%)
    const communityScore = await this.calculateCommunityScore(user, event);
    totalScore += communityScore * this.weights.communityBasedFiltering;
    if (communityScore > 0.5) {
      reasons.push(`Popular in communities you've joined`);
    }

    // Additional factors
    const bonusScore = this.calculateBonusFactors(user, event);
    totalScore += bonusScore;

    return {
      event,
      score: Math.min(totalScore, 1), // Cap at 1.0
      reasons
    };
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
   * Track recommendation interaction (click/register)
   */
  async trackRecommendationInteraction(userId, eventId, action) {
    try {
      const updateField = action === 'click' ? 
        'analytics.recommendationMetrics.recommendationsClicked' :
        'analytics.recommendationMetrics.recommendationsRegistered';

      await User.findByIdAndUpdate(userId, {
        $inc: { [updateField]: 1 }
      });

      // Calculate new rates
      const user = await User.findById(userId);
      const metrics = user.analytics?.recommendationMetrics;
      
      if (metrics) {
        const clickThroughRate = metrics.totalRecommendationsShown > 0 ? 
          metrics.recommendationsClicked / metrics.totalRecommendationsShown : 0;
        const conversionRate = metrics.recommendationsClicked > 0 ? 
          metrics.recommendationsRegistered / metrics.recommendationsClicked : 0;

        await User.findByIdAndUpdate(userId, {
          $set: {
            'analytics.recommendationMetrics.clickThroughRate': clickThroughRate,
            'analytics.recommendationMetrics.conversionRate': conversionRate
          }
        });
      }
    } catch (error) {
      console.error('Error tracking recommendation interaction:', error);
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

  /**
   * Update category preference score
   */
  async updateCategoryPreference(userId, category) {
    if (!category) return;

    try {
      const user = await User.findById(userId);
      const categoryPrefs = user.analytics?.categoryPreferences || [];
      const existingPref = categoryPrefs.find(pref => pref.category === category);

      if (existingPref) {
        // Increase score for existing preference using positional operator
        await User.findOneAndUpdate(
          { _id: userId, 'analytics.categoryPreferences.category': category },
          {
            $inc: { 'analytics.categoryPreferences.$.score': 1 },
            $set: { 'analytics.categoryPreferences.$.lastInteraction': new Date() }
          }
        );
      } else {
        // Add new category preference
        await User.findByIdAndUpdate(userId, {
          $push: {
            'analytics.categoryPreferences': {
              category,
              score: 1,
              lastInteraction: new Date()
            }
          }
        });
      }
    } catch (error) {
      console.error('Error updating category preference:', error);
    }
  }

  /**
   * Update location history
   */
  async updateLocationHistory(userId, location) {
    if (!location?.city) return;

    try {
      const user = await User.findById(userId);
      const locationHistory = user.analytics?.locationHistory || [];
      const existingLocation = locationHistory.find(loc => 
        loc.city.toLowerCase() === location.city.toLowerCase()
      );

      if (existingLocation) {
        // Update frequency for existing location using positional operator
        await User.findOneAndUpdate(
          { _id: userId, 'analytics.locationHistory.city': { $regex: new RegExp(`^${location.city}$`, 'i') } },
          {
            $inc: { 'analytics.locationHistory.$.frequency': 1 },
            $set: { 'analytics.locationHistory.$.lastSeen': new Date() }
          }
        );
      } else {
        // Add new location
        await User.findByIdAndUpdate(userId, {
          $push: {
            'analytics.locationHistory': {
              city: location.city,
              state: location.state,
              country: location.country || 'India',
              frequency: 1,
              lastSeen: new Date()
            }
          }
        });
      }
    } catch (error) {
      console.error('Error updating location history:', error);
    }
  }
}

module.exports = new RecommendationEngine();