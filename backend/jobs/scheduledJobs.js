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
  
  console.log('✅ Scheduled jobs initialized:');
  console.log('   - Event reminders: Daily at 9:00 AM');
  console.log('   - Rating requests: Daily at 10:00 AM');
  console.log('   - Profile reminders: Mondays at 9:00 AM');
  console.log('   - Draft event reminders: Wednesdays at 10:00 AM');
  console.log('   - KYC reminders: Fridays at 11:00 AM');
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
 * Send profile incomplete reminders
 */
async function sendProfileIncompleteReminders() {
  try {
    // Find users with incomplete profiles who haven't been reminded in 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const users = await User.find({
      $or: [
        { profilePicture: { $exists: false } },
        { location: { $exists: false } },
        { location: null },
        { interests: { $size: 0 } }
      ]
    });
    
    console.log(`👤 Found ${users.length} users with incomplete profiles`);
    
    for (const user of users) {
      // Check if we already sent reminder in the last 7 days
      const recentReminder = await Notification.findOne({
        recipient: user._id,
        type: user.role === 'host_partner' ? 'profile_incomplete_host' : 'profile_incomplete_user',
        createdAt: { $gte: sevenDaysAgo }
      });
      
      if (recentReminder) {
        console.log(`⏭️ Skipping user ${user.name} - already reminded recently`);
        continue;
      }
      
      // Send appropriate reminder based on role
      try {
        if (user.role === 'host_partner') {
          await notificationService.notifyProfileIncompleteHost(user._id);
        } else {
          const missingFields = [];
          if (!user.profilePicture) missingFields.push('profilePicture');
          if (!user.location) missingFields.push('location');
          if (!user.interests || user.interests.length === 0) missingFields.push('interests');
          
          await notificationService.notifyProfileIncompleteUser(user._id, missingFields);
        }
        console.log(`✅ Sent profile reminder to: ${user.name}`);
      } catch (error) {
        console.error(`❌ Error sending profile reminder to user ${user._id}:`, error.message);
      }
    }
    
    console.log('✨ Profile reminder job completed');
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
 * Send KYC pending reminders to hosts
 */
async function sendKYCPendingReminders() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Find hosts with pending KYC (no payout details)
    const hosts = await User.find({
      role: 'host_partner',
      $or: [
        { 'payoutDetails.accountNumber': { $exists: false } },
        { 'payoutDetails.bankName': { $exists: false } }
      ]
    });
    
    console.log(`💳 Found ${hosts.length} hosts with pending KYC`);
    
    for (const host of hosts) {
      // Check if we already sent reminder in the last 7 days
      const recentReminder = await Notification.findOne({
        recipient: host._id,
        type: 'kyc_pending',
        createdAt: { $gte: sevenDaysAgo }
      });
      
      if (recentReminder) {
        console.log(`⏭️ Skipping host ${host.name} - already reminded recently`);
        continue;
      }
      
      try {
        await notificationService.notifyKYCPending(host._id);
        console.log(`✅ Sent KYC reminder to: ${host.name}`);
      } catch (error) {
        console.error(`❌ Error sending KYC reminder to host ${host._id}:`, error.message);
      }
    }
    
    console.log('✨ KYC reminder job completed');
  } catch (error) {
    console.error('❌ Error in sendKYCPendingReminders:', error);
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
  sendKYCPendingReminders
};
