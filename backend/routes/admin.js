const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Community = require('../models/Community');
const Collaboration = require('../models/Collaboration');
const { Payout } = require('../models/Payout');
const { adminAuthMiddleware, requirePermission } = require('../utils/adminAuthMiddleware');

// Helper function to find event by ID or slug
async function findEventByIdOrSlug(identifier) {
  const mongoose = require('mongoose');
  
  // Check if identifier is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(identifier) && identifier.match(/^[0-9a-fA-F]{24}$/)) {
    return await Event.findById(identifier);
  } else {
    // Search by slug
    return await Event.findOne({ slug: identifier });
  }
}

// All admin routes require admin authentication
router.use(adminAuthMiddleware);

// ==================== DASHBOARD STATS ====================

// @route   GET /api/admin/dashboard/stats
// @desc    Get comprehensive dashboard statistics
// @access  Admin only
router.get('/dashboard/stats', requirePermission('view_analytics'), async (req, res) => {
  try {
    // Get counts
    const [
      totalUsers,
      totalCommunities,
      totalVenues,
      totalBrands,
      totalEvents,
      activeEvents,
      pendingCollaborations,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'host_partner', hostPartnerType: 'community_organizer' }),
      User.countDocuments({ role: 'host_partner', hostPartnerType: 'venue' }),
      User.countDocuments({ role: 'host_partner', hostPartnerType: 'brand_sponsor' }),
      Event.countDocuments(),
      Event.countDocuments({ status: 'live', date: { $gte: new Date() } }),
      Collaboration.countDocuments({ status: 'submitted' }),
      Payout.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$breakdown.platformFee' } } }
      ])
    ]);

    console.log('[DASHBOARD] Pending collaborations count:', pendingCollaborations);

    // Get collaboration overview statistics
    const [totalProposals, confirmedCollabs, rejectedCollabs, completedCollabs] = await Promise.all([
      Collaboration.countDocuments(),
      Collaboration.countDocuments({ status: { $in: ['admin_approved', 'vendor_accepted', 'counter_delivered', 'completed'] } }),
      Collaboration.countDocuments({ status: { $in: ['admin_rejected', 'vendor_rejected'] } }),
      Collaboration.countDocuments({ status: 'completed' })
    ]);

    console.log('[DASHBOARD] Collaboration overview:', {
      total: totalProposals,
      pending: pendingCollaborations,
      confirmed: confirmedCollabs,
      rejected: rejectedCollabs,
      completed: completedCollabs
    });

    // Get growth metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [newUsersLast30Days, newEventsLast30Days, newCommunitiesLast30Days] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, role: 'user' }),
      Event.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, hostPartnerType: 'community_organizer' })
    ]);

    // Calculate growth percentages (comparing with previous 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [prevUsers, prevEvents, prevCommunities] = await Promise.all([
      User.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, 
        role: 'user' 
      }),
      Event.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      User.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, 
        hostPartnerType: 'community_organizer' 
      })
    ]);

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };

    res.json({
      overview: {
        totalUsers,
        totalCommunities,
        totalVenues,
        totalBrands,
        totalEvents,
        activeEvents,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      collaborations: {
        total: totalProposals,
        pending: pendingCollaborations,
        confirmed: confirmedCollabs,
        rejected: rejectedCollabs,
        completed: completedCollabs
      },
      growth: {
        users: {
          last30Days: newUsersLast30Days,
          growthPercentage: calculateGrowth(newUsersLast30Days, prevUsers)
        },
        events: {
          last30Days: newEventsLast30Days,
          growthPercentage: calculateGrowth(newEventsLast30Days, prevEvents)
        },
        communities: {
          last30Days: newCommunitiesLast30Days,
          growthPercentage: calculateGrowth(newCommunitiesLast30Days, prevCommunities)
        }
      },
      actionRequired: {
        pendingCollaborations,
        pendingPayouts: await Payout.countDocuments({ status: 'pending' }),
        reportedContent: 0 // Placeholder for future content moderation
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard stats' });
  }
});

// ==================== COLLABORATION MANAGEMENT ====================

// @route   GET /api/admin/collaborations/pending
// @desc    Get all pending collaboration requests (submitted, awaiting admin review)
// @access  Admin only
router.get('/collaborations/pending', requirePermission('manage_collaborations'), async (req, res) => {
  try {    const collaborations = await Collaboration.find({ 
      status: 'submitted'
    })
      .populate('initiator.user', 'name email communityProfile brandProfile venueProfile')
      .populate('recipient.user', 'name email communityProfile brandProfile venueProfile')
      .sort({ createdAt: -1 })
      .lean();

    console.log('[PENDING PROPOSALS] Found', collaborations.length, 'collaborations');

    // Add compatibility fields for frontend
    const transformedCollaborations = collaborations.map(collab => ({
      ...collab,
      proposerId: {
        _id: collab.initiator.user._id,
        name: collab.initiator.name || collab.initiator.user?.communityProfile?.communityName || collab.initiator.user?.brandProfile?.brandName || collab.initiator.user?.name || 'Unknown',
        email: collab.initiator.user?.email
      },
      recipientId: {
        _id: collab.recipient.user._id,
        name: collab.recipient.name || collab.recipient.user?.brandProfile?.brandName || collab.recipient.user?.venueProfile?.venueName || collab.recipient.user?.communityProfile?.communityName || collab.recipient.user?.name || 'Unknown',
        email: collab.recipient.user?.email
      }
    }));

    res.json({ data: transformedCollaborations });
  } catch (error) {
    console.error('Error fetching pending collaborations:', error);
    res.status(500).json({ message: 'Server error while fetching collaborations' });
  }
});

// @route   GET /api/admin/collaborations/all
// @desc    Get all collaborations with filters
// @access  Admin only
router.get('/collaborations/all', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    console.log('[ALL COLLABORATIONS] Query:', query, 'Page:', page, 'Limit:', limit);

    const skip = (page - 1) * limit;

    const [collaborations, total] = await Promise.all([
      Collaboration.find(query)
        .populate('initiator.user', 'name email communityProfile brandProfile venueProfile')
        .populate('recipient.user', 'name email communityProfile brandProfile venueProfile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Collaboration.countDocuments(query)
    ]);

    console.log('[ALL COLLABORATIONS] Found', collaborations.length, 'of', total, 'total');

    // Add compatibility fields for frontend
    const transformedCollaborations = collaborations.map(collab => ({
      ...collab,
      proposerId: {
        _id: collab.initiator.user._id,
        name: collab.initiator.name || collab.initiator.user?.communityProfile?.communityName || collab.initiator.user?.brandProfile?.brandName || collab.initiator.user?.name || 'Unknown',
        email: collab.initiator.user?.email
      },
      recipientId: {
        _id: collab.recipient.user._id,
        name: collab.recipient.name || collab.recipient.user?.brandProfile?.brandName || collab.recipient.user?.venueProfile?.venueName || collab.recipient.user?.communityProfile?.communityName || collab.recipient.user?.name || 'Unknown',
        email: collab.recipient.user?.email
      }
    }));

    res.json({
      data: transformedCollaborations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all collaborations:', error);
    res.status(500).json({ message: 'Server error while fetching collaborations' });
  }
});

// @route   PUT /api/admin/collaborations/:id/approve
// @desc    Approve a collaboration request and forward to vendor
// @access  Admin only
router.put('/collaborations/:id/approve', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.userId;

    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration not found' });
    }

    if (collaboration.status !== 'submitted') {
      return res.status(400).json({ 
        message: 'Only submitted collaborations can be approved',
        currentStatus: collaboration.status
      });
    }

    // Update collaboration with admin approval
    collaboration.status = 'admin_approved';
    collaboration.adminReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      decision: 'approved',
      notes: adminNotes || ''
    };

    await collaboration.save();

    // Send notification to recipient - hide admin review, make it look like direct proposal
    const notificationService = require('../services/notificationService');
    const initiatorName = collaboration.initiator?.name || 'A community';
    const recipientType = collaboration.recipient?.userType || collaboration.recipientType;
    
    let notificationType = 'hosting_request_received';
    let notificationTitle = '🎪 Hosting Request Received';
    let notificationMessage = `${initiatorName} wants to host an event at your venue. Review the request!`;
    let actionUrl = `/dashboard/collaborations/${collaboration._id}`;
    
    if (recipientType === 'brand' || recipientType === 'brand_sponsor') {
      notificationType = 'community_proposal_received';
      notificationTitle = '🎁 Partnership Proposal Received';
      notificationMessage = `${initiatorName} sent you a collaboration proposal. Review and respond!`;
      actionUrl = `/brand/collaborations/${collaboration._id}`;
    } else if (recipientType === 'venue') {
      actionUrl = `/venue/collaborations/${collaboration._id}`;
    }
    
    await notificationService.createNotification({
      recipient: collaboration.recipient.user,
      type: notificationType,
      category: 'action_required',
      priority: 'high',
      title: notificationTitle,
      message: notificationMessage,
      actionUrl: actionUrl,
      metadata: {
        collaborationId: collaboration._id,
        initiatorId: collaboration.initiator.user,
        initiatorName
      }
    });

    res.json({
      message: 'Collaboration approved and forwarded to vendor',
      collaboration
    });
  } catch (error) {
    console.error('Error approving collaboration:', error);
    res.status(500).json({ message: 'Server error while approving collaboration' });
  }
});

// @route   PUT /api/admin/collaborations/:id/reject
// @desc    Reject a collaboration request
// @access  Admin only
router.put('/collaborations/:id/reject', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Rejection reason is required (minimum 10 characters)' 
      });
    }

    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration not found' });
    }

    if (collaboration.status !== 'submitted') {
      return res.status(400).json({ 
        message: 'Only submitted collaborations can be rejected',
        currentStatus: collaboration.status
      });
    }

    // Update collaboration with admin rejection
    collaboration.status = 'admin_rejected';
    collaboration.adminReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      decision: 'rejected',
      notes: reason
    };

    await collaboration.save();

    // Send notification to community (initiator)
    const notificationService = require('../services/notificationService');
    await notificationService.createNotification({
      recipient: collaboration.initiator.user,
      type: 'collaboration_rejected',
      category: 'status_update',
      title: 'Collaboration Request Rejected',
      message: `Your collaboration request has been rejected by admin. Reason: ${reason.substring(0, 100)}`,
      actionUrl: `/community/collaborations/${collaboration._id}`,
      metadata: {
        collaborationId: collaboration._id,
        reason: reason
      }
    });

    res.json({
      message: 'Collaboration rejected',
      collaboration
    });
  } catch (error) {
    console.error('Error rejecting collaboration:', error);
    res.status(500).json({ message: 'Server error while rejecting collaboration' });
  }
});

// @route   PUT /api/admin/collaborations/counters/:id/approve
// @desc    Approve a counter-proposal and forward to initiator
// @access  Admin only
router.put('/collaborations/counters/:id/approve', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.userId;

    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration not found' });
    }

    if (collaboration.status !== 'vendor_accepted' || !collaboration.response?.counterOffer) {
      return res.status(400).json({ 
        message: 'No counter-proposal to approve',
        currentStatus: collaboration.status
      });
    }

    // Update collaboration - counter is approved by admin
    collaboration.status = 'counter_delivered'; // New status for counter delivered to initiator
    if (!collaboration.adminReview) {
      collaboration.adminReview = {};
    }
    collaboration.adminReview.counterReviewedBy = adminId;
    collaboration.adminReview.counterReviewedAt = new Date();
    collaboration.adminReview.counterDecision = 'approved';
    collaboration.adminReview.counterNotes = adminNotes || '';

    await collaboration.save();
    
    console.log('✅ Counter approval saved:', {
      collaborationId: collaboration._id,
      counterReviewedBy: collaboration.adminReview.counterReviewedBy,
      counterReviewedAt: collaboration.adminReview.counterReviewedAt,
      counterDecision: collaboration.adminReview.counterDecision
    });

    // Send notification to initiator - hide admin review, make it look like direct counter
    const notificationService = require('../services/notificationService');
    const recipientName = collaboration.recipient.name || 'Vendor';
    const recipientType = collaboration.recipient.userType;
    
    let notificationType = 'venue_counter_received';
    let notificationTitle = '🏪 Venue Counter Received';
    let notificationMessage = `${recipientName} sent you a counter-proposal. Review and accept/reject.`;
    
    if (recipientType === 'brand' || recipientType === 'brand_sponsor') {
      notificationType = 'brand_counter_received';
      notificationTitle = '🎯 Brand Counter Received';
      notificationMessage = `${recipientName} responded with a counter-proposal. Review their terms!`;
    }
    
    await notificationService.createNotification({
      recipient: collaboration.initiator.user,
      type: notificationType,
      category: 'action_required',
      priority: 'high',
      title: notificationTitle,
      message: notificationMessage,
      actionUrl: `/community/collaborations/${collaboration._id}/counter`,
      metadata: {
        collaborationId: collaboration._id,
        recipientId: collaboration.recipient.user,
        recipientName
      }
    });

    res.json({
      message: 'Counter-proposal approved and forwarded to initiator',
      collaboration
    });
  } catch (error) {
    console.error('Error approving counter:', error);
    res.status(500).json({ message: 'Server error while approving counter' });
  }
});

