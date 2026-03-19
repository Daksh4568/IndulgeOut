/**
 * Run the full settlement check: verify pending + check captured for settlement
 * This mimics what the /api/cron/settlement-check endpoint does
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Ticket = require('../models/Ticket');

const CASHFREE_API_URL = process.env.CASHFREE_SECRET_KEY?.startsWith('cfsk_ma_prod_')
  ? 'https://api.cashfree.com'
  : 'https://sandbox.cashfree.com';

const cashfreeHeaders = {
  'x-client-id': process.env.CASHFREE_APP_ID,
  'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  'x-api-version': '2023-08-01'
};

async function cashfreeGet(url) {
  let retries = 0;
  while (retries < 3) {
    try {
      return await axios.get(url, { headers: cashfreeHeaders });
    } catch (err) {
      if (err.response?.status === 429 && retries < 2) {
        retries++;
        console.log(`  ⏳ Rate limited, waiting ${2000 * retries}ms...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      } else {
        throw err;
      }
    }
  }
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // ── STEP 1: Verify pending payments ──
  const pendingTickets = await Ticket.find({
    settlementStatus: 'pending',
    status: { $ne: 'cancelled' },
    purchaseDate: { $gte: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
    'price.amount': { $gt: 0 }
  });

  console.log(`📊 Step 1: Verifying ${pendingTickets.length} pending payments...\n`);

  let verified = 0;
  let verifyFailed = 0;

  for (const ticket of pendingTickets) {
    try {
      const orderId = ticket.metadata?.orderId || ticket.paymentId;
      if (!orderId || !orderId.startsWith('ORDER_')) {
        console.log(`  ⏭️  ${ticket.ticketNumber} - no valid orderId`);
        verifyFailed++;
        continue;
      }

      const orderResponse = await cashfreeGet(`${CASHFREE_API_URL}/pg/orders/${orderId}`);
      const order = orderResponse.data;

      if (order.order_status === 'PAID') {
        ticket.settlementStatus = 'captured';
        ticket.reconciliationStatus = 'verified';
        ticket.lastReconciliationDate = new Date();
        if (!ticket.gatewayResponse) ticket.gatewayResponse = {};
        ticket.gatewayResponse.paymentStatus = order.order_status;
        ticket.gatewayResponse.paymentMethod = order.payment_method || 'unknown';
        await ticket.save({ validateBeforeSave: false });
        verified++;
        console.log(`  ✅ Verified: ${ticket.ticketNumber} (${orderId})`);
      } else {
        console.log(`  ⚠️  ${ticket.ticketNumber} - status: ${order.order_status}`);
        verifyFailed++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`  ❌ ${ticket.ticketNumber}: ${error.message}`);
      verifyFailed++;
    }
  }

  console.log(`\n📊 Step 1 done: ${verified} verified, ${verifyFailed} failed\n`);

  // ── STEP 2: Check settlement for captured tickets ──
  const capturedTickets = await Ticket.find({
    settlementStatus: 'captured',
    purchaseDate: { $gte: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
    'price.amount': { $gt: 0 }
  });

  console.log(`🏦 Step 2: Checking settlement for ${capturedTickets.length} captured payments...\n`);

  let settled = 0;
  let checked = 0;

  for (const ticket of capturedTickets) {
    try {
      const orderId = ticket.metadata?.orderId || ticket.paymentId;
      if (!orderId || !orderId.startsWith('ORDER_')) continue;

      const settlementResponse = await cashfreeGet(
        `${CASHFREE_API_URL}/pg/orders/${orderId}/settlements`
      );

      const rawData = settlementResponse.data;
      let settlements = [];
      if (Array.isArray(rawData)) {
        settlements = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.data)) settlements = rawData.data;
        else if (rawData.settlement_amount != null || rawData.cf_settlement_id != null) settlements = [rawData];
      }

      if (settlements.length > 0) {
        const settlement = settlements[0];
        const utr = settlement.transfer_utr || settlement.settlement_utr || '';

        if (settlement.settlement_amount != null && utr) {
          ticket.settlementStatus = 'settled';
          ticket.settlementDate = new Date(settlement.transfer_time || settlement.settlement_date || Date.now());
          ticket.settlementUTR = utr;
          ticket.settlementAmount = settlement.settlement_amount;
          ticket.cashfreeServiceCharge = settlement.service_charge || 0;
          ticket.cashfreeServiceTax = settlement.service_tax || 0;
          await ticket.save({ validateBeforeSave: false });
          settled++;
          console.log(`  ✅ Settled: ${ticket.ticketNumber} (UTR: ${utr})`);
        } else {
          console.log(`  ⏳ ${ticket.ticketNumber} - captured but not yet settled by Cashfree`);
        }
      } else {
        console.log(`  ⏳ ${ticket.ticketNumber} - no settlement data yet`);
      }

      checked++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`  ⏳ ${ticket.ticketNumber} - settlement not available yet (404)`);
      } else {
        console.error(`  ❌ ${ticket.ticketNumber}: ${error.message}`);
      }
    }
  }

  console.log(`\n✨ COMPLETE: ${verified} verified, ${checked} checked, ${settled} settled`);

  // Final counts
  const finalPending = await Ticket.countDocuments({ settlementStatus: 'pending', 'price.amount': { $gt: 0 } });
  const finalCaptured = await Ticket.countDocuments({ settlementStatus: 'captured', 'price.amount': { $gt: 0 } });
  const finalSettled = await Ticket.countDocuments({ settlementStatus: 'settled' });
  console.log(`\n📈 Final counts - Pending: ${finalPending} | Captured: ${finalCaptured} | Settled: ${finalSettled}`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
