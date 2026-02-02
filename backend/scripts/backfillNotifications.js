/**
 * Backfill Notifications Script
 * Creates notifications for existing events and registrations
 * Run: node scripts/backfillNotifications.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  processing: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}\n${colors.magenta}${msg}${colors.reset}\n${colors.magenta}${'='.repeat(60)}${colors.reset}\n`)
};

let stats = {
  eventsProcessed: 0,
  registrationsProcessed: 0,
  notificationsCreated: 0,
  errors: 0
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Connected to MongoDB');
  } catch (error) {
    log.error('MongoDB connection failed: ' + error.message);
    process.exit(1);
  }
}

/**
 * Create notifications for event registrations
 */
async function backfillEventRegistrations() {
  log.section('BACKFILLING EVENT REGISTRATION NOTIFICATIONS');
  
  try {
    // Find all published events
    const events = await Event.find({ 
      status: 'published',
      date: { $gte: new Date() } // Only future events
    }).populate('host').populate('participants.user');
    
    log.info(`Found ${events.length} published upcoming events`);

    for (const event of events) {
      stats.eventsProcessed++;
      log.processing(`Processing event: ${event.title} (${event.participants.length} participants)`);
      
      // Process each participant
      for (const participant of event.participants) {
        if (!participant.user) continue;
        
        try {
          stats.registrationsProcessed++;
          
          // Check if notification already exists
          const existingNotification = await Notification.findOne({
            user: participant.user._id,
            type: 'booking_confirmed',
            'metadata.eventId': event._id.toString()
          });
          
          if (existingNotification) {
            log.warning(`  - Notification already exists for ${participant.user.name}`);
            continue;
          }
          
          // Create booking confirmation notification
          const ticketId = `REG-${event._id.toString().slice(-8)}-${participant.user._id.toString().slice(-6)}`;
          const notification = await notificationService.notifyBookingConfirmed(
            participant.user._id,
            event._id,
            ticketId,
            participant.quantity || 1,
            event.price?.amount || 0
          );
          
          if (notification && notification._id) {
            stats.notificationsCreated++;
            log.success(`  - Created notification for ${participant.user.name} (ID: ${notification._id})`);
          } else {
            log.error(`  - Notification not created for ${participant.user.name}`);
          }
          
        } catch (error) {
          stats.errors++;
          log.error(`  - Failed for ${participant.user.name}: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    log.error('Error backfilling event registrations: ' + error.message);
  }
}

/**
 * Create event reminder notifications for upcoming events
 */
async function createEventReminders() {
  log.section('CREATING EVENT REMINDER NOTIFICATIONS');
  
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Find events happening in the next 24 hours
    const upcomingEvents = await Event.find({
      status: 'published',
      date: { $gte: now, $lte: tomorrow }
    }).populate('participants.user');
    
    log.info(`Found ${upcomingEvents.length} events happening in next 24 hours`);
    
    for (const event of upcomingEvents) {
      for (const participant of event.participants) {
        if (!participant.user) continue;
        
        try {
          // Check if reminder already sent
          const existingReminder = await Notification.findOne({
            user: participant.user._id,
            type: 'event_reminder',
            'metadata.eventId': event._id.toString()
          });
          
          if (existingReminder) continue;
          
          await notificationService.notifyEventReminder(
            participant.user._id,
            event._id,
            '24 hours'
          );
          
          stats.notificationsCreated++;
          log.success(`  - Created 24h reminder for ${participant.user.name}`);
          
        } catch (error) {
          stats.errors++;
          log.error(`  - Failed reminder for ${participant.user.name}: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    log.error('Error creating event reminders: ' + error.message);
  }
}

/**
 * Create notifications for event organizers
 */
async function backfillOrganizerNotifications() {
  log.section('BACKFILLING ORGANIZER NOTIFICATIONS');
  
  try {
    // Find all published events with participants
    const events = await Event.find({ 
      status: 'published',
      currentParticipants: { $gt: 0 }
    }).populate('host');
    
    log.info(`Found ${events.length} events with registrations`);
    
    for (const event of events) {
      if (!event.host) continue;
      
      try {
        // Check if event published notification exists
        const existingNotification = await Notification.findOne({
          user: event.host._id,
          type: 'event_published',
          'metadata.eventId': event._id.toString()
        });
        
        if (!existingNotification) {
          await notificationService.notifyEventPublished(
            event.host._id,
            event._id
          );
          stats.notificationsCreated++;
          log.success(`  - Created event published notification for ${event.host.name}`);
        }
        
        // Create milestone notifications based on registration count
        const milestones = [10, 25, 50, 100];
        for (const milestone of milestones) {
          if (event.currentParticipants >= milestone) {
            const existingMilestone = await Notification.findOne({
              user: event.host._id,
              type: 'registration_milestone',
              'metadata.eventId': event._id.toString(),
              'metadata.milestone': milestone
            });
            
            if (!existingMilestone) {
              await notificationService.notifyRegistrationMilestone(
                event.host._id,
                event._id,
                milestone
              );
              stats.notificationsCreated++;
              log.success(`  - Created ${milestone} registrations milestone for ${event.host.name}`);
            }
          }
        }
        
      } catch (error) {
        stats.errors++;
        log.error(`  - Failed for event ${event.title}: ${error.message}`);
      }
    }
    
  } catch (error) {
    log.error('Error backfilling organizer notifications: ' + error.message);
  }
}

/**
 * Create welcome notifications for new users without notifications
 */
async function createWelcomeNotifications() {
  log.section('CREATING WELCOME NOTIFICATIONS');
  
  try {
    // Find users with no notifications
    const usersWithNoNotifications = await User.find({
      role: 'user'
    });
    
    let welcomeCount = 0;
    
    for (const user of usersWithNoNotifications) {
      const notificationCount = await Notification.countDocuments({ user: user._id });
      
      if (notificationCount === 0) {
        try {
          await notificationService.notifyWelcome(user._id);
          welcomeCount++;
          stats.notificationsCreated++;
          log.success(`  - Created welcome notification for ${user.name}`);
        } catch (error) {
          stats.errors++;
          log.error(`  - Failed for ${user.name}: ${error.message}`);
        }
      }
    }
    
    log.info(`Created ${welcomeCount} welcome notifications`);
    
  } catch (error) {
    log.error('Error creating welcome notifications: ' + error.message);
  }
}

/**
 * Display statistics
 */
async function displayStats() {
  log.section('BACKFILL STATISTICS');
  
  log.info(`Events Processed: ${stats.eventsProcessed}`);
  log.info(`Registrations Processed: ${stats.registrationsProcessed}`);
  log.success(`Notifications Created: ${stats.notificationsCreated}`);
  if (stats.errors > 0) {
    log.error(`Errors Encountered: ${stats.errors}`);
  }
  
  // Verify notifications in database
  log.info('\nVerifying notifications in database...');
  const totalNotifications = await Notification.countDocuments();
  const unreadNotifications = await Notification.countDocuments({ isRead: false });
  log.info(`Total notifications in DB: ${totalNotifications}`);
  log.info(`Unread notifications: ${unreadNotifications}`);
  
  // Show sample notifications
  const sampleNotifications = await Notification.find()
    .populate('recipient', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);
  
  if (sampleNotifications.length > 0) {
    log.info('\nSample Notifications (latest 5):');
    sampleNotifications.forEach((notif, idx) => {
      log.info(`  ${idx + 1}. ${notif.title} - for ${notif.recipient?.name || 'Unknown'} (${notif.type})`);
    });
  }
}

/**
 * Main execution
 */
async function runBackfill() {
  console.log('\n' + colors.cyan + '╔═══════════════════════════════════════════════════════════╗');
  console.log('║        NOTIFICATION BACKFILL SCRIPT                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝' + colors.reset + '\n');
  
  try {
    await connectDB();
    
    // Run all backfill operations
    await backfillEventRegistrations();
    await createEventReminders();
    await backfillOrganizerNotifications();
    await createWelcomeNotifications();
    
    await displayStats();
    
    log.section('BACKFILL COMPLETED SUCCESSFULLY');
    log.success('All existing data has been processed!');
    
  } catch (error) {
    log.error('Backfill failed: ' + error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    log.info('Database connection closed');
    process.exit(0);
  }
}

// Run the backfill
runBackfill();
