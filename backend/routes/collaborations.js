const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Collaboration = require('../models/Collaboration');
const User = require('../models/User');
const { authMiddleware } = require('../utils/authUtils');

// Helper function to normalize old collaborations to new structure
async function normalizeCollaboration(collab) {
  // If it already has the new structure, return as-is
  if (collab.initiator?.user && collab.recipient?.user) {
    return collab;
  }

  // Transform old structure to new
  if (collab.proposerId && collab.recipientId) {
    try {
      const [proposer, recipient] = await Promise.all([
        User.findById(collab.proposerId).lean(),
        User.findById(collab.recipientId).lean()
      ]);

      if (proposer && recipient) {
        // Add new structure fields
        collab.initiator = {
          user: proposer._id,
          userType: proposer.hostPartnerType || 'community_organizer',
          name: proposer.communityProfile?.communityName || proposer.name || 'Unknown',
          profileImage: proposer.communityProfile?.logo || proposer.profilePicture
        };
        collab.recipient = {
          user: recipient._id,
          userType: recipient.hostPartnerType || 'venue',
          name: recipient.venueProfile?.venueName || recipient.brandProfile?.brandName || recipient.name || 'Unknown',
          profileImage: recipient.venueProfile?.photos?.[0] || recipient.brandProfile?.logo || recipient.profilePicture
        };
      }
    } catch (error) {
      console.error('Error normalizing collaboration:', error);
    }
  }

  return collab;
}

// @route   GET /api/collaborations/received
// @desc    Get all collaboration requests received by the user
// @access  Private
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('[RECEIVED] Querying collaborations for recipient userId:', userId);
    
    // Recipients should only see admin-approved proposals (following hidden admin review workflow)
    // Statuses recipients can see: admin_approved, vendor_accepted, vendor_rejected, counter_delivered, confirmed, completed
    // Statuses recipients CANNOT see: submitted (awaiting admin), admin_rejected
    const allowedStatuses = [
      'admin_approved',      // New: Admin approved, forwarded to recipient
      'vendor_accepted',     // New: Recipient accepted
      'vendor_rejected',     // New: Recipient rejected
      'counter_delivered',   // New: Counter delivered after admin approval
      'confirmed',           // Final agreement
      'completed',           // Completed collaboration
      // Legacy statuses for backward compatibility
      'approved_delivered',  // Legacy: Approved and delivered
      'accepted',            // Legacy: Accepted
      'pending',             // Legacy: Pending (old data might have this)
      'counter_pending_review' // Legacy: Counter pending
    ];
    
    // Query both old (recipientId) and new (recipient.user) field structures
    const collaborations = await Collaboration.find({
      $or: [
        { 'recipient.user': userId },  // New structure
        { 'recipientId': userId }       // Old structure
      ],
      status: { $in: allowedStatuses }  // Only show admin-approved onwards
    })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('[RECEIVED] Found', collaborations.length, 'admin-approved collaborations');
    
    // Normalize old collaborations to new structure
    const normalizedCollaborations = await Promise.all(
      collaborations.map(collab => normalizeCollaboration(collab))
    );
    
    if (normalizedCollaborations.length > 0) {
      console.log('[RECEIVED] First collaboration:', {
        id: normalizedCollaborations[0]._id,
        type: normalizedCollaborations[0].type,
        status: normalizedCollaborations[0].status,
        initiatorName: normalizedCollaborations[0].initiator?.name,
        recipientName: normalizedCollaborations[0].recipient?.name
      });
    }

    res.json({ data: normalizedCollaborations });
  } catch (error) {
    console.error('Error fetching received collaborations:', error);
    res.status(500).json({ message: 'Server error while fetching collaborations' });
  }
});

// @route   GET /api/collaborations/sent
// @desc    Get all collaboration requests sent by the user
// @access  Private
router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('[SENT] Querying collaborations for initiator userId:', userId);
    
    // Query both old (proposerId) and new (initiator.user) field structures
    const collaborations = await Collaboration.find({
      $or: [
        { 'initiator.user': userId },  // New structure
        { 'proposerId': userId }        // Old structure
      ]
    })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('[SENT] Found', collaborations.length, 'collaborations');
    
    // Normalize old collaborations to new structure
    const normalizedCollaborations = await Promise.all(
      collaborations.map(collab => normalizeCollaboration(collab))
    );
    
    if (normalizedCollaborations.length > 0) {
      console.log('[SENT] First collaboration:', {
        id: normalizedCollaborations[0]._id,
        type: normalizedCollaborations[0].type,
        status: normalizedCollaborations[0].status,
        initiatorName: normalizedCollaborations[0].initiator?.name,
        recipientName: normalizedCollaborations[0].recipient?.name
      });
    }
    
    // Also check total count in DB for debugging
    const totalCount = await Collaboration.countDocuments();
    console.log('[SENT] Total collaborations in DB:', totalCount);

    res.json({ data: normalizedCollaborations });
  } catch (error) {
    console.error('Error fetching sent collaborations:', error);
    res.status(500).json({ message: 'Server error while fetching collaborations' });
  }
});

