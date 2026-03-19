const express = require('express');
const router = express.Router();

/**
 * Cron endpoint security middleware
 * Vercel Cron Jobs send an Authorization header with CRON_SECRET
 * Also allows admin users to trigger manually via admin auth
 */
function verifyCronAuth(req, res, next) {
  // Check for Vercel Cron secret (set as CRON_SECRET env var)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return next();
  }
  
  // Also allow admin users (check admin auth token)
  const { adminAuthMiddleware } = require('../utils/adminAuthMiddleware');
  adminAuthMiddleware(req, res, (err) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });
}

// ==================== RECONCILIATION CRON ====================

/**
 * @route   GET /api/cron/reconcile
 * @desc    Run payment reconciliation - verifies payments with Cashfree
 *          Called by Vercel Cron Jobs daily at 2:00 AM, or manually by admin
 * @access  CRON_SECRET or Admin auth
 */
router.get('/reconcile', verifyCronAuth, async (req, res) => {
  try {
    const { runDailyReconciliation } = require('../jobs/scheduledJobs');
    
    console.log('🔄 Reconciliation triggered via API endpoint');
    
    await runDailyReconciliation();
    
    res.json({
      success: true,
      message: 'Payment reconciliation completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Cron reconciliation error:', error);
    res.status(500).json({
      success: false,
      error: 'Reconciliation failed',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/cron/settlement-check
 * @desc    Check settlement status for captured payments
 *          This is included in reconcile but can be run separately
 * @access  CRON_SECRET or Admin auth
 */
router.get('/settlement-check', verifyCronAuth, async (req, res) => {
  try {
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
    
    console.log('🏦 Settlement check triggered via API endpoint');
    
    // Helper: make Cashfree API call with retry on 429
    async function cashfreeGet(url) {
      let retries = 0;
      while (retries < 3) {
        try {
          return await axios.get(url, { headers: cashfreeHeaders });
        } catch (err) {
          if (err.response?.status === 429 && retries < 2) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, 2000 * retries));
          } else {
            throw err;
          }
        }
      }
    }
    
    // ── STEP 1: Verify pending payments first ──
    // Find tickets with settlementStatus 'pending' — these haven't been verified yet
    const pendingTickets = await Ticket.find({
      settlementStatus: 'pending',
      status: { $ne: 'cancelled' },
      purchaseDate: { $gte: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
      'price.amount': { $gt: 0 }
    });
    
    console.log(`📊 Step 1: Found ${pendingTickets.length} pending payments to verify`);
    
    let verified = 0;
    let verifyFailed = 0;
    
    for (const ticket of pendingTickets) {
      try {
        const orderId = ticket.metadata?.orderId || ticket.paymentId;
        if (!orderId || !orderId.startsWith('ORDER_')) {
          verifyFailed++;
          continue;
        }
        
        const orderResponse = await cashfreeGet(`${CASHFREE_API_URL}/pg/orders/${orderId}`);
        const order = orderResponse.data;
        
        if (order.order_status === 'PAID') {
          // Payment confirmed — update to captured
          ticket.settlementStatus = 'captured';
          ticket.reconciliationStatus = 'verified';
          ticket.lastReconciliationDate = new Date();
          
          if (!ticket.gatewayResponse) ticket.gatewayResponse = {};
          ticket.gatewayResponse.paymentStatus = order.order_status;
          ticket.gatewayResponse.paymentMethod = order.payment_method || 'unknown';
          
          await ticket.save({ validateBeforeSave: false });
          verified++;
          console.log(`✅ Verified: ${ticket.ticketNumber} (${orderId})`);
        } else {
          verifyFailed++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error(`Error verifying ${ticket.ticketNumber}:`, error.message);
        }
        verifyFailed++;
      }
    }
    
    // ── STEP 2: Check settlement for all captured tickets ──
    // This now includes both previously-captured AND newly-verified tickets
    const capturedTickets = await Ticket.find({
      settlementStatus: 'captured',
      purchaseDate: { $gte: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
      'price.amount': { $gt: 0 }
    });
    
    console.log(`🏦 Step 2: Found ${capturedTickets.length} captured payments to check settlement`);
    
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
          }
        }
        
        checked++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error(`Error checking settlement for ${ticket.ticketNumber}:`, error.message);
        }
      }
    }
    
    console.log(`✨ Settlement check completed: ${verified} verified, ${checked} checked, ${settled} settled`);
    
    res.json({
      success: true,
      message: `Settlement check completed: ${verified} newly verified, ${checked} checked for settlement, ${settled} settled`,
      verified,
      verifyFailed,
      checked,
      settled,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Settlement check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/cron/health
 * @desc    Health check for cron system
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    cronConfigured: !!process.env.CRON_SECRET,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
