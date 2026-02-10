const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Community = require('../models/Community');
const Collaboration = require('../models/Collaboration');
const CollaborationCounter = require('../models/CollaborationCounter');
const { Payout } = require('../models/Payout');
const { createNotification } = require('../services/notificationService');
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
      Collaboration.countDocuments({ status: 'pending_admin_review' }),
      Payout.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$breakdown.platformFee' } } }
      ])
    ]);

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
    const collaborations = await Collaboration.find({ 
      status: 'pending_admin_review'
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(collaborations);
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

    const skip = (page - 1) * limit;

    const [collaborations, total] = await Promise.all([
      Collaboration.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Collaboration.countDocuments(query)
    ]);

    res.json({
      collaborations,
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

// @route   POST /api/admin/collaborations/:id/approve
// @desc    Approve a collaboration request and forward to vendor
// @access  Admin only
router.post('/collaborations/:id/approve', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.userId;

    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration not found' });
    }

    if (collaboration.status !== 'pending_admin_review') {
      return res.status(400).json({ 
        message: 'Only pending collaborations can be approved',
        currentStatus: collaboration.status
      });
    }

    // Update collaboration with admin approval
    collaboration.status = 'approved_delivered';
    collaboration.adminReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      decision: 'approved',
      notes: adminNotes || ''
    };

    await collaboration.save();

    // TODO: Send notification to vendor

    res.json({
      message: 'Collaboration approved and forwarded to vendor',
      collaboration
    });
  } catch (error) {
    console.error('Error approving collaboration:', error);
    res.status(500).json({ message: 'Server error while approving collaboration' });
  }
});

// @route   POST /api/admin/collaborations/:id/reject
// @desc    Reject a collaboration request
// @access  Admin only
router.post('/collaborations/:id/reject', requirePermission('manage_collaborations'), async (req, res) => {
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

    if (collaboration.status !== 'pending_admin_review') {
      return res.status(400).json({ 
        message: 'Only pending collaborations can be rejected',
        currentStatus: collaboration.status
      });
    }

    // Update collaboration with admin rejection
    collaboration.status = 'rejected';
    collaboration.adminReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      decision: 'rejected',
      notes: reason
    };

    await collaboration.save();

    // TODO: Send notification to community (initiator)

    res.json({
      message: 'Collaboration rejected',
      collaboration
    });
  } catch (error) {
    console.error('Error rejecting collaboration:', error);
    res.status(500).json({ message: 'Server error while rejecting collaboration' });
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

// ==================== COLLABORATION MANAGEMENT ====================

// @route   GET /api/admin/collaborations/pending
// @desc    Get pending collaboration proposals for review
// @access  Admin only
router.get('/collaborations/pending', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const pending = await Collaboration.getPendingReviews();

    res.json({
      success: true,
      data: pending,
      count: pending.length,
    });
  } catch (error) {
    console.error('Error fetching pending collaborations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending collaborations' });
  }
});

// @route   GET /api/admin/collaborations/flagged
// @desc    Get flagged collaborations
// @access  Admin only
router.get('/collaborations/flagged', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const flagged = await Collaboration.find({ 
      complianceFlags: { $exists: true, $ne: [] } 
    })
      .populate('proposerId', 'name email role profilePicture')
      .populate('recipientId', 'name email role profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: flagged,
      count: flagged.length,
    });
  } catch (error) {
    console.error('Error fetching flagged collaborations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch flagged collaborations' });
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

    const collaborations = await Collaboration.find(query)
      .populate('proposerId', 'name email role profilePicture')
      .populate('recipientId', 'name email role profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Collaboration.countDocuments(query);

    res.json({
      success: true,
      data: collaborations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching collaborations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch collaborations' });
  }
});

