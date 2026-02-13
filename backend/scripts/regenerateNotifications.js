/**
 * Script to clear all notifications and regenerate them based on current user/system state
 * This will create appropriate notifications for all users (B2C and B2B)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Collaboration = require('../models/Collaboration');
const Notification = require('../models/Notification');
const { 
  createNotification,
  createProfileIncompleteNotification,
  createKYCReminderNotification 
} = require('../services/notificationService');

async function clearAllNotifications() {
  console.log('🗑️  Clearing all existing notifications...');
  const result = await Notification.deleteMany({});
  console.log(`✅ Deleted ${result.deletedCount} notifications`);
}

async function checkProfileComplete(user) {
  // B2C user profile check
  if (user.role === 'user') {
    return !!(user.name && user.email && user.phoneNumber);
  }

  // B2B profile checks
  if (user.role === 'host_partner') {
    if (user.hostPartnerType === 'community_organizer') {
      const profile = user.communityProfile;
      return !!(
        profile?.communityName &&
        profile?.city &&
        profile?.eventExperience &&
        profile?.description &&
        profile?.eventCategories && 
        profile?.eventCategories.length > 0
      );
    } else if (user.hostPartnerType === 'venue') {
      const profile = user.venueProfile;
      return !!(
        profile?.venueName &&
        profile?.venueType &&
        profile?.capacityRange &&
        profile?.city &&
        profile?.locality &&
        profile?.photos && 
        profile?.photos.length > 0
      );
    } else if (user.hostPartnerType === 'brand_sponsor') {
      const profile = user.brandProfile;
      return !!(
        profile?.brandName &&
        profile?.industry &&
        profile?.targetAudience &&
        profile?.city &&
        profile?.brandDescription
      );
    }
  }

  return true;
}

async function checkKYCComplete(user) {
  if (user.role !== 'host_partner') return true;
  
  const payout = user.payoutDetails;
  return !!(
    payout?.accountHolderName &&
    payout?.accountNumber &&
    payout?.ifscCode &&
    payout?.billingAddress
  );
}

async function checkSubscriptionActive(user) {
  if (user.role !== 'host_partner') return true;
  
  // Check if subscription exists and is active
  const subscription = user.subscription;
  return !!(
    subscription?.plan &&
    subscription?.status === 'active' &&
    subscription?.expiresAt &&
    new Date(subscription.expiresAt) > new Date()
  );
}

async function generateNotificationsForUser(user) {
  const notifications = [];

  // Skip notification generation for admin users
  if (user.role === 'admin') {
    return notifications;
  }

  console.log(`\n👤 Processing user: ${user.email} (${user.role}${user.hostPartnerType ? ` - ${user.hostPartnerType}` : ''})`);

  // 1. Profile Incomplete Notification (ALL USERS)
  const isProfileComplete = await checkProfileComplete(user);
  console.log(`   Profile complete: ${isProfileComplete}`);
  
  if (!isProfileComplete) {
    let title, message, ctaText, actionUrl;

    if (user.role === 'user') {
      title = 'Complete Your Profile';
      message = 'Complete your profile to book events faster and join exclusive communities.';
      ctaText = 'Complete Profile';
      actionUrl = '/profile';
    } else if (user.hostPartnerType === 'community_organizer') {
      title = 'Complete Your Community Profile';
      message = 'Complete your community profile to publish events.';
      ctaText = 'Complete Profile';
      actionUrl = '/profile';
    } else if (user.hostPartnerType === 'venue') {
      title = 'Complete your venue profile';
      message = 'Add photos, amenities, and venue details to attract more organizers';
      ctaText = 'Complete Profile';
      actionUrl = '/profile';
    } else if (user.hostPartnerType === 'brand_sponsor') {
      title = 'Complete Your Brand Profile';
      message = 'Complete your brand profile to start collaborating.';
      ctaText = 'Complete Profile';
      actionUrl = '/profile';
    }

    const notif = await createNotification({
      recipient: user._id,
      type: user.role === 'user' ? 'profile_incomplete' : `profile_incomplete_${user.hostPartnerType}`,
      category: 'action_required',
      priority: 'high',
      title,
      message,
      actionText: ctaText,
      actionUrl
    });
    notifications.push(notif);
    console.log(`   ✅ Created profile incomplete notification`);
  }

  // 2. KYC / Payout Details (B2B ONLY)
  if (user.role === 'host_partner') {
    const isKYCComplete = await checkKYCComplete(user);
    console.log(`   KYC complete: ${isKYCComplete}`);
    
    if (!isKYCComplete) {
      const notif = await createNotification({
        recipient: user._id,
        type: 'kyc_pending',
        category: 'action_required',
        priority: 'high',
        title: 'Add Payout Details',
        message: 'Add your payout details to receive revenue from ticket sales.',
        actionText: 'Add Payout Details',
        actionUrl: '/kyc-setup'
      });
      notifications.push(notif);
      console.log(`   ✅ Created KYC pending notification`);
    }
  }

  // 3. Subscription Payment Pending (B2B ONLY)
  if (user.role === 'host_partner') {
    const isSubscriptionActive = await checkSubscriptionActive(user);
    console.log(`   Subscription active: ${isSubscriptionActive}`);
    
    if (!isSubscriptionActive) {
      const notif = await createNotification({
        recipient: user._id,
        type: 'subscription_payment_pending',
        category: 'action_required',
        priority: 'medium',
        title: 'Activate Your Subscription',
        message: 'Complete payment to activate collaboration and reach out to brands and venues.',
        actionText: 'Activate Subscription',
        actionUrl: '/subscription'
      });
      notifications.push(notif);
      console.log(`   ✅ Created subscription pending notification`);
    }
  }

  console.log(`   📊 Total notifications created: ${notifications.length}`);
  return notifications;
}

async function generateCollaborationNotifications() {
  console.log('\n📨 Generating collaboration notifications...');
  
  // Find all pending collaboration requests
  const pendingCollaborations = await Collaboration.find({
    status: 'submitted'
  })
  .populate('initiator', 'name communityProfile brandProfile venueProfile')
  .populate('recipient', 'name communityProfile brandProfile venueProfile')
  .lean();

  for (const collab of pendingCollaborations) {
    if (!collab.recipient) continue;

    let title, message;
    const initiatorName = collab.initiator?.communityProfile?.communityName || 
                          collab.initiator?.brandProfile?.brandName ||
                          collab.initiator?.venueProfile?.venueName ||
                          'A partner';

    if (collab.type === 'communityToVenue') {
      title = 'New Hosting Request';
      message = `${initiatorName} sent you a hosting request.`;
    } else if (collab.type === 'communityToBrand') {
      title = 'New Sponsorship Proposal';
      message = `${initiatorName} sent you a collaboration proposal.`;
    } else if (collab.type === 'brandToCommunity') {
      title = 'New Brand Proposal';
      message = `Brand ${initiatorName} sent a collaboration proposal.`;
    } else if (collab.type === 'venueToCommunity') {
      title = 'New Venue Response';
      message = `Venue ${initiatorName} has sent a collaboration proposal.`;
    }

    await createNotification({
      recipient: collab.recipient._id,
      type: `${collab.type}_received`,
      category: 'action_required',
      priority: 'high',
      title,
      message,
      actionText: 'Review Proposal',
      actionUrl: `/collaborations/${collab._id}`,
      relatedCollaboration: collab._id
    });
  }

  // Find all counter-proposals
  const counterProposals = await Collaboration.find({
    status: 'counter_delivered'
  })
  .populate('initiator', 'name communityProfile brandProfile venueProfile')
  .populate('recipient', 'name communityProfile brandProfile venueProfile')
  .lean();

  for (const collab of counterProposals) {
    if (!collab.initiator) continue;

    const recipientName = collab.recipient?.communityProfile?.communityName || 
                          collab.recipient?.brandProfile?.brandName ||
                          collab.recipient?.venueProfile?.venueName ||
                          'Partner';

    await createNotification({
      recipient: collab.initiator._id,
      type: 'counter_proposal_received',
      category: 'action_required',
      priority: 'high',
      title: 'Counter Proposal Received',
      message: `${recipientName} responded to your proposal.`,
      actionText: 'Review Counter',
      actionUrl: `/collaborations/${collab._id}`,
      relatedCollaboration: collab._id
    });
  }

  console.log(`✅ Generated ${pendingCollaborations.length + counterProposals.length} collaboration notifications`);
}

async function generateEventNotifications() {
  console.log('\n📅 Generating event notifications...');
  
  // Find events with low booking (community organizers only)
  const upcomingEvents = await Event.find({
    date: { 
      $gte: new Date(),
      $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
    },
    status: { $in: ['live', 'published'] }
  })
  .populate('host', 'communityProfile hostPartnerType')
  .lean();

  let lowBookingCount = 0;
  for (const event of upcomingEvents) {
    if (!event.host) continue;

    const bookingPercentage = ((event.ticketsSold || event.currentParticipants || 0) / (event.capacity || event.maxParticipants || 100)) * 100;
    const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
    
    console.log(`   Event: "${event.title}" - ${Math.round(bookingPercentage)}% filled, ${daysUntil} days away`);
    
    // Low booking alert if less than 30% booked and event is within 7 days
    if (bookingPercentage < 30) {
      await createNotification({
        recipient: event.host._id,
        type: 'low_booking_alert',
        category: 'action_required',
        priority: daysUntil <= 3 ? 'high' : 'medium',
        title: 'Low Booking Alert',
        message: `Your event "${event.title}" is only ${Math.round(bookingPercentage)}% filled with ${daysUntil} day${daysUntil === 1 ? '' : 's'} to go.`,
        actionText: 'Promote Event',
        actionUrl: `/events/${event._id}/promote`,
        relatedEvent: event._id
      });
      lowBookingCount++;
      console.log(`   ✅ Created low booking alert for "${event.title}"`);
    }
  }

  console.log(`✅ Generated ${lowBookingCount} low booking alert notifications from ${upcomingEvents.length} upcoming events`);
}

async function regenerateAllNotifications() {
  try {
    console.log('🚀 Starting notification regeneration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout');
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Clear all existing notifications
    await clearAllNotifications();

    // Step 2: Generate notifications for all users
    console.log('\n👥 Generating user notifications...');
    const users = await User.find({ role: { $ne: 'admin' } });
    
    let userNotifCount = 0;
    for (const user of users) {
      const notifs = await generateNotificationsForUser(user);
      userNotifCount += notifs.length;
    }
    console.log(`✅ Generated ${userNotifCount} user notifications for ${users.length} users`);

    // Step 3: Generate collaboration notifications
    await generateCollaborationNotifications();

    // Step 4: Generate event notifications
    await generateEventNotifications();

    // Summary
    const totalNotifications = await Notification.countDocuments({});
    console.log('\n' + '='.repeat(50));
    console.log('✅ NOTIFICATION REGENERATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`📊 Total notifications created: ${totalNotifications}`);
    console.log(`👥 Users processed: ${users.length}`);
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error regenerating notifications:', error);
    process.exit(1);
  }
}

// Run the script
regenerateAllNotifications();