// @route   POST /api/collaborations/:id/accept
// @desc    Accept a collaboration request
// @access  Private
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const collaborationId = req.params.id;
    const userId = req.user.userId;
    const { responseMessage } = req.body;

    const collaboration = await Collaboration.findById(collaborationId);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration request not found' });
    }

    // Verify user is the recipient
    if (collaboration.recipient.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to respond to this request' });
    }

    // Check if already responded (support both old 'accepted' and new 'admin_approved')
    if (!['admin_approved', 'accepted'].includes(collaboration.status)) {
      return res.status(400).json({ 
        message: 'This request has already been responded to or is not yet approved',
        currentStatus: collaboration.status
      });
    }

    // Accept the collaboration
    await collaboration.accept(responseMessage);

    // TODO: Send notification email to initiator

    res.json({
      message: 'Collaboration request accepted successfully',
      collaboration
    });
  } catch (error) {
    console.error('Error accepting collaboration:', error);
    res.status(500).json({ message: 'Server error while accepting collaboration' });
  }
});

// @route   POST /api/collaborations/:id/counter
// @desc    Submit a counter-proposal with field-by-field responses
// @access  Private
router.post('/:id/counter', authMiddleware, async (req, res) => {
  try {
    const collaborationId = req.params.id;
    const userId = req.user.userId;
    const { counterData } = req.body;

    console.log('[COUNTER] Received counter data:', { collaborationId, userId, counterData });

    const collaboration = await Collaboration.findById(collaborationId);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration request not found' });
    }

    // Verify user is the recipient
    const recipientUserId = collaboration.recipient?.user || collaboration.recipientId;
    if (recipientUserId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to respond to this request' });
    }

    // Check if can respond (support both old 'accepted' and new 'admin_approved')
    if (!['admin_approved', 'accepted', 'approved_delivered'].includes(collaboration.status)) {
      return res.status(400).json({ 
        message: 'This request has already been responded to or is not yet approved',
        currentStatus: collaboration.status
      });
    }

    // Store counter data - Status changes to vendor_accepted (needs admin approval before delivery)
    collaboration.status = 'vendor_accepted';
    collaboration.acceptedAt = new Date();
    collaboration.response = {
      message: counterData.generalNotes || 'Counter-proposal submitted',
      respondedAt: new Date(),
      counterOffer: {
        terms: JSON.stringify(counterData),  // Store full counter data as JSON
        fieldResponses: counterData.fieldResponses || {},
        houseRules: counterData.houseRules || {},
        commercialCounter: counterData.commercialCounter || {},
        budgetAdjustment: counterData.commercialCounter?.value || 0
      }
    };

    await collaboration.save();

    console.log('[COUNTER] Counter saved, notifying admin for review');

    // Notify admin to review counter-proposal (NOT initiator yet)
    const notificationService = require('../services/notificationService');
    const User = require('../models/User');
    const adminUsers = await User.find({ role: 'admin' });
    
    for (const admin of adminUsers) {
      await notificationService.createNotification({
        userId: admin._id,
        type: 'admin_counter_review_required',
        title: 'Counter-Proposal Needs Review',
        message: `A vendor has submitted a counter-proposal for collaboration ${collaboration._id}`,
        actionUrl: `/admin/collaborations/${collaboration._id}`,
        metadata: {
          collaborationId: collaboration._id,
          responderId: userId
        }
      });
    }

    res.json({
      success: true,
      message: 'Counter-proposal submitted successfully. Admin will review before delivery.',
      data: collaboration
    });
  } catch (error) {
    console.error('[COUNTER] Error submitting counter-proposal:', error);
    res.status(500).json({ message: 'Server error while submitting counter-proposal' });
  }
});

