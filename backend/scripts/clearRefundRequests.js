/**
 * Clear Existing Refund Requests
 * 
 * Resets all tickets with pending/in-progress refund requests back to clean state.
 * Run this after the refund flow restructure to avoid stale data issues.
 * 
 * Usage: node scripts/clearRefundRequests.js
 * 
 * Requires MONGODB_URI environment variable (uses dotenv).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in environment');
  process.exit(1);
}

async function clearRefundRequests() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all tickets with any refund activity
    const refundTickets = await Ticket.find({
      'refund.status': { $in: ['requested', 'approved', 'rejected'] }
    });

    console.log(`Found ${refundTickets.length} tickets with pending/approved/rejected refund requests`);

    if (refundTickets.length === 0) {
      console.log('No tickets to clean up. Exiting.');
      await mongoose.disconnect();
      return;
    }

    // List them before clearing
    for (const t of refundTickets) {
      console.log(`  - Ticket ${t.ticketNumber} | Status: ${t.refund.status} | Category: ${t.refund.refundCategory || 'N/A'} | Amount: ₹${t.refund.refundAmount || 0}`);
    }

    // Reset refund subdocument to clean state
    const ticketResult = await Ticket.updateMany(
      { 'refund.status': { $in: ['requested', 'approved', 'rejected'] } },
      {
        $set: {
          'refund.status': 'none',
          'refund.requestedAt': null,
          'refund.refundCategory': null,
          'refund.requestReason': null,
          'refund.refundAmount': null,
          'refund.processedAt': null,
          'refund.processedBy': null,
          'refund.cashfreeRefundId': null,
          'refund.refundARN': null,
          'refund.rejectedAt': null,
          'refund.rejectedBy': null,
          'refund.rejectionReason': null
        }
      }
    );
    console.log(`\nReset ${ticketResult.modifiedCount} ticket refund records to 'none'`);

    // Also ensure these tickets are back to 'active' status (in case any were set to 'refunded' without Cashfree processing)
    const statusResult = await Ticket.updateMany(
      {
        _id: { $in: refundTickets.map(t => t._id) },
        status: { $in: ['refunded'] }
      },
      { $set: { status: 'active' } }
    );
    if (statusResult.modifiedCount > 0) {
      console.log(`Reverted ${statusResult.modifiedCount} tickets from 'refunded' back to 'active'`);
    }

    // Clean up refund-related notifications
    const notifResult = await Notification.deleteMany({
      type: { $in: ['refund_requested', 'refund_approved', 'refund_processed', 'refund_rejected'] }
    });
    console.log(`Deleted ${notifResult.deletedCount} refund-related notifications`);

    console.log('\nCleanup complete.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

clearRefundRequests();
