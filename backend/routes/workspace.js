/**
 * Collaboration Workspace Routes
 * API endpoints for interactive B2B stakeholder workspace
 */

const express = require('express');
const router = express.Router();
const Collaboration = require('../models/Collaboration');
const validateWorkspaceMessage = require('../middleware/validateWorkspaceMessage');
const {
  initializeWorkspaceWithCounterData,
  formatWorkspaceForResponse,
  areAllSectionsAgreed
} = require('../utils/workspaceUtils');

/**
 * GET /api/workspace/:collaborationId
 * Get complete workspace data for a collaboration
 */
router.get('/:collaborationId', async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const userId = req.user._id;
    
    // Find collaboration
    const collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check access permission
    if (!collaboration.canAccessWorkspace(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Workspace not active or you are not a participant.'
      });
    }
    
    // Format workspace data
    const workspaceData = formatWorkspaceForResponse(collaboration);
    
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
        createdAt: collaboration.createdAt
      },
      workspace: workspaceData
    });
    
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace data'
    });
  }
});

/**
 * POST /api/workspace/:collaborationId/initialize
 * Initialize workspace with counter data
 */
router.post('/:collaborationId/initialize', async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const userId = req.user._id;
    
    let collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check if user is a participant
    const isParticipant = 
      collaboration.initiator.user.toString() === userId.toString() ||
      collaboration.recipient.user.toString() === userId.toString();
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a participant.'
      });
    }
    
    // Check if status is counter_delivered
    if (collaboration.status !== 'counter_delivered') {
      return res.status(400).json({
        success: false,
        error: 'Workspace can only be initialized after counter is delivered'
      });
    }
    
    // Initialize workspace
    collaboration = await initializeWorkspaceWithCounterData(collaboration);
    await collaboration.initializeWorkspace();
    
    const workspaceData = formatWorkspaceForResponse(collaboration);
    
    res.json({
      success: true,
      message: 'Workspace initialized successfully',
      workspace: workspaceData
    });
    
  } catch (error) {
    console.error('Error initializing workspace:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize workspace'
    });
  }
});

/**
 * PUT /api/workspace/:collaborationId/field
 * Update a field value
 */
router.put('/:collaborationId/field', async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const { section, field, value, agrees } = req.body;
    const userId = req.user._id;
    const userType = req.user.userType;
    const userName = req.user.name || req.user.organizationName || 'User';
    
    // Validation
    if (!section || !field) {
      return res.status(400).json({
        success: false,
        error: 'Section and field are required'
      });
    }
    
    let collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check access
    if (!collaboration.canAccessWorkspace(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Update field
    collaboration = await collaboration.updateWorkspaceField(
      userId,
      userType,
      userName,
      section,
      field,
      value,
      agrees || false
    );
    
    // Update section status
    collaboration.updateSectionStatus(section);
    collaboration.markModified('workspace.sectionStatus');
    await collaboration.save();
    
    // Add activity log
    collaboration.workspaceActivity.push({
      actor: {
        user: userId,
        name: userName,
        userType
      },
      action: 'edited_field',
      target: `${section}.${field}`,
      description: `${userName} updated ${field}`,
      timestamp: new Date()
    });
    await collaboration.save();
    
    const workspaceData = formatWorkspaceForResponse(collaboration);
    
    res.json({
      success: true,
      message: 'Field updated successfully',
      workspace: workspaceData
    });
    
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update field'
    });
  }
});

/**
 * POST /api/workspace/:collaborationId/field/toggle-agreement
 * Toggle agreement status for a field
 */
