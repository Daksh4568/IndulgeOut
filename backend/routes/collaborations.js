const express = require('express');
const router = express.Router();
const Collaboration = require('../models/Collaboration');
const CollaborationCounter = require('../models/CollaborationCounter');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { scanFormData, generateFlags } = require('../services/complianceService');
const { authMiddleware } = require('../utils/authUtils');

// @route   POST /api/collaborations/propose
// @desc    Submit a new collaboration proposal
// @access  Private
router.post('/propose', authMiddleware, async (req, res) => {
  try {
    const {
      type,
      recipientId,
      recipientType,
      formData,
    } = req.body;

    // Validation
    if (!type || !recipientId || !recipientType || !formData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found',
      });
    }

    // Determine proposer type from user hostPartnerType
    const proposerType = req.user.hostPartnerType === 'community_organizer' ? 'community'
      : req.user.hostPartnerType === 'venue' ? 'venue'
      : req.user.hostPartnerType === 'brand_sponsor' ? 'brand'
      : null;

    if (!proposerType) {
      return res.status(403).json({
        success: false,
        error: 'Invalid user role for proposing collaborations',
      });
    }

    // Scan for compliance violations
    const complianceScan = scanFormData(formData);
    const complianceFlags = generateFlags(complianceScan);

    // Create collaboration
    const collaboration = new Collaboration({
      type,
      proposerId: req.user.userId,
      proposerType,
      recipientId,
      recipientType,
      formData,
      status: 'pending_admin_review',
      complianceFlags,
      isDraft: false,
    });

    console.log('Creating collaboration with data:', {
      type,
      proposerId: req.user.userId,
      proposerType,
      recipientId,
      recipientType,
      status: 'pending_admin_review',
      isDraft: false,
      formDataKeys: Object.keys(formData)
    });

    await collaboration.save();
    
    console.log('Collaboration saved successfully:', collaboration._id);

    res.status(201).json({
      success: true,
      message: 'Your request has been sent successfully',
      data: {
        id: collaboration._id,
        status: 'under_review',
        type: collaboration.type,
      },
    });
  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit proposal',
    });
  }
});

// @route   POST /api/collaborations/draft
// @desc    Save proposal as draft
// @access  Private
router.post('/draft', authMiddleware, async (req, res) => {
  try {
    const { type, recipientId, recipientType, formData } = req.body;

    const proposerType = req.user.hostPartnerType === 'community_organizer' ? 'community'
      : req.user.hostPartnerType === 'venue' ? 'venue'
      : req.user.hostPartnerType === 'brand_sponsor' ? 'brand'
      : null;

    const collaboration = new Collaboration({
      type,
      proposerId: req.user.userId,
      proposerType,
      recipientId,
      recipientType,
      formData,
      status: 'draft',
      isDraft: true,
    });

    await collaboration.save();

    res.status(201).json({
      success: true,
      message: 'Draft saved successfully',
      data: collaboration,
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft',
    });
  }
});

// @route   GET /api/collaborations
// @desc    Get all user's collaborations (sent + received)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const collaborations = await Collaboration.getUserCollaborations(req.user.userId);

    res.json({
      success: true,
      data: collaborations,
    });
  } catch (error) {
    console.error('Error fetching collaborations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collaborations',
    });
  }
});

// @route   GET /api/collaborations/sent
// @desc    Get proposals sent by user
// @access  Private
router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;

    const query = {
      proposerId: req.user.userId,
      isDraft: false,
    };

    if (status) {
      query.status = status;
    }

    console.log('Fetching sent collaborations with query:', query);
    console.log('User ID from token:', req.user.userId);

    const proposals = await Collaboration.find(query)
      .populate('recipientId', 'name email role profilePicture')
      .sort({ createdAt: -1 });

    console.log(`Found ${proposals.length} sent collaborations`);
    if (proposals.length > 0) {
      console.log('First collaboration:', {
        id: proposals[0]._id,
        proposerId: proposals[0].proposerId,
        type: proposals[0].type,
        status: proposals[0].status,
        isDraft: proposals[0].isDraft,
        hasCounter: proposals[0].hasCounter,
        latestCounterId: proposals[0].latestCounterId
      });
    }

    const mapped = proposals.map(p => ({
      ...p.toObject(),
      userFacingStatus: mapStatusToUserFacing(p.status, 'proposer'),
    }));

    res.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('Error fetching sent proposals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sent proposals',
    });
  }
});


// @route   GET /api/collaborations/received
// @desc    Get proposals received by user (only admin-approved ones)
// @access  Private
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const proposals = await Collaboration.find({
      recipientId: req.user.userId,
      status: { $in: ['approved_delivered', 'counter_pending_review', 'counter_delivered', 'confirmed', 'declined'] },
      isDraft: false,
    })
      .populate('proposerId', 'name email role profilePicture')
      .sort({ createdAt: -1 });

    const mapped = proposals.map(p => ({
      ...p.toObject(),
      userFacingStatus: mapStatusToUserFacing(p.status, 'recipient'),
    }));

    res.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('Error fetching received proposals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch received proposals',
    });
  }
});

// @route   GET /api/collaborations/:id
// @desc    Get single collaboration details
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id)
      .populate('proposerId', 'name email role profilePicture')
      .populate('recipientId', 'name email role profilePicture')
      .populate('latestCounterId');

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found',
      });
    }

    console.log('Fetched collaboration details:', {
      id: collaboration._id,
      type: collaboration.type,
      status: collaboration.status,
      hasCounter: collaboration.hasCounter,
      latestCounterId: collaboration.latestCounterId?._id || collaboration.latestCounterId,
      counterPopulated: !!collaboration.latestCounterId?.counterData
    });

    if (!collaboration.isUserInvolved(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access',
      });
    }

    const userRole = collaboration.getUserRole(req.user.userId);

    res.json({
      success: true,
      data: {
        ...collaboration.toObject(),
        userRole,
        userFacingStatus: mapStatusToUserFacing(collaboration.status, userRole),
      },
    });
  } catch (error) {
    console.error('Error fetching collaboration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collaboration',
    });
  }
});

