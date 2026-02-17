const cron = require('node-cron');
const Event = require('../models/Event.js');
const User = require('../models/User.js');
const Notification = require('../models/Notification.js');
const notificationService = require('../services/notificationService.js');

// Store scheduled task references for cleanup if needed
const scheduledTasks = [];

/**
 * Initialize all scheduled jobs
 */
function initializeScheduledJobs() {
  console.log('🕐 Initializing scheduled notification jobs...');
  
  // Event reminders - runs daily at 9:00 AM
  const eventReminderJob = cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running event reminder job...');
    await sendEventReminders();
  });
  scheduledTasks.push(eventReminderJob);
  
  // Post-event rating requests - runs daily at 10:00 AM
  const ratingRequestJob = cron.schedule('0 10 * * *', async () => {
    console.log('⭐ Running post-event rating request job...');
    await sendRatingRequests();
  });
  scheduledTasks.push(ratingRequestJob);
  
  // Profile incomplete reminders - runs every Monday at 9:00 AM
  const profileReminderJob = cron.schedule('0 9 * * 1', async () => {
    console.log('👤 Running profile incomplete reminder job...');
    await sendProfileIncompleteReminders();
  });
  scheduledTasks.push(profileReminderJob);
  
  // Draft event reminders - runs every Wednesday at 10:00 AM
  const draftEventJob = cron.schedule('0 10 * * 3', async () => {
    console.log('📝 Running draft event reminder job...');
    await sendDraftEventReminders();
  });
  scheduledTasks.push(draftEventJob);
  
  // KYC pending reminders - runs every Friday at 11:00 AM
  const kycReminderJob = cron.schedule('0 11 * * 5', async () => {
    console.log('💳 Running KYC pending reminder job...');
    await sendKYCPendingReminders();
  });
  scheduledTasks.push(kycReminderJob);
  
  // Low booking alerts - runs daily at 8:00 AM
  const lowBookingAlertJob = cron.schedule('0 8 * * *', async () => {
    console.log('⚠️ Running low booking alert job...');
    await sendLowBookingAlerts();
  });
  scheduledTasks.push(lowBookingAlertJob);
  
  console.log('✅ Scheduled jobs initialized:');
  console.log('   - Event reminders: Daily at 9:00 AM');
  console.log('   - Rating requests: Daily at 10:00 AM');
  console.log('   - Profile reminders: Mondays at 9:00 AM');
  console.log('   - Draft event reminders: Wednesdays at 10:00 AM');
  console.log('   - KYC reminders: Fridays at 11:00 AM');
  console.log('   - Low booking alerts: Daily at 8:00 AM');
}

/**
 * Send event reminders - 24 hours before event
 */
