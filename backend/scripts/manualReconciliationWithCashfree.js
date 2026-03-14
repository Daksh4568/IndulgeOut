/**
 * Manual Cashfree Payment Reconciliation Script
 * 
 * PURPOSE: Manually verify all payments with Cashfree API
 * USE CASES:
 * 1. Test reconciliation function before going live
 * 2. Backfill historical ticket reconciliation data
 * 3. Re-run reconciliation for specific date ranges
 * 4. Verify production Cashfree integration
 * 
 * USAGE:
 * 
 * # Reconcile yesterday's payments (default)
 * node scripts/manualReconciliationWithCashfree.js
 * 
 * # Reconcile all historical payments (use with caution - may take time)
 * node scripts/manualReconciliationWithCashfree.js --all
 * 
 * # Reconcile specific date range
 * node scripts/manualReconciliationWithCashfree.js --from 2026-01-01 --to 2026-03-02
 * 
 * # Reconcile last N days
 * node scripts/manualReconciliationWithCashfree.js --days 7
 * 
 * # Dry run (don't save to database)
 * node scripts/manualReconciliationWithCashfree.js --dry-run
 * 
 * # Force re-check already verified tickets
 * node scripts/manualReconciliationWithCashfree.js --force
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  all: args.includes('--all'),
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
  from: args.includes('--from') ? args[args.indexOf('--from') + 1] : null,
  to: args.includes('--to') ? args[args.indexOf('--to') + 1] : null,
  days: args.includes('--days') ? parseInt(args[args.indexOf('--days') + 1]) : null
};

/**
 * Main reconciliation function with flexible date range
 */
