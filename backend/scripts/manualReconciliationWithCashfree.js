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
    
    // Build query
    const query = {
      purchaseDate: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    };
    
    // Only process pending tickets unless force flag is used
    if (!options.force) {
      query.reconciliationStatus = 'pending';
    }
    
    // Find tickets to reconcile
    const tickets = await Ticket.find(query);
    
    console.log(`📊 Found ${tickets.length} tickets to reconcile`);
    
    if (tickets.length === 0) {
      console.log('✅ No tickets need reconciliation');
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
        // Ensure price.amount is set for old tickets (backward compatibility)
        if (typeof ticket.price === 'number') {
          // Old format: price was stored as number, convert to object
          const oldPrice = ticket.price;
          ticket.price = { amount: oldPrice, currency: 'INR' };
        } else if (!ticket.price || ticket.price.amount === undefined || ticket.price.amount === null) {
          if (!ticket.price) {
            ticket.price = { currency: 'INR' };
          }
          // Use metadata.basePrice or totalPaid as fallback
          ticket.price.amount = ticket.metadata?.basePrice || ticket.metadata?.totalPaid || 0;
        }
        
        const orderId = ticket.metadata?.orderId;
        
        if (!orderId) {
          console.warn(`⚠️  [${processed}/${tickets.length}] Ticket ${ticket.ticketNumber} - Missing orderId`);
          
          if (!options.dryRun) {
            ticket.reconciliationStatus = 'manual_review';
            ticket.reconciliationNotes = 'Missing orderId';
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
              ticket.settlementStatus = 'captured';
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
        } else {
          console.error(`   ❌ Error: ${error.message}`);
        }
        
        if (!options.dryRun) {
          ticket.reconciliationStatus = 'manual_review';
          ticket.reconciliationNotes = `Reconciliation error: ${error.message}`;
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
    console.log('Checking settlement status for captured payments...');
    console.log('─────────────────────────────────────────────────────');
    console.log('');
    
    // Check settlement status for captured payments
    const capturedTickets = await Ticket.find({
      settlementStatus: 'captured',
      purchaseDate: { $gte: startDate, $lte: endDate }
    }).limit(100); // Limit to avoid long-running script
    
    console.log(`🏦 Found ${capturedTickets.length} captured payments to check for settlement`);
    console.log('');
    
    let settled = 0;
    let settlementChecked = 0;
    
    for (const ticket of capturedTickets) {
      settlementChecked++;
      
      try {
        // Ensure price.amount is set for old tickets (backward compatibility)
        if (typeof ticket.price === 'number') {
          // Old format: price was stored as number, convert to object
          const oldPrice = ticket.price;
          ticket.price = { amount: oldPrice, currency: 'INR' };
        } else if (!ticket.price || ticket.price.amount === undefined || ticket.price.amount === null) {
          if (!ticket.price) {
            ticket.price = { currency: 'INR' };
          }
          ticket.price.amount = ticket.metadata?.basePrice || ticket.metadata?.totalPaid || 0;
        }
        
        const orderId = ticket.metadata?.orderId;
        if (!orderId) continue;
        
        console.log(`🏦 [${settlementChecked}/${capturedTickets.length}] Checking settlement for ${ticket.ticketNumber}...`);
        
        // Fetch settlement details
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
          
          if (settlement.settlement_status === 'SUCCESS') {
            console.log(`   ✅ SETTLED - Amount: ₹${settlement.settlement_amount}, UTR: ${settlement.settlement_utr}`);
            
            if (!options.dryRun) {
              ticket.settlementStatus = 'settled';
              ticket.settlementDate = new Date(settlement.settlement_date);
              ticket.settlementUTR = settlement.settlement_utr;
              ticket.settlementAmount = settlement.settlement_amount;
              await ticket.save({ validateBeforeSave: false });
            }
            
            settled++;
          } else {
            console.log(`   ⏳ Settlement pending (${settlement.settlement_status})`);
          }
        } else {
          console.log(`   ⏳ No settlement data available yet`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        // Settlement might not be available yet - skip silently
        if (!error.response || error.response.status !== 404) {
          console.error(`   ⚠️  Error: ${error.message}`);
        } else {
          console.log(`   ⏳ Settlement not available yet`);
        }
      }
    }
    
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
        type: 'payment_reconciliation_alert',
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