async function sendEventReminders() {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
    // Find events happening tomorrow
    const upcomingEvents = await Event.find({
      date: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: 'published'
    }).populate('participants.user');
    
    console.log(`📅 Found ${upcomingEvents.length} events happening tomorrow`);
    
    for (const event of upcomingEvents) {
      // Check if we already sent reminder for this event today
      const existingReminder = await Notification.findOne({
        type: 'event_reminder',
        relatedEvent: event._id,
        createdAt: {
          $gte: new Date(now.setHours(0, 0, 0, 0))
        }
      });
      
      if (existingReminder) {
        console.log(`⏭️ Skipping event ${event.title} - reminder already sent today`);
        continue;
      }
      
      // Send reminder to all participants
      for (const participant of event.participants) {
        if (participant.user && participant.user._id) {
          try {
            await notificationService.notifyEventReminder(
              participant.user._id,
              event
            );
          } catch (error) {
            console.error(`❌ Error sending reminder to user ${participant.user._id}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Sent reminders for event: ${event.title}`);
    }
    
    console.log('✨ Event reminder job completed');
  } catch (error) {
    console.error('❌ Error in sendEventReminders:', error);
  }
}

/**
 * Send post-event rating requests
 */
async function sendRatingRequests() {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    // Find events that happened yesterday
    const pastEvents = await Event.find({
      date: {
        $gte: twoDaysAgo,
        $lt: yesterday
      },
      status: 'published'
    }).populate('participants.user');
    
    console.log(`⭐ Found ${pastEvents.length} events from yesterday`);
    
    for (const event of pastEvents) {
      // Check if we already sent rating request for this event
      const existingRequest = await Notification.findOne({
        type: 'rate_experience',
        relatedEvent: event._id
      });
      
      if (existingRequest) {
        console.log(`⏭️ Skipping event ${event.title} - rating request already sent`);
        continue;
      }
      
      // Send rating request to all participants
      for (const participant of event.participants) {
        if (participant.user && participant.user._id) {
          try {
            await notificationService.notifyRateExperience(
              participant.user._id,
              event
            );
          } catch (error) {
            console.error(`❌ Error sending rating request to user ${participant.user._id}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Sent rating requests for event: ${event.title}`);
    }
    
    console.log('✨ Rating request job completed');
  } catch (error) {
    console.error('❌ Error in sendRatingRequests:', error);
  }
}

/**
 * Check if user profile is complete based on role
 */
function isProfileComplete(user) {
  if (user.role === 'user') {
    return !!(user.name && user.email && user.phoneNumber);
  }
  
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

/**
 * Send profile incomplete reminders
 */
async function sendProfileIncompleteReminders() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get all non-admin users
    const users = await User.find({ role: { $ne: 'admin' } });
    
    console.log(`👤 Checking ${users.length} users for profile completeness`);
    
    let remindersSent = 0;
    
    for (const user of users) {
      // Check if profile is complete using comprehensive checks
      if (isProfileComplete(user)) {
        continue; // Profile is complete, skip
      }
      
      // Determine notification type based on role and hostPartnerType
      let notificationType;
      if (user.role === 'host_partner') {
        if (user.hostPartnerType === 'venue') {
          notificationType = 'profile_incomplete_venue';
        } else if (user.hostPartnerType === 'brand_sponsor') {
          notificationType = 'profile_incomplete_brand_sponsor';
        } else if (user.hostPartnerType === 'community_organizer') {
          notificationType = 'profile_incomplete_community_organizer';
        } else {
          notificationType = 'profile_incomplete_community_organizer';
        }
      } else {
        notificationType = 'profile_incomplete';
      }

      // Check if we already sent reminder in the last 7 days
      const recentReminder = await Notification.findOne({
        recipient: user._id,
        type: notificationType,
        createdAt: { $gte: sevenDaysAgo }
      });
      
      if (recentReminder) {
        continue; // Already reminded recently
      }
      
      // Send appropriate reminder based on role and type
      try {
        if (user.role === 'host_partner') {
          if (user.hostPartnerType === 'venue') {
            await notificationService.notifyProfileIncompleteVenue(user._id);
          } else if (user.hostPartnerType === 'brand_sponsor') {
            await notificationService.notifyProfileIncompleteBrand(user._id);
          } else {
            await notificationService.notifyProfileIncompleteHost(user._id);
          }
        } else {
          const missingFields = [];
          if (!user.name) missingFields.push('name');
          if (!user.phoneNumber) missingFields.push('phoneNumber');
          
          await notificationService.notifyProfileIncompleteUser(user._id, missingFields);
        }
        remindersSent++;
        console.log(`✅ Sent profile reminder to: ${user.name || user.email} (${user.hostPartnerType || 'user'})`);
      } catch (error) {
        console.error(`❌ Error sending profile reminder to user ${user._id}:`, error.message);
      }
    }
    
    console.log(`✨ Profile reminder job completed - Sent ${remindersSent} reminders`);
  } catch (error) {
    console.error('❌ Error in sendProfileIncompleteReminders:', error);
  }
}

/**
 * Send draft event reminders to hosts
 */
async function sendDraftEventReminders() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Find draft events created more than 7 days ago
    const draftEvents = await Event.find({
      status: 'draft',
      createdAt: { $lte: sevenDaysAgo }
    }).populate('host');
    
    console.log(`📝 Found ${draftEvents.length} draft events older than 7 days`);
    
    for (const event of draftEvents) {
      if (!event.host) continue;
      
      // Check if we already sent reminder for this draft
      const recentReminder = await Notification.findOne({
        recipient: event.host._id,
        type: 'event_draft_incomplete',
        relatedEvent: event._id,
        createdAt: { $gte: sevenDaysAgo }
      });
      
      if (recentReminder) {
        console.log(`⏭️ Skipping draft ${event.title} - already reminded recently`);
        continue;
      }
      
      try {
        await notificationService.notifyEventDraftIncomplete(
          event.host._id,
          event._id,
          event.title
        );
        console.log(`✅ Sent draft reminder for event: ${event.title}`);
      } catch (error) {
        console.error(`❌ Error sending draft reminder for event ${event._id}:`, error.message);
      }
    }
    
    console.log('✨ Draft event reminder job completed');
  } catch (error) {
    console.error('❌ Error in sendDraftEventReminders:', error);
  }
}

/**
 * Check if KYC/Payout details are complete
 */
function isKYCComplete(user) {
  if (user.role !== 'host_partner') return true;
  
  const payout = user.payoutDetails;
  return !!(
    payout?.accountHolderName &&
    payout?.accountNumber &&
    payout?.ifscCode &&
    payout?.billingAddress
  );
}

/**
 * Send KYC pending reminders to hosts
 */
async function sendKYCPendingReminders() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Find all B2B users (host_partners)
    const hosts = await User.find({ role: 'host_partner' });
    
    console.log(`💳 Checking ${hosts.length} hosts for KYC completeness`);
    
    let remindersSent = 0;
    
    for (const host of hosts) {
      // Check if KYC is complete using comprehensive check
      if (isKYCComplete(host)) {
        continue; // KYC is complete, skip
      }
      
      // Check if we already sent reminder in the last 7 days
      const recentReminder = await Notification.findOne({
        recipient: host._id,
        type: 'kyc_pending',
        createdAt: { $gte: sevenDaysAgo }
      });
      
      if (recentReminder) {
        continue; // Already reminded recently
      }
      
      try {
        await notificationService.notifyKYCPending(host._id);
        remindersSent++;
        console.log(`✅ Sent KYC reminder to: ${host.name || host.email} (${host.hostPartnerType})`);
      } catch (error) {
        console.error(`❌ Error sending KYC reminder to host ${host._id}:`, error.message);
      }
    }
    
    console.log(`✨ KYC reminder job completed - Sent ${remindersSent} reminders`);
  } catch (error) {
    console.error('❌ Error in sendKYCPendingReminders:', error);
  }
}

