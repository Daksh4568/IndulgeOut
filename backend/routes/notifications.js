const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification.js');
const { authMiddleware } = require('../utils/authUtils');

// GET /api/notifications - Get all notifications with pagination & filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      category, 
      unreadOnly, 
      type 
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {
      recipient: userId,
      isArchived: false
    };

    if (category) {
      query.category = category;
    }

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    if (type) {
      query.type = type;
    }

    // Fetch notifications and count
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('relatedEvent', 'title date location')
        .populate('relatedCommunity', 'name profilePicture')
        .populate('relatedUser', 'name profilePicture')
        .lean(),
      Notification.countDocuments(query),
      Notification.getUnreadCount(userId)
    ]);

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

// GET /api/notifications/category/:category - Get notifications by category
router.get('/category/:category', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate category
    const validCategories = ['action_required', 'status_update', 'reminder', 'milestone'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: ' + validCategories.join(', ')
      });
    }

    const result = await Notification.getByCategory(userId, category, { page, limit });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching notifications by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/preferences - Get user notification preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const User = require('../models/User.js');
    
    const user = await User.findById(userId).select('notificationPreferences');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Default preferences if none exist
    const preferences = user.notificationPreferences || {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      eventReminders: true,
      communityUpdates: true,
      promotionalEmails: false
    };

    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// PUT /api/notifications/read/bulk - Mark multiple notifications as read
router.put('/read/bulk', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds must be a non-empty array'
      });
    }

    const result = await Notification.markManyAsRead(notificationIds, userId);

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
});

// PUT /api/notifications/read/all - Mark all notifications as read
router.put('/read/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const result = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id/archive - Archive notification
router.put('/:id/archive', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.archive();

    res.json({
      success: true,
      message: 'Notification archived',
      notification
    });
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive notification',
      error: error.message
    });
  }
});

// PUT /api/notifications/preferences - Update notification preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const User = require('../models/User.js');
    
    const {
      emailNotifications,
      pushNotifications,
      smsNotifications,
      eventReminders,
      communityUpdates,
      promotionalEmails
    } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(pushNotifications !== undefined && { pushNotifications }),
      ...(smsNotifications !== undefined && { smsNotifications }),
      ...(eventReminders !== undefined && { eventReminders }),
      ...(communityUpdates !== undefined && { communityUpdates }),
      ...(promotionalEmails !== undefined && { promotionalEmails })
    };

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
});

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// DELETE /api/notifications/read/all - Delete all read notifications
router.delete('/read/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const result = await Notification.deleteAllRead(userId);

    res.json({
      success: true,
      message: `${result.deletedCount} read notifications deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete read notifications',
      error: error.message
    });
  }
});

module.exports = router;
