const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Collaboration = require('../models/Collaboration');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../utils/authUtils');
const { checkAndGenerateActionRequiredNotifications } = require('../utils/checkUserActionRequirements');

// @route   GET /api/brands/browse
// @desc    Get all brands with optional filters
// @access  Public
router.get('/browse', async (req, res) => {
  try {
    const {
      brandCategory,
      targetCity,
      sponsorshipType,
      collaborationIntent,
      budgetScale,
      search
    } = req.query;

    // Build query for users with hostPartnerType: 'brand_sponsor'
    let query = { hostPartnerType: 'brand_sponsor' };

    // Brand category filter
    if (brandCategory) {
      query['brandProfile.brandCategory'] = brandCategory;
    }

    // Target city filter
    if (targetCity) {
      query['brandProfile.targetCity'] = targetCity;
    }

    // Sponsorship type filter
    if (sponsorshipType) {
      const typesArray = Array.isArray(sponsorshipType) ? sponsorshipType : [sponsorshipType];
      query['brandProfile.sponsorshipType'] = { $in: typesArray };
    }

    // Collaboration intent filter
    if (collaborationIntent) {
      const intentsArray = Array.isArray(collaborationIntent) ? collaborationIntent : [collaborationIntent];
      query['brandProfile.collaborationIntent'] = { $in: intentsArray };
    }

    // Budget scale filter
    if (budgetScale) {
      if (budgetScale === 'micro') {
        query['brandProfile.budget.max'] = { $lte: 50000 };
      } else if (budgetScale === 'mid') {
        query['brandProfile.budget.max'] = { $gt: 50000, $lte: 200000 };
      } else if (budgetScale === 'large') {
        query['brandProfile.budget.max'] = { $gt: 200000 };
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { 'brandProfile.brandName': { $regex: search, $options: 'i' } },
        { 'brandProfile.brandDescription': { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch brands
    const brands = await User.find(query)
      .select('brandProfile')
      .lean();

    // Transform data for frontend
    const transformedBrands = brands.map(brand => ({
      _id: brand._id,
      brandName: brand.brandProfile?.brandName,
      brandCategory: brand.brandProfile?.brandCategory,
      brandDescription: brand.brandProfile?.brandDescription,
      logo: brand.brandProfile?.logo,
      targetCity: brand.brandProfile?.targetCity || [],
      sponsorshipType: brand.brandProfile?.sponsorshipType || [],
      collaborationIntent: brand.brandProfile?.collaborationIntent || [],
      budget: brand.brandProfile?.budget || {},
      pastActivations: brand.brandProfile?.pastActivations || 0,
      // Add missing fields
      images: brand.brandProfile?.brandAssets || [],
      brandAssets: brand.brandProfile?.brandAssets || [],
      website: brand.brandProfile?.website,
      instagram: brand.brandProfile?.instagram,
      facebook: brand.brandProfile?.facebook,
      linkedin: brand.brandProfile?.linkedin,
      contactPerson: brand.brandProfile?.contactPerson || {}
    }));

    console.log('🏷️ Brands fetched:', transformedBrands.length);
    transformedBrands.forEach((brand, index) => {
      console.log(`\n🏢 Brand ${index + 1}: ${brand.brandName}`);
      console.log('  Target Cities:', brand.targetCity);
      console.log('  Budget:', brand.budget);
      console.log('  Contact Person:', brand.contactPerson);
      console.log('  Images:', brand.images?.length || 0);
    });

    res.json(transformedBrands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Server error while fetching brands' });
  }
});

// @route   GET /api/brands/dashboard
// @desc    Get brand dashboard data
// @access  Private (Brand only)
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verify the user is a brand sponsor
    const brand = await User.findById(userId);
    if (!brand || !(brand.role === 'host_partner' && brand.hostPartnerType === 'brand_sponsor')) {
      return res.status(403).json({ message: 'Access denied. Only brand sponsors can access this dashboard.' });
    }

    // Generate action required notifications if needed
    await checkAndGenerateActionRequiredNotifications(userId);

    // 1. Actions Required
    const actionsRequired = [];

    // Query action_required notifications from Notification model
    // Don't filter by read status - action items should show until completed
    const actionRequiredNotifications = await Notification.find({
      recipient: userId,
      category: 'action_required'
    }).sort({ createdAt: -1 });

    // Deduplicate notifications by type - keep only the most recent of each type
    const seenTypes = new Set();
    actionRequiredNotifications.forEach(notif => {
      if (!seenTypes.has(notif.type)) {
        seenTypes.add(notif.type);
        actionsRequired.push({
          id: notif._id,
          type: notif.type,
          priority: notif.priority || 'medium',
          title: notif.title,
          description: notif.message,
          actionUrl: notif.actionButton?.link || '/profile',
          ctaText: notif.actionButton?.text || 'View',
          itemId: notif._id,
          createdAt: notif.createdAt
        });
      }
    });

    // Check for pending collaboration approvals (submitted by admin, awaiting brand response)
    const pendingApprovals = await Collaboration.find({
      'recipient.user': userId,
      status: 'admin_approved'
    }).populate('requestDetails.eventId', 'name date').limit(5);

    pendingApprovals.forEach(collab => {
      actionsRequired.push({
        id: collab._id,
        type: 'collaboration_request',
        priority: 'high',
        title: 'New Collaboration Request',
        description: `Review collaboration for ${collab.requestDetails?.eventId?.name || 'an event'}`,
        actionUrl: `/collaborations/${collab._id}`,
        createdAt: collab.createdAt
      });
    });

    // Check for clarifications requested
    const clarificationsNeeded = await Collaboration.find({
      'recipient.user': userId,
      status: 'clarification_requested'
    }).populate('requestDetails.eventId', 'name').limit(3);

    clarificationsNeeded.forEach(collab => {
      actionsRequired.push({
        id: collab._id,
        type: 'clarification_requested',
        priority: 'high',
        title: 'Clarification Needed',
        description: `Provide additional information for ${collab.requestDetails?.eventId?.name || 'collaboration'}`,
        actionUrl: `/collaborations/${collab._id}`,
        createdAt: collab.updatedAt
      });
    });

    // Check for completed events awaiting feedback
    const feedbackPending = await Collaboration.find({
      'recipient.user': userId,
      status: 'completed',
      'feedback.brandFeedback': { $exists: false }
    }).populate('requestDetails.eventId', 'name').limit(3);

    feedbackPending.forEach(collab => {
      actionsRequired.push({
        id: collab._id,
        type: 'feedback_pending',
        priority: 'medium',
        title: 'Provide Event Feedback',
        description: `Share your experience for ${collab.requestDetails?.eventId?.name || 'completed event'}`,
        actionUrl: `/collaborations/${collab._id}/feedback`,
        createdAt: collab.updatedAt
      });
    });

    // Check for profile completion
    const profileComplete = brand.brandProfile?.companyName &&
      brand.brandProfile?.industries &&
      brand.brandProfile?.industries.length > 0 &&
      brand.brandProfile?.logo;

    if (!profileComplete) {
      actionsRequired.push({
        id: 'profile_incomplete',
        type: 'profile_incomplete',
        priority: 'medium',
        title: 'Complete Your Brand Profile',
        description: 'Add company details and logo to increase collaboration opportunities',
        actionUrl: '/brand/profile/edit'
      });
    }

    // Sort actions by priority and date
    actionsRequired.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    // 2. Active Collaborations
    const activeCollaborations = await Collaboration.find({
      'recipient.user': userId,
      status: { $in: ['vendor_accepted', 'in_progress', 'completed'] }
    })
      .populate('requestDetails.eventId', 'name date city category status analytics')
      .populate('requestDetails.communityId', 'name communityProfile')
      .sort({ 'requestDetails.eventId.date': 1 })
      .limit(10);

    const collaborationsData = activeCollaborations.map(collab => {
      const event = collab.requestDetails?.eventId;
      return {
        id: collab._id,
        eventName: event?.name || 'N/A',
        communityName: collab.requestDetails?.communityId?.name || 'N/A',
        city: event?.city || 'N/A',
        category: event?.category || 'N/A',
        date: event?.date,
        status: event?.status || 'upcoming',
        collaborationType: collab.collaborationType,
        expectedFootfall: event?.analytics?.expectedAttendance || 0,
        actualFootfall: event?.analytics?.actualAttendance || null,
        engagement: event?.analytics?.actualAttendance && event?.analytics?.expectedAttendance
          ? ((event.analytics.actualAttendance / event.analytics.expectedAttendance) * 100).toFixed(0)
          : null
      };
    });

    // 3. Performance & Impact Metrics
    const totalCollaborations = await Collaboration.countDocuments({
      'recipient.user': userId,
      status: { $in: ['vendor_accepted', 'in_progress', 'completed'] }
    });

    // Calculate cities reached
    const citiesReached = await Collaboration.aggregate([
      {
        $match: {
          'recipient.user': userId,
          status: { $in: ['vendor_accepted', 'in_progress', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'requestDetails.eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: '$event.city'
        }
      },
      { $count: 'total' }
    ]);

    // Calculate total footfall from completed events
    const footfallData = await Collaboration.aggregate([
      {
        $match: {
          'recipient.user': userId,
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'requestDetails.eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: null,
          totalFootfall: { $sum: '$event.analytics.actualAttendance' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalFootfall = footfallData.length > 0 ? footfallData[0].totalFootfall || 0 : 0;
    const completedCollabs = footfallData.length > 0 ? footfallData[0].count || 0 : 0;
    const avgEngagement = completedCollabs > 0 ? Math.round(totalFootfall / completedCollabs) : 0;

    // 4. Insights - What's Working
    const insights = {
      whatsWorking: [],
      recentPerformance: []
    };

    // Best event types for the brand
    const eventTypePerformance = await Collaboration.aggregate([
      {
        $match: {
          'recipient.user': userId,
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'requestDetails.eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: '$event.category',
          count: { $sum: 1 },
          avgAttendance: { $avg: '$event.analytics.actualAttendance' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    if (eventTypePerformance.length > 0) {
      eventTypePerformance.forEach(type => {
        insights.whatsWorking.push({
          title: `Strong Performance in ${type._id || 'Events'}`,
          description: `You've collaborated on ${type.count} ${type._id || 'events'} with an average footfall of ${Math.round(type.avgAttendance || 0)} attendees`,
          metric: type.count
        });
      });
    }

    // Top performing collaboration types
    const collabTypePerformance = await Collaboration.aggregate([
      {
        $match: {
          'recipient.user': userId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$collaborationType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    if (collabTypePerformance.length > 0) {
      insights.whatsWorking.push({
        title: `${collabTypePerformance[0]._id} Collaborations Excel`,
        description: `Your ${collabTypePerformance[0]._id} partnerships have been highly successful`,
        metric: collabTypePerformance[0].count
      });
    }

    // Top performing cities
    const cityPerformance = await Collaboration.aggregate([
      {
        $match: {
          'recipient.user': userId,
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'requestDetails.eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: '$event.city',
          count: { $sum: 1 },
          totalFootfall: { $sum: '$event.analytics.actualAttendance' }
        }
      },
      { $sort: { totalFootfall: -1 } },
      { $limit: 1 }
    ]);

    if (cityPerformance.length > 0) {
      insights.whatsWorking.push({
        title: `${cityPerformance[0]._id} is Your Top Market`,
        description: `${cityPerformance[0].count} successful collaborations with ${cityPerformance[0].totalFootfall || 0} total reach`,
        metric: cityPerformance[0].totalFootfall
      });
    }

    // Recent high-performing events
    const recentEvents = await Collaboration.find({
      'recipient.user': userId,
      status: 'completed'
    })
      .populate('requestDetails.eventId', 'name date analytics category')
      .sort({ updatedAt: -1 })
      .limit(3);

    recentEvents.forEach(collab => {
      const event = collab.requestDetails?.eventId;
      if (event && event.analytics?.actualAttendance) {
        insights.recentPerformance.push({
          eventName: event.name,
          category: event.category,
          date: event.date,
          footfall: event.analytics.actualAttendance,
          collaborationType: collab.collaborationType
        });
      }
    });

    // Add general suggestions if needed
    if (totalCollaborations === 0) {
      insights.whatsWorking.push({
        title: 'Get Started',
        description: 'Browse upcoming events and submit collaboration proposals to grow your brand presence',
        metric: 0
      });
    } else if (totalCollaborations < 5) {
      insights.whatsWorking.push({
        title: 'Build Your Portfolio',
        description: 'Consider diversifying across different event categories to maximize your reach',
        metric: totalCollaborations
      });
    }

    // Return dashboard data
    res.json({
      actionsRequired,
      activeCollaborations: collaborationsData,
      performance: {
        totalCollaborations,
        citiesReached: citiesReached.length > 0 ? citiesReached[0].total : 0,
        totalFootfall,
        avgEngagement
      },
      insights
    });

  } catch (error) {
    console.error('Error fetching brand dashboard:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// @route   GET /api/brands/:id
// @desc    Get brand profile detail
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const brand = await User.findOne({
      _id: req.params.id,
      hostPartnerType: 'brand_sponsor'
    })
      .select('brandProfile email')
      .lean();

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    // Transform data
    const brandDetail = {
      _id: brand._id,
      email: brand.email,
      brandName: brand.brandProfile?.brandName,
      brandCategory: brand.brandProfile?.brandCategory,
      brandDescription: brand.brandProfile?.brandDescription,
      logo: brand.brandProfile?.logo,
      targetCity: brand.brandProfile?.targetCity || [],
      sponsorshipType: brand.brandProfile?.sponsorshipType || [],
      collaborationIntent: brand.brandProfile?.collaborationIntent || [],
      budget: brand.brandProfile?.budget || {},
      pastActivations: brand.brandProfile?.pastActivations || 0,
      partnershipCriteria: brand.brandProfile?.partnershipCriteria || {},
      audienceFit: brand.brandProfile?.audienceFit || {},
      pastCampaigns: brand.brandProfile?.pastCampaigns || [],
      collaborationModels: brand.brandProfile?.collaborationModels || []
    };

    res.json(brandDetail);
  } catch (error) {
    console.error('Error fetching brand detail:', error);
    res.status(500).json({ message: 'Server error while fetching brand detail' });
  }
});

// @route   POST /api/brands/:id/propose-collaboration
// @desc    Submit collaboration proposal to admin for review
// @access  Private
router.post('/:id/propose-collaboration', authMiddleware, async (req, res) => {
  try {
    const brandId = req.params.id;
    const {
      eventId,
      eventName,
      eventDate,
      message,
      sponsorshipType,
      collaborationFormat,
      expectedReach,
      targetAudience,
      budgetProposed,
      deliverables
    } = req.body;

    // Validate brand exists
    const brand = await User.findOne({
      _id: brandId,
      hostPartnerType: 'brand_sponsor'
    });

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    // Validate initiator (must be community organizer)
    const initiator = await User.findById(req.user.userId);
    if (!initiator) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create collaboration request (goes to admin first)
    const collaboration = new Collaboration({
      type: 'brand_sponsorship',
      initiator: {
        user: initiator._id,
        userType: initiator.hostPartnerType || 'community',
        name: initiator.communityProfile?.communityName || initiator.name,
        profileImage: initiator.communityProfile?.logo || initiator.profilePicture
      },
      recipient: {
        user: brand._id,
        userType: 'brand',
        name: brand.brandProfile?.brandName,
        profileImage: brand.brandProfile?.logo
      },
      requestDetails: {
        eventId,
        eventName,
        eventDate,
        message
      },
      brandSponsorship: {
        sponsorshipType: Array.isArray(sponsorshipType) ? sponsorshipType : [sponsorshipType],
        collaborationFormat: Array.isArray(collaborationFormat) ? collaborationFormat : [collaborationFormat],
        expectedReach,
        targetAudience,
        budgetProposed,
        deliverables
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

    // Send notification to admin instead of brand
    // TODO: Notify admin of new collaboration proposal

    res.status(201).json({
      message: 'Collaboration proposal submitted for admin review',
      collaboration
    });
  } catch (error) {
    console.error('Error creating brand collaboration proposal:', error);
    res.status(500).json({ message: 'Server error while creating collaboration proposal' });
  }
});

module.exports = router;