router.post('/:collaborationId/field/toggle-agreement', async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const { section, field, agrees } = req.body;
    const userId = req.user._id;
    const userName = req.user.name || req.user.organizationName || 'User';
    const userType = req.user.userType;
    
    // Validation
    if (!section || !field || typeof agrees !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Section, field, and agrees (boolean) are required'
      });
    }
    
    let collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check access
    if (!collaboration.canAccessWorkspace(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Toggle agreement
    collaboration = await collaboration.toggleFieldAgreement(userId, section, field, agrees);
    
    // Update section status
    collaboration.updateSectionStatus(section);
    collaboration.markModified('workspace.sectionStatus');
    await collaboration.save();
    
    // Check if section is now fully agreed
    const sectionStatus = collaboration.workspace.sectionStatus.get(section);
    if (sectionStatus === 'agreed') {
      await collaboration.addSystemNotification(`${section} section marked as Agreed`);
    }
    
    // Add activity log
    collaboration.workspaceActivity.push({
      actor: {
        user: userId,
        name: userName,
        userType
      },
      action: agrees ? 'agreed_field' : 'disagreed_field',
      target: `${section}.${field}`,
      description: `${userName} ${agrees ? 'agreed on' : 'disagreed with'} ${field}`,
      timestamp: new Date()
    });
    await collaboration.save();
    
    const workspaceData = formatWorkspaceForResponse(collaboration);
    
    res.json({
      success: true,
      message: `Agreement ${agrees ? 'confirmed' : 'removed'} successfully`,
      workspace: workspaceData
    });
    
  } catch (error) {
    console.error('Error toggling agreement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to toggle agreement'
    });
  }
});

/**
 * POST /api/workspace/:collaborationId/notes
 * Add a comment to a specific field
 */
