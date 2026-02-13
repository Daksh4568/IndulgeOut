const Notification = require('../models/Notification.js');
const User = require('../models/User.js');
const emailService = require('../utils/emailService.js');

/**
 * Core function to create and deliver notifications
 * @param {Object} notificationData - Notification details
 * @returns {Promise<Notification>}
 */
async function createNotification(notificationData) {
  try {
    const {
      recipient,
      type,
      category,
      priority = 'medium',
      title,
      message,
      actionUrl,
      actionText,
      relatedEvent,
      relatedCommunity,
      relatedUser,
      metadata = {}
    } = notificationData;

    // Get user preferences
    const user = await User.findById(recipient).select('notificationPreferences email name');
    if (!user) {
      console.error(`User ${recipient} not found for notification`);
      return null;
    }

    // Create in-app notification
    const notification = await Notification.create({
      recipient,
      type,
      category,
      priority,
      title,
      message,
      actionUrl,
      actionText,
      relatedEvent,
      relatedCommunity,
      relatedUser,
      metadata,
      channels: {
        inApp: true,
        email: user.notificationPreferences?.emailNotifications !== false,
        push: user.notificationPreferences?.pushNotifications === true,
        sms: user.notificationPreferences?.smsNotifications === true
      }
    });

    // Send email if user has email notifications enabled
    if (user.notificationPreferences?.emailNotifications !== false && user.email) {
      try {
        await emailService.sendNotificationEmail(
          user.email,
          title,
          message,
          actionUrl,
          actionText
        );
        notification.deliveryStatus.email = 'sent';
        await notification.save();
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        notification.deliveryStatus.email = 'failed';
        await notification.save();
      }
    }

    // TODO: Send push notification if enabled
    // TODO: Send SMS if enabled

    console.log(`✅ Notification created: ${type} for user ${recipient}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Send notifications to multiple users
 */
async function notifyMultipleUsers(userIds, notificationData) {
  const promises = userIds.map(userId =>
    createNotification({ ...notificationData, recipient: userId })
  );
  return Promise.allSettled(promises);
}

// ===================================
// B2C USER NOTIFICATIONS
// ===================================

/**
 * Notify user of booking confirmation
 */
async function notifyBookingConfirmed(userId, event, ticket) {
  return createNotification({
    recipient: userId,
    type: 'booking_confirmed',
    category: 'status_update',
    priority: 'high',
    title: '🎉 Booking Confirmed!',
    message: `Your booking for "${event.title}" is confirmed. Event date: ${new Date(event.date).toLocaleDateString()}.`,
    actionUrl: `/tickets/${ticket._id}`,
    actionText: 'View Ticket',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      eventDate: event.date,
      ticketNumber: ticket.ticketNumber
    }
  });
}

/**
 * Notify user of booking failure
 */
async function notifyBookingFailed(userId, event, reason) {
  return createNotification({
    recipient: userId,
    type: 'booking_failed',
    category: 'status_update',
    priority: 'high',
    title: '❌ Booking Failed',
    message: `Your booking for "${event.title}" could not be completed. Reason: ${reason}`,
    actionUrl: `/events/${event._id}`,
    actionText: 'Try Again',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      failureReason: reason
    }
  });
}

/**
 * Notify user of upcoming event (24hr reminder)
 */
async function notifyEventReminder(userId, event) {
  return createNotification({
    recipient: userId,
    type: 'event_reminder',
    category: 'reminder',
    priority: 'high',
    title: '⏰ Event Tomorrow!',
    message: `"${event.title}" is happening tomorrow at ${new Date(event.date).toLocaleString()}. Don't forget to check in!`,
    actionUrl: `/events/${event._id}`,
    actionText: 'View Event',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      eventDate: event.date,
      location: event.location
    }
  });
}

/**
 * Notify user that check-in QR code is ready
 */
async function notifyCheckinQRReady(userId, event, ticket) {
  return createNotification({
    recipient: userId,
    type: 'checkin_qr_ready',
    category: 'status_update',
    priority: 'medium',
    title: '📱 Your Ticket is Ready',
    message: `Your ticket for "${event.title}" is ready. Show the QR code at check-in.`,
    actionUrl: `/tickets/${ticket._id}`,
    actionText: 'View QR Code',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      ticketNumber: ticket.ticketNumber
    }
  });
}

/**
 * Notify user to rate their experience
 */