// @route   GET /api/admin/collaborations/analytics
// @desc    Get collaboration analytics
// @access  Admin only
router.get('/collaborations/analytics', requirePermission('view_analytics'), async (req, res) => {
  try {
    const totalProposals = await Collaboration.countDocuments({ isDraft: false });
    const pendingReview = await Collaboration.countDocuments({ status: 'pending_admin_review' });
    const approved = await Collaboration.countDocuments({ status: 'approved_delivered' });
    const rejected = await Collaboration.countDocuments({ status: 'rejected' });
    const confirmed = await Collaboration.countDocuments({ status: 'confirmed' });
    const flagged = await Collaboration.countDocuments({ complianceFlags: { $exists: true, $ne: [] } });

    // By type
    const byType = await Collaboration.aggregate([
      { $match: { isDraft: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    // Average review time
    const avgReviewTime = await Collaboration.aggregate([
      { $match: { status: { $in: ['approved_delivered', 'rejected'] }, adminReviewedAt: { $exists: true } } },
      { 
        $project: { 
          reviewTime: { $subtract: ['$adminReviewedAt', '$createdAt'] } 
        } 
      },
      { $group: { _id: null, avgTime: { $avg: '$reviewTime' } } },
    ]);

    // Recent activity (last 10)
    const recentActivity = await Collaboration.find({ 
      status: { $in: ['approved_delivered', 'rejected', 'confirmed'] } 
    })
      .populate('proposerId', 'name')
      .populate('recipientId', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('type status createdAt updatedAt proposerId recipientId');

    const approvalRate = totalProposals > 0 
      ? ((approved + confirmed) / totalProposals * 100).toFixed(1)
      : 0;

    const avgReviewHours = avgReviewTime[0]?.avgTime 
      ? (avgReviewTime[0].avgTime / (1000 * 60 * 60)).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalProposals,
        pendingReview,
        approvalRate: parseFloat(approvalRate),
        avgReviewTime: `${avgReviewHours} hours`,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        flagged,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Error fetching collaboration analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// @route   GET /api/admin/collaborations/:id
// @desc    Get single collaboration details for review
// @access  Admin only
router.get('/collaborations/:id', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id)
      .populate('proposerId', 'name email role profilePicture phone')
      .populate('recipientId', 'name email role profilePicture phone')
      .populate('adminReviewedBy', 'name email')
      .populate('latestCounterId');

    if (!collaboration) {
      return res.status(404).json({ success: false, error: 'Collaboration not found' });
    }

    res.json({
      success: true,
      data: collaboration,
    });
  } catch (error) {
    console.error('Error fetching collaboration:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch collaboration' });
  }
});

// @route   PUT /api/admin/collaborations/:id/approve
// @desc    Approve collaboration and deliver to recipient
// @access  Admin only
router.put('/collaborations/:id/approve', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const collaboration = await Collaboration.findById(req.params.id);

    if (!collaboration) {
      return res.status(404).json({ success: false, error: 'Collaboration not found' });
    }

    if (collaboration.status !== 'pending_admin_review') {
      return res.status(400).json({ success: false, error: 'Collaboration is not pending review' });
    }

    // Update status
    collaboration.status = 'approved_delivered';
    collaboration.adminReviewedBy = req.user.userId;
    collaboration.adminReviewedAt = new Date();
    if (adminNotes) {
      collaboration.adminNotes = adminNotes;
    }

    await collaboration.save();

    // Notify recipient
    await createNotification({
      recipientId: collaboration.recipientId,
      type: 'collaboration_proposal_received',
      category: 'action_required',
      title: 'New Collaboration Proposal',
      message: 'You have received a new collaboration proposal.',
      relatedCollaboration: collaboration._id,
    });

    res.json({
      success: true,
      message: 'Collaboration approved and delivered',
      data: collaboration,
    });
  } catch (error) {
    console.error('Error approving collaboration:', error);
    res.status(500).json({ success: false, error: 'Failed to approve collaboration' });
  }
});

// @route   PUT /api/admin/collaborations/:id/reject
// @desc    Reject collaboration with reason
// @access  Admin only
router.put('/collaborations/:id/reject', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }

    const collaboration = await Collaboration.findById(req.params.id);

    if (!collaboration) {
      return res.status(404).json({ success: false, error: 'Collaboration not found' });
    }

    collaboration.status = 'rejected';
    collaboration.rejectionReason = rejectionReason;
    collaboration.adminReviewedBy = req.user.userId;
    collaboration.adminReviewedAt = new Date();
    if (adminNotes) {
      collaboration.adminNotes = adminNotes;
    }

    await collaboration.save();

    // Notify proposer
    await createNotification({
      recipientId: collaboration.proposerId,
      type: 'collaboration_rejected',
      category: 'action_required',
      title: 'Proposal Needs Revision',
      message: 'Your submission couldn\'t be processed. Please review our guidelines and try again.',
      relatedCollaboration: collaboration._id,
    });

    res.json({
      success: true,
      message: 'Collaboration rejected',
      data: collaboration,
    });
  } catch (error) {
    console.error('Error rejecting collaboration:', error);
    res.status(500).json({ success: false, error: 'Failed to reject collaboration' });
  }
});