router.post('/:collaborationId/notes', validateWorkspaceMessage, async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const { section, field, message } = req.body;
    const userId = req.user._id;
    const userType = req.user.userType;
    const userName = req.user.name || req.user.organizationName || 'User';
    const profileImage = req.user.profilePicture || '';
    
    // Validation
    if (!section || !field) {
      return res.status(400).json({
        success: false,
        error: 'Section and field are required'
      });
    }
    
    let collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check access
    if (!collaboration.canAccessWorkspace(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Add note
    collaboration = await collaboration.addFieldNote(
      userId,
      userType,
      userName,
      profileImage,
      section,
      field,
      message
    );
    
    // Add activity log
    collaboration.workspaceActivity.push({
      actor: {
        user: userId,
        name: userName,
        userType
      },
      action: 'added_comment',
      target: `${section}.${field}`,
      description: `${userName} added a comment on ${field}`,
      timestamp: new Date()
    });
    await collaboration.save();
    
    res.json({
      success: true,
      message: 'Note added successfully',
      note: {
        author: {
          user: userId,
          userType,
          name: userName,
          profileImage
        },
        message,
        createdAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add note'
    });
  }
});

/**
 * GET /api/workspace/:collaborationId/notes/:section/:field
 * Get all notes for a specific field
 */
router.get('/:collaborationId/notes/:section/:field', async (req, res) => {
  try {
    const { collaborationId, section, field } = req.params;
    const userId = req.user._id;
    
    const collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check access
    if (!collaboration.canAccessWorkspace(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const fieldKey = `${section}.${field}`;
    const notes = collaboration.workspace.fieldNotes.get(fieldKey) || [];
    
    res.json({
      success: true,
      notes
    });
    
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes'
    });
  }
});

/**
 * GET /api/workspace/:collaborationId/history/:section/:field
 * Get change history for a specific field
 */
router.get('/:collaborationId/history/:section/:field', async (req, res) => {
  try {
    const { collaborationId, section, field } = req.params;
    const userId = req.user._id;
    
    const collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check access
    if (!collaboration.canAccessWorkspace(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const fieldKey = `${section}.${field}`;
    const history = collaboration.workspace.fieldHistory.get(fieldKey) || [];
    
    res.json({
      success: true,
      history
    });
    
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
});

/**
 * POST /api/workspace/:collaborationId/forum
 * Post a message to master discussion forum
 */
router.post('/:collaborationId/forum', validateWorkspaceMessage, async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;
    const userType = req.user.userType;
    const userName = req.user.name || req.user.organizationName || 'User';
    const profileImage = req.user.profilePicture || '';
    
    let collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check access
    if (!collaboration.canAccessWorkspace(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Add forum message
    collaboration = await collaboration.addForumMessage(
      userId,
      userType,
      userName,
      profileImage,
      message
    );
    
    res.json({
      success: true,
      message: 'Message posted successfully',
      forumMessage: {
        author: {
          user: userId,
          userType,
          name: userName,
          profileImage
        },
        message,
        messageType: 'user_message',
        createdAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error posting forum message:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to post message'
    });
  }
});

/**
 * POST /api/workspace/:collaborationId/save
 * Save all pending changes and return to dashboard
 */
router.post('/:collaborationId/save', async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const userId = req.user._id;
    const userName = req.user.name || req.user.organizationName || 'User';
    const userType = req.user.userType;
    
    const collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check access
    if (!collaboration.canAccessWorkspace(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Update last activity
    collaboration.workspace.lastActivityAt = new Date();
    
    // Add system notification
    await collaboration.addSystemNotification(`${userName} saved changes to the workspace`);
    
    // Add activity log
    collaboration.workspaceActivity.push({
      actor: {
        user: userId,
        name: userName,
        userType
      },
      action: 'saved_changes',
      target: 'workspace',
      description: `${userName} saved changes`,
      timestamp: new Date()
    });
    
    await collaboration.save();
    
    // TODO: Send notification to other stakeholder
    
    res.json({
      success: true,
      message: 'Changes saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving changes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save changes'
    });
  }
});

/**
 * POST /api/workspace/:collaborationId/exit
 * Exit collaboration (stakeholder no longer wants to continue)
 */
router.post('/:collaborationId/exit', async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    const userName = req.user.name || req.user.organizationName || 'User';
    const userType = req.user.userType;
    
    const collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check access
    if (!collaboration.canAccessWorkspace(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Update status to cancelled
    collaboration.status = 'cancelled';
    collaboration.cancelledAt = new Date();
    
    // Lock workspace
    collaboration.workspace.isLocked = true;
    collaboration.workspace.lastActivityAt = new Date();
    
    // Add system notification
    const exitMessage = reason 
      ? `${userName} exited the collaboration. Reason: ${reason}`
      : `${userName} exited the collaboration`;
    await collaboration.addSystemNotification(exitMessage);
    
    // Add activity log
    collaboration.workspaceActivity.push({
      actor: {
        user: userId,
        name: userName,
        userType
      },
      action: 'exited_collaboration',
      target: 'workspace',
      description: exitMessage,
      timestamp: new Date()
    });
    
    await collaboration.save();
    
    // TODO: Send notification to other stakeholder
    
    res.json({
      success: true,
      message: 'Collaboration exited successfully'
    });
    
  } catch (error) {
    console.error('Error exiting collaboration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to exit collaboration'
    });
  }
});

/**
 * POST /api/workspace/:collaborationId/confirm
 * Confirm collaboration (lock workspace after all sections agreed)
 */
router.post('/:collaborationId/confirm', async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const userId = req.user._id;
    const userType = req.user.userType;
    const userName = req.user.name || req.user.organizationName || 'User';
    
    const collaboration = await Collaboration.findById(collaborationId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Check access
    if (!collaboration.canAccessWorkspace(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Confirm collaboration
    await collaboration.confirmCollaboration(userId, userType);
    
    // Add activity log
    collaboration.workspaceActivity.push({
      actor: {
        user: userId,
        name: userName,
        userType
      },
      action: 'confirmed_collaboration',
      target: 'workspace',
      description: `${userName} confirmed the collaboration`,
      timestamp: new Date()
    });
    
    await collaboration.save();
    
    const isFullyLocked = collaboration.workspace.isLocked;
    
    // TODO: Send notifications
    
    res.json({
      success: true,
      message: isFullyLocked 
        ? 'Collaboration confirmed by both parties. Workspace is now locked.'
        : 'Your confirmation recorded. Waiting for other party to confirm.',
      isLocked: isFullyLocked,
      confirmedBy: collaboration.workspace.confirmedBy
    });
    
  } catch (error) {
    console.error('Error confirming collaboration:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to confirm collaboration'
    });
  }
});

module.exports = router;