async function notifyRateExperience(userId, event) {
  return createNotification({
    recipient: userId,
    type: 'rate_experience',
    category: 'action_required',
    priority: 'low',
    title: '⭐ How Was Your Experience?',
    message: `Please rate your experience at "${event.title}". Your feedback helps improve future events!`,
    actionUrl: `/events/${event._id}/review`,
    actionText: 'Rate Event',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title
    }
  });
}

/**
 * Notify user that host replied to their feedback
 */
async function notifyHostReplyFeedback(userId, event, hostName) {
  return createNotification({
    recipient: userId,
    type: 'host_reply_feedback',
    category: 'status_update',
    priority: 'medium',
    title: '💬 Host Replied to Your Feedback',
    message: `${hostName} replied to your feedback for "${event.title}".`,
    actionUrl: `/events/${event._id}#reviews`,
    actionText: 'View Reply',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      hostName
    }
  });
}

/**
 * Notify B2C user to complete profile
 */
async function notifyProfileIncompleteUser(userId, missingFields) {
  return createNotification({
    recipient: userId,
    type: 'profile_incomplete',
    category: 'action_required',
    priority: 'low',
    title: '👤 Complete Your Profile',
    message: `Your profile is incomplete. Add ${missingFields.join(', ')} to get personalized event recommendations.`,
    actionUrl: '/profile/edit',
    actionText: 'Complete Profile',
    metadata: {
      missingFields
    }
  });
}

// ===================================
// HOST/COMMUNITY NOTIFICATIONS
// ===================================

/**
 * Notify host to complete profile
 */
async function notifyProfileIncompleteHost(userId) {
  return createNotification({
    recipient: userId,
    type: 'profile_incomplete_host',
    category: 'action_required',
    priority: 'high',
    title: '🎯 Complete Your Host Profile',
    message: 'Complete your profile to start creating events and reach more attendees.',
    actionUrl: '/dashboard/profile',
    actionText: 'Complete Profile',
    metadata: {}
  });
}

/**
 * Notify host that KYC/payout details are pending
 */
async function notifyKYCPending(userId) {
  return createNotification({
    recipient: userId,
    type: 'kyc_pending',
    category: 'action_required',
    priority: 'high',
    title: '💳 Add Payout Details',
    message: 'Add your payout details to receive revenue from ticket sales.',
    actionUrl: '/dashboard/payouts/setup',
    actionText: 'Add Details',
    metadata: {}
  });
}

/**
 * Notify host about incomplete draft event
 */
async function notifyEventDraftIncomplete(userId, eventTitle, eventId) {
  return createNotification({
    recipient: userId,
    type: 'event_draft_incomplete',
    category: 'reminder',
    priority: 'low',
    title: '📝 Complete Your Event Draft',
    message: `Your draft event "${eventTitle}" is incomplete. Finish and publish to start selling tickets!`,
    actionUrl: `/dashboard/events/${eventId}/edit`,
    actionText: 'Edit Event',
    metadata: {
      eventTitle,
      eventId
    }
  });
}

/**
 * Notify host that event is published
 */
async function notifyEventPublished(userId, event) {
  return createNotification({
    recipient: userId,
    type: 'event_published',
    category: 'status_update',
    priority: 'high',
    title: '🎉 Event Published Successfully',
    message: `"${event.title}" is now live and accepting bookings!`,
    actionUrl: `/events/${event._id}`,
    actionText: 'View Event',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      eventDate: event.date
    }
  });
}

/**
 * Notify host of first booking
 */
async function notifyFirstBookingReceived(userId, event, attendeeName) {
  return createNotification({
    recipient: userId,
    type: 'first_booking',
    category: 'milestone',
    priority: 'high',
    title: '🎊 Your First Booking!',
    message: `Congratulations! ${attendeeName} just booked "${event.title}". Your event is gaining traction!`,
    actionUrl: `/dashboard/events/${event._id}/attendees`,
    actionText: 'View Attendees',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      attendeeName
    }
  });
}

/**
 * Notify host of ticket sales milestone
 */
async function notifyMilestoneReached(userId, event, milestone) {
  return createNotification({
    recipient: userId,
    type: 'milestone_reached',
    category: 'milestone',
    priority: 'high',
    title: `🎯 ${milestone} Tickets Sold!`,
    message: `Amazing! "${event.title}" has reached ${milestone} bookings. Keep up the momentum!`,
    actionUrl: `/dashboard/events/${event._id}/analytics`,
    actionText: 'View Analytics',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      milestone
    }
  });
}

/**
 * Notify host that event is nearing full capacity
 */