async function runManualReconciliation(options) {
  try {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   MANUAL CASHFREE RECONCILIATION SCRIPT           ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
    
    // Determine Cashfree API URL
    const CASHFREE_API_URL = process.env.CASHFREE_SECRET_KEY?.startsWith('cfsk_ma_prod_')
      ? 'https://api.cashfree.com'
      : 'https://sandbox.cashfree.com';
    
    const environment = CASHFREE_API_URL.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION';
    console.log(`🌍 Environment: ${environment}`);
    console.log(`🔑 App ID: ${process.env.CASHFREE_APP_ID?.substring(0, 10)}...`);
    console.log(`🔐 Secret Key: ${process.env.CASHFREE_SECRET_KEY?.substring(0, 10)}...`);
    console.log(`🌐 API URL: ${CASHFREE_API_URL}`);
    console.log('');
    
    if (options.dryRun) {
      console.log('⚠️  DRY RUN MODE - No changes will be saved to database');
      console.log('');
    }
    
    // Determine date range
    let startDate, endDate;
    
    if (options.all) {
      // Get the earliest ticket date
      const earliestTicket = await Ticket.findOne()
        .sort({ purchaseDate: 1 })
        .select('purchaseDate');
      
      if (!earliestTicket) {
        console.log('❌ No tickets found in database');
        return;
      }
      
      startDate = new Date(earliestTicket.purchaseDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      console.log(`📅 Processing ALL historical tickets`);
      console.log(`   From: ${startDate.toDateString()}`);
      console.log(`   To: ${endDate.toDateString()}`);
    } else if (options.from && options.to) {
      startDate = new Date(options.from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(options.to);
      endDate.setHours(23, 59, 59, 999);
      
      console.log(`📅 Processing date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);
    } else if (options.days) {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - options.days);
      startDate.setHours(0, 0, 0, 0);
      
      console.log(`📅 Processing last ${options.days} days`);
      console.log(`   From: ${startDate.toDateString()}`);
      console.log(`   To: ${endDate.toDateString()}`);
    } else {
      // Default: yesterday only
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
      
      console.log(`📅 Processing yesterday's tickets: ${startDate.toDateString()}`);
    }
    
    console.log('');
    
    // Build query - only paid tickets (free events don't go through Cashfree)
    const query = {
      purchaseDate: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' },
      'price.amount': { $gt: 0 }
    };
    
    // Process pending and manual_review tickets (re-check previously failed ones)
    // Use --force to also re-check already verified tickets
    if (!options.force) {
      query.reconciliationStatus = { $in: ['pending', 'manual_review'] };
    }
    
    // Find tickets to reconcile
    const tickets = await Ticket.find(query);
    
    console.log(`📊 Found ${tickets.length} tickets to reconcile`);
    
    if (tickets.length === 0) {
      console.log('✅ No tickets need reconciliation');
      
      // Show how many tickets exist in total for the date range (diagnostic info)
      const totalInRange = await Ticket.countDocuments({
        purchaseDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      });
      
      if (totalInRange > 0) {
        const verifiedInRange = await Ticket.countDocuments({
          purchaseDate: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
          reconciliationStatus: 'verified'
        });
        console.log('');
        console.log(`ℹ️  There are ${totalInRange} total tickets in this date range:`);
        console.log(`   ✅ ${verifiedInRange} already verified`);
        console.log(`   📋 ${totalInRange - verifiedInRange} with other statuses`);
        console.log('');
        console.log('💡 To re-check all tickets (including already verified), use --force');
      }
      
      return {
        total: 0,
        verified: 0,
        mismatches: 0,
        failed: 0,
        settled: 0
      };
    }
    
    console.log('');
    console.log('─────────────────────────────────────────────────────');
    console.log('Starting reconciliation...');
    console.log('─────────────────────────────────────────────────────');
    console.log('');
    
    let verified = 0;
    let mismatches = 0;
    let failed = 0;
    let processed = 0;
    
    const mismatchDetails = [];
    const failureDetails = [];
    
    for (const ticket of tickets) {
      processed++;
      
      try {
        // Fix price format for backward compatibility (use toObject to get raw value)
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
          console.warn(`⚠️  Could not fix price for ${ticket.ticketNumber}: ${priceFixError.message}`);
        }
        
        // Try metadata.orderId first, fall back to paymentId (which stores orderId)
        const orderId = ticket.metadata?.orderId || ticket.paymentId;
        
        if (!orderId || !orderId.startsWith('ORDER_')) {
          console.warn(`⚠️  [${processed}/${tickets.length}] Ticket ${ticket.ticketNumber} - Missing orderId`);
          
          if (!options.dryRun) {
            ticket.reconciliationStatus = 'manual_review';
            ticket.reconciliationNotes = 'Missing orderId - no Cashfree order reference found';
            ticket.lastReconciliationDate = new Date();
            await ticket.save({ validateBeforeSave: false });
          }
          
          failed++;
          failureDetails.push({
            ticketNumber: ticket.ticketNumber,
            reason: 'Missing orderId'
          });
          continue;
        }
        
        // Backfill orderId in metadata if it was only in paymentId
        if (!ticket.metadata?.orderId && orderId) {
          ticket.set('metadata.orderId', orderId);
        }
        
        // Fetch order details from Cashfree
        console.log(`🔍 [${processed}/${tickets.length}] Checking ${ticket.ticketNumber} (${orderId})...`);
        
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
            console.log(`   ✅ VERIFIED - Amount: ₹${cashfreeAmount}, Method: ${order.payment_method || 'unknown'}`);
            
            if (!options.dryRun) {
              ticket.reconciliationStatus = 'verified';
              // Only set to 'captured' if not already settled (avoid overwriting settled status on --force)
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
              
              await ticket.save({ validateBeforeSave: false });
            }
            
            verified++;
          } else {
            // Amount mismatch - needs review
            console.warn(`   ⚠️  MISMATCH - Expected: ₹${expectedAmount}, Cashfree: ₹${cashfreeAmount}, Diff: ₹${difference}`);
            
            if (!options.dryRun) {
              ticket.reconciliationStatus = 'mismatch';
              ticket.reconciliationNotes = `Amount mismatch: Expected ₹${expectedAmount}, Cashfree shows ₹${cashfreeAmount} (diff: ₹${difference})`;
              ticket.lastReconciliationDate = new Date();
              await ticket.save({ validateBeforeSave: false });
            }
            
            mismatches++;
            mismatchDetails.push({
              ticketNumber: ticket.ticketNumber,
              orderId,
              expected: expectedAmount,
              actual: cashfreeAmount,
              difference
            });
          }
        } else {
          // Payment not successful
          console.warn(`   ⚠️  Payment status: ${order.order_status}`);
          
          if (!options.dryRun) {
            ticket.reconciliationStatus = 'manual_review';
            ticket.reconciliationNotes = `Cashfree status: ${order.order_status}`;
            ticket.lastReconciliationDate = new Date();
            await ticket.save({ validateBeforeSave: false });
          }
          
          failed++;
          failureDetails.push({
            ticketNumber: ticket.ticketNumber,
            orderId,
            status: order.order_status
          });
        }
        
        // Rate limiting - wait 150ms between requests
        await new Promise(resolve => setTimeout(resolve, 150));
        
      } catch (error) {
        if (error.response?.status === 404) {
          console.error(`   ❌ Order not found in Cashfree: ${ticket.metadata?.orderId}`);
          console.error(`      (API: ${CASHFREE_API_URL} | Ticket created: ${ticket.purchaseDate?.toISOString()} | Source: ${ticket.metadata?.registrationSource || 'unknown'})`);
        } else {
          console.error(`   ❌ Error: ${error.message}`);
        }
        
        if (!options.dryRun) {
          const env = CASHFREE_API_URL.includes('sandbox') ? 'sandbox' : 'production';
          ticket.reconciliationStatus = 'manual_review';
          ticket.reconciliationNotes = error.response?.status === 404 
            ? `Order not found in Cashfree ${env} (404). Order may have been created in a different environment.`
            : `Reconciliation error: ${error.message}`;
          ticket.lastReconciliationDate = new Date();
          await ticket.save({ validateBeforeSave: false });
        }
        
        failed++;
        failureDetails.push({
          ticketNumber: ticket.ticketNumber,
          orderId: ticket.metadata?.orderId,
          error: error.message
        });
      }
    }
    
    console.log('');
    console.log('─────────────────────────────────────────────────────');
    console.log('Fixing incorrectly settled tickets (no UTR)...');
    console.log('─────────────────────────────────────────────────────');
    console.log('');
    
    // Fix tickets marked as "settled" but with no UTR (settlement not actually completed)
    if (!options.dryRun) {
      const badlySettled = await Ticket.find({
        settlementStatus: 'settled',
        $or: [
          { settlementUTR: { $exists: false } },
          { settlementUTR: '' },
          { settlementUTR: null }
        ],
        'price.amount': { $gt: 0 }
      });
      
      if (badlySettled.length > 0) {
        console.log(`⚠️  Found ${badlySettled.length} tickets marked "settled" without bank UTR - reverting to "captured"`);
        for (const ticket of badlySettled) {
          ticket.settlementStatus = 'captured';
          ticket.settlementDate = undefined;
          ticket.settlementAmount = undefined;
          ticket.cashfreeServiceCharge = undefined;
          ticket.cashfreeServiceTax = undefined;
          await ticket.save({ validateBeforeSave: false });
        }
        console.log(`✅ Reverted ${badlySettled.length} tickets back to "captured"`);
      } else {
        console.log('✅ No incorrectly settled tickets found');
      }
    }
    
    console.log('');
    console.log('─────────────────────────────────────────────────────');
    console.log('Checking settlement status for captured payments...');
    console.log('─────────────────────────────────────────────────────');
    console.log('');
    
    // Check settlement status for captured payments (only paid tickets)
    const capturedTickets = await Ticket.find({
      settlementStatus: 'captured',
      purchaseDate: { $gte: startDate, $lte: endDate },
      'price.amount': { $gt: 0 }
    });
    
    console.log(`🏦 Found ${capturedTickets.length} captured payments to check for settlement`);
    console.log('');
    
    let settled = 0;
    let settlementChecked = 0;
    
    for (const ticket of capturedTickets) {
      settlementChecked++;
      
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
        
        console.log(`🏦 [${settlementChecked}/${capturedTickets.length}] Checking settlement for ${ticket.ticketNumber}...`);
        
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
            break;
          } catch (err) {
            if (err.response?.status === 429 && retries < 2) {
              retries++;
              const waitTime = 3000 * retries;
              console.log(`   ⏳ Rate limited, waiting ${waitTime}ms (retry ${retries}/2)`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              throw err;
            }
          }
        }
        
        // Parse settlement response - handle multiple Cashfree response formats
        // Cashfree may return: array, single object, or { data: [...] } wrapper
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
        
        // Debug: log actual settlement response structure (first 3 tickets only)
        if (settlementChecked <= 3) {
          console.log(`   🔍 Raw response type: ${typeof rawSettlementData}, isArray: ${Array.isArray(rawSettlementData)}`);
          if (settlements.length > 0) {
            console.log(`   🔍 Settlement keys: ${Object.keys(settlements[0]).join(', ')}`);
            console.log(`   🔍 Settlement data: amount=${settlements[0].settlement_amount}, utr=${settlements[0].transfer_utr || 'N/A'}, time=${settlements[0].transfer_time || 'N/A'}`);
          }
        }
        
        if (settlements.length > 0) {
          const settlement = settlements[0];
          const utr = settlement.transfer_utr || settlement.settlement_utr || '';
          const serviceCharge = settlement.service_charge || 0;
          const serviceTax = settlement.service_tax || 0;
          const totalDeducted = serviceCharge + serviceTax;
          
          if (settlement.settlement_amount != null && utr) {
            // UTR exists = Cashfree has actually transferred the money to bank
            console.log(`   ✅ SETTLED - Amount: ₹${settlement.settlement_amount}, Cashfree Fee: ₹${serviceCharge} + Tax: ₹${serviceTax} = ₹${totalDeducted.toFixed(2)} deducted, UTR: ${utr}`);
            
            if (!options.dryRun) {
              ticket.settlementStatus = 'settled';
              ticket.settlementDate = new Date(settlement.transfer_time || settlement.settlement_date || Date.now());
              ticket.settlementUTR = utr;
              ticket.settlementAmount = settlement.settlement_amount;
              ticket.cashfreeServiceCharge = serviceCharge;
              ticket.cashfreeServiceTax = serviceTax;
              await ticket.save({ validateBeforeSave: false });
            }
            
            settled++;
          } else if (settlement.settlement_amount != null) {
            // Amount exists but no UTR = Cashfree has calculated but NOT yet transferred
            console.log(`   ⏳ Settlement pending (Amount: ₹${settlement.settlement_amount}, Fee: ₹${totalDeducted.toFixed(2)}, UTR not yet assigned)`);
          } else {
            console.log(`   ⏳ Settlement pending`);
          }
        } else {
          console.log(`   ⏳ No settlement data available yet`);
        }
        
        // Longer delay between settlement checks to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        // Settlement might not be available yet - skip silently
        if (error.response?.status === 429) {
          console.error(`   ⚠️  Rate limited, pausing 5s...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else if (!error.response || error.response.status !== 404) {
          console.error(`   ⚠️  Error: ${error.message}`);
        } else {
          console.log(`   ⏳ Settlement not available yet`);
        }
      }
    }
    
    // Calculate Cashfree fee totals from settled tickets
    const settledTickets = await Ticket.find({
      settlementStatus: 'settled',
      purchaseDate: { $gte: startDate, $lte: endDate },
      'price.amount': { $gt: 0 }
    }).select('cashfreeServiceCharge cashfreeServiceTax settlementAmount');
    
    const totalServiceCharge = settledTickets.reduce((sum, t) => sum + (t.cashfreeServiceCharge || 0), 0);
    const totalServiceTax = settledTickets.reduce((sum, t) => sum + (t.cashfreeServiceTax || 0), 0);
    const totalSettledAmount = settledTickets.reduce((sum, t) => sum + (t.settlementAmount || 0), 0);
    
    // Generate final report
    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║              RECONCILIATION SUMMARY                ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Total Tickets Processed:     ${tickets.length}`);
    console.log(`✅ Verified with Cashfree:    ${verified} (${((verified / tickets.length) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Amount Mismatches:         ${mismatches}`);
    console.log(`❌ Failed/Manual Review:      ${failed}`);
    console.log(`🏦 Settlement Confirmed:      ${settled}`);
    console.log('');
    if (totalServiceCharge > 0 || settled > 0) {
      console.log('─────────────────────────────────────────────────────');
      console.log('💳 CASHFREE FEE BREAKDOWN:');
      console.log(`   Cashfree Service Charge:  ₹${totalServiceCharge.toFixed(2)}`);
      console.log(`   GST on Service Charge:    ₹${totalServiceTax.toFixed(2)}`);
      console.log(`   Total Deducted by Cashfree: ₹${(totalServiceCharge + totalServiceTax).toFixed(2)}`);
      console.log(`   Total Settled to Bank:    ₹${totalSettledAmount.toFixed(2)}`);
      console.log('─────────────────────────────────────────────────────');
      console.log('');
    }
    
    if (options.dryRun) {
      console.log('⚠️  This was a DRY RUN - No changes were saved to database');
      console.log('');
    }
    
    // Show mismatch details
    if (mismatchDetails.length > 0) {
      console.log('─────────────────────────────────────────────────────');
      console.log('⚠️  AMOUNT MISMATCHES (Manual Review Required):');
      console.log('─────────────────────────────────────────────────────');
      mismatchDetails.forEach(m => {
        console.log(`  • ${m.ticketNumber} (${m.orderId})`);
        console.log(`    Expected: ₹${m.expected}, Actual: ₹${m.actual}, Diff: ₹${m.difference}`);
      });
      console.log('');
    }
    
    // Show failure details
    if (failureDetails.length > 0 && failureDetails.length <= 20) {
      console.log('─────────────────────────────────────────────────────');
      console.log('❌ FAILED VERIFICATIONS:');
      console.log('─────────────────────────────────────────────────────');
      failureDetails.forEach(f => {
        console.log(`  • ${f.ticketNumber} - ${f.reason || f.status || f.error}`);
      });
      console.log('');
    } else if (failureDetails.length > 20) {
      console.log(`❌ ${failureDetails.length} failed verifications (too many to display)`);
      console.log('');
    }
    
    // Send alert to admin if mismatches found
    if ((mismatches > 0 || failed > 5) && !options.dryRun) {
      console.log('📧 Sending alert to admin users...');
      await sendAdminAlert({
        environment,
        dateRange: `${startDate.toDateString()} to ${endDate.toDateString()}`,
        total: tickets.length,
        verified,
        mismatches,
        failed,
        settled
      });
    }
    
    console.log('✅ Reconciliation completed successfully');
    console.log('');
    
    return {
      total: tickets.length,
      verified,
      mismatches,
      failed,
      settled,
      mismatchDetails,
      failureDetails
    };
    
  } catch (error) {
    console.error('');
    console.error('╔════════════════════════════════════════════════════╗');
    console.error('║                   ERROR                            ║');
    console.error('╚════════════════════════════════════════════════════╝');
    console.error('');
    console.error(error);
    throw error;
  }
}

/**
 * Send alert notification to all admin users
 */
async function sendAdminAlert(data) {
  try {
    const notificationService = require('../services/notificationService');
    
    const adminUsers = await User.find({ role: 'admin' }).select('_id name email');
    
    for (const admin of adminUsers) {
      await notificationService.createNotification({
        recipient: admin._id,
        type: 'admin_review_required',
        category: 'action_required',
        priority: 'high',
        title: '🚨 Manual Reconciliation Completed',
        message: `Reconciliation for ${data.dateRange} found ${data.mismatches} payment mismatches and ${data.failed} failed verifications. Review required.`,
        actionUrl: '/admin/reports/reconciliation',
        metadata: data
      });
    }
    
    console.log(`✅ Alert sent to ${adminUsers.length} admin users`);
  } catch (error) {
    console.error('❌ Failed to send admin alerts:', error.message);
  }
}

// Run script
if (require.main === module) {
  console.log('');
  
  // Show usage if help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log('USAGE:');
    console.log('  node scripts/manualReconciliationWithCashfree.js [options]');
    console.log('');
    console.log('OPTIONS:');
    console.log('  --all              Reconcile all historical tickets');
    console.log('  --from DATE        Start date (YYYY-MM-DD)');
    console.log('  --to DATE          End date (YYYY-MM-DD)');
    console.log('  --days N           Reconcile last N days');
    console.log('  --dry-run          Test without saving to database');
    console.log('  --force            Re-check already verified tickets');
    console.log('  --help, -h         Show this help message');
    console.log('');
    console.log('EXAMPLES:');
    console.log('  node scripts/manualReconciliationWithCashfree.js');
    console.log('  node scripts/manualReconciliationWithCashfree.js --all');
    console.log('  node scripts/manualReconciliationWithCashfree.js --days 7');
    console.log('  node scripts/manualReconciliationWithCashfree.js --from 2026-01-01 --to 2026-03-02');
    console.log('  node scripts/manualReconciliationWithCashfree.js --all --dry-run');
    console.log('');
    process.exit(0);
  }
  
  // Connect to MongoDB and run
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      console.log('');
      return runManualReconciliation(options);
    })
    .then(() => {
      console.log('Closing database connection...');
      return mongoose.connection.close();
    })
    .then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Script failed:', err);
      process.exit(1);
    });
}

module.exports = {
  runManualReconciliation
};
