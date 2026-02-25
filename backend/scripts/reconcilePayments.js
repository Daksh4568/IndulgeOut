/**
 * Payment Reconciliation Job
 * 
 * PURPOSE: Daily check to ensure all successful payments have tickets
 * RUNS: Every day at 3 AM
 * 
 * WHAT IT DOES:
 * 1. Fetches all Cashfree successful payments from yesterday
 * 2. Compares with tickets in database
 * 3. Auto-fixes missing tickets using fixMissingTicket.js
 * 4. Sends alert email if discrepancies found
 */

require('dotenv').config();
const cron = require('node-cron');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const WebhookLog = require('../models/WebhookLog');
const { sendEmail } = require('../utils/emailService');
const { fixMissingTicket } = require('./fixMissingTicket');

/**
 * Reconcile payments for a specific date
 */
async function reconcilePayments(date = new Date()) {
  try {
    console.log('🔍 [Reconciliation] Starting payment reconciliation for:', date.toDateString());

    // 1. Get all successful webhook payments for the date
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Fetch successful webhook logs (these are confirmed payments)
    const successfulWebhooks = await WebhookLog.find({
      receivedAt: { $gte: startOfDay, $lte: endOfDay },
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      status: 'success'
    }).select('orderId paymentId amount userId eventId ticketCreated ticketId');

    console.log(`📊 [Reconciliation] Found ${successfulWebhooks.length} successful payment webhooks`);

    // 2. Get all tickets created on this date
    const tickets = await Ticket.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).select('orderId user event');

    const ticketOrderIds = new Set(tickets.map(t => t.orderId || t.metadata?.orderId));
    console.log(`🎫 [Reconciliation] Found ${tickets.length} tickets in database`);

    // 3. Find payments that succeeded but don't have tickets
    const missingTickets = [];
    for (const webhook of successfulWebhooks) {
      // Webhook says ticketCreated=true but we can't find the ticket
      if (webhook.ticketCreated && !ticketOrderIds.has(webhook.orderId)) {
        missingTickets.push(webhook);
        console.warn(`⚠️ [Reconciliation] Webhook says ticket created but missing in DB: ${webhook.orderId}`);
      }
      // Webhook says ticketCreated=false (payment succeeded but ticket creation failed)
      else if (!webhook.ticketCreated) {
        missingTickets.push(webhook);
        console.warn(`⚠️ [Reconciliation] Payment succeeded but ticket creation failed: ${webhook.orderId}`);
      }
    }

    // 4. Auto-fix missing tickets
    if (missingTickets.length > 0) {
      console.log(`🔧 [Reconciliation] Auto-fixing ${missingTickets.length} missing tickets...`);
      
      const fixResults = [];
      for (const webhook of missingTickets) {
        try {
          // Use imported fixMissingTicket function
          const result = await fixMissingTicket(webhook.orderId);
          fixResults.push({ orderId: webhook.orderId, status: 'fixed' });
          console.log(`✅ [Reconciliation] Fixed: ${webhook.orderId}`);
        } catch (error) {
          fixResults.push({ orderId: webhook.orderId, status: 'failed', error: error.message });
          console.error(`❌ [Reconciliation] Failed to fix: ${webhook.orderId}`, error);
        }
      }

      // 5. Send alert email to admin
      const alertData = {
        date: date.toDateString(),
        totalPayments: successfulWebhooks.length,
        totalTickets: tickets.length,
        missingCount: missingTickets.length,
        fixedCount: fixResults.filter(r => r.status === 'fixed').length,
        failedCount: fixResults.filter(r => r.status === 'failed').length,
        failures: fixResults.filter(r => r.status === 'failed')
      };

      await sendReconciliationAlert(alertData);
    } else {
      console.log('✅ [Reconciliation] All payments have tickets. No issues found.');
    }

    // 6. Generate report
    const report = {
      date: date.toDateString(),
      totalPayments: successfulWebhooks.length,
      totalTickets: tickets.length,
      missingTickets: missingTickets.length,
      successRate: successfulWebhooks.length > 0 
        ? ((tickets.length / successfulWebhooks.length) * 100).toFixed(2) + '%'
        : 'N/A'
    };

    console.log('📊 [Reconciliation] Report:', report);
    return report;

  } catch (error) {
    console.error('❌ [Reconciliation] Error:', error);
    throw error;
  }
}

/**
 * Send reconciliation alert email to admin
 */
async function sendReconciliationAlert(data) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@indulgeout.com';
  
  const emailContent = `
    <h2>🚨 Payment Reconciliation Alert</h2>
    <p><strong>Date:</strong> ${data.date}</p>
    <p><strong>Total Payments:</strong> ${data.totalPayments}</p>
    <p><strong>Total Tickets:</strong> ${data.totalTickets}</p>
    <p><strong>Missing Tickets:</strong> ${data.missingCount}</p>
    <p><strong>Auto-Fixed:</strong> ${data.fixedCount}</p>
    <p><strong>Failed Fixes:</strong> ${data.failedCount}</p>
    
    ${data.failedCount > 0 ? `
      <h3>⚠️ Failed Fixes (Manual Action Required):</h3>
      <ul>
        ${data.failures.map(f => `<li>${f.orderId}: ${f.error}</li>`).join('')}
      </ul>
    ` : ''}
  `;

  try {
    await sendAlertEmail(adminEmail, 'Payment Reconciliation Alert', emailContent);
    console.log('✅ [Reconciliation] Alert email sent to admin');
  } catch (error) {
    console.error('❌ [Reconciliation] Failed to send alert email:', error);
  }
}

// Schedule daily reconciliation at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('⏰ [Cron] Running scheduled payment reconciliation...');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await reconcilePayments(yesterday);
});

// Manual reconciliation function
async function runManualReconciliation(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  date.setDate(date.getDate() - 1); // Yesterday by default
  return await reconcilePayments(date);
}

module.exports = {
  reconcilePayments,
  runManualReconciliation
};

// Run immediately if executed directly
if (require.main === module) {
  // Connect to MongoDB first
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      return runManualReconciliation();
    })
    .then(() => {
      console.log('✅ Manual reconciliation completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Manual reconciliation failed:', err);
      process.exit(1);
    });
}