async function notifyEventNearingFull(userId, event, percentageFull) {
  return createNotification({
    recipient: userId,
    type: 'event_nearing_full',
    category: 'status_update',
    priority: 'high',
    title: '🔥 Event Almost Full!',
    message: `"${event.title}" is ${percentageFull}% full. Only a few spots left!`,
    actionUrl: `/dashboard/events/${event._id}`,
    actionText: 'View Event',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      percentageFull,
      currentParticipants: event.currentParticipants,
      maxParticipants: event.maxParticipants
    }
  });
}

/**
 * Notify host that event is sold out
 */
async function notifyCapacityReached(userId, event) {
  return createNotification({
    recipient: userId,
    type: 'capacity_reached',
    category: 'milestone',
    priority: 'high',
    title: '🎉 Event Sold Out!',
    message: `Congratulations! "${event.title}" is completely sold out with ${event.maxParticipants} attendees!`,
    actionUrl: `/dashboard/events/${event._id}`,
    actionText: 'View Event',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      totalAttendees: event.maxParticipants
    }
  });
}

/**
 * Notify host of revenue milestone
 */
async function notifyRevenueMilestone(userId, totalRevenue, milestone) {
  return createNotification({
    recipient: userId,
    type: 'revenue_milestone',
    category: 'milestone',
    priority: 'medium',
    title: `💰 ₹${milestone} Revenue Milestone!`,
    message: `You've earned ₹${totalRevenue} from ticket sales. Great work!`,
    actionUrl: '/dashboard/revenue',
    actionText: 'View Revenue',
    metadata: {
      totalRevenue,
      milestone
    }
  });
}

/**
 * Notify host of updated ratings
 */
async function notifyRatingsUpdated(userId, event, newRating, oldRating) {
  const improved = newRating > oldRating;
  return createNotification({
    recipient: userId,
    type: 'ratings_updated',
    category: 'status_update',
    priority: 'low',
    title: improved ? '⭐ Rating Improved!' : '📊 New Rating',
    message: `"${event.title}" rating ${improved ? 'increased' : 'changed'} to ${newRating.toFixed(1)} stars.`,
    actionUrl: `/dashboard/events/${event._id}#reviews`,
    actionText: 'View Reviews',
    relatedEvent: event._id,
    metadata: {
      eventTitle: event.title,
      newRating,
      oldRating
    }
  });
}

/**
 * Notify community that venue responded to proposal
 */
async function notifyVenueResponseReceived(userId, venueName, collaborationId) {
  return createNotification({
    recipient: userId,
    type: 'venue_response',
    category: 'status_update',
    priority: 'high',
    title: '🏢 Venue Responded',
    message: `${venueName} responded to your collaboration request.`,
    actionUrl: `/dashboard/collaborations/${collaborationId}`,
    actionText: 'View Response',
    metadata: {
      venueName,
      collaborationId
    }
  });
}

/**
 * Notify community that brand sent proposal
 */
async function notifyBrandProposalReceived(userId, brandName, collaborationId) {
  return createNotification({
    recipient: userId,
    type: 'brand_proposal',
    category: 'action_required',
    priority: 'high',
    title: '🎁 Brand Partnership Received',
    message: `${brandName} sent you a collaboration proposal. Review and respond!`,
    actionUrl: `/dashboard/collaborations/${collaborationId}`,
    actionText: 'View Proposal',
    metadata: {
      brandName,
      collaborationId
    }
  });
}

/**
 * Notify host they have new feedback to respond to
 */
async function notifyRespondToFeedback(userId, eventId, eventTitle) {
  return createNotification({
    recipient: userId,
    type: 'respond_to_feedback',
    category: 'action_required',
    priority: 'medium',
    title: '💬 New Feedback Received',
    message: `An attendee left feedback for "${eventTitle}". Respond to show you care!`,
    actionUrl: `/dashboard/events/${eventId}#reviews`,
    actionText: 'Respond',
    relatedEvent: eventId,
    metadata: {
      eventTitle
    }
  });
}

// ===================================
// BRAND NOTIFICATIONS
// ===================================

/**
 * Notify brand to complete profile
 */
async function notifyProfileIncompleteBrand(userId) {
  return createNotification({
    recipient: userId,
    type: 'profile_incomplete_brand',
    category: 'action_required',
    priority: 'high',
    title: '🏢 Complete Your Brand Profile',
    message: 'Complete your brand profile to start partnering with communities and events.',
    actionUrl: '/dashboard/profile',
    actionText: 'Complete Profile',
    metadata: {}
  });
}