/**
 * Send low booking alerts to hosts for events within 7 days with <40% capacity
 */
async function sendLowBookingAlerts() {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Find upcoming events within 7 days
    const upcomingEvents = await Event.find({
      date: {
        $gte: now,
        $lte: sevenDaysFromNow
      },
      status: { $in: ['published', 'live'] },
      maxParticipants: { $gt: 0 } // Only events with capacity limits
    }).populate('host');
    
    console.log(`⚠️ Found ${upcomingEvents.length} upcoming events to check for low bookings`);
    
    let alertsSent = 0;
    
    for (const event of upcomingEvents) {
      if (!event.host) continue;
      
      // Calculate fill percentage
      const currentParticipants = event.currentParticipants || 0;
      const fillPercentage = Math.round((currentParticipants / event.maxParticipants) * 100);
      
      // Only alert if booking is below 40%
      if (fillPercentage >= 40) {
        continue;
      }
      
      // Calculate days until event
      const daysLeft = Math.ceil((new Date(event.date) - now) / (1000 * 60 * 60 * 24));
      
      // Check if we already sent alert for this event in the last 3 days
      const recentAlert = await Notification.findOne({
        recipient: event.host._id,
        type: 'low_booking_alert',
        relatedEvent: event._id,
        createdAt: {
          $gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        }
      });
      
      if (recentAlert) {
        console.log(`⏭️ Skipping ${event.title} - alert sent within last 3 days`);
        continue;
      }
      
      try {
        await notificationService.notifyLowBookingAlert(
          event.host._id,
          event,
          fillPercentage,
          daysLeft
        );
        alertsSent++;
        console.log(`✅ Low booking alert sent for: ${event.title} (${fillPercentage}% filled, ${daysLeft} days left)`);
      } catch (error) {
        console.error(`❌ Error sending low booking alert for event ${event._id}:`, error.message);
      }
    }
    
    console.log(`✨ Low booking alert job completed - Sent ${alertsSent} alerts`);
  } catch (error) {
    console.error('❌ Error in sendLowBookingAlerts:', error);
  }
}

/**
 * Stop all scheduled tasks (for cleanup/testing)
 */
function stopAllJobs() {
  console.log('🛑 Stopping all scheduled jobs...');
  scheduledTasks.forEach(task => task.stop());
  console.log('✅ All scheduled jobs stopped');
}

module.exports = {
  initializeScheduledJobs,
  stopAllJobs,
  // Export individual functions for manual testing
  sendEventReminders,
  sendRatingRequests,
  sendProfileIncompleteReminders,
  sendDraftEventReminders,
  sendKYCPendingReminders,
  sendLowBookingAlerts
};