// @route   PUT /api/admin/collaborations/counters/:id/reject
// @desc    Reject a counter-proposal
// @access  Admin only
router.put('/collaborations/counters/:id/reject', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Rejection reason is required (minimum 10 characters)' 
      });
    }

    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration not found' });
    }

    if (collaboration.status !== 'vendor_accepted' || !collaboration.response?.counterOffer) {
      return res.status(400).json({ 
        message: 'No counter-proposal to reject',
        currentStatus: collaboration.status
      });
    }

    // Update collaboration - counter is rejected by admin, back to admin_approved
    collaboration.status = 'admin_approved'; // Back to vendor to resubmit
    if (!collaboration.adminReview) {
      collaboration.adminReview = {};
    }
    collaboration.adminReview.counterReviewedBy = adminId;
    collaboration.adminReview.counterReviewedAt = new Date();
    collaboration.adminReview.counterDecision = 'rejected';
    collaboration.adminReview.counterNotes = reason;
    
    // Clear the rejected counter
    collaboration.response.counterOffer = null;
    collaboration.acceptedAt = null;

    await collaboration.save();

    // Send notification to vendor about rejected counter
    const notificationService = require('../services/notificationService');
    await notificationService.createNotification({
      recipient: collaboration.recipient.user,
      type: 'counter_rejected',
      category: 'status_update',
      title: 'Counter Proposal Rejected',
      message: `Your counter proposal has been rejected by admin. Reason: ${reason.substring(0, 100)}`,
      actionUrl: `/venue/collaborations/${collaboration._id}`,
      metadata: {
        collaborationId: collaboration._id,
        reason: reason
      }
    });

    res.json({
      message: 'Counter-proposal rejected',
      collaboration
    });
  } catch (error) {
    console.error('Error rejecting counter:', error);
    res.status(500).json({ message: 'Server error while rejecting counter' });
  }
});

// @route   PUT /api/admin/collaborations/:id/flag
// @desc    Flag a collaboration for compliance review
// @access  Admin only
router.put('/collaborations/:id/flag', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Flag reason is required (minimum 10 characters)' 
      });
    }

    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration not found' });
    }

    // Add or update compliance flag
    const flagEntry = {
      flaggedBy: adminId,
      flaggedAt: new Date(),
      reason: reason,
      resolved: false
    };

    if (!collaboration.complianceFlags) {
      collaboration.complianceFlags = [];
    }
    
    collaboration.complianceFlags.push(flagEntry);
    collaboration.status = 'flagged';

    await collaboration.save();

    // Don't notify initiator about rejection (admin review is hidden)
    // They simply won't see the collaboration appear

    res.json({
      message: 'Collaboration flagged for compliance review',
      collaboration
    });
  } catch (error) {
    console.error('Error flagging collaboration:', error);
    res.status(500).json({ message: 'Server error while flagging collaboration' });
  }
});

// @route   GET /api/admin/collaborations/counters/pending
// @desc    Get all pending counter proposals (responses with counter offers awaiting admin review)
// @access  Admin only
router.get('/collaborations/counters/pending', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    // Support both old ('accepted', 'counter_pending_review') and new ('vendor_accepted') status
    const counters = await Collaboration.find({ 
      status: 'vendor_accepted',
      $or: [
        { 'response.counterOffer': { $exists: true, $ne: null } },
        { 'hasCounter': true }  // Old structure flag
      ]
    })
      .populate('initiator.user', 'name email communityProfile venueProfile brandProfile')
      .populate('recipient.user', 'name email communityProfile venueProfile brandProfile')
      .sort({ 'response.respondedAt': -1 })
      .lean();

    // Add responderId for each counter (recipient is the one who submitted counter)
    const enhancedCounters = counters.map(counter => ({
      ...counter,
      responderId: {
        _id: counter.recipient.user._id,
        name: counter.recipient.name || counter.recipient.user?.brandProfile?.brandName || counter.recipient.user?.venueProfile?.venueName || counter.recipient.user?.communityProfile?.communityName || counter.recipient.user?.name || 'Unknown',
        email: counter.recipient.user?.email
      },
      responderType: counter.recipient.userType,
      proposerId: {
        _id: counter.initiator.user._id,
        name: counter.initiator.name || counter.initiator.user?.communityProfile?.communityName || counter.initiator.user?.brandProfile?.brandName || counter.initiator.user?.name || 'Unknown',
        email: counter.initiator.user?.email
      },
      collaborationId: {
        _id: counter._id,
        proposerId: {
          _id: counter.initiator.user._id,
          name: counter.initiator.name || counter.initiator.user?.communityProfile?.communityName || counter.initiator.user?.brandProfile?.brandName || counter.initiator.user?.name || 'Unknown'
        }
      }
    }));

    res.json({ data: enhancedCounters });
  } catch (error) {
    console.error('Error fetching pending counters:', error);
    res.status(500).json({ message: 'Server error while fetching pending counters' });
  }
});

// @route   GET /api/admin/collaborations/counters/:id
// @desc    Get counter details for review
// @access  Admin only
router.get('/collaborations/counters/:id', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id)
      .populate('initiator.user', 'name email communityProfile venueProfile brandProfile')
      .populate('recipient.user', 'name email communityProfile venueProfile brandProfile')
      .populate('adminReview.reviewedBy', 'name email')
      .populate('adminReview.counterReviewedBy', 'name email')
      .lean();

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration not found' });
    }

    // Check if there's a counter proposal (stored in response.counterOffer)
    if (!collaboration.response?.counterOffer) {
      return res.status(404).json({ message: 'No counter proposal found' });
    }

    // Parse counter data from JSON string
    let counterData = collaboration.response.counterOffer;
    if (counterData.terms && typeof counterData.terms === 'string') {
      try {
        const parsed = JSON.parse(counterData.terms);
        counterData = { ...counterData, ...parsed };
      } catch (e) {
        console.error('Error parsing counter terms:', e);
      }
    }

    // Add parsed counter data to response
    collaboration.counterData = counterData;
    collaboration.hasCounter = true;

    // Add responderId as the recipient (who submitted the counter)
    collaboration.responderId = {
      _id: collaboration.recipient.user._id,
      name: collaboration.recipient.name || collaboration.recipient.user?.brandProfile?.brandName || collaboration.recipient.user?.venueProfile?.venueName || collaboration.recipient.user?.communityProfile?.communityName || collaboration.recipient.user?.name || 'Unknown',
      email: collaboration.recipient.user?.email
    };
    collaboration.responderType = collaboration.recipient.userType;
    
    // Add proposerId for display
    collaboration.proposerId = {
      _id: collaboration.initiator.user._id,
      name: collaboration.initiator.name || collaboration.initiator.user?.communityProfile?.communityName || collaboration.initiator.user?.brandProfile?.brandName || collaboration.initiator.user?.name || 'Unknown',
      email: collaboration.initiator.user?.email
    };
    collaboration.recipientId = collaboration.responderId;

    res.json({ data: collaboration });
  } catch (error) {
    console.error('Error fetching counter details:', error);
    res.status(500).json({ message: 'Server error while fetching counter details' });
  }
});

// @route   GET /api/admin/collaborations/flagged
// @desc    Get all flagged collaboration requests
// @access  Admin only
router.get('/collaborations/flagged', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const collaborations = await Collaboration.find({ 
      $or: [
        { 'adminReview.decision': 'pending_info' },
        { tags: 'flagged' }
      ]
    })
      .populate('initiator.user', 'name email communityProfile brandProfile venueProfile')
      .populate('recipient.user', 'name email communityProfile brandProfile venueProfile')
      .sort({ createdAt: -1 })
      .lean();

    // Add compatibility fields for frontend
    const transformedCollaborations = collaborations.map(collab => ({
      ...collab,
      proposerId: {
        _id: collab.initiator.user._id,
        name: collab.initiator.name || collab.initiator.user?.communityProfile?.communityName || collab.initiator.user?.brandProfile?.brandName || collab.initiator.user?.name || 'Unknown',
        email: collab.initiator.user?.email
      },
      recipientId: {
        _id: collab.recipient.user._id,
        name: collab.recipient.name || collab.recipient.user?.brandProfile?.brandName || collab.recipient.user?.venueProfile?.venueName || collab.recipient.user?.communityProfile?.communityName || collab.recipient.user?.name || 'Unknown',
        email: collab.recipient.user?.email
      }
    }));

    res.json({ data: transformedCollaborations });
  } catch (error) {
    console.error('Error fetching flagged collaborations:', error);
    res.status(500).json({ message: 'Server error while fetching flagged collaborations' });
  }
});

// @route   GET /api/admin/collaborations/analytics
// @desc    Get collaboration analytics for admin dashboard
// @access  Admin only
router.get('/collaborations/analytics', requirePermission('view_analytics'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get collaboration statistics
    const [
      totalCollaborations,
      pendingReview,
      approved,
      rejected,
      completed,
      byType,
      recent30Days
    ] = await Promise.all([
      Collaboration.countDocuments(),
      Collaboration.countDocuments({ status: 'submitted' }),
      Collaboration.countDocuments({ status: { $in: ['admin_approved', 'vendor_accepted', 'counter_delivered', 'completed'] } }),
      Collaboration.countDocuments({ status: { $in: ['admin_rejected', 'vendor_rejected'] } }),
      Collaboration.countDocuments({ status: 'completed' }),
      Collaboration.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),
      Collaboration.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    console.log('[ANALYTICS] Collaboration counts:', {
      total: totalCollaborations,
      pending: pendingReview,
      approved,
      rejected,
      completed,
      byType
    });

    // Calculate approval rate
    const totalReviewed = approved + rejected;
    const approvalRate = totalReviewed > 0 ? ((approved / totalReviewed) * 100).toFixed(1) : 0;
//, 'accepted', 'rejected'
    // Average response time (for approved/rejected)
    const reviewedCollabs = await Collaboration.find({
      status: { $in: ['admin_approved', 'vendor_accepted', 'counter_delivered', 'completed'] },
      $or: [
        { 'adminReview.reviewedAt': { $exists: true } },
        { 'updatedAt': { $exists: true } }  // For old data without adminReview
      ]
    })
      .select('createdAt adminReview.reviewedAt updatedAt')
      .lean();

    let avgResponseTime = 0;
    if (reviewedCollabs.length > 0) {
      const totalTime = reviewedCollabs.reduce((sum, collab) => {
        const reviewDate = collab.adminReview?.reviewedAt || collab.updatedAt;
        const createdDate = collab.createdAt;
        if (reviewDate && createdDate) {
          const timeDiff = (new Date(reviewDate) - new Date(createdDate)) / (1000 * 60 * 60); // hours
          return sum + timeDiff;
        }
        return sum;
      }, 0);
      avgResponseTime = (totalTime / reviewedCollabs.length).toFixed(1);
    }

    res.json({
      data: {
        // Flat structure for easy frontend access
        totalProposals: totalCollaborations,
        pendingReview: pendingReview,  // Match frontend expectation
        pending: pendingReview,
        approved: approved,
        rejected: rejected,
        completed: completed,
        confirmed: approved,  // Alias for "confirmed" used in frontend
        approvalRate: parseFloat(approvalRate),
        avgReviewTime: parseFloat(avgResponseTime),  // In hours
        
        // Detailed breakdown
        overview: {
          total: totalCollaborations,
          pending: pendingReview,
          approved,
          rejected,
          completed,
          approvalRate: parseFloat(approvalRate),
          avgResponseTimeHours: parseFloat(avgResponseTime)
        },
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        growth: {
          last30Days: recent30Days
        }
      }
    });
  } catch (error) {
    console.error('Error fetching collaboration analytics:', error);
    res.status(500).json({ message: 'Server error while fetching analytics' });
  }
});

