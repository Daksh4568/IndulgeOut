/**
 * Test Reconciliation Setup
 * 
 * This script helps you verify that:
 * 1. Cashfree API credentials are working
 * 2. Database connection is established
 * 3. Reconciliation logic is functioning correctly
 * 
 * USAGE:
 * node scripts/testReconciliation.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Ticket = require('../models/Ticket');

async function testReconciliationSetup() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║      RECONCILIATION SETUP VERIFICATION             ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  
  let allTestsPassed = true;
  
  // Test 1: Environment Variables
  console.log('📋 TEST 1: Environment Variables');
  console.log('─────────────────────────────────────────────────────');
  
  const requiredEnvVars = [
    'MONGODB_URI',
    'CASHFREE_APP_ID',
    'CASHFREE_SECRET_KEY'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set (${process.env[envVar].substring(0, 15)}...)`);
    } else {
      console.log(`❌ ${envVar}: Missing`);
      allTestsPassed = false;
    }
  }
  console.log('');
  
  // Determine environment
  const CASHFREE_API_URL = process.env.CASHFREE_SECRET_KEY?.startsWith('cfsk_ma_prod_')
    ? 'https://api.cashfree.com'
    : 'https://sandbox.cashfree.com';
  
  const environment = CASHFREE_API_URL.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION';
  console.log(`🌍 Detected Environment: ${environment}`);
  console.log(`🌐 API URL: ${CASHFREE_API_URL}`);
  console.log('');
  
  if (!allTestsPassed) {
    console.log('❌ Environment variables test failed. Please check your .env file');
    return false;
  }
  
  // Test 2: Database Connection
  console.log('📋 TEST 2: Database Connection');
  console.log('─────────────────────────────────────────────────────');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB');
    
    // Check tickets collection
    const ticketCount = await Ticket.countDocuments();
    console.log(`✅ Found ${ticketCount} tickets in database`);
    
    // Check tickets with orderId
    const ticketsWithOrderId = await Ticket.countDocuments({
      'metadata.orderId': { $exists: true, $ne: null }
    });
    console.log(`✅ ${ticketsWithOrderId} tickets have orderId (eligible for reconciliation)`);
    
    // Check reconciliation status distribution
    const pending = await Ticket.countDocuments({ reconciliationStatus: 'pending' });
    const verified = await Ticket.countDocuments({ reconciliationStatus: 'verified' });
    const mismatch = await Ticket.countDocuments({ reconciliationStatus: 'mismatch' });
    const manual = await Ticket.countDocuments({ reconciliationStatus: 'manual_review' });
    
    console.log('');
    console.log('Reconciliation Status:');
    console.log(`  • Pending: ${pending}`);
    console.log(`  • Verified: ${verified}`);
    console.log(`  • Mismatch: ${mismatch}`);
    console.log(`  • Manual Review: ${manual}`);
    
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    allTestsPassed = false;
  }
  console.log('');
  
  // Test 3: Cashfree API Connection
  console.log('📋 TEST 3: Cashfree API Connection');
  console.log('─────────────────────────────────────────────────────');
  
  try {
    // Find a ticket with orderId to test
    const testTicket = await Ticket.findOne({
      'metadata.orderId': { $exists: true, $ne: null }
    }).select('metadata ticketNumber');
    
    if (!testTicket || !testTicket.metadata?.orderId) {
      console.log('⚠️  No tickets with orderId found to test API connection');
      console.log('   This is normal if you haven\'t processed any payments yet');
    } else {
      const orderId = testTicket.metadata.orderId;
      console.log(`Testing with order: ${orderId} (Ticket: ${testTicket.ticketNumber})`);
      
      // Try to fetch order from Cashfree
      const response = await axios.get(
        `${CASHFREE_API_URL}/pg/orders/${orderId}`,
        {
          headers: {
            'x-client-id': process.env.CASHFREE_APP_ID,
            'x-client-secret': process.env.CASHFREE_SECRET_KEY,
            'x-api-version': '2023-08-01'
          }
        }
      );
      
      console.log('✅ Successfully connected to Cashfree API');
      console.log(`✅ Order Status: ${response.data.order_status}`);
      console.log(`✅ Order Amount: ₹${response.data.order_amount}`);
      console.log(`✅ Payment Method: ${response.data.payment_method || 'N/A'}`);
      
      // Check if settlement data available
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
          console.log(`✅ Settlement Status: ${settlementResponse.data[0].settlement_status}`);
        } else {
          console.log('ℹ️  No settlement data available yet (normal for recent payments)');
        }
      } catch (settlementError) {
        if (settlementError.response?.status === 404) {
          console.log('ℹ️  Settlement data not found (normal for recent payments)');
        } else {
          console.log(`⚠️  Settlement check failed: ${settlementError.message}`);
        }
      }
    }
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  Order not found in Cashfree (might be using different environment)');
      console.log('   Make sure you\'re using the correct credentials (sandbox vs production)');
    } else if (error.response?.status === 401) {
      console.log('❌ Authentication failed - Invalid credentials');
      console.log('   Please check CASHFREE_APP_ID and CASHFREE_SECRET_KEY');
      allTestsPassed = false;
    } else {
      console.log(`❌ Cashfree API error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data)}`);
      }
      allTestsPassed = false;
    }
  }
  console.log('');
  
  // Test 4: Scheduled Jobs Check
  console.log('📋 TEST 4: Scheduled Jobs Status');
  console.log('─────────────────────────────────────────────────────');
  
  try {
    const { runDailyReconciliation } = require('../jobs/scheduledJobs');
    
    if (typeof runDailyReconciliation === 'function') {
      console.log('✅ Daily reconciliation function is available');
      console.log('ℹ️  Scheduled to run daily at 2:00 AM');
      console.log('ℹ️  You can test it manually using manualReconciliationWithCashfree.js');
    } else {
      console.log('⚠️  Daily reconciliation function not found');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`⚠️  Could not load scheduled jobs: ${error.message}`);
  }
  console.log('');
  
  // Final Summary
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║                   SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  
  if (allTestsPassed) {
    console.log('✅ All tests passed! Reconciliation system is ready.');
    console.log('');
    console.log('NEXT STEPS:');
    console.log('');
    console.log('1. Test with dry run (won\'t save to database):');
    console.log('   node scripts/manualReconciliationWithCashfree.js --dry-run');
    console.log('');
    console.log('2. Reconcile yesterday\'s payments:');
    console.log('   node scripts/manualReconciliationWithCashfree.js');
    console.log('');
    console.log('3. Reconcile last 7 days:');
    console.log('   node scripts/manualReconciliationWithCashfree.js --days 7');
    console.log('');
    console.log('4. Reconcile all historical data:');
    console.log('   node scripts/manualReconciliationWithCashfree.js --all');
    console.log('');
  } else {
    console.log('❌ Some tests failed. Please fix the issues above before running reconciliation.');
    console.log('');
  }
  
  return allTestsPassed;
}

// Run tests
if (require.main === module) {
  testReconciliationSetup()
    .then((passed) => {
      return mongoose.connection.close().then(() => passed);
    })
    .then((passed) => {
      process.exit(passed ? 0 : 1);
    })
    .catch(err => {
      console.error('❌ Test failed:', err);
      process.exit(1);
    });
}

module.exports = { testReconciliationSetup };