// @route   PUT /api/admin/collaborations/:id/flag
// @desc    Flag collaboration for further review
// @access  Admin only
router.put('/collaborations/:id/flag', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { flagReason, adminNotes } = req.body;

    const collaboration = await Collaboration.findById(req.params.id);

    if (!collaboration) {
      return res.status(404).json({ success: false, error: 'Collaboration not found' });
    }

    collaboration.status = 'flagged';
    if (!collaboration.complianceFlags) {
      collaboration.complianceFlags = [];
    }
    if (flagReason && !collaboration.complianceFlags.includes(flagReason)) {
      collaboration.complianceFlags.push(flagReason);
    }
    collaboration.adminReviewedBy = req.user.userId;
    collaboration.adminReviewedAt = new Date();
    if (adminNotes) {
      collaboration.adminNotes = adminNotes;
    }

    await collaboration.save();

    res.json({
      success: true,
      message: 'Collaboration flagged for review',
      data: collaboration,
    });
  } catch (error) {
    console.error('Error flagging collaboration:', error);
    res.status(500).json({ success: false, error: 'Failed to flag collaboration' });
  }
});

// @route   GET /api/admin/collaborations/counters/pending
// @desc    Get pending counter-proposals for review
// @access  Admin only
router.get('/collaborations/counters/pending', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const pending = await CollaborationCounter.getPendingReviews();

    res.json({
      success: true,
      data: pending,
      count: pending.length,
    });
  } catch (error) {
    console.error('Error fetching pending counters:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending counters' });
  }
});

// @route   GET /api/admin/collaborations/counters/:id
// @desc    Get counter-proposal details
// @access  Admin only
router.get('/collaborations/counters/:id', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const counter = await CollaborationCounter.findById(req.params.id)
      .populate('responderId', 'name email role profilePicture')
      .populate({
        path: 'collaborationId',
        populate: {
          path: 'proposerId recipientId',
          select: 'name email role profilePicture',
        },
      })
      .populate('adminReviewedBy', 'name email');

    if (!counter) {
      return res.status(404).json({ success: false, error: 'Counter not found' });
    }

    res.json({
      success: true,
      data: counter,
    });
  } catch (error) {
    console.error('Error fetching counter:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch counter' });
  }
});

// @route   PUT /api/admin/collaborations/counters/:id/approve
// @desc    Approve counter-proposal and deliver to proposer
// @access  Admin only
router.put('/collaborations/counters/:id/approve', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const counter = await CollaborationCounter.findById(req.params.id);

    if (!counter) {
      return res.status(404).json({ success: false, error: 'Counter not found' });
    }

    if (counter.status !== 'pending_admin_review') {
      return res.status(400).json({ success: false, error: 'Counter is not pending review' });
    }

    // Update counter
    counter.status = 'approved';
    counter.adminReviewedBy = req.user.userId;
    counter.adminReviewedAt = new Date();
    if (adminNotes) {
      counter.adminNotes = adminNotes;
    }
    await counter.save();

    // Update collaboration
    const collaboration = await Collaboration.findById(counter.collaborationId);
    if (collaboration) {
      collaboration.status = 'counter_delivered';
      await collaboration.save();

      // Notify original proposer
      await createNotification({
        recipientId: collaboration.proposerId,
        type: 'collaboration_counter_received',
        category: 'action_required',
        title: 'Response Received',
        message: 'The recipient has responded to your proposal.',
        relatedCollaboration: collaboration._id,
      });
    }

    res.json({
      success: true,
      message: 'Counter approved and delivered',
      data: counter,
    });
  } catch (error) {
    console.error('Error approving counter:', error);
    res.status(500).json({ success: false, error: 'Failed to approve counter' });
  }
});

// @route   PUT /api/admin/collaborations/counters/:id/reject
// @desc    Reject counter-proposal
// @access  Admin only
router.put('/collaborations/counters/:id/reject', requirePermission('manage_collaborations'), async (req, res) => {
  try {
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }

    const counter = await CollaborationCounter.findById(req.params.id);

    if (!counter) {
      return res.status(404).json({ success: false, error: 'Counter not found' });
    }

    counter.status = 'rejected';
    counter.rejectionReason = rejectionReason;
    counter.adminReviewedBy = req.user.userId;
    counter.adminReviewedAt = new Date();
    if (adminNotes) {
      counter.adminNotes = adminNotes;
    }
    await counter.save();

    // Update collaboration status back
    await Collaboration.findByIdAndUpdate(counter.collaborationId, {
      status: 'approved_delivered', // Back to awaiting response
      hasCounter: false,
    });

    // Notify responder
    await createNotification({
      recipientId: counter.responderId,
      type: 'collaboration_rejected',
      category: 'action_required',
      title: 'Response Needs Revision',
      message: 'Your response couldn\'t be processed. Please review and try again.',
      relatedCollaboration: counter.collaborationId,
    });

    res.json({
      success: true,
      message: 'Counter rejected',
      data: counter,
    });
  } catch (error) {
    console.error('Error rejecting counter:', error);
    res.status(500).json({ success: false, error: 'Failed to reject counter' });
  }
});

module.exports = router;