// @route   GET /api/admin/collaborations/:id
// @desc    Get single collaboration details
// @access  Admin only (MUST be after all specific /collaborations/* routes)
router.get('/collaborations/:id', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id)
      .populate('initiator.user', 'name email phoneNumber profilePicture hostPartnerType communityProfile venueProfile brandProfile')
      .populate('recipient.user', 'name email phoneNumber profilePicture hostPartnerType communityProfile venueProfile brandProfile')
      .populate('adminReview.reviewedBy', 'name email')
      .populate('adminReview.counterReviewedBy', 'name email')
      .lean();

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration not found' });
    }

    // Add compatibility fields for frontend
    collaboration.proposerId = {
      _id: collaboration.initiator.user._id,
      name: collaboration.initiator.name || collaboration.initiator.user?.communityProfile?.communityName || collaboration.initiator.user?.brandProfile?.brandName || collaboration.initiator.user?.name || 'Unknown',
      email: collaboration.initiator.user?.email
    };
    collaboration.recipientId = {
      _id: collaboration.recipient.user._id,
      name: collaboration.recipient.name || collaboration.recipient.user?.brandProfile?.brandName || collaboration.recipient.user?.venueProfile?.venueName || collaboration.recipient.user?.communityProfile?.communityName || collaboration.recipient.user?.name || 'Unknown',
      email: collaboration.recipient.user?.email
    };

    // Helper function to format sub-options
    const formatSubOptions = (subOptions) => {
      if (!subOptions || typeof subOptions !== 'object') return 'None';
      const selected = [];
      Object.entries(subOptions).forEach(([key, value]) => {
        if (value && value.selected) {
          selected.push(key);
        }
      });
      return selected.length > 0 ? selected.join(', ') : 'None';
    };

    // Transform structured schema data for better display
    if (collaboration.communityToBrand) {
      const ctb = collaboration.communityToBrand;
      
      // Transform brand deliverables
      if (ctb.brandDeliverables) {
        const transformed = {};
        Object.entries(ctb.brandDeliverables).forEach(([key, value]) => {
          if (value && value.selected) {
            transformed[`Brand ${key}`] = {
              selected: value.selected,
              subOptions: formatSubOptions(value.subOptions),
              comment: value.comment || 'None'
            };
          }
        });
        collaboration.transformedDeliverables = transformed;
      }
      
      // Transform pricing
      if (ctb.pricing) {
        const transformed = {};
        Object.entries(ctb.pricing).forEach(([key, value]) => {
          if (value && value.selected) {
            transformed[`Pricing.${key}`] = {
              selected: value.selected,
              value: value.value || 'Not specified',
              comment: value.comment || 'None'
            };
          }
        });
        collaboration.transformedPricing = transformed;
      }
      
      // Transform audience proof
      if (ctb.audienceProof) {
        const transformed = {};
        Object.entries(ctb.audienceProof).forEach(([key, value]) => {
          if (value && value.selected) {
            transformed[`AudienceProof.${key}`] = value.value || 'Provided';
          }
        });
        collaboration.transformedAudienceProof = transformed;
      }
    }

    // Transform brandToCommunity data
    if (collaboration.brandToCommunity) {
      const btc = collaboration.brandToCommunity;
      
      // Transform brand offers
      if (btc.brandOffers) {
        const transformed = {};
        Object.entries(btc.brandOffers).forEach(([key, value]) => {
          if (value && value.selected) {
            transformed[`BrandOffers.${key}`] = {
              selected: value.selected,
              subOptions: formatSubOptions(value.subOptions),
              comment: value.comment || 'None'
            };
          }
        });
        collaboration.transformedBrandOffers = transformed;
      }
      
      // Transform brand expectations
      if (btc.brandExpectations) {
        const transformed = {};
        Object.entries(btc.brandExpectations).forEach(([key, value]) => {
          if (value && value.selected) {
            transformed[`BrandExpectations.${key}`] = {
              selected: value.selected,
              subOptions: formatSubOptions(value.subOptions),
              comment: value.comment || 'None'
            };
          }
        });
        collaboration.transformedBrandExpectations = transformed;
      }
    }

    // Transform formData to handle nested objects better
    if (collaboration.formData) {
      const flattenedData = {};
      
      Object.entries(collaboration.formData).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // For nested objects, flatten them with descriptive keys
          if (key === 'eventDate' && value.date) {
            flattenedData['Event Date'] = value.date;
            if (value.startTime) flattenedData['Start Time'] = value.startTime;
            if (value.endTime) flattenedData['End Time'] = value.endTime;
          } else if (key === 'backupDate' && value.date) {
            flattenedData['Backup Date'] = value.date;
            if (value.startTime) flattenedData['Backup Start Time'] = value.startTime;
            if (value.endTime) flattenedData['Backup End Time'] = value.endTime;
          } else if (key === 'pricing' || key === 'revenueShare') {
            Object.entries(value).forEach(([subKey, subValue]) => {
              flattenedData[`${key}.${subKey}`] = subValue;
            });
          } else if (key === 'brandDeliverables' || key === 'brandOffers' || key === 'brandExpectations' || key === 'venueOfferings' || key === 'requirements') {
            // Handle structured deliverables/offers with sub-options
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subKey !== '__typename' && subValue && typeof subValue === 'object') {
                // If it's a structured object with selected, subOptions, comment
                if (subValue.selected) {
                  const displayKey = `${key.replace(/([A-Z])/g, ' $1')}.${subKey}`;
                  flattenedData[displayKey] = 'Selected ✓';
                  
                  // Format sub-options if they exist
                  if (subValue.subOptions && typeof subValue.subOptions === 'object') {
                    const selectedSubOptions = [];
                    Object.entries(subValue.subOptions).forEach(([optKey, optValue]) => {
                      if (optValue && (optValue.selected || optValue === true)) {
                        selectedSubOptions.push(optKey);
                      }
                    });
                    if (selectedSubOptions.length > 0) {
                      flattenedData[`${displayKey} - Options`] = selectedSubOptions.join(', ');
                    }
                  }
                  
                  // Add comment if exists
                  if (subValue.comment) {
                    flattenedData[`${displayKey} - Comment`] = subValue.comment;
                  }
                  
                  // Add value if exists (for pricing)
                  if (subValue.value) {
                    flattenedData[`${displayKey} - Value`] = String(subValue.value);
                  }
                }
              } else if (subKey !== '__typename') {
                flattenedData[`${key} - ${subKey}`] = Array.isArray(subValue) ? subValue.join(', ') : String(subValue);
              }
            });
          } else if (key === 'pricing') {
            // Handle pricing object
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subValue && typeof subValue === 'object' && subValue.selected) {
                const displayKey = `Pricing.${subKey}`;
                flattenedData[displayKey] = 'Selected ✓';
                if (subValue.value) {
                  flattenedData[`${displayKey} - Value`] = String(subValue.value);
                }
                if (subValue.comment) {
                  flattenedData[`${displayKey} - Comment`] = subValue.comment;
                }
              } else if (subKey !== 'additionalNotes') {
                flattenedData[`pricing.${subKey}`] = String(subValue);
              }
            });
            if (value.additionalNotes) {
              flattenedData['Pricing Notes'] = value.additionalNotes;
            }
          } else if (key === 'audienceProof') {
            // Handle audience proof
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subValue && typeof subValue === 'object' && subValue.selected) {
                flattenedData[`Audience Proof.${subKey}`] = subValue.value || 'Provided';
              }
            });
          } else if (key === 'commercialModels') {
            // Handle commercial models
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subValue && typeof subValue === 'object' && subValue.selected) {
                const displayKey = `Commercial.${subKey}`;
                flattenedData[displayKey] = 'Selected ✓';
                if (subValue.value) {
                  flattenedData[`${displayKey} - Value`] = String(subValue.value);
                }
                if (subValue.comment) {
                  flattenedData[`${displayKey} - Comment`] = subValue.comment;
                }
              }
            });
          } else {
            // For other nested objects, check if they have a similar structure
            const hasStructuredFields = Object.values(value).some(v => 
              v && typeof v === 'object' && ('selected' in v || 'value' in v)
            );
            
            if (hasStructuredFields) {
              // Handle other structured objects similarly
              Object.entries(value).forEach(([subKey, subValue]) => {
                if (subValue && typeof subValue === 'object' && subValue.selected) {
                  const displayKey = `${key}.${subKey}`;
                  flattenedData[displayKey] = 'Selected ✓';
                  if (subValue.value) flattenedData[`${displayKey} - Value`] = String(subValue.value);
                  if (subValue.comment) flattenedData[`${displayKey} - Comment`] = subValue.comment;
                }
              });
            } else {
              // For simple nested objects, flatten them
              Object.entries(value).forEach(([subKey, subValue]) => {
                if (subValue !== null && subValue !== undefined && subKey !== '__typename') {
                  flattenedData[`${key} - ${subKey}`] = subValue;
                }
              });
            }
          }
        } else if (Array.isArray(value)) {
          flattenedData[key] = value.join(', ');
        } else if (value !== null && value !== undefined) {
          flattenedData[key] = value;
        }
      });
      
      collaboration.formData = flattenedData;
    }

    // Check if collaboration has a counter proposal
    let hasCounter = false;
    let counterData = null;
    
    if (collaboration.response && collaboration.response.counterOffer) {
      hasCounter = true;
      counterData = collaboration.response.counterOffer;
      
      // Parse counter data if it's stored as JSON string
      if (counterData.terms && typeof counterData.terms === 'string') {
        try {
          const parsed = JSON.parse(counterData.terms);
          counterData = { ...counterData, ...parsed };
        } catch (e) {
          console.error('Error parsing counter terms:', e);
        }
      }
    }

    // Add counter info to response
    collaboration.hasCounter = hasCounter;
    if (hasCounter) {
      collaboration.counterData = counterData;
      // Add responderId for display
      collaboration.counterData.responderId = collaboration.recipient.user;
      collaboration.counterData.responderType = collaboration.recipient?.userType || collaboration.recipientType;
    }
    
    // Debug: Log adminReview data
    console.log('📋 GET /collaborations/:id - adminReview data:', {
      collaborationId: collaboration._id,
      hasAdminReview: !!collaboration.adminReview,
      reviewedAt: collaboration.adminReview?.reviewedAt,
      counterReviewedAt: collaboration.adminReview?.counterReviewedAt,
      counterReviewedBy: collaboration.adminReview?.counterReviewedBy,
      counterDecision: collaboration.adminReview?.counterDecision
    });

    // Build timeline
    const timeline = [
      {
        event: 'Proposal Submitted',
        actor: collaboration.initiator.user?.name || 'Unknown',
        actorType: collaboration.initiator.userType,
        timestamp: collaboration.createdAt,
        status: 'submitted',
        description: 'Initial proposal submitted for review'
      }
    ];

    if (collaboration.adminReview && collaboration.adminReview.decision) {
      timeline.push({
        event: collaboration.adminReview.decision === 'approved' ? 'Admin Approved Proposal' : 'Admin Rejected Proposal',
        actor: collaboration.adminReview.reviewedBy?.name || 'Admin',
        actorType: 'admin',
        timestamp: collaboration.adminReview.reviewedAt,
        status: collaboration.adminReview.decision === 'approved' ? 'admin_approved' : 'admin_rejected',
        description: collaboration.adminReview.notes || (collaboration.adminReview.decision === 'approved' ? 'Proposal approved and forwarded to vendor' : 'Proposal rejected'),
        notes: collaboration.adminReview.notes
      });
    }

    if (hasCounter && collaboration.acceptedAt) {
      timeline.push({
        event: 'Counter Proposal Submitted',
        actor: collaboration.recipient.user?.name || 'Vendor',
        actorType: collaboration.recipient.userType,
        timestamp: collaboration.acceptedAt,
        status: 'vendor_accepted',
        description: 'Vendor responded with counter-proposal'
      });
    }

    // Add counter admin review step if it exists
    if (collaboration.adminReview && collaboration.adminReview.counterReviewedAt) {
      timeline.push({
        event: collaboration.adminReview.counterDecision === 'approved' ? 'Counter Admin Approved' : 'Counter Admin Rejected',
        actor: collaboration.adminReview.counterReviewedBy?.name || 'Admin',
        actorType: 'admin',
        timestamp: collaboration.adminReview.counterReviewedAt,
        status: collaboration.adminReview.counterDecision === 'approved' ? 'counter_admin_approved' : 'counter_admin_rejected',
        description: collaboration.adminReview.counterDecision === 'approved' ? 'Counter-proposal approved and delivered to initiator' : 'Counter-proposal rejected',
        notes: collaboration.adminReview.counterNotes
      });
    }

    if (collaboration.status === 'counter_delivered') {
      timeline.push({
        event: 'Counter Approved & Delivered',
        actor: 'Admin',
        actorType: 'admin',
        timestamp: collaboration.updatedAt,
        status: 'counter_delivered',
        description: 'Counter-proposal approved and delivered to initiator'
      });
    }

    if (collaboration.status === 'completed') {
      timeline.push({
        event: 'Collaboration Completed',
        actor: 'System',
        actorType: 'system',
        timestamp: collaboration.updatedAt,
        status: 'completed',
        description: 'Collaboration successfully completed'
      });
    }

    if (collaboration.status === 'cancelled') {
      timeline.push({
        event: 'Collaboration Cancelled',
        actor: collaboration.initiator?.user?.name || 'User',
        actorType: collaboration.initiator?.userType,
        timestamp: collaboration.cancelledAt || collaboration.updatedAt,
        status: 'cancelled',
        description: 'Collaboration cancelled by initiator'
      });
    }

    if (collaboration.status === 'vendor_rejected') {
      timeline.push({
        event: 'Vendor Rejected',
        actor: collaboration.recipient?.user?.name || 'Vendor',
        actorType: collaboration.recipient?.userType,
        timestamp: collaboration.rejectedAt || collaboration.updatedAt,
        status: 'vendor_rejected',
        description: 'Vendor declined the collaboration'
      });
    }

    // Add timeline to collaboration object
    collaboration.timeline = timeline;

    res.json({ data: collaboration });
  } catch (error) {
    console.error('Error fetching collaboration details:', error);
    res.status(500).json({ message: 'Server error while fetching collaboration details' });
  }
});

