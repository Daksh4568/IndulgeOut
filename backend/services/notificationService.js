const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('../utils/emailService');

class NotificationService {
  /**
   * Create and send a notification
   * @param {Object} notificationData - Notification configuration
   * @returns {Promise<Notification>}
   */
  async createNotification({
    recipientId,
    type,
    category,
    priority = 'medium',
    title,
    message,
    relatedEvent = null,
    relatedCommunity = null,
    relatedTicket = null,
    relatedCollaboration = null,
    relatedUser = null,
    actionButton = null,
    metadata = {},
    channels = { inApp: true, email: false, push: false, sms: false },
    expiresInDays = null
  }) {
    try {
      // Get user preferences
      const user = await User.findById(recipientId).select('preferences email name');
      
      if (!user) {
        throw new Error('Recipient user not found');
      }

      // Respect user notification preferences
      if (user.preferences) {
        if (!user.preferences.emailNotifications) channels.email = false;
        if (!user.preferences.pushNotifications) channels.push = false;
      }

      // Calculate expiry date if specified
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      // Create notification
      const notification = new Notification({
        recipient: recipientId,
        type,
        category,
        priority,
        title,
        message,
        relatedEvent,
        relatedCommunity,
        relatedTicket,
        relatedCollaboration,
        relatedUser,
        actionButton,
        metadata,
        channels,
        expiresAt
      });

      await notification.save();

      // Send via different channels
      if (channels.email && user.email) {
        await this.sendEmailNotification(user, notification);
      }

      // TODO: Implement push notifications
      if (channels.push) {
        await this.sendPushNotification(user, notification);
      }

      // TODO: Implement SMS notifications
      if (channels.sms && user.phoneNumber) {
        await this.sendSMSNotification(user, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(user, notification) {
    try {
      await sendNotificationEmail(user.email, user.name, {
        title: notification.title,
        message: notification.message,
        actionButton: notification.actionButton
      });
      
      notification.deliveryStatus.email = 'sent';
      await notification.save();
    } catch (error) {
      console.error('Error sending email notification:', error);
      notification.deliveryStatus.email = 'failed';
      await notification.save();
    }
  }

  /**
   * Send push notification (placeholder)
   */
  async sendPushNotification(user, notification) {
    // TODO: Implement with Firebase Cloud Messaging or similar
    console.log('📱 Push notification would be sent:', {
      to: user._id,
      title: notification.title,
      message: notification.message
    });
    notification.deliveryStatus.push = 'sent';
    await notification.save();
  }

  /**
   * Send SMS notification (placeholder)
   */
  async sendSMSNotification(user, notification) {
    // TODO: Implement with Twilio or similar
    console.log('📱 SMS notification would be sent:', {
      to: user.phoneNumber,
      message: notification.message
    });
    notification.deliveryStatus.sms = 'sent';
    await notification.save();
  }

  /**
   * B2C User Notification Templates
   */
  async notifyBookingConfirmed(userId, event, ticket) {
    return this.createNotification({
      recipientId: userId,
      type: 'booking_confirmed',
      category: 'status_update',
      priority: 'high',
      title: 'Booking Confirmed! 🎉',
      message: `You're confirmed for ${event.title}.`,
      relatedEvent: event._id,
      relatedTicket: ticket._id,
      actionButton: {
        text: 'View Ticket',
        link: `/tickets/${ticket._id}`,
        action: 'view_ticket'
      },
      metadata: {
        emoji: '✅',
        color: 'green',
        icon: 'check-circle'
      },
      channels: { inApp: true, email: true }
    });
  }

  async notifyBookingFailed(userId, event, reason = '') {
    return this.createNotification({
      recipientId: userId,
      type: 'booking_failed',
      category: 'action_required',
      priority: 'high',
      title: 'Booking Failed',
      message: `Your booking for ${event.title} didn't go through. ${reason}`,
      relatedEvent: event._id,
      actionButton: {
        text: 'Try Again',
        link: `/events/${event._id}`,
        action: 'retry_booking'
      },
      metadata: {
        emoji: '❌',
        color: 'red',
        icon: 'x-circle'
      },
      channels: { inApp: true, email: true }
    });
  }

  async notifyEventReminder(userId, event) {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return this.createNotification({
      recipientId: userId,
      type: 'event_reminder',
      category: 'reminder',
      priority: 'high',
      title: 'Event Tomorrow!',
      message: `Tomorrow: ${event.title} at ${event.time}.`,
      relatedEvent: event._id,
      actionButton: {
        text: 'View Details',
        link: `/events/${event._id}`,
        action: 'view_event'
      },
      metadata: {
        emoji: '📅',
        color: 'blue',
        icon: 'calendar'
      },
      channels: { inApp: true, email: true, push: true },
      expiresInDays: 2
    });
  }

  async notifyCheckinQRReady(userId, event, ticket) {
    return this.createNotification({
      recipientId: userId,
      type: 'checkin_qr_ready',
      category: 'status_update',
      priority: 'medium',
      title: 'Entry QR Ready',
      message: `Your entry QR for ${event.title} is ready.`,
      relatedEvent: event._id,
      relatedTicket: ticket._id,
      actionButton: {
        text: 'View QR Code',
        link: `/tickets/${ticket._id}`,
        action: 'view_qr'
      },
      metadata: {
        emoji: '🎫',
        color: 'purple',
        icon: 'qr-code'
      },
      channels: { inApp: true }
    });
  }

  async notifyRateExperience(userId, event) {
    return this.createNotification({
      recipientId: userId,
      type: 'rate_experience',
      category: 'action_required',
      priority: 'low',
      title: 'Rate Your Experience',
      message: `How was ${event.title}? Rate your experience.`,
      relatedEvent: event._id,
      actionButton: {
        text: 'Leave Review',
        link: `/events/${event._id}/review`,
        action: 'rate_event'
      },
      metadata: {
        emoji: '⭐',
        color: 'yellow',
        icon: 'star'
      },
      channels: { inApp: true, email: true },
      expiresInDays: 7
    });
  }

  async notifyHostReplyFeedback(userId, event, hostId) {
    return this.createNotification({
      recipientId: userId,
      type: 'host_reply_feedback',
      category: 'status_update',
      priority: 'medium',
      title: 'Host Replied to Your Feedback',
      message: `Host replied to your feedback on ${event.title}.`,
      relatedEvent: event._id,
      relatedUser: hostId,
      actionButton: {
        text: 'View Reply',
        link: `/events/${event._id}/reviews`,
        action: 'view_reply'
      },
      metadata: {
        emoji: '💬',
        color: 'blue',
        icon: 'message-circle'
      },
      channels: { inApp: true, email: true }
    });
  }

  async notifyProfileIncompleteUser(userId, missingFields = [], options = {}) {
    return this.createNotification({
      recipientId: userId,
      type: 'profile_incomplete_user',
      category: 'action_required',
      priority: 'medium',
      title: 'Complete Your Profile',
      message: 'Complete your profile to book events faster and join exclusive communities.',
      actionButton: {
        text: 'Complete Profile',
        link: '/profile',
        action: 'complete_profile'
      },
      metadata: {
        emoji: '👤',
        color: 'orange',
        icon: 'user',
        additionalData: { missingFields }
      },
      channels: { inApp: true, email: options.sendEmail !== false },
      expiresInDays: 30
    });
  }

  /**
   * Host/Community Notification Templates
   */
  async notifyProfileIncompleteHost(userId, options = {}) {
    return this.createNotification({
      recipientId: userId,
      type: 'profile_incomplete_host',
      category: 'action_required',
      priority: 'high',
      title: 'Complete Your Community Profile',
      message: 'Complete your community profile to publish events.',
      actionButton: {
        text: 'Complete Profile',
        link: '/profile',
        action: 'complete_host_profile'
      },
      metadata: {
        emoji: '🏢',
        color: 'red',
        icon: 'alert-circle'
      },
      channels: { inApp: true, email: options.sendEmail !== false }
    });
  }

  async notifyKYCPending(userId, options = {}) {
    return this.createNotification({
      recipientId: userId,
      type: 'kyc_pending',
      category: 'action_required',
      priority: 'high',
      title: 'Payout Details Missing',
      message: 'Add payout details to receive earnings.',
      actionButton: {
        text: 'Add Details',
        link: '/profile?section=payout',
        action: 'add_payout_details'
      },
      metadata: {
        emoji: '💳',
        color: 'red',
        icon: 'credit-card'
      },
      channels: { inApp: true, email: options.sendEmail !== false }
    });
  }

  async notifyEventDraftIncomplete(userId, eventId, eventTitle) {
    return this.createNotification({
      recipientId: userId,
      type: 'event_draft_incomplete',
      category: 'action_required',
      priority: 'medium',
      title: 'Event Draft Incomplete',
      message: `Finish setting up ${eventTitle} to publish.`,
      relatedEvent: eventId,
      actionButton: {
        text: 'Complete Event',
        link: `/host/events/${eventId}/edit`,
        action: 'complete_event'
      },
      metadata: {
        emoji: '📝',
        color: 'orange',
        icon: 'edit'
      },
      channels: { inApp: true },
      expiresInDays: 7
    });
  }

  async notifyEventPublished(userId, event) {
    return this.createNotification({
      recipientId: userId,
      type: 'event_published',
      category: 'status_update',
      priority: 'medium',
      title: 'Event Published! 🎉',
      message: `Your event ${event.title} is now live.`,
      relatedEvent: event._id,
      actionButton: {
        text: 'View Event',
        link: `/events/${event._id}`,
        action: 'view_event'
      },
      metadata: {
        emoji: '🚀',
        color: 'green',
        icon: 'check-circle'
      },
      channels: { inApp: true, email: true }
    });
  }

  async notifyFirstBookingReceived(userId, event, attendeeName) {
    return this.createNotification({
      recipientId: userId,
      type: 'first_booking_received',
      category: 'milestone',
      priority: 'high',
      title: 'First Booking Received! 🎉',
      message: `${attendeeName} just booked ${event.title}. Congratulations!`,
      relatedEvent: event._id,
      actionButton: {
        text: 'View Attendees',
        link: `/host/events/${event._id}/attendees`,
        action: 'view_attendees'
      },
      metadata: {
        emoji: '🎉',
        color: 'green',
        icon: 'users'
      },
      channels: { inApp: true, email: true, push: true }
    });
  }

  async notifyMilestoneReached(userId, event, milestone) {
    return this.createNotification({
      recipientId: userId,
      type: 'milestone_reached',
      category: 'milestone',
      priority: 'medium',
      title: 'Milestone Reached!',
      message: `${milestone} tickets sold for ${event.title}.`,
      relatedEvent: event._id,
      actionButton: {
        text: 'View Analytics',
        link: `/host/events/${event._id}/analytics`,
        action: 'view_analytics'
      },
      metadata: {
        emoji: '🎯',
        color: 'purple',
        icon: 'trending-up',
        additionalData: { milestone }
      },
      channels: { inApp: true, email: true }
    });
  }

  async notifyEventNearingFull(userId, event, percentage) {
    return this.createNotification({
      recipientId: userId,
      type: 'event_nearing_full',
      category: 'status_update',
      priority: 'medium',
      title: 'Event Almost Full!',
      message: `${event.title} is ${percentage}% full.`,
      relatedEvent: event._id,
      actionButton: {
        text: 'View Event',
        link: `/host/events/${event._id}`,
        action: 'view_event'
      },
      metadata: {
        emoji: '📊',
        color: 'orange',
        icon: 'trending-up',
        additionalData: { percentage }
      },
      channels: { inApp: true, email: true }
    });
  }

  async notifyCapacityReached(userId, event) {
    return this.createNotification({
      recipientId: userId,
      type: 'capacity_reached',
      category: 'milestone',
      priority: 'high',
      title: 'Event Sold Out! 🎉',
      message: `${event.title} is sold out.`,
      relatedEvent: event._id,
      actionButton: {
        text: 'View Event',
        link: `/host/events/${event._id}`,
        action: 'view_event'
      },
      metadata: {
        emoji: '🔥',
        color: 'red',
        icon: 'alert-circle'
      },
      channels: { inApp: true, email: true, push: true }
    });
  }

  async notifyRevenueMilestone(userId, amount) {
    return this.createNotification({
      recipientId: userId,
      type: 'revenue_milestone',
      category: 'milestone',
      priority: 'high',
      title: 'Revenue Milestone!',
      message: `You crossed ₹${amount.toLocaleString()} earnings on IndulgeOut.`,
      actionButton: {
        text: 'View Earnings',
        link: '/host/earnings',
        action: 'view_earnings'
      },
      metadata: {
        emoji: '💰',
        color: 'green',
        icon: 'dollar-sign',
        additionalData: { amount }
      },
      channels: { inApp: true, email: true }
    });
  }

  async notifyRatingsUpdated(userId, newRating, communityId = null) {
    return this.createNotification({
      recipientId: userId,
      type: 'ratings_updated',
      category: 'status_update',
      priority: 'low',
      title: 'Rating Updated',
      message: `Your ${communityId ? 'community' : 'host'} rating increased to ${newRating} ⭐`,
      relatedCommunity: communityId,
      actionButton: {
        text: 'View Profile',
        link: communityId ? `/communities/${communityId}` : '/host/profile',
        action: 'view_profile'
      },
      metadata: {
        emoji: '⭐',
        color: 'yellow',
        icon: 'star',
        additionalData: { rating: newRating }
      },
      channels: { inApp: true }
    });
  }

  async notifyVenueResponseReceived(userId, venueName, collaborationId) {
    return this.createNotification({
      recipientId: userId,
      type: 'venue_response_received',
      category: 'action_required',
      priority: 'high',
      title: 'Venue Response Received',
      message: `Venue ${venueName} has sent a collaboration proposal.`,
      relatedCollaboration: collaborationId,
      actionButton: {
        text: 'View Proposal',
        link: `/host/collaborations/${collaborationId}`,
        action: 'view_proposal'
      },
      metadata: {
        emoji: '🏢',
        color: 'blue',
        icon: 'building'
      },
      channels: { inApp: true, email: true, push: true }
    });
  }

  async notifyBrandProposalReceived(userId, brandName, collaborationId) {
    return this.createNotification({
      recipientId: userId,
      type: 'brand_proposal_received',
      category: 'action_required',
      priority: 'high',
      title: 'Brand Proposal Received',
      message: `Brand ${brandName} sent a collaboration proposal.`,
      relatedCollaboration: collaborationId,
      actionButton: {
        text: 'View Proposal',
        link: `/host/collaborations/${collaborationId}`,
        action: 'view_proposal'
      },
      metadata: {
        emoji: '🤝',
        color: 'purple',
        icon: 'handshake'
      },
      channels: { inApp: true, email: true, push: true }
    });
  }

  async notifyRespondToFeedback(userId, eventId, eventTitle) {
    return this.createNotification({
      recipientId: userId,
      type: 'respond_to_feedback',
      category: 'action_required',
      priority: 'medium',
      title: 'New Attendee Feedback',
      message: `New attendee feedback on ${eventTitle}.`,
      relatedEvent: eventId,
      actionButton: {
        text: 'View & Respond',
        link: `/host/events/${eventId}/reviews`,
        action: 'respond_feedback'
      },
      metadata: {
        emoji: '💬',
        color: 'blue',
        icon: 'message-square'
      },
      channels: { inApp: true, email: true }
    });
  }

  /**
   * Brand Notification Templates
   */
  async notifyProfileIncompleteBrand(userId, options = {}) {
    return this.createNotification({
      recipientId: userId,
      type: 'profile_incomplete_brand',
      category: 'action_required',
      priority: 'high',
      title: 'Complete Your Brand Profile',
      message: 'Complete your brand profile to start collaborating.',
      actionButton: {
        text: 'Complete Profile',
        link: '/profile',
        action: 'complete_brand_profile'
      },
      metadata: {
        emoji: '🏢',
        color: 'red',
        icon: 'alert-circle'
      },
      channels: { inApp: true, email: options.sendEmail !== false }
    });
  }

  async notifyCommunityProposalReceived(userId, communityName, collaborationId) {
    return this.createNotification({
      recipientId: userId,
      type: 'community_proposal_received',
      category: 'action_required',
      priority: 'high',
      title: 'Community Proposal Received',
      message: `Community ${communityName} sent you a collaboration proposal.`,
      relatedCollaboration: collaborationId,
      actionButton: {
        text: 'View Proposal',
        link: `/brand/collaborations/${collaborationId}`,
        action: 'view_proposal'
      },
      metadata: {
        emoji: '👥',
        color: 'blue',
        icon: 'users'
      },
      channels: { inApp: true, email: true, push: true }
    });
  }

  async notifyPerformanceReportReady(userId, eventId, eventTitle, userRole) {
    const rolePrefix = userRole === 'brand' ? 'brand' : 'venue';
    
    return this.createNotification({
      recipientId: userId,
      type: `performance_report_ready_${rolePrefix}`,
      category: 'status_update',
      priority: 'medium',
      title: 'Performance Report Ready',
      message: `View performance summary for ${eventTitle}.`,
      relatedEvent: eventId,
      actionButton: {
        text: 'View Report',
        link: `/${rolePrefix}/reports/${eventId}`,
        action: 'view_report'
      },
      metadata: {
        emoji: '📊',
        color: 'purple',
        icon: 'bar-chart'
      },
      channels: { inApp: true, email: true }
    });
  }

  /**
   * Venue Notification Templates
   */
  async notifyProfileIncompleteVenue(userId, options = {}) {
    return this.createNotification({
      recipientId: userId,
      type: 'profile_incomplete_venue',
      category: 'action_required',
      priority: 'high',
      title: 'Complete Your Venue Profile',
      message: 'Complete your venue profile to receive event requests.',
      actionButton: {
        text: 'Complete Profile',
        link: '/profile',
        action: 'complete_venue_profile'
      },
      metadata: {
        emoji: '🏢',
        color: 'red',
        icon: 'alert-circle'
      },
      channels: { inApp: true, email: options.sendEmail !== false }
    });
  }

  async notifyHostingRequestReceived(userId, communityName, collaborationId) {
    return this.createNotification({
      recipientId: userId,
      type: 'hosting_request_received',
      category: 'action_required',
      priority: 'high',
      title: 'New Hosting Request',
      message: `New hosting request from ${communityName}.`,
      relatedCollaboration: collaborationId,
      actionButton: {
        text: 'View Request',
        link: `/venue/requests/${collaborationId}`,
        action: 'view_request'
      },
      metadata: {
        emoji: '📩',
        color: 'blue',
        icon: 'inbox'
      },
      channels: { inApp: true, email: true, push: true }
    });
  }

  async notifyVenueRatingUpdated(userId, newRating) {
    return this.createNotification({
      recipientId: userId,
      type: 'venue_rating_updated',
      category: 'status_update',
      priority: 'low',
      title: 'Venue Rating Updated',
      message: `Your venue rating is now ${newRating} ⭐`,
      actionButton: {
        text: 'View Profile',
        link: '/venue/profile',
        action: 'view_profile'
      },
      metadata: {
        emoji: '⭐',
        color: 'yellow',
        icon: 'star',
        additionalData: { rating: newRating }
      },
      channels: { inApp: true }
    });
  }

  /**
   * Generic Subscription Payment Notification
   */
  async notifySubscriptionPaymentPending(userId, userRole) {
    const roleMap = {
      'host_partner': 'collaboration',
      'brand_sponsor': 'collaboration',
      'venue': 'collaboration'
    };
    
    return this.createNotification({
      recipientId: userId,
      type: `subscription_payment_pending_${userRole}`,
      category: 'action_required',
      priority: 'urgent',
      title: 'Payment Pending',
      message: `Complete payment to activate ${roleMap[userRole] || 'collaboration'} and reach out to partners.`,
      actionButton: {
        text: 'Complete Payment',
        link: '/billing/subscription',
        action: 'complete_payment'
      },
      metadata: {
        emoji: '💳',
        color: 'red',
        icon: 'credit-card'
      },
      channels: { inApp: true, email: true }
    });
  }

  /**
   * Welcome Notification for New Users
   */
  async notifyWelcome(userId) {
    return this.createNotification({
      recipientId: userId,
      type: 'welcome',
      category: 'status_update',
      priority: 'medium',
      title: '🎉 Welcome to IndulgeOut!',
      message: 'Discover amazing events, connect with communities, and create unforgettable experiences.',
      actionButton: {
        text: 'Explore Events',
        link: '/explore',
        action: 'explore'
      },
      metadata: {
        emoji: '🎉',
        color: 'purple',
        icon: 'party-popper',
        additionalData: { isWelcome: true }
      },
      channels: { inApp: true, email: true }
    });
  }

  /**
   * Bulk notification methods
   */
  async notifyMultipleUsers(userIds, notificationConfig) {
    const notifications = userIds.map(userId => ({
      ...notificationConfig,
      recipientId: userId
    }));
    
    return Promise.all(
      notifications.map(config => this.createNotification(config))
    );
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      category = null,
      unreadOnly = false
    } = options;

    const query = {
      recipient: userId,
      isArchived: false
    };

    if (category) {
      query.category = category;
    }

    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('relatedEvent', 'title date location images')
      .populate('relatedCommunity', 'name coverImage')
      .populate('relatedUser', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }
}

module.exports = new NotificationService();
