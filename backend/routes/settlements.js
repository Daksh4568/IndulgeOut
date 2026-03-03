const express = require('express');
const axios = require('axios');
const { authMiddleware } = require('../utils/authUtils');
const Event = require('../models/Event');

const router = express.Router();

// Determine Cashfree API URL
const CASHFREE_API_URL = process.env.CASHFREE_SECRET_KEY?.startsWith('cfsk_ma_prod_')
  ? 'https://api.cashfree.com'
  : 'https://sandbox.cashfree.com';

/**
 * GET /api/settlements/verify
 * Verify settlement status for organizer's orders
 * Cross-checks Cashfree settlement reports with internal revenue
 */
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { startDate, endDate } = req.query;

    console.log('🏦 [Settlements] Verifying settlements for userId:', userId);

    // Import required models
    const Ticket = require('../models/Ticket');

    // Get all events by this organizer
    const events = await Event.find({ host: userId }).select('_id title');
    const eventIds = events.map(e => e._id);

    // Get all tickets for these events
    const tickets = await Ticket.find({
      event: { $in: eventIds },
      status: { $ne: 'cancelled' }
    }).select('metadata.orderId metadata.basePrice metadata.totalPaid purchaseDate ticketNumber');

    // Filter by date range if provided
    let filteredTickets = tickets;
    if (startDate || endDate) {
      filteredTickets = tickets.filter(ticket => {
        const purchaseDate = new Date(ticket.purchaseDate);
        if (startDate && purchaseDate < new Date(startDate)) return false;
        if (endDate && purchaseDate > new Date(endDate)) return false;
        return true;
      });
    }

    console.log(`🏦 [Settlements] Checking ${filteredTickets.length} tickets`);

    // Get unique order IDs
    const orderIds = [...new Set(filteredTickets.map(t => t.metadata?.orderId).filter(Boolean))];

    // Fetch settlements from Cashfree
    let settledOrders = [];
    let unsettledOrders = [];
    let totalSettledAmount = 0;
    let totalUnsettledAmount = 0;

    for (const orderId of orderIds) {
      try {
        // Fetch order details
        const orderResponse = await axios.get(
          `${CASHFREE_API_URL}/pg/orders/${orderId}`,
          {
            headers: {
              'x-client-id': process.env.CASHFREE_APP_ID,
              'x-client-secret': process.env.CASHFREE_SECRET_KEY,
              'x-api-version': '2023-08-01'
            }
          }
        );

        const order = orderResponse.data;

        // Fetch settlement details for this order
        try {
          const settlementResponse = await axios.get(
            `${CASHFREE_API_URL}/pg/orders/${orderId}/settlements`,
            {
              headers: {
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01'
              }
            }
          );

          const settlements = settlementResponse.data;

          if (settlements && settlements.length > 0) {
            // Order is settled
            const settlement = settlements[0];
            settledOrders.push({
              orderId,
              orderAmount: order.order_amount,
              settlementAmount: settlement.settlement_amount,
              settlementId: settlement.settlement_id,
              settlementDate: settlement.settlement_date,
              utr: settlement.settlement_utr
            });
            totalSettledAmount += settlement.settlement_amount;
          } else {
            // Order is unsettled
            unsettledOrders.push({
              orderId,
              orderAmount: order.order_amount,
              orderStatus: order.order_status,
              createdAt: order.created_at
            });
            totalUnsettledAmount += order.order_amount;
          }
        } catch (settlementError) {
          // No settlement found - order is unsettled
          unsettledOrders.push({
            orderId,
            orderAmount: order.order_amount,
            orderStatus: order.order_status,
            createdAt: order.created_at
          });
          totalUnsettledAmount += order.order_amount;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ [Settlements] Failed to fetch order ${orderId}:`, error.message);
      }
    }

    // Calculate internal revenue (organizer's share)
    const internalRevenue = filteredTickets.reduce((sum, ticket) => {
      return sum + (ticket.metadata?.basePrice || 0);
    }, 0);

    // Calculate expected settlement (after Cashfree deducts their 2% fee)
    // Organizer gets: basePrice (₹199) from each ticket
    // Cashfree keeps: Gateway fee (3%) + GST (2.6%) = 5.6% of basePrice
    // So settlement should be slightly less than totalSettledAmount due to Cashfree's processing fee
    const expectedSettlement = totalSettledAmount * 0.98; // Approx 2% Cashfree fee

    res.json({
      summary: {
        totalOrders: orderIds.length,
        settledOrders: settledOrders.length,
        unsettledOrders: unsettledOrders.length,
        totalSettledAmount: parseFloat(totalSettledAmount.toFixed(2)),
        totalUnsettledAmount: parseFloat(totalUnsettledAmount.toFixed(2)),
        expectedSettlement: parseFloat(expectedSettlement.toFixed(2)),
        organizerRevenue: parseFloat(internalRevenue.toFixed(2))
      },
      settled: settledOrders,
      unsettled: unsettledOrders,
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Now'
      }
    });

  } catch (error) {
    console.error('❌ [Settlements] Error:', error);
    res.status(500).json({
      message: 'Failed to verify settlements',
      error: error.message
    });
  }
});

/**
 * GET /api/settlements/reconcile
 * Reconcile internal revenue with bank deposits
 * This should be run monthly to match bank statements
 */
router.get('/reconcile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { month, year } = req.query; // e.g., month=2, year=2026

    console.log('🏦 [Reconciliation] Starting for month:', month, year);

    const Ticket = require('../models/Ticket');

    // Get all events by this organizer
    const events = await Event.find({ host: userId }).select('_id title');
    const eventIds = events.map(e => e._id);

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all tickets in this date range
    const tickets = await Ticket.find({
      event: { $in: eventIds },
      status: { $ne: 'cancelled' },
      purchaseDate: { $gte: startDate, $lte: endDate }
    }).select('metadata.orderId metadata.basePrice metadata.totalPaid purchaseDate');

    // Calculate expected revenue
    const expectedRevenue = tickets.reduce((sum, ticket) => {
      return sum + (ticket.metadata?.basePrice || 0);
    }, 0);

    // Get unique order IDs
    const orderIds = [...new Set(tickets.map(t => t.metadata?.orderId).filter(Boolean))];

    // Fetch settlements from Cashfree for this month
    let totalSettled = 0;
    const settlementDetails = [];

    for (const orderId of orderIds) {
      try {
        const settlementResponse = await axios.get(
          `${CASHFREE_API_URL}/pg/orders/${orderId}/settlements`,
          {
            headers: {
              'x-client-id': process.env.CASHFREE_APP_ID,
              'x-client-secret': process.env.CASHFREE_SECRET_KEY,
              'x-api-version': '2023-08-01'
            }
          }
        );

        if (settlementResponse.data && settlementResponse.data.length > 0) {
          const settlement = settlementResponse.data[0];
          totalSettled += settlement.settlement_amount;
          
          settlementDetails.push({
            orderId,
            settlementAmount: settlement.settlement_amount,
            settlementDate: settlement.settlement_date,
            utr: settlement.settlement_utr,
            status: 'SETTLED'
          });
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch settlement for ${orderId}`);
      }
    }

    // After Cashfree's ~2% fee, expected bank deposit
    const expectedBankDeposit = totalSettled * 0.98;

    res.json({
      period: `${month}/${year}`,
      expectedRevenue: parseFloat(expectedRevenue.toFixed(2)),
      totalSettled: parseFloat(totalSettled.toFixed(2)),
      expectedBankDeposit: parseFloat(expectedBankDeposit.toFixed(2)),
      ordersSettled: settlementDetails.length,
      settlementDetails,
      instructions: [
        '1. Check your bank statement for this month',
        `2. Total deposits should be approximately ₹${expectedBankDeposit.toFixed(2)}`,
        '3. Match each UTR number with bank transaction',
        '4. Report any discrepancies to support@indulgeout.com'
      ]
    });

  } catch (error) {
    console.error('❌ [Reconciliation] Error:', error);
    res.status(500).json({
      message: 'Failed to reconcile settlements',
      error: error.message
    });
  }
});

module.exports = router;