// @route   POST /api/collaborations/:id/counter
// @desc    Submit counter-proposal
// @access  Private
router.post('/:id/counter', authMiddleware, async (req, res) => {
  try {
    const { counterData } = req.body;

    const collaboration = await Collaboration.findById(req.params.id);

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found',
      });
    }

    console.log('Counter submission for collaboration:', {
      collaborationId: collaboration._id,
      collaborationType: collaboration.type,
      currentStatus: collaboration.status,
      proposerId: collaboration.proposerId,
      recipientId: collaboration.recipientId,
      requestingUserId: req.user.userId
    });

    if (!collaboration.recipientId.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Only recipient can submit counter-proposal',
      });
    }

    if (collaboration.status !== 'approved_delivered') {
      return res.status(400).json({
        success: false,
        error: `Collaboration is not in correct status for counter submission. Current status: ${collaboration.status}`,
      });
    }

    const complianceScan = scanFormData(counterData);
    const complianceFlags = generateFlags(complianceScan);

    const counter = new CollaborationCounter({
      collaborationId: collaboration._id,
      responderId: req.user.userId,
      responderType: collaboration.recipientType,
      counterData,
      status: 'pending_admin_review',
    });

    await counter.save();

    console.log('Counter created successfully:', {
      counterId: counter._id,
      collaborationId: counter.collaborationId,
      responderId: counter.responderId,
      responderType: counter.responderType,
      status: counter.status
    });

    // Update collaboration to link to counter
    collaboration.status = 'counter_pending_review';
    collaboration.hasCounter = true;
    collaboration.latestCounterId = counter._id;
    if (complianceFlags.length > 0) {
      collaboration.complianceFlags = [...collaboration.complianceFlags, ...complianceFlags];
    }
    await collaboration.save();

    console.log('Collaboration updated with counter link:', {
      collaborationId: collaboration._id,
      hasCounter: collaboration.hasCounter,
      latestCounterId: collaboration.latestCounterId,
      newStatus: collaboration.status
    });

    res.status(201).json({
      success: true,
      message: 'Your response has been sent successfully',
      data: {
        id: counter._id,
        collaborationId: collaboration._id,
        status: 'processing',
      },
    });
  } catch (error) {
    console.error('Error submitting counter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit counter-proposal',
    });
  }
});

// @route   PUT /api/collaborations/:id/accept
// @desc    Accept final terms
// @access  Private
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id);

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found',
      });
    }

    if (!collaboration.isUserInvolved(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    collaboration.status = 'confirmed';
    await collaboration.save();

    const otherPartyId = collaboration.proposerId.equals(req.user.userId)
      ? collaboration.recipientId
      : collaboration.proposerId;

    await createNotification({
      recipientId: otherPartyId,
      type: 'collaboration_confirmed',
      category: 'status_update',
      title: 'Collaboration Confirmed!',
      message: 'The collaboration terms have been accepted.',
      relatedCollaboration: collaboration._id,
    });

    res.json({
      success: true,
      message: 'Collaboration confirmed!',
      data: collaboration,
    });
  } catch (error) {
    console.error('Error accepting collaboration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept collaboration',
    });
  }
});

// @route   PUT /api/collaborations/:id/decline
// @desc    Decline collaboration
// @access  Private
router.put('/:id/decline', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;

    const collaboration = await Collaboration.findById(req.params.id);

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found',
      });
    }

    if (!collaboration.isUserInvolved(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    collaboration.status = 'declined';
    if (reason) {
      collaboration.rejectionReason = reason;
    }
    await collaboration.save();

    const otherPartyId = collaboration.proposerId.equals(req.user.userId)
      ? collaboration.recipientId
      : collaboration.proposerId;

    await createNotification({
      recipientId: otherPartyId,
      type: 'collaboration_declined',
      category: 'status_update',
      title: 'Collaboration Declined',
      message: reason || 'The collaboration has been declined.',
      relatedCollaboration: collaboration._id,
    });

    res.json({
      success: true,
      message: 'Collaboration declined',
      data: collaboration,
    });
  } catch (error) {
    console.error('Error declining collaboration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decline collaboration',
    });
  }
});

// @route   DELETE /api/collaborations/:id
// @desc    Delete draft collaboration
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id);

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found',
      });
    }

    if (!collaboration.proposerId.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!collaboration.isDraft) {
      return res.status(400).json({
        success: false,
        error: 'Can only delete draft collaborations',
      });
    }

    await collaboration.deleteOne();

    res.json({
      success: true,
      message: 'Draft deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft',
    });
  }
});

// Helper function to map internal status to user-facing status
function mapStatusToUserFacing(status, userRole) {
  const statusMap = {
    proposer: {
      'draft': 'Draft',
      'pending_admin_review': 'Under Review',
      'approved_delivered': 'Sent to Recipient',
      'rejected': 'Needs Revision',
      'counter_pending_review': 'Processing Response',
      'counter_delivered': 'Response Received',
      'confirmed': 'Confirmed',
      'declined': 'Declined',
      'flagged': 'Under Review',
    },
    recipient: {
      'approved_delivered': 'New Proposal',
      'counter_pending_review': 'Processing Response',
      'counter_delivered': 'Response Sent',
      'confirmed': 'Confirmed',
      'declined': 'Declined',
    },
  };

  return statusMap[userRole]?.[status] || status;
}

module.exports = router;