// ==================== USER MANAGEMENT ====================

// @route   GET /api/admin/users
// @desc    Get all users with filters and pagination
// @access  Admin only
router.get('/users', requirePermission('manage_users'), async (req, res) => {
  try {
    const { role, hostPartnerType, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (hostPartnerType) query.hostPartnerType = hostPartnerType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get detailed user information
// @access  Admin only
router.get('/users/:id', requirePermission('manage_users'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's events if community organizer
    let events = [];
    if (user.hostPartnerType === 'community_organizer') {
      events = await Event.find({ host: user._id })
        .select('title date status participants')
        .sort({ date: -1 })
        .limit(10)
        .lean();
    }

    res.json({
      user,
      stats: {
        eventsHosted: events.length,
        totalParticipants: events.reduce((sum, e) => sum + (e.participants?.length || 0), 0)
      },
      recentEvents: events
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error while fetching user details' });
  }
});

// @route   PATCH /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Admin only (super_admin only)
router.patch('/users/:id/status', requirePermission('manage_users'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Only super admins can deactivate users
    if (req.user.adminProfile.accessLevel !== 'super_admin' && isActive === false) {
      return res.status(403).json({ 
        message: 'Only super admins can deactivate users' 
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

// ==================== EVENT MANAGEMENT ====================

// @route   GET /api/admin/events
// @desc    Get all events with filters
// @access  Admin only
router.get('/events', requirePermission('manage_events'), async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.categories = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('host', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Event.countDocuments(query)
    ]);

    res.json({
      events,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
});

// ==================== REVENUE & PAYOUTS ====================

// @route   GET /api/admin/revenue
// @desc    Get revenue analytics
// @access  Admin only
router.get('/revenue', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { timeRange = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    const revenueData = await Payout.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$breakdown.platformFee' },
          totalPaidOut: { $sum: '$breakdown.netAmount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const pendingPayouts = await Payout.aggregate([
      {
        $match: { status: 'pending' }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      revenue: revenueData[0] || { totalRevenue: 0, totalPaidOut: 0, transactionCount: 0 },
      pending: pendingPayouts[0] || { totalPending: 0, count: 0 }
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Server error while fetching revenue data' });
  }
});

// ==================== EVENT AUDIT & REPORTS ====================

/**
 * GET /api/admin/events/all-with-revenue
 * Get all events with revenue metrics for admin dashboard
 */
router.get('/events/all-with-revenue', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, organizerId } = req.query;
    
    console.log('📊 [Admin Events] Fetching all events with revenue...');
    
    const Ticket = require('../models/Ticket');
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (organizerId) query.host = organizerId;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get events with organizer info
    const events = await Event.find(query)
      .populate('host', 'name email communityProfile')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Event.countDocuments(query);
    
    console.log(`📊 [Admin Events] Found ${events.length} events`);
    
    // Enrich with revenue and ticket data
    const enrichedEvents = await Promise.all(events.map(async (event) => {
      // Get tickets for this event
      const tickets = await Ticket.find({
        event: event._id,
        status: { $ne: 'cancelled' }
      }).lean();
      
      // Calculate revenue metrics
      const totalRevenueBeforeDiscount = tickets.reduce((sum, t) => sum + (t.metadata?.basePrice || 0), 0);
      
      // Calculate total coupon discount from event participants
      const totalCouponDiscount = (event.participants || []).reduce((sum, participant) => {
        return sum + (participant.couponUsed?.discountApplied || 0);
      }, 0);
      
      // Final revenue after coupon discounts
      const totalRevenue = totalRevenueBeforeDiscount - totalCouponDiscount;
      
      const totalPaid = tickets.reduce((sum, t) => sum + (t.metadata?.totalPaid || 0), 0);
      
      // Settlement status
      const settledCount = tickets.filter(t => t.settlementStatus === 'settled').length;
      const pendingCount = tickets.filter(t => t.settlementStatus === 'pending' || t.settlementStatus === 'captured').length;
      
      // Reconciliation status
      const verifiedCount = tickets.filter(t => t.reconciliationStatus === 'verified').length;
      const mismatchCount = tickets.filter(t => t.reconciliationStatus === 'mismatch').length;
      const needsReviewCount = tickets.filter(t => t.reconciliationStatus === 'manual_review').length;
      
      return {
        _id: event._id,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        status: event.status,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
        organizer: {
          id: event.host._id,
          name: event.host.name,
          email: event.host.email,
          communityName: event.host.communityProfile?.communityName
        },
        revenue: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalPaid: parseFloat(totalPaid.toFixed(2)),
          ticketCount: tickets.length,
          avgTicketPrice: tickets.length > 0 ? parseFloat((totalRevenue / tickets.length).toFixed(2)) : 0
        },
        settlement: {
          settled: settledCount,
          pending: pendingCount,
          settledPercentage: tickets.length > 0 ? parseFloat(((settledCount / tickets.length) * 100).toFixed(1)) : 0
        },
        reconciliation: {
          verified: verifiedCount,
          mismatches: mismatchCount,
          needsReview: needsReviewCount,
          total: tickets.length,
          verifiedPercentage: tickets.length > 0 ? parseFloat(((verifiedCount / tickets.length) * 100).toFixed(1)) : 0
        },
        hasIssues: mismatchCount > 0 || needsReviewCount > 0
      };
    }));
    
    res.json({
      events: enrichedEvents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('❌ [Admin Events] Error:', error);
    res.status(500).json({
      message: 'Failed to fetch events',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/events/:eventId/audit-report
 * Download detailed audit report for any event (admin access)
 */
router.get('/events/:eventId/audit-report', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { format = 'csv' } = req.query;
    
    console.log('📊 [Admin Report] Generating audit report for event:', eventId);
    
    const Ticket = require('../models/Ticket');
    
    // Get event with organizer
    let event = await findEventByIdOrSlug(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Populate host after finding
    event = await Event.findById(event._id)
      .populate('host', 'name email communityProfile');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get all tickets (use event._id ObjectId, not raw eventId which could be a slug)
    const tickets = await Ticket.find({
      event: event._id,
      status: { $ne: 'cancelled' }
    }).populate('user', 'name email phoneNumber')
      .sort({ purchaseDate: -1 });
    
    console.log(`📊 [Admin Report] Found ${tickets.length} tickets`);
    
    // Calculate metrics
    const totalRevenueBeforeDiscount = tickets.reduce((sum, t) => sum + (t.metadata?.basePrice || 0), 0);
    
    // Calculate total coupon discount from event participants
    const totalCouponDiscount = (event.participants || []).reduce((sum, participant) => {
      return sum + (participant.couponUsed?.discountApplied || 0);
    }, 0);
    
    console.log(`💰 [Admin Report] Revenue: ₹${totalRevenueBeforeDiscount} - ₹${totalCouponDiscount} (coupon) = ₹${totalRevenueBeforeDiscount - totalCouponDiscount}`);
    
    // Final revenue after coupon discounts
    const totalRevenue = totalRevenueBeforeDiscount - totalCouponDiscount;
    
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
    
    // Build a map of participant coupon data by userId for lookup
    const participantCouponMap = {};
    (event.participants || []).forEach(p => {
      if (p.couponUsed?.code) {
        participantCouponMap[p.user?.toString()] = p.couponUsed;
      }
    });
    
    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: 'Admin',
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
        totalRevenueBeforeDiscount: parseFloat(totalRevenueBeforeDiscount.toFixed(2)),
        totalCouponDiscount: parseFloat(totalCouponDiscount.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalPaidByUsers: parseFloat(totalPaid.toFixed(2)),
        totalGatewayFees: parseFloat(totalGatewayFees.toFixed(2)),
        totalCashfreeCharges: parseFloat(tickets.reduce((sum, t) => sum + (t.cashfreeServiceCharge || 0) + (t.cashfreeServiceTax || 0), 0).toFixed(2)),
        avgTicketPrice: tickets.length > 0 ? parseFloat((totalRevenue / tickets.length).toFixed(2)) : 0,
        settlement: {
          settled: settledCount,
          pending: pendingCount,
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
        
        // Get coupon data: try ticket metadata first, then event participant data
        const userId = t.user?._id?.toString() || t.user?.toString();
        const ticketCoupon = t.metadata?.couponCode ? {
          code: t.metadata.couponCode,
          discountType: t.metadata.couponDiscountType || t.metadata.discountType || 'N/A',
          discountValue: t.metadata.couponDiscountValue || t.metadata.discountValue || 0,
          discountApplied: t.metadata.couponDiscount || 0
        } : participantCouponMap[userId] || null;
        
        return {
        ticketNumber: t.ticketNumber,
        userName: t.user?.name || 'N/A',
        userEmail: t.user?.email || 'N/A',
        userPhone: t.user?.phoneNumber || 'N/A',
        purchaseDate: t.purchaseDate,
        quantity: t.quantity || 1,
        ticketType: t.metadata?.ticketType || 'general',
        perTicketPrice: t.metadata?.priceAtPurchase || (basePrice && (t.quantity || 1) > 0 ? Math.round(basePrice / (t.quantity || 1)) : 0),
        pricingTimelineTier: t.metadata?.pricingTimelineTier || '',
        groupingOffer: t.metadata?.groupingOffer || '',
        tierPeople: t.metadata?.tierPeople || '',
        couponCode: ticketCoupon?.code || '',
        couponDiscountType: ticketCoupon?.discountType || '',
        couponDiscountApplied: ticketCoupon?.discountApplied || 0,
        originalPriceBeforeCoupon: ticketCoupon ? basePrice + (ticketCoupon.discountApplied || 0) : basePrice,
        totalTicketPrice: basePrice,
        gstAndOtherCharges: gstCharges,
        platformFees: platformFees,
        totalPaidByUser: totalPaidByUser,
        orderId: t.metadata?.orderId,
        paymentId: t.paymentId,
        paymentMethod: t.gatewayResponse?.paymentMethod || 'N/A',
        paymentStatus: t.gatewayResponse?.paymentStatus || 'N/A',
        gatewayPaymentAmount: totalPaidByUser,
        settlementStatus: t.settlementStatus,
        settlementDate: t.settlementDate,
        settlementUTR: t.settlementUTR,
        settlementAmount: t.settlementAmount || 0,
        cashfreeServiceCharge: t.cashfreeServiceCharge || 0,
        cashfreeServiceTax: t.cashfreeServiceTax || 0,
        cashfreeTotalDeducted: (t.cashfreeServiceCharge || 0) + (t.cashfreeServiceTax || 0),
        reconciliationStatus: t.reconciliationStatus,
        lastReconciliationDate: t.lastReconciliationDate,
        reconciliationNotes: t.reconciliationNotes,
        checkInStatus: t.status,
        checkInTime: t.checkInTime
      };})
    };
    
    // Add price change history and grouping offers to report
    report.priceChangeHistory = (event.priceChangeHistory || []).map(change => ({
      previousPrice: change.previousPrice,
      newPrice: change.newPrice,
      changedAt: change.changedAt,
      reason: change.reason,
      spotsBookedAtPrevPrice: change.spotsBookedAtPrevPrice
    }));
    
    report.pricingTimeline = event.pricingTimeline?.enabled ? {
      enabled: true,
      tiers: (event.pricingTimeline.tiers || []).map(tier => ({
        startDate: tier.startDate,
        endDate: tier.endDate,
        price: tier.price,
        label: tier.label
      }))
    } : { enabled: false };
    
    report.groupingOffers = event.groupingOffers?.enabled ? {
      enabled: true,
      tiers: (event.groupingOffers.tiers || []).map(t => ({
        people: t.people,
        price: t.price,
        label: t.label || ''
      }))
    } : { enabled: false };
    
    if (format === 'csv') {
      const fields = [
        'ticketNumber', 'userName', 'userEmail', 'userPhone', 'purchaseDate',
        'quantity', 'ticketType', 'perTicketPrice', 'pricingTimelineTier',
        'groupingOffer', 'tierPeople',
        'couponCode', 'couponDiscountType', 'couponDiscountApplied',
        'originalPriceBeforeCoupon', 'totalTicketPrice', 'gstAndOtherCharges', 'platformFees',
        'totalPaidByUser', 'orderId', 'paymentId', 'paymentMethod', 'paymentStatus',
        'gatewayPaymentAmount', 'settlementStatus', 'settlementDate', 'settlementUTR', 'settlementAmount',
        'cashfreeServiceCharge', 'cashfreeServiceTax', 'cashfreeTotalDeducted',
        'reconciliationStatus', 'lastReconciliationDate', 'reconciliationNotes',
        'checkInStatus', 'checkInTime'
      ];
      
      const totalSettledAmount = tickets.filter(t => t.settlementStatus === 'settled').reduce((sum, t) => sum + (t.settlementAmount || 0), 0);
      const totalCashfreeCharges = tickets.reduce((sum, t) => sum + (t.cashfreeServiceCharge || 0) + (t.cashfreeServiceTax || 0), 0);
      
      const csvRows = [];
      csvRows.push(`# ========================================`);
      csvRows.push(`# ADMIN AUDIT REPORT`);
      csvRows.push(`# ========================================`);
      csvRows.push(`# Event: ${event.title}`);
      csvRows.push(`# Organizer: ${event.host.name} (${event.host.email})`);
      csvRows.push(`# Community: ${event.host.communityProfile?.communityName || 'N/A'}`);
      csvRows.push(`# Generated: ${new Date().toISOString()}`);
      csvRows.push(`# Total Tickets: ${tickets.length}`);
      csvRows.push(`# Total Revenue (User Paid): ₹${totalPaid.toFixed(2)}`);
      csvRows.push(`# Base Revenue (Organizer Share): ₹${totalRevenue.toFixed(2)}`);
      csvRows.push(`# Gateway Fees Deducted: ₹${totalGatewayFees.toFixed(2)}`);
      csvRows.push(`#`);
      csvRows.push(`# COUPON DISCOUNTS:`);
      csvRows.push(`#   - Total Coupon Discount: ₹${totalCouponDiscount.toFixed(2)}`);
      csvRows.push(`#   - Tickets with Coupons: ${report.tickets.filter(t => t.couponCode).length}`);
      csvRows.push(`#   - Revenue Before Coupon: ₹${totalRevenueBeforeDiscount.toFixed(2)}`);
      csvRows.push(`#   - Revenue After Coupon (Organizer Share): ₹${totalRevenue.toFixed(2)}`);
      csvRows.push(`#`);
      csvRows.push(`# SETTLEMENT STATUS:`);
      csvRows.push(`#   - Settled: ${settledCount} tickets (${report.summary.settlement.settledPercentage}%)`);
      csvRows.push(`#   - Amount Settled to Organizer Bank: ₹${totalSettledAmount.toFixed(2)}`);
      csvRows.push(`#   - Cashfree Charges Deducted (1.2% + GST): ₹${totalCashfreeCharges.toFixed(2)}`);
      csvRows.push(`#   - Pending Settlement: ${pendingCount} tickets`);
      csvRows.push(`#   - Settlement = When Cashfree transfers money to organizer's bank account`);
      csvRows.push(`#`);
      csvRows.push(`# RECONCILIATION STATUS:`);
      csvRows.push(`#   - Verified with Cashfree: ${verifiedCount} (${report.summary.reconciliation.verifiedPercentage}%)`);
      csvRows.push(`#   - Mismatches Found: ${mismatchCount}`);
      csvRows.push(`#   - Pending Verification: ${tickets.length - verifiedCount - mismatchCount}`);
      csvRows.push(`#   - Reconciliation = Daily verification that payment was actually received by Cashfree`);
      csvRows.push(`#`);
      csvRows.push(`# PRICE CHANGES:`);
      csvRows.push(`#   - Total Price Changes: ${(event.priceChangeHistory || []).length}`);
      if (event.priceChangeHistory && event.priceChangeHistory.length > 0) {
        event.priceChangeHistory.forEach((change, i) => {
          csvRows.push(`#   - Change ${i + 1}: ₹${change.previousPrice} → ₹${change.newPrice} on ${new Date(change.changedAt).toISOString()} (${change.reason}) [${change.spotsBookedAtPrevPrice} spots at prev price]`);
        });
      }
      csvRows.push(`#   - Time-Based Pricing: ${event.pricingTimeline?.enabled ? 'Enabled' : 'Disabled'}`);
      if (event.pricingTimeline?.enabled && event.pricingTimeline.tiers?.length > 0) {
        event.pricingTimeline.tiers.forEach((tier, i) => {
          csvRows.push(`#   - Tier ${i + 1}: ${tier.label || 'N/A'} - ₹${tier.price} (${new Date(tier.startDate).toLocaleDateString()} to ${new Date(tier.endDate).toLocaleDateString()})`);
        });
      }
      csvRows.push(`#`);
      csvRows.push(`# GROUPING OFFERS:`);
      csvRows.push(`#   - Grouping Offers: ${event.groupingOffers?.enabled ? 'Enabled' : 'Disabled'}`);
      if (event.groupingOffers?.enabled && event.groupingOffers.tiers?.length > 0) {
        const groupTickets = report.tickets.filter(t => t.groupingOffer);
        csvRows.push(`#   - Tickets with Group Offers: ${groupTickets.length}`);
        event.groupingOffers.tiers.forEach((tier, i) => {
          const tierTickets = groupTickets.filter(t => t.groupingOffer === (tier.label || `${tier.people} people`));
          csvRows.push(`#   - Tier ${i + 1}: ${tier.people} people at ₹${tier.price} (${tierTickets.length} tickets)`);
        });
      }
      csvRows.push(`#`);
      csvRows.push(`# FIELD EXPLANATIONS:`);
      csvRows.push(`#   - totalPaidByUser: Total amount customer paid (includes all fees)`);
      csvRows.push(`#   - gatewayPaymentAmount: Amount received by Cashfree from customer`);
      csvRows.push(`#   - totalTicketPrice: Total ticket price (per ticket × spots, organizer's share before gateway fees)`);
      csvRows.push(`#   - perTicketPrice: Per ticket price at the time of purchase`);
      csvRows.push(`#   - pricingTimelineTier: Which pricing timeline tier was active at purchase`);
      csvRows.push(`#   - groupingOffer: Group offer tier label (if applicable)`);
      csvRows.push(`#   - tierPeople: Number of people in the group tier`);
      csvRows.push(`#   - couponCode: Discount coupon applied by user (if any)`);
      csvRows.push(`#   - couponDiscountApplied: Amount discounted by coupon (in ₹)`);
      csvRows.push(`#   - originalPriceBeforeCoupon: Base price before coupon was applied`);
      csvRows.push(`#   - settlementAmount: Final amount transferred to organizer's bank`);
      csvRows.push(`#   - cashfreeServiceCharge: Cashfree processing fee (1.2% of order amount)`);
      csvRows.push(`#   - cashfreeServiceTax: GST charged on Cashfree's processing fee`);
      csvRows.push(`#   - cashfreeTotalDeducted: Total amount deducted by Cashfree (charge + tax)`);
      csvRows.push(`#   - orderId: Cashfree order ID for verification`);
      csvRows.push(`#   - reconciliationStatus: verified = Payment confirmed with Cashfree API`);
      csvRows.push(`#   - lastReconciliationDate: When we last verified this payment with Cashfree`);
      csvRows.push(`# ========================================`);
      csvRows.push('');
      csvRows.push(fields.join(','));
      
      report.tickets.forEach(ticket => {
        const row = fields.map(field => {
          let value = ticket[field];
          if (field.includes('Date') || field.includes('Time')) {
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
      res.setHeader('Content-Disposition', `attachment; filename="admin-audit-${eventId}-${Date.now()}.csv"`);
      res.send(csvRows.join('\n'));
    } else {
      res.json(report);
    }
    
  } catch (error) {
    console.error('❌ [Admin Report] Error:', error);
    res.status(500).json({
      message: 'Failed to generate audit report',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/reports/reconciliation-issues
 * Get all tickets with reconciliation issues (mismatches, manual review)
 */
router.get('/reports/reconciliation-issues', requirePermission('view_analytics'), async (req, res) => {
  try {
    const Ticket = require('../models/Ticket');
    
    console.log('⚠️ [Admin] Fetching reconciliation issues...');
    
    // Get tickets with issues
    const issueTickets = await Ticket.find({
      $or: [
        { reconciliationStatus: 'mismatch' },
        { reconciliationStatus: 'manual_review' }
      ]
    })
      .populate('event', 'title date host')
      .populate('user', 'name email')
      .sort({ lastReconciliationDate: -1 })
      .limit(100)
      .lean();
    
    // Populate host manually
    const enrichedTickets = await Promise.all(issueTickets.map(async (ticket) => {
      if (ticket.event && ticket.event.host) {
        const host = await User.findById(ticket.event.host).select('name email communityProfile').lean();
        return {
          ...ticket,
          event: {
            ...ticket.event,
            hostData: host
          }
        };
      }
      return ticket;
    }));
    
    console.log(`⚠️ [Admin] Found ${enrichedTickets.length} tickets with issues`);
    
    // Group by issue type
    const mismatches = enrichedTickets.filter(t => t.reconciliationStatus === 'mismatch');
    const needsReview = enrichedTickets.filter(t => t.reconciliationStatus === 'manual_review');
    
    res.json({
      summary: {
        total: enrichedTickets.length,
        mismatches: mismatches.length,
        needsReview: needsReview.length
      },
      issues: enrichedTickets.map(t => ({
        ticketNumber: t.ticketNumber,
        eventTitle: t.event?.title,
        eventDate: t.event?.date,
        organizer: {
          name: t.event?.hostData?.name,
          email: t.event?.hostData?.email,
          communityName: t.event?.hostData?.communityProfile?.communityName
        },
        user: {
          name: t.user?.name,
          email: t.user?.email
        },
        purchaseDate: t.purchaseDate,
        basePrice: t.metadata?.basePrice,
        totalPaid: t.metadata?.totalPaid,
        orderId: t.metadata?.orderId,
        reconciliationStatus: t.reconciliationStatus,
        reconciliationNotes: t.reconciliationNotes,
        lastReconciliationDate: t.lastReconciliationDate
      }))
    });
    
  } catch (error) {
    console.error('❌ [Admin Issues] Error:', error);
    res.status(500).json({
      message: 'Failed to fetch reconciliation issues',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/reports/settlement-pending
 * Get all tickets with pending settlements (aging analysis)
 */
router.get('/reports/settlement-pending', requirePermission('view_analytics'), async (req, res) => {
  try {
    const Ticket = require('../models/Ticket');
    
    console.log('🏦 [Admin] Fetching pending settlements...');
    
    // Get pending/captured tickets
    const pendingTickets = await Ticket.find({
      settlementStatus: { $in: ['pending', 'captured'] },
      reconciliationStatus: 'verified' // Only reconciled payments
    })
      .populate('event', 'title date host')
      .populate('user', 'name email')
      .sort({ purchaseDate: 1 }) // Oldest first
      .lean();
    
    // Populate host data
    const enrichedTickets = await Promise.all(pendingTickets.map(async (ticket) => {
      if (ticket.event && ticket.event.host) {
        const host = await User.findById(ticket.event.host).select('name email communityProfile').lean();
        
        // Calculate days pending
        const daysPending = Math.floor((new Date() - new Date(ticket.purchaseDate)) / (24 * 60 * 60 * 1000));
        
        return {
          ...ticket,
          daysPending,
          event: {
            ...ticket.event,
            hostData: host
          }
        };
      }
      return ticket;
    }));
    
    // Categorize by age
    const aging = {
      fresh: enrichedTickets.filter(t => t.daysPending <= 2),           // 0-2 days (normal)
      pending: enrichedTickets.filter(t => t.daysPending > 2 && t.daysPending <= 5),  // 3-5 days
      overdue: enrichedTickets.filter(t => t.daysPending > 5 && t.daysPending <= 10), // 6-10 days
      critical: enrichedTickets.filter(t => t.daysPending > 10)          // 10+ days (escalate)
    };
    
    console.log(`🏦 [Admin] Settlements: ${aging.fresh.length} fresh, ${aging.pending.length} pending, ${aging.overdue.length} overdue, ${aging.critical.length} critical`);
    
    res.json({
      summary: {
        total: enrichedTickets.length,
        fresh: aging.fresh.length,
        pending: aging.pending.length,
        overdue: aging.overdue.length,
        critical: aging.critical.length,
        totalAmount: enrichedTickets.reduce((sum, t) => sum + (t.metadata?.basePrice || 0), 0)
      },
      aging: {
        fresh: aging.fresh.slice(0, 10).map(t => formatSettlementTicket(t)),
        pending: aging.pending.slice(0, 10).map(t => formatSettlementTicket(t)),
        overdue: aging.overdue.map(t => formatSettlementTicket(t)),
        critical: aging.critical.map(t => formatSettlementTicket(t))
      }
    });
    
  } catch (error) {
    console.error('❌ [Admin Settlements] Error:', error);
    res.status(500).json({
      message: 'Failed to fetch pending settlements',
      error: error.message
    });
  }
});

// Helper function to format settlement ticket data
function formatSettlementTicket(ticket) {
  return {
    ticketNumber: ticket.ticketNumber,
    eventTitle: ticket.event?.title,
    organizer: {
      name: ticket.event?.hostData?.name,
      email: ticket.event?.hostData?.email,
      communityName: ticket.event?.hostData?.communityProfile?.communityName
    },
    purchaseDate: ticket.purchaseDate,
    daysPending: ticket.daysPending,
    basePrice: ticket.metadata?.basePrice,
    orderId: ticket.metadata?.orderId,
    settlementStatus: ticket.settlementStatus
  };
}

// ==================== ORGANIZER MANAGEMENT ====================

/**
 * GET /api/admin/organizers
 * Get all community organizers with basic stats
 */
router.get('/organizers', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, city, verified } = req.query;
    
    const query = {
      role: 'host_partner',
      hostPartnerType: 'community_organizer'
    };
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'communityProfile.communityName': { $regex: search, $options: 'i' } }
      ];
    }
    
    // City filter
    if (city) {
      query['communityProfile.city'] = { $regex: city, $options: 'i' };
    }
    
    // KYC verification filter
    if (verified !== undefined) {
      query['payoutDetails.isVerified'] = verified === 'true';
    }
    
    const skip = (page - 1) * parseInt(limit);
    
    // Get all matching organizer IDs first
    const allOrganizers = await User.find(query).select('_id').lean();
    const total = allOrganizers.length;
    const organizerIds = allOrganizers.map(o => o._id);

    // Aggregate spots booked per organizer from Event.currentParticipants
    const now = new Date();
    const spotsAgg = await Event.aggregate([
      { $match: { host: { $in: organizerIds } } },
      {
        $addFields: {
          // Combine date + endTime into a comparable datetime
          eventEndDateTime: {
            $cond: {
              if: { $and: ['$date', '$endTime'] },
              then: {
                $dateFromString: {
                  dateString: {
                    $concat: [
                      { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                      'T',
                      '$endTime',
                      ':00'
                    ]
                  },
                  onError: '$date'
                }
              },
              else: '$date'
            }
          }
        }
      },
      {
        $group: {
          _id: '$host',
          totalSpotsBooked: { $sum: '$currentParticipants' },
          totalEvents: { $sum: 1 },
          activeEvents: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'published'] }, { $gte: ['$eventEndDateTime', now] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { totalSpotsBooked: -1 } }
    ]);

    // Build a map of organizer stats
    const spotsMap = {};
    spotsAgg.forEach(s => {
      spotsMap[s._id.toString()] = {
        totalSpotsBooked: s.totalSpotsBooked,
        totalEvents: s.totalEvents,
        activeEvents: s.activeEvents
      };
    });

    // Sort all organizer IDs by spots booked descending, then paginate
    organizerIds.sort((a, b) => {
      const aSpots = spotsMap[a.toString()]?.totalSpotsBooked || 0;
      const bSpots = spotsMap[b.toString()]?.totalSpotsBooked || 0;
      return bSpots - aSpots;
    });

    const paginatedIds = organizerIds.slice(skip, skip + parseInt(limit));

    // Fetch full organizer data for this page
    const organizers = await User.find({ _id: { $in: paginatedIds } })
      .select('name email phoneNumber communityProfile payoutDetails createdAt location')
      .lean();

    // Map organizers by ID for ordering
    const organizerMap = {};
    organizers.forEach(o => { organizerMap[o._id.toString()] = o; });

    // Build enriched list in sorted order
    const enrichedOrganizers = paginatedIds.map(id => {
      const organizer = organizerMap[id.toString()];
      if (!organizer) return null;
      const stats = spotsMap[id.toString()] || { totalSpotsBooked: 0, totalEvents: 0, activeEvents: 0 };
      return {
        _id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        phoneNumber: organizer.phoneNumber,
        communityName: organizer.communityProfile?.communityName || 'N/A',
        city: organizer.communityProfile?.city || organizer.location?.city || 'N/A',
        category: organizer.communityProfile?.primaryCategory || organizer.communityProfile?.category?.[0] || 'N/A',
        logo: organizer.communityProfile?.logo,
        memberCount: organizer.communityProfile?.memberCount || 0,
        kycVerified: organizer.payoutDetails?.isVerified || false,
        stats: {
          totalEvents: stats.totalEvents,
          activeEvents: stats.activeEvents,
          totalSpotsBooked: stats.totalSpotsBooked
        },
        joinedDate: organizer.createdAt
      };
    }).filter(Boolean);
    
    res.json({
      organizers: enrichedOrganizers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching organizers:', error);
    res.status(500).json({ message: 'Server error while fetching organizers' });
  }
});

/**
 * GET /api/admin/organizers/:organizerId
 * Get complete organizer details including KYC
 */
router.get('/organizers/:organizerId', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { organizerId } = req.params;
    
    const organizer = await User.findOne({
      _id: organizerId,
      role: 'host_partner',
      hostPartnerType: 'community_organizer'
    }).lean();
    
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }
    
    // Get event statistics
    const [eventStats, totalRevenue, recentEvents] = await Promise.all([
      Event.aggregate([
        { $match: { host: organizer._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      // Calculate total revenue from tickets
      Event.aggregate([
        { $match: { host: organizer._id } },
        {
          $group: {
            _id: null,
            totalTicketsSold: { $sum: '$currentParticipants' },
            totalEvents: { $sum: 1 }
          }
        }
      ]),
      // Get recent events
      Event.find({ host: organizer._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title date status currentParticipants maxParticipants price location')
        .lean()
    ]);
    
    // Format event stats
    const statusCounts = {};
    eventStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });
    
    // Fetch Ticket model to get actual revenue from this organizer
    const Ticket = require('../models/Ticket');
    const ticketRevenue = await Ticket.aggregate([
      { 
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventDetails'
        }
      },
      { $unwind: '$eventDetails' },
      { $match: { 'eventDetails.host': organizer._id } },
      {
        $group: {
          _id: null,
          // Base Revenue = organizer's share (metadata.basePrice preferred, fallback to price.amount)
          totalRevenue: {
            $sum: {
              $cond: [
                { $gt: ['$metadata.basePrice', 0] },
                '$metadata.basePrice',
                '$price.amount'
              ]
            }
          },
          // Total User Paid = full amount charged to customer (metadata.totalPaid preferred, fallback to price.amount)
          totalUserPaid: {
            $sum: {
              $cond: [
                { $gt: ['$metadata.totalPaid', 0] },
                '$metadata.totalPaid',
                '$price.amount'
              ]
            }
          },
          settledAmount: {
            $sum: {
              $cond: [
                { $eq: ['$settlementStatus', 'settled'] },
                '$settlementAmount',
                0
              ]
            }
          },
          pendingSettlement: {
            $sum: {
              $cond: [
                { $in: ['$settlementStatus', ['pending', 'captured']] },
                {
                  $cond: [
                    { $gt: ['$metadata.basePrice', 0] },
                    '$metadata.basePrice',
                    '$price.amount'
                  ]
                },
                0
              ]
            }
          },
          totalCashfreeServiceCharge: {
            $sum: { $ifNull: ['$cashfreeServiceCharge', 0] }
          },
          totalCashfreeServiceTax: {
            $sum: { $ifNull: ['$cashfreeServiceTax', 0] }
          }
        }
      }
    ]);
    
    const response = {
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        phoneNumber: organizer.phoneNumber,
        isPhoneVerified: organizer.otpVerification?.isPhoneVerified || false,
        profilePicture: organizer.profilePicture,
        bio: organizer.bio,
        location: organizer.location,
        joinedDate: organizer.createdAt,
        lastActive: organizer.updatedAt
      },
      communityProfile: {
        communityName: organizer.communityProfile?.communityName,
        city: organizer.communityProfile?.city,
        category: organizer.communityProfile?.category || [],
        primaryCategory: organizer.communityProfile?.primaryCategory,
        communityType: organizer.communityProfile?.communityType,
        communityDescription: organizer.communityProfile?.communityDescription,
        shortBio: organizer.communityProfile?.shortBio,
        logo: organizer.communityProfile?.logo,
        coverImage: organizer.communityProfile?.coverImage,
        socialLinks: {
          instagram: organizer.communityProfile?.instagram,
          facebook: organizer.communityProfile?.facebook,
          website: organizer.communityProfile?.website,
          linkedin: organizer.communityProfile?.linkedin
        },
        pastEventPhotos: organizer.communityProfile?.pastEventPhotos || [],
        pastEventExperience: organizer.communityProfile?.pastEventExperience,
        typicalAudienceSize: organizer.communityProfile?.typicalAudienceSize,
        established: organizer.communityProfile?.established,
        memberCount: organizer.communityProfile?.memberCount || 0,
        contactPerson: organizer.communityProfile?.contactPerson,
        preferences: {
          preferredCities: organizer.communityProfile?.preferredCities || [],
          preferredCategories: organizer.communityProfile?.preferredCategories || [],
          preferredEventFormats: organizer.communityProfile?.preferredEventFormats || [],
          preferredAudienceTypes: organizer.communityProfile?.preferredAudienceTypes || [],
          nicheCommunityDescription: organizer.communityProfile?.nicheCommunityDescription
        }
      },
      payoutDetails: {
        accountHolderName: organizer.payoutDetails?.accountHolderName,
        accountNumber: organizer.payoutDetails?.accountNumber || null,
        ifscCode: organizer.payoutDetails?.ifscCode,
        billingAddress: organizer.payoutDetails?.billingAddress,
        upiId: organizer.payoutDetails?.upiId,
        gstNumber: organizer.payoutDetails?.gstNumber,
        idProofDocument: organizer.payoutDetails?.idProofDocument,
        isVerified: organizer.payoutDetails?.isVerified || false,
        verifiedAt: organizer.payoutDetails?.verifiedAt,
        lastUpdated: organizer.payoutDetails?.lastUpdated
      },
      eventStats: {
        total: (statusCounts.draft || 0) + (statusCounts.published || 0) + (statusCounts.completed || 0) + (statusCounts.cancelled || 0),
        draft: statusCounts.draft || 0,
        live: statusCounts.published || 0,
        completed: statusCounts.completed || 0,
        cancelled: statusCounts.cancelled || 0
      },
      revenueStats: {
        totalRevenue: ticketRevenue[0]?.totalRevenue || 0,
        totalUserPaid: ticketRevenue[0]?.totalUserPaid || ticketRevenue[0]?.totalRevenue || 0,
        totalSpotsBooked: totalRevenue[0]?.totalTicketsSold || 0,
        settledAmount: ticketRevenue[0]?.settledAmount || 0,
        pendingSettlement: ticketRevenue[0]?.pendingSettlement || 0,
        cashfreeServiceCharge: ticketRevenue[0]?.totalCashfreeServiceCharge || 0,
        cashfreeServiceTax: ticketRevenue[0]?.totalCashfreeServiceTax || 0,
        totalCashfreeDeducted: (ticketRevenue[0]?.totalCashfreeServiceCharge || 0) + (ticketRevenue[0]?.totalCashfreeServiceTax || 0),
        currency: 'INR'
      },
      recentEvents
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching organizer details:', error);
    res.status(500).json({ message: 'Server error while fetching organizer details' });
  }
});

/**
 * GET /api/admin/organizers/:organizerId/events
 * Get all events by a specific organizer
 */
router.get('/organizers/:organizerId/events', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { page = 1, limit = 20, status, category, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // Verify organizer exists
    const organizer = await User.findOne({
      _id: organizerId,
      role: 'host_partner',
      hostPartnerType: 'community_organizer'
    });
    
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }
    
    const query = { host: organizerId };
    
    if (status) query.status = status;
    if (category) query.categories = category;
    
    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;
    
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Event.countDocuments(query)
    ]);
    
    // Enrich with ticket and revenue data
    const Ticket = require('../models/Ticket');
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const tickets = await Ticket.find({ event: event._id }).lean();
        
        // Base Revenue = organizer's share
        const totalRevenue = tickets.reduce((sum, ticket) => {
          const base = ticket.metadata?.basePrice > 0 ? ticket.metadata.basePrice : (ticket.price?.amount || 0);
          return sum + base;
        }, 0);
        
        // Total User Paid (includes GST + platform fees)
        const totalUserPaid = tickets.reduce((sum, ticket) => {
          const paid = ticket.metadata?.totalPaid > 0 ? ticket.metadata.totalPaid : (ticket.price?.amount || 0);
          return sum + paid;
        }, 0);
        
        const settledRevenue = tickets
          .filter(t => t.settlementStatus === 'settled')
          .reduce((sum, ticket) => sum + (ticket.settlementAmount || ticket.price?.amount || 0), 0);
        
        const totalCashfreeDeducted = tickets.reduce((sum, t) => 
          sum + (t.cashfreeServiceCharge || 0) + (t.cashfreeServiceTax || 0), 0
        );
        
        const totalSpotsBooked = event.currentParticipants || 0;
        const activeTickets = tickets.filter(t => t.status === 'active').length;
        const checkedInTickets = tickets.filter(t => t.status === 'checked_in').length;
        
        return {
          _id: event._id,
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          categories: event.categories,
          format: event.format,
          status: event.status,
          price: event.price,
          maxParticipants: event.maxParticipants,
          currentParticipants: event.currentParticipants,
          eventImage: event.eventImage,
          createdAt: event.createdAt,
          revenue: {
            totalRevenue,
            totalUserPaid,
            settledRevenue,
            cashfreeChargesDeducted: parseFloat(totalCashfreeDeducted.toFixed(2)),
            pendingRevenue: totalRevenue - settledRevenue,
            ticketsSold: tickets.length,
            totalSpotsBooked,
            activeTickets,
            checkedInTickets
          }
        };
      })
    );
    
    res.json({
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        communityName: organizer.communityProfile?.communityName
      },
      events: enrichedEvents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching organizer events:', error);
    res.status(500).json({ message: 'Server error while fetching organizer events' });
  }
});

/**
 * GET /api/admin/events/:eventId/complete-details
 * Get complete event details with tickets, analytics, and audit data
 */
router.get('/events/:eventId/complete-details', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    let event = await findEventByIdOrSlug(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Populate after finding
    event = await Event.findById(event._id)
      .populate('host', 'name email communityProfile payoutDetails')
      .populate('coHosts', 'name email')
      .lean();
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get all tickets for this event (use event._id ObjectId)
    const Ticket = require('../models/Ticket');
    const tickets = await Ticket.find({ event: event._id })
      .populate('user', 'name email phoneNumber')
      .sort({ purchaseDate: -1 })
      .lean();
    
    // Calculate comprehensive analytics
    // Base Revenue = organizer's share. Use metadata.basePrice if available, else price.amount
    const totalRevenue = tickets.reduce((sum, ticket) => {
      const base = ticket.metadata?.basePrice > 0 ? ticket.metadata.basePrice : (ticket.price?.amount || 0);
      return sum + base;
    }, 0);
    
    // Total amount users actually paid (includes GST + platform fees)
    // Use metadata.totalPaid if > 0, else price.amount (which IS total paid for older tickets)
    const totalUserPaid = tickets.reduce((sum, ticket) => {
      const paid = ticket.metadata?.totalPaid > 0 ? ticket.metadata.totalPaid : (ticket.price?.amount || 0);
      return sum + paid;
    }, 0);
    
    const settledRevenue = tickets
      .filter(t => t.settlementStatus === 'settled')
      .reduce((sum, ticket) => sum + (ticket.settlementAmount || ticket.price?.amount || 0), 0);
    
    const capturedRevenue = tickets
      .filter(t => t.settlementStatus === 'captured')
      .reduce((sum, ticket) => {
        const base = ticket.metadata?.basePrice > 0 ? ticket.metadata.basePrice : (ticket.price?.amount || 0);
        return sum + base;
      }, 0);
    
    const totalCashfreeServiceCharge = tickets.reduce((sum, t) => sum + (t.cashfreeServiceCharge || 0), 0);
    const totalCashfreeServiceTax = tickets.reduce((sum, t) => sum + (t.cashfreeServiceTax || 0), 0);
    
    const ticketsByStatus = {
      active: tickets.filter(t => t.status === 'active').length,
      checked_in: tickets.filter(t => t.status === 'checked_in').length,
      cancelled: tickets.filter(t => t.status === 'cancelled').length,
      refunded: tickets.filter(t => t.status === 'refunded').length
    };
    
    const settlementStats = {
      pending: tickets.filter(t => t.settlementStatus === 'pending').length,
      captured: tickets.filter(t => t.settlementStatus === 'captured').length,
      settled: tickets.filter(t => t.settlementStatus === 'settled').length,
      reconciled: tickets.filter(t => t.settlementStatus === 'reconciled').length,
      failed: tickets.filter(t => t.settlementStatus === 'failed').length
    };
    
    const reconciliationStats = {
      verified: tickets.filter(t => t.reconciliationStatus === 'verified').length,
      mismatch: tickets.filter(t => t.reconciliationStatus === 'mismatch').length,
      manual_review: tickets.filter(t => t.reconciliationStatus === 'manual_review').length,
      pending: tickets.filter(t => t.reconciliationStatus === 'pending').length
    };
    
    // Payment method breakdown
    const paymentMethods = {};
    tickets.forEach(ticket => {
      const method = ticket.gatewayResponse?.paymentMethod || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });
    
    // Daily ticket sales (IST-aware)
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const dailySales = {};
    tickets.forEach(ticket => {
      const date = new Date(new Date(ticket.purchaseDate).getTime() + IST_OFFSET).toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { count: 0, revenue: 0 };
      }
      dailySales[date].count++;
      dailySales[date].revenue += ticket.price?.amount || 0;
    });
    
    // Format attendee list with purchase details
    const attendees = tickets.map(ticket => ({
      ticketNumber: ticket.ticketNumber,
      user: {
        _id: ticket.user?._id,
        name: ticket.user?.name,
        email: ticket.user?.email,
        phoneNumber: ticket.user?.phoneNumber
      },
      purchaseDate: ticket.purchaseDate,
      price: ticket.price?.amount,
      quantity: ticket.quantity || 1,
      ticketType: ticket.metadata?.ticketType || 'general',
      priceAtPurchase: ticket.metadata?.priceAtPurchase || (ticket.metadata?.basePrice ? Math.round(ticket.metadata.basePrice / (ticket.quantity || 1)) : ticket.price?.amount || 0),
      pricingTimelineTier: ticket.metadata?.pricingTimelineTier || null,
      basePrice: ticket.metadata?.basePrice || 0,
      couponCode: ticket.metadata?.couponCode || null,
      couponDiscount: ticket.metadata?.couponDiscount || 0,
      discountType: ticket.metadata?.discountType || null,
      discountValue: ticket.metadata?.discountValue || null,
      groupingOffer: ticket.metadata?.groupingOffer || null,
      tierPeople: ticket.metadata?.tierPeople || null,
      orderId: ticket.metadata?.orderId,
      totalPaid: ticket.metadata?.totalPaid || ticket.price?.amount || 0,
      paymentId: ticket.paymentId,
      paymentMethod: ticket.gatewayResponse?.paymentMethod,
      status: ticket.status,
      checkInTime: ticket.checkInTime,
      settlementStatus: ticket.settlementStatus,
      settlementDate: ticket.settlementDate,
      settlementUTR: ticket.settlementUTR,
      reconciliationStatus: ticket.reconciliationStatus,
      lastReconciliationDate: ticket.lastReconciliationDate
    }));
    
    const response = {
      event: {
        _id: event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        endDate: event.endDate,
        endTime: event.endTime,
        location: event.location,
        categories: event.categories,
        format: event.format,
        status: event.status,
        price: event.price,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
        eventImage: event.eventImage,
        galleryImages: event.galleryImages,
        ageLimit: event.ageLimit,
        policies: event.policies,
        requirements: event.requirements,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      },
      organizer: {
        _id: event.host._id,
        name: event.host.name,
        email: event.host.email,
        communityName: event.host.communityProfile?.communityName,
        logo: event.host.communityProfile?.logo,
        kycVerified: event.host.payoutDetails?.isVerified || false,
        accountNumber: event.host.payoutDetails?.accountNumber ? 
          `****${event.host.payoutDetails.accountNumber.slice(-4)}` : null,
        ifscCode: event.host.payoutDetails?.ifscCode,
        upiId: event.host.payoutDetails?.upiId
      },
      coHosts: event.coHosts || [],
      analytics: {
        totalTickets: tickets.length,
        totalSpotsBooked: event.currentParticipants || 0,
        ticketsByStatus,
        totalRevenue,
        totalUserPaid,
        settledRevenue,
        capturedRevenue,
        pendingRevenue: totalRevenue - settledRevenue,
        settlementPercentage: totalRevenue > 0 ? 
          ((settledRevenue / totalRevenue) * 100).toFixed(2) : 0,
        checkInRate: tickets.length > 0 ? 
          ((ticketsByStatus.checked_in / tickets.length) * 100).toFixed(2) : 0,
        cashfreeCharges: {
          serviceCharge: parseFloat(totalCashfreeServiceCharge.toFixed(2)),
          serviceTax: parseFloat(totalCashfreeServiceTax.toFixed(2)),
          totalDeducted: parseFloat((totalCashfreeServiceCharge + totalCashfreeServiceTax).toFixed(2))
        },
        settlementStats,
        reconciliationStats,
        paymentMethods,
        dailySales: Object.entries(dailySales).map(([date, data]) => ({
          date,
          ticketsSold: data.count,
          revenue: data.revenue
        })).sort((a, b) => new Date(a.date) - new Date(b.date))
      },
      attendees,
      hasIssues: reconciliationStats.mismatch > 0 || reconciliationStats.manual_review > 0,
      // Price change history and pricing timeline
      priceChangeHistory: (event.priceChangeHistory || []).map(change => ({
        previousPrice: change.previousPrice,
        newPrice: change.newPrice,
        changedAt: change.changedAt,
        reason: change.reason,
        spotsBookedAtPrevPrice: change.spotsBookedAtPrevPrice,
        groupingOffersSnapshot: change.groupingOffersSnapshot
      })),
      pricingTimeline: event.pricingTimeline?.enabled ? {
        enabled: true,
        tiers: (event.pricingTimeline.tiers || []).map(tier => {
          // Use IST-aware date comparison since events are India-based
          const IST_OFFSET = 5.5 * 60 * 60 * 1000;
          const toISTDateStr = (d) => new Date(new Date(d).getTime() + IST_OFFSET).toISOString().split('T')[0];
          const startStr = toISTDateStr(tier.startDate);
          const endStr = toISTDateStr(tier.endDate);
          const tierFilter = t => {
            const purchaseStr = toISTDateStr(t.purchaseDate);
            return purchaseStr >= startStr && purchaseStr <= endStr;
          };
          return {
            startDate: tier.startDate,
            endDate: tier.endDate,
            price: tier.price,
            label: tier.label,
            ticketsBought: tickets.filter(tierFilter).length,
            spotsBought: tickets.filter(tierFilter).reduce((sum, t) => sum + (t.quantity || 1), 0),
            revenue: tickets.filter(tierFilter).reduce((sum, t) => sum + (t.metadata?.basePrice || t.price?.amount || 0), 0)
          };
        })
      } : { enabled: false, tiers: [] },
      // Grouping offers data
      groupingOffers: event.groupingOffers || { enabled: false, tiers: [] },
      // Coupon data
      coupons: event.coupons || { enabled: false, codes: [] }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching complete event details:', error);
    res.status(500).json({ message: 'Server error while fetching event details' });
  }
});

/**
 * PUT /api/admin/organizers/:organizerId/verify-kyc
 * Verify or reject organizer KYC details
 */
router.put('/organizers/:organizerId/verify-kyc', requirePermission('manage_payments'), async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { isVerified, notes } = req.body;
    
    const organizer = await User.findOne({
      _id: organizerId,
      role: 'host_partner',
      hostPartnerType: 'community_organizer'
    });
    
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }
    
    organizer.payoutDetails = organizer.payoutDetails || {};
    organizer.payoutDetails.isVerified = isVerified;
    if (isVerified) {
      organizer.payoutDetails.verifiedAt = new Date();
    }
    organizer.payoutDetails.lastUpdated = new Date();
    
    await organizer.save();
    
    // Send notification to organizer
    const notificationService = require('../services/notificationService');
    await notificationService.createNotification({
      recipient: organizerId,
      type: isVerified ? 'kyc_approved' : 'kyc_rejected',
      category: 'account',
      priority: 'high',
      title: isVerified ? '✅ KYC Verified' : '❌ KYC Verification Failed',
      message: isVerified 
        ? 'Your KYC details have been verified. You can now receive payouts.' 
        : `Your KYC verification was not successful. ${notes || 'Please update your details and try again.'}`,
      actionUrl: '/organizer/profile/payout-details'
    });
    
    res.json({
      message: `KYC ${isVerified ? 'verified' : 'rejected'} successfully`,
      payoutDetails: {
        isVerified: organizer.payoutDetails.isVerified,
        verifiedAt: organizer.payoutDetails.verifiedAt,
        lastUpdated: organizer.payoutDetails.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error updating KYC status:', error);
    res.status(500).json({ message: 'Server error while updating KYC status' });
  }
});

// ==================== WORKSPACE SPECTATE ====================

/**
 * @route   GET /api/admin/collaborations/:id/workspace/spectate
 * @desc    Admin spectate mode - view collaboration workspace (read-only)
 * @access  Admin only
 */
router.get('/collaborations/:id/workspace/spectate', requirePermission('approve_collaborations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { formatWorkspaceForResponse } = require('../utils/workspaceUtils');
    
    const collaboration = await Collaboration.findById(id);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check if workspace is active
    if (!collaboration.workspace.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Workspace is not active for this collaboration'
      });
    }
    
    // Format workspace data
    const workspaceData = formatWorkspaceForResponse(collaboration);
    
    // Add read-only flag for admin
    const spectateData = {
      ...workspaceData,
      isSpectateMode: true,
      canEdit: false,
      canComment: false,
      // Include field notes and history for admin viewing
      allFieldNotes: collaboration.workspace.fieldNotes || {},
      allFieldHistory: collaboration.workspace.fieldHistory || {}
    };
    
    res.json({
      success: true,
      collaboration: {
        _id: collaboration._id,
        type: collaboration.type,
        status: collaboration.status,
        initiator: collaboration.initiator,
        recipient: collaboration.recipient,
        formData: collaboration.formData,
        response: collaboration.response,
        createdAt: collaboration.createdAt,
        adminReview: collaboration.adminReview
      },
      workspace: spectateData,
      workspaceActivity: collaboration.workspaceActivity
    });
    
  } catch (error) {
    console.error('Error fetching workspace for spectate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace data'
    });
  }
});

// ==================== WHATSAPP MARKETING ====================

// City alias map — matches both old and new spellings in the DB
const CITY_ALIASES = {
  'Bengaluru': ['Bangalore', 'Bengaluru'],
  'Chennai': ['Madras', 'Chennai'],
  'Delhi': ['New Delhi', 'Delhi'],
  'Gurgaon': ['Gurugram', 'Gurgaon'],
  'Kochi': ['Cochin', 'Kochi'],
  'Kolkata': ['Calcutta', 'Kolkata'],
  'Mumbai': ['Bombay', 'Mumbai'],
  'Mysuru': ['Mysore', 'Mysuru'],
  'Thiruvananthapuram': ['Trivandrum', 'Thiruvananthapuram'],
  'Vadodara': ['Baroda', 'Vadodara'],
  'Varanasi': ['Banaras', 'Benares', 'Varanasi'],
  'Visakhapatnam': ['Vizag', 'Visakhapatnam'],
  'Mangalore': ['Mangaluru', 'Mangalore'],
  'Goa': ['Panaji', 'Goa'],
};

function buildCityRegex(city) {
  // Find all aliases for the given city
  const lower = city.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    if (canonical.toLowerCase() === lower || aliases.some(a => a.toLowerCase() === lower)) {
      return { $regex: `^(${aliases.join('|')})$`, $options: 'i' };
    }
  }
  return { $regex: city, $options: 'i' };
}

/**
 * GET /api/admin/marketing/audience
 * Estimate audience size based on filters
 * Query params: audienceType (all_b2c | organizer_specific | category_interests), organizerId, categories (comma-separated)
 */
router.get('/marketing/audience', adminAuthMiddleware, async (req, res) => {
  try {
    const { audienceType, organizerId, categories, ageMin, ageMax, gender, city } = req.query;
    const Ticket = require('../models/Ticket');

    let userQuery = { phoneNumber: { $exists: true, $nin: ['', null] } };
    let userIds = null;

    switch (audienceType) {
      case 'all_b2c':
        userQuery.role = 'user';
        break;

      case 'organizer_specific': {
        if (!organizerId) {
          return res.status(400).json({ success: false, error: 'organizerId is required' });
        }
        // Find all events by this organizer
        const orgEvents = await Event.find({ host: organizerId }).select('_id');
        const eventIds = orgEvents.map(e => e._id);
        // Find unique users who bought tickets for these events
        const tickets = await Ticket.find({
          event: { $in: eventIds },
          status: { $ne: 'cancelled' }
        }).select('user').lean();
        userIds = [...new Set(tickets.map(t => t.user.toString()))];
        userQuery._id = { $in: userIds };
        break;
      }

      case 'category_interests': {
        const categoryList = categories ? categories.split(',').map(c => c.trim()) : [];
        if (categoryList.length === 0) {
          return res.status(400).json({ success: false, error: 'At least one category is required' });
        }
        userQuery.role = 'user';
        userQuery.interests = { $in: categoryList };
        break;
      }

      default:
        return res.status(400).json({ success: false, error: 'Invalid audienceType' });
    }

    // Apply sub-filters: age, gender, city
    if (ageMin || ageMax) {
      userQuery.age = {};
      if (ageMin) userQuery.age.$gte = parseInt(ageMin, 10);
      if (ageMax) userQuery.age.$lte = parseInt(ageMax, 10);
    }
    if (gender) {
      userQuery.gender = gender;
    }
    if (city) {
      userQuery['location.city'] = buildCityRegex(city);
    }

    const totalUsers = await User.countDocuments(userQuery);
    const sampleUsers = await User.find(userQuery)
      .select('name email phoneNumber age gender location.city')
      .limit(5)
      .lean();

    res.json({
      success: true,
      totalUsers,
      sampleUsers: sampleUsers.map(u => ({
        name: u.name,
        email: u.email,
        phone: u.phoneNumber ? `${u.phoneNumber.slice(0, 3)}****${u.phoneNumber.slice(-3)}` : 'N/A',
        age: u.age || null,
        gender: u.gender || null,
        city: u.location?.city || null
      }))
    });
  } catch (error) {
    console.error('Error estimating marketing audience:', error);
    res.status(500).json({ success: false, error: 'Failed to estimate audience' });
  }
});

/**
 * GET /api/admin/marketing/audience/export
 * Export filtered B2C users as CSV with first ticket purchase info
 * Same query params as /marketing/audience
 */
router.get('/marketing/audience/export', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { audienceType, organizerId, categories, ageMin, ageMax, gender, city } = req.query;
    const Ticket = require('../models/Ticket');

    let userQuery = { phoneNumber: { $exists: true, $nin: ['', null] } };
    let userIds = null;

    switch (audienceType) {
      case 'all_b2c':
        userQuery.role = 'user';
        break;
      case 'organizer_specific': {
        if (!organizerId) {
          return res.status(400).json({ success: false, error: 'organizerId is required' });
        }
        const orgEvents = await Event.find({ host: organizerId }).select('_id');
        const eventIds = orgEvents.map(e => e._id);
        const tickets = await Ticket.find({ event: { $in: eventIds }, status: { $ne: 'cancelled' } }).select('user').lean();
        userIds = [...new Set(tickets.map(t => t.user.toString()))];
        userQuery._id = { $in: userIds };
        break;
      }
      case 'category_interests': {
        const categoryList = categories ? categories.split(',').map(c => c.trim()) : [];
        if (categoryList.length === 0) {
          return res.status(400).json({ success: false, error: 'At least one category is required' });
        }
        userQuery.role = 'user';
        userQuery.interests = { $in: categoryList };
        break;
      }
      default:
        return res.status(400).json({ success: false, error: 'Invalid audienceType' });
    }

    // Sub-filters
    if (ageMin || ageMax) {
      userQuery.age = {};
      if (ageMin) userQuery.age.$gte = parseInt(ageMin, 10);
      if (ageMax) userQuery.age.$lte = parseInt(ageMax, 10);
    }
    if (gender) userQuery.gender = gender;
    if (city) userQuery['location.city'] = buildCityRegex(city);

    const users = await User.find(userQuery)
      .select('name email phoneNumber age gender location.city')
      .lean();

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'No users found for the given filters' });
    }

    // Get first ticket per user (earliest purchaseDate, non-cancelled)
    const userIdList = users.map(u => u._id);
    const firstTickets = await Ticket.aggregate([
      { $match: { user: { $in: userIdList }, status: { $ne: 'cancelled' } } },
      { $sort: { purchaseDate: 1 } },
      { $group: {
        _id: '$user',
        firstTicketDate: { $first: '$purchaseDate' },
        firstEventId: { $first: '$event' },
      }},
    ]);

    // Collect event IDs and fetch event + host details
    const eventIds = [...new Set(firstTickets.map(t => t.firstEventId.toString()))];
    const events = await Event.find({ _id: { $in: eventIds } })
      .select('title host')
      .populate('host', 'communityProfile.communityName name')
      .lean();
    const eventMap = {};
    for (const ev of events) { eventMap[ev._id.toString()] = ev; }

    // Build lookup: userId -> first ticket info
    const ticketMap = {};
    for (const t of firstTickets) {
      const ev = eventMap[t.firstEventId.toString()];
      ticketMap[t._id.toString()] = {
        firstTicketDate: t.firstTicketDate,
        firstEventName: ev?.title || '',
        communityName: ev?.host?.communityProfile?.communityName || ev?.host?.name || '',
      };
    }

    // Build CSV
    const escapeCSV = (val) => {
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = 'User Name,Mobile Number,Email,Age,City,Gender,First Ticket Date,First Event Name,Community Name';
    const rows = users.map(u => {
      const info = ticketMap[u._id.toString()] || {};
      const ticketDate = info.firstTicketDate
        ? new Date(info.firstTicketDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
      return [
        escapeCSV(u.name),
        escapeCSV(u.phoneNumber),
        escapeCSV(u.email),
        escapeCSV(u.age || ''),
        escapeCSV(u.location?.city || ''),
        escapeCSV(u.gender || ''),
        escapeCSV(ticketDate),
        escapeCSV(info.firstEventName || ''),
        escapeCSV(info.communityName || ''),
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="b2c_users_export_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting marketing audience CSV:', error);
    res.status(500).json({ success: false, error: 'Failed to export audience' });
  }
});

/**
 * GET /api/admin/marketing/events
 * Get upcoming published events for the event selector
 */
router.get('/marketing/events', adminAuthMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    const query = {
      status: 'published',
      date: { $gte: new Date() }
    };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    const events = await Event.find(query)
      .select('title date startTime endTime location images slug host')
      .populate('host', 'name communityProfile.communityName')
      .sort({ date: 1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      events: events.map(e => ({
        _id: e._id,
        title: e.title,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        venue: [e.location?.address, e.location?.city].filter(Boolean).join(', '),
        image: e.images?.[0] || '',
        slug: e.slug || '',
        organizerName: e.host?.communityProfile?.communityName || e.host?.name || 'Unknown'
      }))
    });
  } catch (error) {
    console.error('Error fetching marketing events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

/**
 * POST /api/admin/marketing/send
 * Send WhatsApp marketing messages to the filtered audience for a specific event
 * Body: { audienceType, organizerId, categories[], eventId }
 */
router.post('/marketing/send', adminAuthMiddleware, async (req, res) => {
  try {
    const { audienceType, organizerId, categories, eventId, ageMin, ageMax, gender, city } = req.body;
    const Ticket = require('../models/Ticket');
    const { sendWhatsAppMarketing } = require('../services/msg91Service');

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId is required' });
    }

    // Fetch the event
    const event = await Event.findById(eventId).populate('host', 'name').lean();
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // Build user query
    let userQuery = { phoneNumber: { $exists: true, $nin: ['', null] } };

    switch (audienceType) {
      case 'all_b2c':
        userQuery.role = 'user';
        break;

      case 'organizer_specific': {
        if (!organizerId) {
          return res.status(400).json({ success: false, error: 'organizerId is required' });
        }
        const orgEvents = await Event.find({ host: organizerId }).select('_id');
        const eventIds = orgEvents.map(e => e._id);
        const tickets = await Ticket.find({
          event: { $in: eventIds },
          status: { $ne: 'cancelled' }
        }).select('user').lean();
        const userIds = [...new Set(tickets.map(t => t.user.toString()))];
        userQuery._id = { $in: userIds };
        break;
      }

      case 'category_interests': {
        const categoryList = Array.isArray(categories) ? categories : [];
        if (categoryList.length === 0) {
          return res.status(400).json({ success: false, error: 'At least one category is required' });
        }
        userQuery.role = 'user';
        userQuery.interests = { $in: categoryList };
        break;
      }

      default:
        return res.status(400).json({ success: false, error: 'Invalid audienceType' });
    }

    // Apply sub-filters: age, gender, city
    if (ageMin || ageMax) {
      userQuery.age = {};
      if (ageMin) userQuery.age.$gte = parseInt(ageMin, 10);
      if (ageMax) userQuery.age.$lte = parseInt(ageMax, 10);
    }
    if (gender) {
      userQuery.gender = gender;
    }
    if (city) {
      userQuery['location.city'] = buildCityRegex(city);
    }

    // Fetch all target users
    const users = await User.find(userQuery).select('name phoneNumber').lean();

    if (users.length === 0) {
      return res.json({ success: true, sent: 0, failed: 0, total: 0, message: 'No users matched the filter' });
    }

    // Prepare event details
    const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
    const eventTime = event.startTime && event.endTime
      ? `${event.startTime} - ${event.endTime}`
      : 'TBD';
    const venueName = [event.location?.address, event.location?.city].filter(Boolean).join(', ') || 'TBD';
    const eventImageUrl = event.images?.[0] || '';
    const eventSlug = event.slug || '';

    // Send messages in batches of 10 with 1s delay between batches
    let sent = 0;
    let failed = 0;
    const batchSize = 10;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(user => sendWhatsAppMarketing(user.phoneNumber, {
          userName: (user.name || 'there').split(' ')[0],
          eventName: event.title,
          eventDate,
          eventTime,
          venueName,
          eventImageUrl,
          eventSlug,
        }))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          sent++;
        } else {
          failed++;
        }
      }

      // Rate limit: wait 1s between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📱 [Marketing] Campaign complete: ${sent} sent, ${failed} failed out of ${users.length} users for event "${event.title}"`);

    res.json({
      success: true,
      sent,
      failed,
      total: users.length,
      eventTitle: event.title,
    });
  } catch (error) {
    console.error('Error sending marketing messages:', error);
    res.status(500).json({ success: false, error: 'Failed to send marketing messages' });
  }
});

module.exports = router;