/**
 * Notify brand of community proposal
 */
async function notifyCommunityProposalReceived(userId, communityName, collaborationId) {
  return createNotification({
    recipient: userId,
    type: 'community_proposal',
    category: 'action_required',
    priority: 'high',
    title: '🤝 Community Partnership Request',
    message: `${communityName} sent you a collaboration proposal. Review and respond!`,
    actionUrl: `/dashboard/collaborations/${collaborationId}`,
    actionText: 'View Proposal',
    metadata: {
      communityName,
      collaborationId
    }
  });
}

/**
 * Notify brand that performance report is ready
 */
async function notifyPerformanceReportReady(userId, reportPeriod) {
  return createNotification({
    recipient: userId,
    type: 'performance_report',
    category: 'status_update',
    priority: 'medium',
    title: '📊 Performance Report Ready',
    message: `Your ${reportPeriod} performance report is now available.`,
    actionUrl: '/dashboard/reports',
    actionText: 'View Report',
    metadata: {
      reportPeriod
    }
  });
}

// ===================================
// VENUE NOTIFICATIONS
// ===================================

/**
 * Notify venue to complete profile
 */
async function notifyProfileIncompleteVenue(userId) {
  return createNotification({
    recipient: userId,
    type: 'profile_incomplete_venue',
    category: 'action_required',
    priority: 'high',
    title: '🏢 Complete Your Venue Profile',
    message: 'Complete your venue profile to start receiving hosting requests from communities.',
    actionUrl: '/dashboard/profile',
    actionText: 'Complete Profile',
    metadata: {}
  });
}

/**
 * Notify venue of hosting request
 */
async function notifyHostingRequestReceived(userId, communityName, collaborationId) {
  return createNotification({
    recipient: userId,
    type: 'hosting_request',
    category: 'action_required',
    priority: 'high',
    title: '🎪 Hosting Request Received',
    message: `${communityName} wants to host an event at your venue. Review the request!`,
    actionUrl: `/dashboard/collaborations/${collaborationId}`,
    actionText: 'View Request',
    metadata: {
      communityName,
      collaborationId
    }
  });
}

/**
 * Notify venue of rating update
 */
async function notifyVenueRatingUpdated(userId, newRating, eventTitle) {
  return createNotification({
    recipient: userId,
    type: 'venue_rating_updated',
    category: 'status_update',
    priority: 'low',
    title: '⭐ Venue Rating Updated',
    message: `Your venue received a ${newRating}-star rating from "${eventTitle}".`,
    actionUrl: '/dashboard/reviews',
    actionText: 'View Reviews',
    metadata: {
      newRating,
      eventTitle
    }
  });
}

// ===================================
// GENERIC NOTIFICATIONS
// ===================================

/**
 * Notify user of pending subscription payment
 */
async function notifySubscriptionPaymentPending(userId, amount, dueDate) {
  return createNotification({
    recipient: userId,
    type: 'payment_reminder',
    category: 'action_required',
    priority: 'high',
    title: '💳 Payment Due',
    message: `Your subscription payment of ₹${amount} is due on ${new Date(dueDate).toLocaleDateString()}.`,
    actionUrl: '/dashboard/billing',
    actionText: 'Pay Now',
    metadata: {
      amount,
      dueDate
    }
  });
}

module.exports = {
  createNotification,
  notifyMultipleUsers,
  // B2C User
  notifyBookingConfirmed,
  notifyBookingFailed,
  notifyEventReminder,
  notifyCheckinQRReady,
  notifyRateExperience,
  notifyHostReplyFeedback,
  notifyProfileIncompleteUser,
  // Host/Community
  notifyProfileIncompleteHost,
  notifyKYCPending,
  notifyEventDraftIncomplete,
  notifyEventPublished,
  notifyFirstBookingReceived,
  notifyMilestoneReached,
  notifyEventNearingFull,
  notifyCapacityReached,
  notifyRevenueMilestone,
  notifyRatingsUpdated,
  notifyVenueResponseReceived,
  notifyBrandProposalReceived,
  notifyRespondToFeedback,
  // Brand
  notifyProfileIncompleteBrand,
  notifyCommunityProposalReceived,
  notifyPerformanceReportReady,
  // Venue
  notifyProfileIncompleteVenue,
  notifyHostingRequestReceived,
  notifyVenueRatingUpdated,
  // Generic
  notifySubscriptionPaymentPending
};
