const express = require('express');
const router = express.Router();
const Collaboration = require('../models/Collaboration');
const { authMiddleware } = require('../utils/authUtils');
const notificationService = require('../services/notificationService');

// @route   GET /api/collaborations/received
// @desc    Get all collaboration requests received by the user
// @access  Private
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const collaborations = await Collaboration.find({
      'recipient.user': userId
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(collaborations);
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
    
    const collaborations = await Collaboration.find({
      'initiator.user': userId
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(collaborations);
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

    // Check if already responded
    if (collaboration.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been responded to' });
    }

    // Accept the collaboration
    await collaboration.accept(responseMessage);

    // Send notification to initiator
    setImmediate(async () => {
      try {
        const initiatorType = collaboration.initiator.type; // 'community', 'venue', 'brand'
        const recipientType = collaboration.recipient.type;
        
        if (recipientType === 'venue' && initiatorType === 'community') {
          // Venue responded to community's hosting request
          await notificationService.notifyVenueResponseReceived(
            collaboration.initiator.user,
            collaboration.recipient.name,
            collaborationId
          );
        } else if (recipientType === 'brand' && initiatorType === 'community') {
          // Brand responded to community's proposal
          await notificationService.notifyBrandProposalReceived(
            collaboration.initiator.user,
            collaboration.recipient.name,
            collaborationId
          );
        } else if (recipientType === 'community' && initiatorType === 'brand') {
          // Community responded to brand's proposal
          await notificationService.notifyCommunityProposalReceived(
            collaboration.initiator.user,
            collaboration.recipient.name,
            collaborationId
          );
        }
      } catch (error) {
        console.error('Failed to send collaboration notification:', error);
      }
    });

    res.json({
      message: 'Collaboration request accepted successfully',
      collaboration
    });
  } catch (error) {
    console.error('Error accepting collaboration:', error);
    res.status(500).json({ message: 'Server error while accepting collaboration' });
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

    // Check if already responded
    if (collaboration.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been responded to' });
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

    // Check if can be cancelled
    if (collaboration.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
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
