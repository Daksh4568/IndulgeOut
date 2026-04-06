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
  
  // Daily payment reconciliation - runs daily at 2:00 AM
  const dailyReconciliationJob = cron.schedule('0 2 * * *', async () => {
    console.log('💰 Running daily payment reconciliation job...');
    await runDailyReconciliation();
  });
  scheduledTasks.push(dailyReconciliationJob);
  
  // Monthly settlement report - runs on 1st of every month at 3:00 AM
  const monthlyReportJob = cron.schedule('0 3 1 * *', async () => {
    console.log('📊 Running monthly settlement report job...');
    await generateMonthlySettlementReports();
  });
  scheduledTasks.push(monthlyReportJob);

  // Pricing timeline auto-update - runs daily at 12:01 AM IST
  const pricingTimelineJob = cron.schedule('1 0 * * *', async () => {
    console.log('💰 Running pricing timeline auto-update job...');
    await applyPricingTimelineChanges();
  });
  scheduledTasks.push(pricingTimelineJob);
  
  console.log('✅ Scheduled jobs initialized:');
  console.log('   - Event reminders: Daily at 9:00 AM');
  console.log('   - Rating requests: Daily at 10:00 AM');
  console.log('   - Profile reminders: Mondays at 9:00 AM');
  console.log('   - Draft event reminders: Wednesdays at 10:00 AM');
  console.log('   - KYC reminders: Fridays at 11:00 AM');
  console.log('   - Low booking alerts: Daily at 8:00 AM');
  console.log('   - Payment reconciliation: Daily at 2:00 AM');
  console.log('   - Monthly settlement reports: 1st of month at 3:00 AM');
  console.log('   - Pricing timeline auto-update: Daily at 12:01 AM');
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
      // Use IST midnight for dedup check
      const IST_OFFSET = 5.5 * 60 * 60 * 1000;
      const todayISTStr = new Date(Date.now() + IST_OFFSET).toISOString().split('T')[0];
      const todayISTMidnight = new Date(todayISTStr + 'T00:00:00.000Z');
      todayISTMidnight.setTime(todayISTMidnight.getTime() - IST_OFFSET);
      const existingReminder = await Notification.findOne({
        type: 'event_reminder',
        relatedEvent: event._id,
        createdAt: {
          $gte: todayISTMidnight
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
        profile?.pastEventExperience &&
        profile?.communityDescription &&
        profile?.category && 
        profile?.category.length > 0
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
 * Run daily payment reconciliation - verifies payments with Cashfree
 * Runs every day at 2:00 AM
 */
async function runDailyReconciliation() {
  try {
    const axios = require('axios');
    const Ticket = require('../models/Ticket.js');
    
    // Determine Cashfree API URL
    const CASHFREE_API_URL = process.env.CASHFREE_SECRET_KEY?.startsWith('cfsk_ma_prod_')
      ? 'https://api.cashfree.com'
      : 'https://sandbox.cashfree.com';
    
    console.log('💰 Starting daily payment reconciliation...');
    
    // Get yesterday's date range in IST
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowISTStr = new Date(Date.now() + IST_OFFSET_MS).toISOString().split('T')[0];
    const todayISTMidnightUTC = new Date(new Date(nowISTStr + 'T00:00:00.000Z').getTime() - IST_OFFSET_MS);
    const yesterdayISTMidnightUTC = new Date(todayISTMidnightUTC.getTime() - 24 * 60 * 60 * 1000);
    const yesterday = yesterdayISTMidnightUTC;
    const today = todayISTMidnightUTC;
    
    // Find ONLY unverified paid tickets for reconciliation (purchased in last 30 days)
    // IMPORTANT: Skip already verified tickets (reconciliationStatus: 'verified') 
    // and already settled tickets - only process 'pending' and 'manual_review'
    const tickets = await Ticket.find({
      purchaseDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      status: { $ne: 'cancelled' },
      reconciliationStatus: { $in: ['pending', 'manual_review'] },
      'price.amount': { $gt: 0 }
    });
    
    console.log(`📊 Found ${tickets.length} tickets to reconcile from ${yesterday.toDateString()}`);
    
    let verified = 0;
    let mismatches = 0;
    let failed = 0;
    
    for (const ticket of tickets) {
      try {
        // Fix price format for backward compatibility
        try {
          const rawPrice = ticket.toObject?.().price ?? ticket.price;
          if (typeof rawPrice === 'number') {
            ticket.set('price', { amount: rawPrice, currency: 'INR' });
          } else if (!rawPrice || rawPrice.amount == null) {
            ticket.set('price', {
              amount: ticket.metadata?.basePrice || ticket.metadata?.totalPaid || 0,
              currency: 'INR'
            });
          }
        } catch (priceFixError) {
          console.warn(`⚠️ Could not fix price for ${ticket.ticketNumber}: ${priceFixError.message}`);
        }
        
        // Try metadata.orderId first, fall back to paymentId
        const orderId = ticket.metadata?.orderId || ticket.paymentId;
        
        if (!orderId || !orderId.startsWith('ORDER_')) {
          console.warn(`⚠️ Ticket ${ticket.ticketNumber} missing orderId - marking for manual review`);
          ticket.reconciliationStatus = 'manual_review';
          ticket.reconciliationNotes = 'Missing orderId - no Cashfree order reference found';
          ticket.lastReconciliationDate = new Date();
          await ticket.save({ validateBeforeSave: false });
          failed++;
          continue;
        }
        
        // Backfill orderId in metadata if missing
        if (!ticket.metadata?.orderId && orderId) {
          ticket.set('metadata.orderId', orderId);
        }
        
        // Fetch order details from Cashfree
        const cashfreeResponse = await axios.get(
          `${CASHFREE_API_URL}/pg/orders/${orderId}`,
          {
            headers: {
              'x-client-id': process.env.CASHFREE_APP_ID,
              'x-client-secret': process.env.CASHFREE_SECRET_KEY,
              'x-api-version': '2023-08-01'
            }
          }
        );
        
        const order = cashfreeResponse.data;
        
        // Check payment status
        if (order.order_status === 'PAID') {
          const cashfreeAmount = order.order_amount;
          const expectedAmount = ticket.metadata?.totalPaid || (ticket.metadata?.basePrice * 1.056);
          
          // Allow ±₹2 tolerance for rounding
          const difference = Math.abs(cashfreeAmount - expectedAmount);
          
          if (difference <= 2) {
            // Amount matches - mark as verified
            ticket.reconciliationStatus = 'verified';
            // Only set to 'captured' if not already settled
            if (!ticket.settlementStatus || ticket.settlementStatus === 'pending') {
              ticket.settlementStatus = 'captured';
            }
            ticket.lastReconciliationDate = new Date();
            
            // Store gateway response
            if (!ticket.gatewayResponse) {
              ticket.gatewayResponse = {};
            }
            ticket.gatewayResponse.paymentStatus = order.order_status;
            ticket.gatewayResponse.paymentMethod = order.payment_method || 'unknown';
            
            verified++;
            console.log(`✅ Verified: ${ticket.ticketNumber} (${orderId})`);
          } else {
            // Amount mismatch - needs review
            ticket.reconciliationStatus = 'mismatch';
            ticket.reconciliationNotes = `Amount mismatch: Expected ₹${expectedAmount}, Cashfree shows ₹${cashfreeAmount} (diff: ₹${difference})`;
            ticket.lastReconciliationDate = new Date();
            
            mismatches++;
            console.warn(`⚠️ Mismatch: ${ticket.ticketNumber} - expected ₹${expectedAmount}, got ₹${cashfreeAmount}`);
          }
          
          await ticket.save({ validateBeforeSave: false });
        } else {
          // Payment not successful
          ticket.reconciliationStatus = 'manual_review';
          ticket.reconciliationNotes = `Cashfree status: ${order.order_status}`;
          ticket.lastReconciliationDate = new Date();
          await ticket.save({ validateBeforeSave: false });
          failed++;
          console.warn(`⚠️ Payment not successful: ${ticket.ticketNumber} (${order.order_status})`);
        }
        
        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const env = CASHFREE_API_URL.includes('sandbox') ? 'sandbox' : 'production';
        console.error(`❌ Error reconciling ticket ${ticket.ticketNumber}:`, error.message);
        ticket.reconciliationStatus = 'manual_review';
        ticket.reconciliationNotes = error.response?.status === 404 
          ? `Order not found in Cashfree ${env} (404). Order may have been created in a different environment.`
          : `Reconciliation error: ${error.message}`;
        ticket.lastReconciliationDate = new Date();
        await ticket.save({ validateBeforeSave: false });
        failed++;
      }
    }
    
    // Check settlement for verified/captured payments (payment confirmed but money not yet transferred to bank)
    // IMPORTANT: Skip 'settled' tickets (already confirmed bank transfer with UTR)
    // 'pending' tickets should have been upgraded to 'captured' by the reconciliation step above
    const ticketsToCheckSettlement = await Ticket.find({
      settlementStatus: { $in: ['pending', 'captured'] },
      reconciliationStatus: 'verified',
      purchaseDate: { $gte: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
      'price.amount': { $gt: 0 }
    });
    
    console.log(`🏦 Checking settlement status for ${ticketsToCheckSettlement.length} captured payments...`);
    
    let settled = 0;
    for (const ticket of ticketsToCheckSettlement) {
      try {
        // Fix price format for backward compatibility
        try {
          const rawPrice = ticket.toObject?.().price ?? ticket.price;
          if (typeof rawPrice === 'number') {
            ticket.set('price', { amount: rawPrice, currency: 'INR' });
          } else if (!rawPrice || rawPrice.amount == null) {
            ticket.set('price', {
              amount: ticket.metadata?.basePrice || ticket.metadata?.totalPaid || 0,
              currency: 'INR'
            });
          }
        } catch (priceFixError) {
          // Non-critical, continue
        }
        
        const orderId = ticket.metadata?.orderId || ticket.paymentId;
        if (!orderId || !orderId.startsWith('ORDER_')) continue;
        
        // Fetch settlement details with retry logic for rate limiting
        let settlementResponse;
        let retries = 0;
        while (retries < 3) {
          try {
            settlementResponse = await axios.get(
              `${CASHFREE_API_URL}/pg/orders/${orderId}/settlements`,
              {
                headers: {
                  'x-client-id': process.env.CASHFREE_APP_ID,
                  'x-client-secret': process.env.CASHFREE_SECRET_KEY,
                  'x-api-version': '2023-08-01'
                }
              }
            );
            break; // Success, exit retry loop
          } catch (err) {
            if (err.response?.status === 429 && retries < 2) {
              // Rate limited, wait longer and retry
              retries++;
              const waitTime = 2000 * retries; // 2s, 4s
              console.log(`⏳ Rate limited for ${ticket.ticketNumber}, waiting ${waitTime}ms (retry ${retries}/2)`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              throw err; // Re-throw if not 429 or max retries reached
            }
          }
        }
        
        // Parse settlement response - handle multiple Cashfree response formats
        const rawSettlementData = settlementResponse.data;
        let settlements = [];
        if (Array.isArray(rawSettlementData)) {
          settlements = rawSettlementData;
        } else if (rawSettlementData && typeof rawSettlementData === 'object') {
          if (Array.isArray(rawSettlementData.data)) {
            settlements = rawSettlementData.data;
          } else if (rawSettlementData.settlement_amount != null || rawSettlementData.cf_settlement_id != null) {
            settlements = [rawSettlementData];
          }
        }
        
        if (settlements.length > 0) {
          const settlement = settlements[0];
          const utr = settlement.transfer_utr || settlement.settlement_utr || '';
          
          if (settlement.settlement_amount != null && utr) {
            // UTR exists = Cashfree has actually transferred the money to bank
            ticket.settlementStatus = 'settled';
            ticket.settlementDate = new Date(settlement.transfer_time || settlement.settlement_date || Date.now());
            ticket.settlementUTR = utr;
            ticket.settlementAmount = settlement.settlement_amount;
            ticket.cashfreeServiceCharge = settlement.service_charge || 0;
            ticket.cashfreeServiceTax = settlement.service_tax || 0;
            await ticket.save({ validateBeforeSave: false });
            
            settled++;
            console.log(`✅ Settlement confirmed: ${ticket.ticketNumber} (UTR: ${utr})`);
          }
          // If settlement_amount exists but no UTR, payment is not yet settled by Cashfree
        }
        
        // Increased delay to avoid rate limiting (1 second between requests)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        // Handle different error types
        if (error.response?.status === 429) {
          console.error(`❌ Rate limit exceeded for ${ticket.ticketNumber} after retries`);
        } else if (error.response?.status === 404) {
          // Settlement not available yet - skip silently
        } else {
          console.error(`Error checking settlement for ${ticket.ticketNumber}:`, error.message);
        }
      }
    }
    
    console.log(`✨ Daily reconciliation completed:`);
    console.log(`   ✅ Verified: ${verified}`);
    console.log(`   ⚠️ Mismatches: ${mismatches}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   🏦 Settled: ${settled}`);
    
    // Send alert if there are mismatches
    if (mismatches > 0 || failed > 5) {
      console.warn(`🚨 ALERT: ${mismatches} mismatches and ${failed} failed reconciliations detected!`);
      
      // Send notification to all admin users
      try {
        const adminUsers = await User.find({ role: 'admin' }).select('_id name email');
        
        for (const admin of adminUsers) {
          await notificationService.createNotification({
            recipient: admin._id,
            type: 'admin_review_required',
            category: 'action_required',
            priority: 'high',
            title: '🚨 Payment Reconciliation Alert',
            message: `Daily reconciliation found ${mismatches} payment mismatches and ${failed} failed verifications. Immediate review required.`,
            actionUrl: '/admin/reports/reconciliation',
            metadata: {
              verified,
              mismatches,
              failed,
              settled,
              date: yesterday.toISOString()
            }
          });
        }
        
        console.log(`✅ Alert sent to ${adminUsers.length} admin users`);
      } catch (notifError) {
        console.error('❌ Error sending admin alerts:', notifError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in runDailyReconciliation:', error);
  }
}

/**
 * Generate monthly settlement reports for all organizers
 * Runs on 1st of every month at 3:00 AM
 */
async function generateMonthlySettlementReports() {
  try {
    const Ticket = require('../models/Ticket.js');
    const fs = require('fs');
    const path = require('path');
    
    console.log('📊 Generating monthly settlement reports...');
    
    // Get last month's date range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthName = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    console.log(`📅 Generating reports for: ${monthName}`);
    
    // Get all tickets from last month
    const tickets = await Ticket.find({
      purchaseDate: { $gte: lastMonth, $lt: thisMonth },
      status: { $ne: 'cancelled' }
    }).populate('event', 'title host')
      .populate('user', 'name email');
    
    console.log(`📊 Found ${tickets.length} tickets from ${monthName}`);
    
    // Group tickets by organizer
    const organizerTickets = new Map();
    
    for (const ticket of tickets) {
      if (!ticket.event || !ticket.event.host) continue;
      
      const organizerId = ticket.event.host.toString();
      
      if (!organizerTickets.has(organizerId)) {
        organizerTickets.set(organizerId, []);
      }
      
      organizerTickets.get(organizerId).push(ticket);
    }
    
    console.log(`👥 Generating reports for ${organizerTickets.size} organizers...`);
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const monthDir = path.join(reportsDir, lastMonth.toISOString().substring(0, 7)); // YYYY-MM
    if (!fs.existsSync(monthDir)) {
      fs.mkdirSync(monthDir, { recursive: true });
    }
    
    let reportsGenerated = 0;
    
    for (const [organizerId, tickets] of organizerTickets.entries()) {
      try {
        const totalRevenue = tickets.reduce((sum, t) => sum + (t.metadata?.basePrice || 0), 0);
        const totalSettled = tickets.filter(t => t.settlementStatus === 'settled').length;
        const totalPending = tickets.filter(t => t.settlementStatus === 'pending' || t.settlementStatus === 'captured').length;
        const totalAmount = tickets.reduce((sum, t) => sum + (t.settlementAmount || 0), 0);
        
        const report = {
          organizerId,
          month: monthName,
          generatedAt: new Date().toISOString(),
          summary: {
            totalTickets: tickets.length,
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            totalSettledAmount: parseFloat(totalAmount.toFixed(2)),
            ticketsSettled: totalSettled,
            ticketsPending: totalPending
          },
          tickets: tickets.map(t => ({
            ticketNumber: t.ticketNumber,
            eventTitle: t.event?.title,
            userName: t.user?.name,
            userEmail: t.user?.email,
            purchaseDate: t.purchaseDate,
            basePrice: t.metadata?.basePrice,
            totalPaid: t.metadata?.totalPaid,
            orderId: t.metadata?.orderId,
            settlementStatus: t.settlementStatus,
            settlementDate: t.settlementDate,
            settlementUTR: t.settlementUTR,
            settlementAmount: t.settlementAmount,
            reconciliationStatus: t.reconciliationStatus
          }))
        };
        
        // Save report as JSON
        const reportPath = path.join(monthDir, `organizer_${organizerId}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        reportsGenerated++;
        console.log(`✅ Report generated for organizer ${organizerId}: ${tickets.length} tickets, ₹${totalRevenue}`);
        
      } catch (error) {
        console.error(`❌ Error generating report for organizer ${organizerId}:`, error.message);
      }
    }
    
    console.log(`✨ Monthly report generation completed: ${reportsGenerated} reports generated`);
    
  } catch (error) {
    console.error('❌ Error in generateMonthlySettlementReports:', error);
  }
}

/**
 * Apply pricing timeline changes automatically
 * Runs daily at 12:01 AM IST — detects when a new pricing tier becomes active
 * and logs it in priceChangeHistory with reason 'timeline_automatic'
 */
async function applyPricingTimelineChanges() {
  try {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(Date.now() + IST_OFFSET).toISOString().split('T')[0];
    const toISTDateStr = (d) => new Date(new Date(d).getTime() + IST_OFFSET).toISOString().split('T')[0];

    // Find all published/live events with pricing timeline enabled and date in the future
    const events = await Event.find({
      status: { $in: ['published', 'live'] },
      date: { $gte: new Date() },
      'pricingTimeline.enabled': true,
      'pricingTimeline.tiers.0': { $exists: true }
    });

    console.log(`💰 [Pricing Timeline] Found ${events.length} events with active pricing timelines`);

    let updated = 0;

    for (const event of events) {
      // Find which tier is active today
      const activeTier = event.pricingTimeline.tiers.find(tier => {
        const startStr = toISTDateStr(tier.startDate);
        const endStr = toISTDateStr(tier.endDate);
        return todayIST >= startStr && todayIST <= endStr;
      });

      if (!activeTier) continue;

      const currentStoredPrice = event.price?.amount || 0;
      const tierPrice = activeTier.price;

      // Check if gender pricing is also enabled — update gender prices from the tier
      const hasGenderPricing = event.genderPricing?.enabled && activeTier.malePrice != null && activeTier.femalePrice != null;
      const genderChanged = hasGenderPricing && (
        event.genderPricing.malePrice !== activeTier.malePrice ||
        event.genderPricing.femalePrice !== activeTier.femalePrice
      );

      // Only log if the stored price differs from the active tier price (or gender prices changed)
      if (currentStoredPrice === tierPrice && !genderChanged) continue;

      // Check if we already logged this tier transition today
      const alreadyLogged = (event.priceChangeHistory || []).some(change => {
        if (change.reason !== 'timeline_automatic') return false;
        const changeDate = toISTDateStr(change.changedAt);
        return changeDate === todayIST && change.newPrice === tierPrice;
      });

      if (alreadyLogged) continue;

      // Push price change history entry and update stored price atomically
      const updateFields = { 'price.amount': tierPrice };
      // If gender pricing is enabled and the tier has gender prices, sync them
      if (hasGenderPricing) {
        updateFields['genderPricing.malePrice'] = activeTier.malePrice;
        updateFields['genderPricing.femalePrice'] = activeTier.femalePrice;
      }

      await Event.findByIdAndUpdate(event._id, {
        $set: updateFields,
        $push: {
          priceChangeHistory: {
            previousPrice: currentStoredPrice,
            newPrice: tierPrice,
            changedAt: new Date(),
            reason: 'timeline_automatic',
            spotsBookedAtPrevPrice: event.currentParticipants || 0,
            groupingOffersSnapshot: {
              enabled: event.groupingOffers?.enabled || false,
              tiers: (event.groupingOffers?.tiers || []).map(t => ({
                people: t.people,
                price: t.price,
                label: t.label || ''
              }))
            }
          }
        }
      });

      console.log(`  ✅ ${event.title}: ₹${currentStoredPrice} → ₹${tierPrice} (tier: ${activeTier.label || 'unnamed'})${hasGenderPricing ? ` | Male: ₹${activeTier.malePrice}, Female: ₹${activeTier.femalePrice}` : ''}`);
      updated++;
    }

    console.log(`💰 [Pricing Timeline] Updated ${updated} event(s)`);
  } catch (error) {
    console.error('❌ Error in pricing timeline auto-update:', error);
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
  sendLowBookingAlerts,
  runDailyReconciliation,
  generateMonthlySettlementReports,
  applyPricingTimelineChanges
};