// @route   POST /api/collaborations/:id/reject
// @desc    Reject a collaboration request
// @access  Private
router.post('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const collaborationId = req.params.id;
    const userId = req.user.userId;
    const { responseMessage } = req.body;

    const collaboration = await Collaboration.findById(collaborationId);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration request not found' });
    }

    // Verify user is the recipient
    if (collaboration.recipient.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to respond to this request' });
    }

    // Check if already responded (support both old 'accepted' and new 'admin_approved')
    if (!['admin_approved', 'accepted'].includes(collaboration.status)) {
      return res.status(400).json({ 
        message: 'This request has already been responded to or is not yet approved',
        currentStatus: collaboration.status
      });
    }

    // Reject the collaboration
    await collaboration.reject(responseMessage);

    // TODO: Send notification email to initiator

    res.json({
      message: 'Collaboration request rejected',
      collaboration
    });
  } catch (error) {
    console.error('Error rejecting collaboration:', error);
    res.status(500).json({ message: 'Server error while rejecting collaboration' });
  }
});

// @route   POST /api/collaborations/:id/cancel
// @desc    Cancel a collaboration request (by initiator)
// @access  Private
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const collaborationId = req.params.id;
    const userId = req.user.userId;

    const collaboration = await Collaboration.findById(collaborationId);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration request not found' });
    }

    // Verify user is the initiator
    if (collaboration.initiator.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to cancel this request' });
    }

    // Check if can be cancelled (support old and new statuses)
    if (!['submitted', 'admin_approved', 'pending', 'accepted'].includes(collaboration.status)) {
      return res.status(400).json({ 
        message: 'Only pending or approved requests can be cancelled',
        currentStatus: collaboration.status
      });
    }

    // Cancel the collaboration
    await collaboration.cancel();

    res.json({
      message: 'Collaboration request cancelled successfully',
      collaboration
    });
  } catch (error) {
    console.error('Error cancelling collaboration:', error);
    res.status(500).json({ message: 'Server error while cancelling collaboration' });
  }
});

// @route   POST /api/collaborations/:id/counter/accept
// @desc    Accept counter-proposal final terms (by initiator/community)
// @access  Private
router.post('/:id/counter/accept', authMiddleware, async (req, res) => {
  try {
    const collaborationId = req.params.id;
    const userId = req.user.userId;
    const { acceptanceMessage } = req.body;

    const collaboration = await Collaboration.findById(collaborationId);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration request not found' });
    }

    // Verify user is the initiator
    if (collaboration.initiator.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to accept this counter' });
    }

    // Check if there's a counter to accept
    if (collaboration.status !== 'counter_delivered') {
      return res.status(400).json({ 
        message: 'No counter-proposal to accept',
        currentStatus: collaboration.status
      });
    }

    // Accept the counter and mark as completed
    collaboration.status = 'completed';
    collaboration.messages.push({
      sender: userId,
      message: acceptanceMessage || 'Counter-proposal accepted. Terms agreed.',
      sentAt: new Date(),
      read: false
    });

    await collaboration.save();

    // TODO: Send notification to vendor about accepted counter

    res.json({
      success: true,
      message: 'Counter-proposal accepted successfully. Collaboration completed!',
      data: collaboration
    });
  } catch (error) {
    console.error('Error accepting counter:', error);
    res.status(500).json({ message: 'Server error while accepting counter' });
  }
});

// @route   POST /api/collaborations/:id/counter/reject
// @desc    Reject counter-proposal final terms (by initiator/community)
// @access  Private
router.post('/:id/counter/reject', authMiddleware, async (req, res) => {
  try {
    const collaborationId = req.params.id;
    const userId = req.user.userId;
    const { rejectionMessage } = req.body;

    const collaboration = await Collaboration.findById(collaborationId);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration request not found' });
    }

    // Verify user is the initiator
    if (collaboration.initiator.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to reject this counter' });
    }

    // Check if there's a counter to reject
    if (collaboration.status !== 'counter_delivered') {
      return res.status(400).json({ 
        message: 'No counter-proposal to reject',
        currentStatus: collaboration.status
      });
    }

    // Reject the counter - negotiation ended
    collaboration.status = 'vendor_rejected';
    collaboration.rejectedAt = new Date();
    collaboration.messages.push({
      sender: userId,
      message: rejectionMessage || 'Counter-proposal rejected. Terms not agreed.',
      sentAt: new Date(),
      read: false
    });

    await collaboration.save();

    // TODO: Send notification to vendor about rejected counter

    res.json({
      success: true,
      message: 'Counter-proposal rejected',
      data: collaboration
    });
  } catch (error) {
    console.error('Error rejecting counter:', error);
    res.status(500).json({ message: 'Server error while rejecting counter' });
  }
});

