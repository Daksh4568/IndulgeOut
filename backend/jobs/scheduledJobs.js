const cron = require('node-cron');
const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const notificationService = require('../services/notificationService');

// Job to send event reminders 24 hours before the event
const sendEventReminders = cron.schedule('0 9 * * *', async () => {
  // Runs daily at 9:00 AM
  console.log('Running event reminder job...');

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find events happening in the next 24-48 hours
    const upcomingEvents = await Event.find({
      eventDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: 'active'
    }).populate({
      path: 'participants.user',
      select: 'name email emailNotifications eventReminders'
    });

    console.log(`Found ${upcomingEvents.length} events happening tomorrow`);

    for (const event of upcomingEvents) {
      // Notify all registered participants
      for (const participant of event.participants) {
        if (participant.user) {
          try {
            await notificationService.notifyEventReminder(
              participant.user._id,
              event,
              event.eventDate
            );
          } catch (error) {
            console.error(`Failed to send reminder to user ${participant.user._id}:`, error);
          }
        }
      }
    }

    console.log('Event reminder job completed');
  } catch (error) {
    console.error('Error in event reminder job:', error);
  }
}, {
  scheduled: false // Don't start immediately, will be started manually
});

// Job to send post-event rating requests
const sendPostEventRatings = cron.schedule('0 10 * * *', async () => {
  // Runs daily at 10:00 AM
  console.log('Running post-event rating job...');

  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Find events that ended yesterday
    const completedEvents = await Event.find({
      eventDate: {
        $gte: yesterday,
        $lt: today
      },
      status: 'active'
    }).populate({
      path: 'participants.user',
      select: 'name email emailNotifications'
    });

    console.log(`Found ${completedEvents.length} events completed yesterday`);

    for (const event of completedEvents) {
      // Notify all participants to rate their experience
      for (const participant of event.participants) {
        if (participant.user) {
          try {
            await notificationService.notifyRateExperience(
              participant.user._id,
              event
            );
          } catch (error) {
            console.error(`Failed to send rating request to user ${participant.user._id}:`, error);
          }
        }
      }
    }

    console.log('Post-event rating job completed');
  } catch (error) {
    console.error('Error in post-event rating job:', error);
  }
}, {
  scheduled: false
});

// Job to check for incomplete profiles and send reminders (weekly)
const sendProfileIncompleteReminders = cron.schedule('0 9 * * 1', async () => {
  // Runs every Monday at 9:00 AM
  console.log('Running profile incomplete reminder job...');

  try {
    const users = await User.find({
      $or: [
        { interests: { $size: 0 } },
        { location: { $exists: false } },
        { phoneNumber: { $exists: false } }
      ]
    });

    console.log(`Found ${users.length} users with incomplete profiles`);

    for (const user of users) {
      try {
        const missingFields = [];
        if (!user.interests || user.interests.length === 0) missingFields.push('interests');
        if (!user.location) missingFields.push('location');
        if (!user.phoneNumber) missingFields.push('phone number');

        if (user.role === 'user') {
          await notificationService.notifyProfileIncompleteUser(
            user._id,
            missingFields
          );
        } else if (user.role === 'host_partner') {
          await notificationService.notifyProfileIncompleteHost(user._id);
        }
      } catch (error) {
        console.error(`Failed to send profile reminder to user ${user._id}:`, error);
      }
    }

    console.log('Profile incomplete reminder job completed');
  } catch (error) {
    console.error('Error in profile incomplete reminder job:', error);
  }
}, {
  scheduled: false
});

// Job to check for draft events and remind hosts (weekly)
const sendDraftEventReminders = cron.schedule('0 10 * * 3', async () => {
  // Runs every Wednesday at 10:00 AM
  console.log('Running draft event reminder job...');

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const draftEvents = await Event.find({
      status: 'draft',
      createdAt: { $lt: sevenDaysAgo }
    }).populate('host', 'name email emailNotifications');

    console.log(`Found ${draftEvents.length} draft events older than 7 days`);

    for (const event of draftEvents) {
      if (event.host) {
        try {
          await notificationService.notifyEventDraftIncomplete(
            event.host._id,
            event._id,
            event.title || 'Untitled Event'
          );
        } catch (error) {
          console.error(`Failed to send draft reminder for event ${event._id}:`, error);
        }
      }
    }

    console.log('Draft event reminder job completed');
  } catch (error) {
    console.error('Error in draft event reminder job:', error);
  }
}, {
  scheduled: false
});

// Job to check KYC pending status (weekly)
const sendKYCPendingReminders = cron.schedule('0 11 * * 5', async () => {
  // Runs every Friday at 11:00 AM
  console.log('Running KYC pending reminder job...');

  try {
    const hosts = await User.find({
      role: 'host_partner',
      $or: [
        { 'payoutDetails.accountNumber': { $exists: false } },
        { 'payoutDetails.ifscCode': { $exists: false } },
        { 'payoutDetails.accountHolderName': { $exists: false } }
      ]
    });

    console.log(`Found ${hosts.length} hosts with pending KYC details`);

    for (const host of hosts) {
      try {
        await notificationService.notifyKYCPending(host._id);
      } catch (error) {
        console.error(`Failed to send KYC reminder to host ${host._id}:`, error);
      }
    }

    console.log('KYC pending reminder job completed');
  } catch (error) {
    console.error('Error in KYC pending reminder job:', error);
  }
}, {
  scheduled: false
});

// Function to start all scheduled jobs
const startAllJobs = () => {
  console.log('Starting all scheduled jobs...');
  
  sendEventReminders.start();
  console.log('✓ Event reminders job started (daily at 9:00 AM)');
  
  sendPostEventRatings.start();
  console.log('✓ Post-event ratings job started (daily at 10:00 AM)');
  
  sendProfileIncompleteReminders.start();
  console.log('✓ Profile incomplete reminders job started (weekly on Monday at 9:00 AM)');
  
  sendDraftEventReminders.start();
  console.log('✓ Draft event reminders job started (weekly on Wednesday at 10:00 AM)');
  
  sendKYCPendingReminders.start();
  console.log('✓ KYC pending reminders job started (weekly on Friday at 11:00 AM)');
  
  console.log('All scheduled jobs started successfully!');
};

// Function to stop all scheduled jobs
const stopAllJobs = () => {
  sendEventReminders.stop();
  sendPostEventRatings.stop();
  sendProfileIncompleteReminders.stop();
  sendDraftEventReminders.stop();
  sendKYCPendingReminders.stop();
  console.log('All scheduled jobs stopped');
};

module.exports = {
  startAllJobs,
  stopAllJobs,
  sendEventReminders,
  sendPostEventRatings,
  sendProfileIncompleteReminders,
  sendDraftEventReminders,
  sendKYCPendingReminders
};
