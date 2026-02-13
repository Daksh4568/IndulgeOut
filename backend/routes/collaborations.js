const express = require('express');
const router = express.Router();
const Collaboration = require('../models/Collaboration');
const { authMiddleware } = require('../utils/authUtils');

// @route   GET /api/collaborations/received
// @desc    Get all collaboration requests received by the user
// @access  Private
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('[RECEIVED] Querying collaborations for recipient userId:', userId);
    
    // Query both old (recipientId) and new (recipient.user) field structures
    const collaborations = await Collaboration.find({
      $or: [
        { 'recipient.user': userId },  // New structure
        { 'recipientId': userId }       // Old structure
      ]
    })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('[RECEIVED] Found', collaborations.length, 'collaborations');
    if (collaborations.length > 0) {
      console.log('[RECEIVED] First collaboration:', {
        id: collaborations[0]._id,
        type: collaborations[0].type,
        status: collaborations[0].status,
        // Old structure
        proposerId: collaborations[0].proposerId,
        recipientId: collaborations[0].recipientId,
        // New structure
        initiatorUser: collaborations[0].initiator?.user,
        recipientUser: collaborations[0].recipient?.user
      });
    }

    res.json({ data: collaborations });
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
    if (collaborations.length > 0) {
      console.log('[SENT] First collaboration:', {
        id: collaborations[0]._id,
        type: collaborations[0].type,
        status: collaborations[0].status,
        // Old structure
        proposerId: collaborations[0].proposerId,
        recipientId: collaborations[0].recipientId,
        // New structure
        initiatorUser: collaborations[0].initiator?.user,
        recipientUser: collaborations[0].recipient?.user
      });
    }
    
    // Also check total count in DB for debugging
    const totalCount = await Collaboration.countDocuments();
    console.log('[SENT] Total collaborations in DB:', totalCount);

    res.json({ data: collaborations });
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

    const collaboration = await Collaboration.findById(collaborationId);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration request not found' });
    }

    // Verify user is the recipient
    if (collaboration.recipient.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to respond to this request' });
    }

    // Check if can respond (support both old 'accepted' and new 'admin_approved')
    if (!['admin_approved', 'accepted'].includes(collaboration.status)) {
      return res.status(400).json({ 
        message: 'This request has already been responded to or is not yet approved',
        currentStatus: collaboration.status
      });
    }

    // Update collaboration with counter-proposal
    collaboration.status = 'vendor_accepted';
    collaboration.acceptedAt = new Date();
    collaboration.response = {
      message: counterData.generalNotes || 'Counter-proposal submitted',
      respondedAt: new Date(),
      counterOffer: {
        terms: JSON.stringify(counterData),
        budgetAdjustment: counterData.commercialCounter?.value || 0,
        fieldResponses: counterData.fieldResponses,
        houseRules: counterData.houseRules,
        commercialCounter: counterData.commercialCounter
      }
    };

    await collaboration.save();

    // TODO: Send notification to initiator about counter-proposal

    res.json({
      success: true,
      message: 'Counter-proposal submitted successfully',
      data: collaboration
    });
  } catch (error) {
    console.error('Error submitting counter-proposal:', error);
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
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const collaborationId = req.params.id;
    const userId = req.user.userId;

    const collaboration = await Collaboration.findById(collaborationId).lean();

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration request not found' });
    }

    // Verify user is either initiator or recipient
    const isInitiator = collaboration.initiator.user.toString() === userId.toString();
    const isRecipient = collaboration.recipient.user.toString() === userId.toString();

    if (!isInitiator && !isRecipient) {
      return res.status(403).json({ message: 'You are not authorized to view this request' });
    }

    // Mark as viewed if user is recipient and it's unread
    if (isRecipient && !collaboration.viewed) {
      await Collaboration.findByIdAndUpdate(collaborationId, {
        viewed: true,
        viewedAt: new Date()
      });
    }

    res.json(collaboration);
  } catch (error) {
    console.error('Error fetching collaboration details:', error);
    res.status(500).json({ message: 'Server error while fetching collaboration details' });
  }
});

module.exports = router;