// @route   GET /api/collaborations/:id
// @desc    Get collaboration details
// @access  Private
// @route   POST /api/collaborations/propose
// @desc    Create a new collaboration proposal
// @access  Private
router.post('/propose', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, recipientId, recipientType, formData } = req.body;

    console.log('[PROPOSE] Creating collaboration:', { 
      type, 
      recipientId, 
      recipientType, 
      userId,
      formDataKeys: Object.keys(formData || {}),
      eventDate: formData?.eventDate,
      eventCategory: formData?.eventCategory,
      targetAudience: formData?.targetAudience
    });

    // Validate required fields
    if (!type || !recipientId || !recipientType || !formData) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get proposer and recipient details
    const User = require('../models/User');
    const proposer = await User.findById(userId);
    const recipient = await User.findById(recipientId);

    if (!proposer || !recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Parse eventDate from object to Date if needed
    let eventDate = null;
    if (formData.eventDate) {
      if (typeof formData.eventDate === 'object' && formData.eventDate.date) {
        // Convert {date: '2026-02-27', startTime: '09:00', endTime: '10:00'} to Date
        eventDate = new Date(formData.eventDate.date);
      } else if (typeof formData.eventDate === 'string') {
        eventDate = new Date(formData.eventDate);
      }
    }

    // Helper function to parse attendees range to number
    const parseAttendees = (value) => {
      if (!value) return null;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Handle ranges like "20-40" - take the maximum value
        const match = value.match(/(\d+)-(\d+)/);
        if (match) return parseInt(match[2]);
        // Handle single numbers
        const num = parseInt(value);
        if (!isNaN(num)) return num;
      }
      return null;
    };

    // Helper function to convert requirements object to string
    const stringifyRequirements = (reqs) => {
      if (!reqs) return '';
      if (typeof reqs === 'string') return reqs;
      if (typeof reqs === 'object') {
        // Convert object to readable string
        const parts = [];
        if (reqs.spaceOnly?.selected) parts.push('Space Only');
        if (reqs.barFood?.selected) parts.push('Bar & Food');
        if (reqs.audioVisual?.selected) parts.push('Audio Visual');
        if (reqs.decoration?.selected) parts.push('Decoration');
        if (reqs.entertainment?.selected) parts.push('Entertainment');
        return parts.join(', ') || JSON.stringify(reqs);
      }
      return '';
    };

    // Build requestDetails based on collaboration type
    const requestDetails = {
      message: formData.message || formData.supportingInfo?.note || 'Collaboration request',
      eventName: formData.eventName,
      eventDate: eventDate
    };

    // Add type-specific details
    if (recipientType === 'venue' || type === 'communityToVenue') {
      requestDetails.venueRequest = {
        date: eventDate,
        timeSlot: formData.eventDate?.startTime && formData.eventDate?.endTime 
          ? `${formData.eventDate.startTime} - ${formData.eventDate.endTime}` 
          : null,
        expectedAttendees: parseAttendees(formData.expectedAttendees),
        eventType: formData.eventType,
        specialRequirements: stringifyRequirements(formData.requirements),
        budgetRange: formData.pricing?.revenueShare ? 'revenue_share' : formData.pricing?.fixedRental ? 'rental' : 'free'
      };
    } else if (recipientType === 'brand' || type === 'communityToBrand') {
      requestDetails.brandSponsorship = {
        sponsorshipType: formData.sponsorshipType ? [formData.sponsorshipType] : [],
        collaborationFormat: formData.collaborationFormat ? [formData.collaborationFormat] : [],
        expectedReach: parseAttendees(formData.expectedAttendees),
        targetAudience: formData.targetAudience,
        deliverables: formData.deliverables || formData.supportingInfo?.note
      };
    }

    // Create collaboration - Status is 'submitted' (awaiting admin review)
    const collaboration = new Collaboration({
      type,
      // New structure
      initiator: {
        user: proposer._id,
        userType: proposer.hostPartnerType || 'community_organizer',
        name: proposer.communityProfile?.communityName || proposer.name,
        profileImage: proposer.communityProfile?.logo || proposer.profilePicture
      },
      recipient: {
        user: recipient._id,
        userType: recipient.hostPartnerType || recipientType,
        name: recipient.venueProfile?.venueName || recipient.brandProfile?.brandName || recipient.name,
        profileImage: recipient.venueProfile?.photos?.[0] || recipient.brandProfile?.logo || recipient.profilePicture
      },
      // Old structure for backward compatibility
      proposerId: proposer._id,
      proposerType: 'community',
      recipientId: recipient._id,
      recipientType,
      formData,
      requestDetails,
      status: 'submitted', // Awaiting admin review - recipient won't see this yet
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    });

    await collaboration.save();

    console.log('[PROPOSE] Collaboration created:', collaboration._id);

    // DO NOT notify recipient yet - admin must review first
    // Notify admin instead
    const notificationService = require('../services/notificationService');
    
    // Find admin users
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      await notificationService.createNotification({
        userId: admin._id,
        type: 'admin_review_required',
        title: 'New Collaboration Request Needs Review',
        message: `${proposer.communityProfile?.communityName || proposer.name} has submitted a ${recipientType} collaboration request`,
        actionUrl: `/admin/collaborations/${collaboration._id}`,
        metadata: {
          collaborationId: collaboration._id,
          proposerId: proposer._id,
          recipientId: recipient._id
        }
      });
    }

    res.status(201).json({ 
      message: 'Collaboration request submitted successfully and is awaiting admin approval',
      collaboration 
    });
  } catch (error) {
    console.error('[PROPOSE] Error creating collaboration:', error);
    res.status(500).json({ message: 'Server error while creating collaboration' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid collaboration ID format' });
    }
    
    const collaborationId = req.params.id;
    const userId = req.user.userId;

    let collaboration = await Collaboration.findById(collaborationId)
      .populate('proposerId', 'name email username communityProfile venueProfile brandProfile')
      .populate('recipientId', 'name email username communityProfile venueProfile brandProfile')
      .lean();

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration request not found' });
    }

    // Handle both old and new structures
    let isInitiator = false;
    let isRecipient = false;

    if (collaboration.initiator?.user) {
      // New structure
      isInitiator = collaboration.initiator.user.toString() === userId.toString();
      isRecipient = collaboration.recipient.user.toString() === userId.toString();
    } else if (collaboration.proposerId) {
      // Old structure
      isInitiator = collaboration.proposerId._id.toString() === userId.toString();
      isRecipient = collaboration.recipientId._id.toString() === userId.toString();
    }

    if (!isInitiator && !isRecipient) {
      return res.status(403).json({ message: 'You are not authorized to view this request' });
    }

    // Ensure initiator/recipient fields are populated for display
    if (!collaboration.initiator?.name && collaboration.proposerId) {
      collaboration.initiator = {
        user: collaboration.proposerId._id,
        userType: collaboration.proposerType || 'community_organizer',
        name: collaboration.proposerId.communityProfile?.communityName || collaboration.proposerId.name,
        profileImage: collaboration.proposerId.communityProfile?.logo || collaboration.proposerId.profilePicture
      };
    }

    if (!collaboration.recipient?.name && collaboration.recipientId) {
      collaboration.recipient = {
        user: collaboration.recipientId._id,
        userType: collaboration.recipientType || 'venue',
        name: collaboration.recipientId.venueProfile?.venueName || 
              collaboration.recipientId.brandProfile?.brandName || 
              collaboration.recipientId.name,
        profileImage: collaboration.recipientId.venueProfile?.photos?.[0] || 
                     collaboration.recipientId.brandProfile?.logo || 
                     collaboration.recipientId.profilePicture
      };
    }

    // Add counter data from response field if it exists
    if (collaboration.response?.counterOffer) {
      // Parse terms if it's a JSON string
      let counterData = collaboration.response.counterOffer;
      if (typeof counterData.terms === 'string') {
        try {
          const parsed = JSON.parse(counterData.terms);
          counterData = { ...counterData, ...parsed };
        } catch (e) {
          console.log('Could not parse counter terms JSON');
        }
      }
      collaboration.counterData = counterData;
      collaboration.hasCounter = true;
    }

    // Mark as viewed if user is recipient and it's unread
    if (isRecipient && !collaboration.viewed) {
      await Collaboration.findByIdAndUpdate(collaborationId, {
        viewed: true,
        viewedAt: new Date()
      });
    }

    res.json({ data: collaboration });
  } catch (error) {
    console.error('Error fetching collaboration details:', error);
    res.status(500).json({ message: 'Server error while fetching collaboration details' });
  }
});

module.exports = router;
