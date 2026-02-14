const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Community = require('../models/Community');
const Collaboration = require('../models/Collaboration');
const { Payout } = require('../models/Payout');
const { adminAuthMiddleware, requirePermission } = require('../utils/adminAuthMiddleware');

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
      // Count both old and new status for backward compatibility
      // Old: 'pending_admin_review', New: 'pending', 'submitted'
      Collaboration.countDocuments({ status: { $in: ['pending', 'submitted', 'pending_admin_review'] } }),
      Payout.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$breakdown.platformFee' } } }
      ])
    ]);

    console.log('[DASHBOARD] Pending collaborations count:', pendingCollaborations);

    // Get collaboration overview statistics
    const [totalProposals, confirmedCollabs, rejectedCollabs, completedCollabs] = await Promise.all([
      Collaboration.countDocuments(),
      Collaboration.countDocuments({ status: { $in: ['confirmed', 'accepted', 'admin_approved', 'approved_delivered'] } }),
      Collaboration.countDocuments({ status: { $in: ['rejected', 'admin_rejected', 'vendor_rejected', 'declined'] } }),
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
  try {
    // Support old ('pending_admin_review') and new ('pending', 'submitted') status
    const collaborations = await Collaboration.find({ 
      status: { $in: ['pending', 'submitted', 'pending_admin_review'] }
    })
      .populate('proposerId', 'name email hostPartnerType')  // Old structure
      .populate('recipientId', 'name email hostPartnerType')  // Old structure
      .populate('initiator.user', 'name email')  // New structure
      .populate('recipient.user', 'name email')  // New structure
      .sort({ createdAt: -1 })
      .lean();

    console.log('[PENDING PROPOSALS] Found', collaborations.length, 'collaborations');
    if (collaborations.length > 0) {
      console.log('[PENDING PROPOSALS] Statuses:', collaborations.map(c => c.status));
    }

    // Transform old structure to new structure for frontend compatibility
    const transformedCollaborations = collaborations.map(collab => {
      // If using old structure, map it to new structure
      if (collab.proposerId && !collab.initiator?.user) {
        return {
          ...collab,
          initiator: {
            user: collab.proposerId,
            name: collab.proposerId?.name,
            userType: collab.proposerType === 'community' ? 'community_organizer' : collab.proposerType
          },
          recipient: {
            user: collab.recipientId,
            name: collab.recipientId?.name,
            userType: collab.recipientType === 'community' ? 'community_organizer' : collab.recipientType
          }
        };
      }
      return collab;
    });

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
        .populate('proposerId', 'name email hostPartnerType')  // Old structure
        .populate('recipientId', 'name email hostPartnerType')  // Old structure
        .populate('initiator.user', 'name email')  // New structure
        .populate('recipient.user', 'name email')  // New structure
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Collaboration.countDocuments(query)
    ]);

    console.log('[ALL COLLABORATIONS] Found', collaborations.length, 'of', total, 'total');

    // Transform old structure to new structure for frontend compatibility
    const transformedCollaborations = collaborations.map(collab => {
      // If using old structure, map it to new structure
      if (collab.proposerId && !collab.initiator?.user) {
        return {
          ...collab,
          initiator: {
            user: collab.proposerId,
            name: collab.proposerId?.name,
            userType: collab.proposerType === 'community' ? 'community_organizer' : collab.proposerType
          },
          recipient: {
            user: collab.recipientId,
            name: collab.recipientId?.name,
            userType: collab.recipientType === 'community' ? 'community_organizer' : collab.recipientType
          }
        };
      }
      return collab;
    });

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

    // Send notification to vendor
    const notificationService = require('../services/notificationService');
    await notificationService.createNotification({
      userId: collaboration.recipient?.user || collaboration.recipientId,
      type: 'collaboration_approved',
      title: 'New Collaboration Request Approved',
      message: `Your collaboration request from ${collaboration.initiator?.name || 'a community'} has been approved by admin. Please review and respond.`,
      actionUrl: `/venue/collaborations/${collaboration._id}`,
      metadata: {
        collaborationId: collaboration._id,
        initiatorId: collaboration.initiator?.user || collaboration.proposerId
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
      userId: collaboration.initiator?.user || collaboration.proposerId,
      type: 'collaboration_rejected',
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

    // Send notification to initiator about approved counter
    const notificationService = require('../services/notificationService');
    await notificationService.createNotification({
      userId: collaboration.initiator?.user || collaboration.proposerId,
      type: 'counter_approved',
      title: 'Counter Proposal Approved',
      message: `The counter proposal from ${collaboration.recipient?.name || 'vendor'} has been approved. Please review and accept/reject.`,
      actionUrl: `/community/collaborations/${collaboration._id}/counter`,
      metadata: {
        collaborationId: collaboration._id,
        recipientId: collaboration.recipient?.user || collaboration.recipientId
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
      userId: collaboration.recipient?.user || collaboration.recipientId,
      type: 'counter_rejected',
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
      status: { $in: ['accepted', 'vendor_accepted', 'counter_pending_review'] },
      $or: [
        { 'response.counterOffer': { $exists: true, $ne: null } },
        { 'hasCounter': true }  // Old structure flag
      ]
    })
      .populate('initiator.user', 'name email communityProfile venueProfile brandProfile')
      .populate('recipient.user', 'name email communityProfile venueProfile brandProfile')
      .populate('proposerId', 'name email communityProfile venueProfile brandProfile')  // Old structure
      .populate('recipientId', 'name email communityProfile venueProfile brandProfile')  // Old structure
      .sort({ 'response.respondedAt': -1 })
      .lean();

    // Add responderId for each counter (recipient is the one who submitted counter)
    const enhancedCounters = counters.map(counter => ({
      ...counter,
      responderId: counter.recipient?.user || counter.recipientId,
      responderType: counter.recipient?.userType || counter.recipientType
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
      .populate('proposerId', 'name email hostPartnerType communityProfile venueProfile brandProfile')
      .populate('recipientId', 'name email hostPartnerType communityProfile venueProfile brandProfile')
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
    collaboration.responderId = collaboration.recipient?.user || collaboration.recipientId;
    collaboration.responderType = collaboration.recipient?.userType || collaboration.recipientType;

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
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: collaborations });
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
      // Count old ('pending_admin_review') and new ('pending', 'submitted')
      Collaboration.countDocuments({ status: { $in: ['pending', 'submitted', 'pending_admin_review'] } }),
      // Count old ('accepted', 'approved_delivered', 'confirmed') and new ('admin_approved')
      Collaboration.countDocuments({ status: { $in: ['accepted', 'admin_approved', 'approved_delivered', 'confirmed'] } }),
      // Count old ('rejected', 'declined') and new ('admin_rejected', 'vendor_rejected')
      Collaboration.countDocuments({ status: { $in: ['rejected', 'admin_rejected', 'vendor_rejected', 'declined'] } }),
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
      status: { $in: ['admin_approved', 'admin_rejected', 'accepted', 'rejected', 'approved_delivered', 'confirmed', 'declined'] },
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
      .populate('proposerId', 'name email phoneNumber profilePicture hostPartnerType communityProfile venueProfile brandProfile')
      .populate('recipientId', 'name email phoneNumber profilePicture hostPartnerType communityProfile venueProfile brandProfile')
      .populate('adminReview.reviewedBy', 'name email')
      .lean();

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration not found' });
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
          } else if (key === 'brandDeliverables') {
            // Handle brand deliverables object
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subKey !== '__typename') {  // Skip GraphQL typename
                flattenedData[`Brand ${subKey}`] = Array.isArray(subValue) ? subValue.join(', ') : subValue;
              }
            });
          } else {
            // For other nested objects, stringify them nicely
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subValue !== null && subValue !== undefined && subKey !== '__typename') {
                flattenedData[`${key} - ${subKey}`] = subValue;
              }
            });
          }
        } else if (Array.isArray(value)) {
          flattenedData[key] = value.join(', ');
        } else if (value !== null && value !== undefined) {
          flattenedData[key] = value;
        }
      });
      
      collaboration.formData = flattenedData;
    }

    // Ensure we have proper user data from either old or new structure
    if (collaboration.proposerId && !collaboration.initiator) {
      collaboration.initiator = {
        user: collaboration.proposerId,
        userType: collaboration.proposerType
      };
    }
    
    if (collaboration.recipientId && !collaboration.recipient) {
      collaboration.recipient = {
        user: collaboration.recipientId,
        userType: collaboration.recipientType
      };
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
      collaboration.counterData.responderId = collaboration.recipient?.user || collaboration.recipientId;
      collaboration.counterData.responderType = collaboration.recipient?.userType || collaboration.recipientType;
    }

    // Build timeline
    const timeline = [
      {
        event: 'Proposal Submitted',
        actor: collaboration.initiator?.user?.name || collaboration.proposerId?.name || 'Unknown',
        actorType: collaboration.initiator?.userType || collaboration.proposerType,
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
        actor: collaboration.recipient?.user?.name || collaboration.recipientId?.name || 'Vendor',
        actorType: collaboration.recipient?.userType || collaboration.recipientType,
        timestamp: collaboration.acceptedAt,
        status: 'vendor_accepted',
        description: 'Vendor responded with counter-proposal'
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

module.exports = router;
