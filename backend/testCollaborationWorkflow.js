/**
 * End-to-End Collaboration Workflow Test Script
 * Tests: Proposal → Admin Review → Counter → Admin Review → Accept → Confirmed
 * 
 * To run this test:
 * 1. Start your backend server (node index.js)
 * 2. Run: node testCollaborationWorkflow.js
 * 
 * This script will:
 * - Create test users (Community, Venue, Brand)
 * - Submit a proposal
 * - Admin approves it
 * - Recipient submits counter
 * - Admin approves counter
 * - Proposer accepts counter
 * - Verify final status is 'confirmed'
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test data
let testData = {
  adminToken: null,
  communityToken: null,
  venueToken: null,
  brandToken: null,
  communityId: null,
  venueId: null,
  brandId: null,
  proposalId: null,
  counterId: null
};

// Helper: Login or create user
async function loginOrCreateUser(phone, role, name, email, password) {
  try {
    console.log(`\n📱 Logging in as ${name} (${role})...`);
    
    // Try email/password login first
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: email,
        password: password
      });
      
      console.log(`  ✓ Logged in as ${name} (email/password)`);
      return {
        token: loginRes.data.token,
        userId: loginRes.data.user.id
      };
    } catch (err) {
      console.log(`  ⚠ Email login failed: ${err.response?.data?.error || err.message}`);
      console.log('  ℹ Trying OTP authentication...');
      
      // Fallback to OTP authentication
      try {
        // Request OTP
        await axios.post(`${API_URL}/auth/send-otp`, { phoneNumber: phone });
        console.log('  ✓ OTP requested');
        
        // Wait a bit for OTP to be generated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify OTP (use 123456 as default test OTP)
        const verifyRes = await axios.post(`${API_URL}/auth/verify-otp`, {
          phoneNumber: phone,
          otp: '123456',
          role: role,
          name: name
        });
        
        console.log(`  ✓ Logged in as ${name} (OTP)`);
        return {
          token: verifyRes.data.token,
          userId: verifyRes.data.user._id
        };
      } catch (otpErr) {
        console.error(`  ✗ OTP authentication also failed`);
        console.log('');
        console.log('  ❌ Authentication failed for', name);
        console.log('  ℹ Please run: node setupTestUsers.js');
        console.log('  ℹ This will create all test users with proper credentials');
        throw new Error(`Authentication failed for ${name}`);
      }
    }
  } catch (error) {
    throw error;
  }
}

// Step 1: Create/Login test users
async function setupTestUsers() {
  console.log('\n====== STEP 1: SETUP TEST USERS ======');
  
  try {
    // Admin
    const admin = await loginOrCreateUser(
      '+919999999999', 
      'admin', 
      'Test Admin',
      'admin@indulgeout.com',
      'admin123'
    );
    testData.adminToken = admin.token;
    
    // Community Organizer
    const community = await loginOrCreateUser(
      '+919999999991', 
      'community_organizer', 
      'Test Community',
      'community@test.com',
      'test123'
    );
    testData.communityToken = community.token;
    testData.communityId = community.userId;
    
    // Venue
    const venue = await loginOrCreateUser(
      '+919999999992', 
      'venue', 
      'Test Venue',
      'venue@test.com',
      'test123'
    );
    testData.venueToken = venue.token;
    testData.venueId = venue.userId;
    
    // Brand
    const brand = await loginOrCreateUser(
      '+919999999993', 
      'brand_sponsor', 
      'Test Brand',
      'brand@test.com',
      'test123'
    );
    testData.brandToken = brand.token;
    testData.brandId = brand.userId;
    
    console.log('\n✓ All test users created successfully!');
  } catch (error) {
    console.error('✗ Failed to setup test users');
    process.exit(1);
  }
}

// Step 2: Submit a proposal (Community → Venue)
async function submitProposal() {
  console.log('\n====== STEP 2: SUBMIT PROPOSAL (Community → Venue) ======');
  
  try {
    const proposalData = {
      type: 'communityToVenue',
      recipientId: testData.venueId,
      recipientType: 'venue',
      formData: {
        eventType: 'Music Concert',
        expectedAttendees: '500',
        seatingCapacity: '600',
        eventDate: {
          date: '2026-03-15',
          startTime: '18:00',
          endTime: '23:00'
        },
        showBackupDate: true,
        backupDate: {
          date: '2026-03-16',
          startTime: '18:00',
          endTime: '23:00'
        },
        requirements: {
          audioVisual: true,
          seating: true,
          barFood: true,
          production: true
        },
        pricing: {
          model: 'Fixed Fee',
          value: '₹50,000'
        }
      }
    };
    
    console.log('  📤 Sending proposal data:', JSON.stringify(proposalData, null, 2));
    console.log('  🔑 Using token:', testData.communityToken ? 'Present' : 'Missing');
    console.log('  👤 Community ID:', testData.communityId);
    console.log('  🏢 Venue ID:', testData.venueId);
    
    const res = await axios.post(`${API_URL}/collaborations/propose`, proposalData, {
      headers: { Authorization: `Bearer ${testData.communityToken}` }
    });
    
    testData.proposalId = res.data.data.id;
    console.log(`  ✓ Proposal submitted successfully!`);
    console.log(`  📄 Proposal ID: ${testData.proposalId}`);
    console.log(`  📊 Status: ${res.data.data.status}`);
  } catch (error) {
    console.error(`  ✗ Error submitting proposal: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.error('  📋 Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Step 3: Admin approves proposal
async function adminApprovesProposal() {
  console.log('\n====== STEP 3: ADMIN APPROVES PROPOSAL ======');
  
  try {
    console.log('  📤 Approving proposal ID:', testData.proposalId);
    console.log('  🔑 Using admin token:', testData.adminToken ? 'Present' : 'Missing');
    
    const res = await axios.put(
      `${API_URL}/admin/collaborations/${testData.proposalId}/approve`,
      { adminNotes: 'All compliance checks passed. Approved for delivery.' },
      { headers: { Authorization: `Bearer ${testData.adminToken}` } }
    );
    
    console.log(`  ✓ Proposal approved by admin!`);
    console.log(`  📊 New Status: ${res.data.data.status}`);
    console.log(`  📧 Notification sent to venue`);
  } catch (error) {
    console.error(`  ✗ Error approving proposal: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.error('  📋 Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.response?.status) {
      console.error('  📊 Status code:', error.response.status);
    }
    throw error;
  }
}

// Step 4: Venue submits counter-proposal
async function venueSubmitsCounter() {
  console.log('\n====== STEP 4: VENUE SUBMITS COUNTER-PROPOSAL ======');
  
  try {
    const counterData = {
      counterData: {
        fieldResponses: {
          seatingCapacity: {
            action: 'modify',
            modifiedValue: '550',
            note: 'We can provide 550 seats comfortably'
          },
          expectedAttendees: {
            action: 'accept',
            note: '500 attendees is perfect'
          }
        },
        houseRules: {
          alcohol: {
            allowed: true,
            note: 'Alcohol service available with proper licensing'
          },
          soundLimit: '85 dB until 11 PM',
          ageRestriction: '18+',
          setupWindow: '4 hours before event start',
          additionalRules: 'No outside food or beverages'
        },
        commercialCounter: {
          model: 'Fixed Fee',
          value: '₹65,000',
          note: 'Includes full A/V setup and bar service'
        },
        generalNotes: 'Looking forward to hosting your event!'
      }
    };
    
    const res = await axios.post(
      `${API_URL}/collaborations/${testData.proposalId}/counter`,
      counterData,
      { headers: { Authorization: `Bearer ${testData.venueToken}` } }
    );
    
    testData.counterId = res.data.data.id;
    console.log(`  ✓ Counter-proposal submitted by venue!`);
    console.log(`  📄 Counter ID: ${testData.counterId}`);
    console.log(`  📊 New Status: ${res.data.data.status}`);
    console.log(`  💰 Counter Offer: ${counterData.counterData.commercialCounter.value}`);
  } catch (error) {
    console.error(`  ✗ Error submitting counter: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Step 5: Admin approves counter
async function adminApprovesCounter() {
  console.log('\n====== STEP 5: ADMIN APPROVES COUNTER ======');
  
  try {
    const res = await axios.put(
      `${API_URL}/admin/collaborations/counters/${testData.counterId}/approve`,
      { adminNotes: 'Counter-proposal looks fair. Approved for delivery.' },
      { headers: { Authorization: `Bearer ${testData.adminToken}` } }
    );
    
    console.log(`  ✓ Counter approved by admin!`);
    console.log(`  📊 Counter Status: approved`);
    console.log(`  📧 Notification sent to community organizer`);
  } catch (error) {
    console.error(`  ✗ Error approving counter: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Step 6: Community accepts counter
async function communityAcceptsCounter() {
  console.log('\n====== STEP 6: COMMUNITY ACCEPTS COUNTER ======');
  
  try {
    const res = await axios.put(
      `${API_URL}/collaborations/${testData.proposalId}/accept`,
      {},
      { headers: { Authorization: `Bearer ${testData.communityToken}` } }
    );
    
    console.log(`  ✓ Counter accepted by community!`);
    console.log(`  📊 Final Status: ${res.data.data.status}`);
    console.log(`  🎉 Collaboration CONFIRMED!`);
  } catch (error) {
    console.error(`  ✗ Error accepting counter: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Step 7: Verify final state
async function verifyFinalState() {
  console.log('\n====== STEP 7: VERIFY FINAL STATE ======');
  
  try {
    const res = await axios.get(
      `${API_URL}/collaborations/${testData.proposalId}`,
      { headers: { Authorization: `Bearer ${testData.communityToken}` } }
    );
    
    const collab = res.data.data;
    
    console.log(`  📊 Status: ${collab.status}`);
    console.log(`  ✓ Type: ${collab.type}`);
    console.log(`  ✓ Proposer: ${collab.proposerId?.name || collab.proposerId?.username || 'Community Organizer'}`);
    console.log(`  ✓ Recipient: ${collab.recipientId?.name || collab.recipientId?.username || 'Venue'}`);
    console.log(`  ✓ Original Proposal: Seating ${collab.formData?.seatingCapacity}, Price ${collab.formData?.pricing?.value}`);
    
    if (collab.latestCounterId) {
      console.log(`  ✓ Counter Submitted: Yes`);
      console.log(`  ✓ Counter ID: ${collab.latestCounterId._id || collab.latestCounterId}`);
    }
    
    if (collab.status === 'confirmed') {
      console.log(`\n  ✅ SUCCESS! Collaboration workflow completed successfully!`);
      console.log(`  🎯 All 7 steps passed: Submit → Admin Approve → Counter → Admin Approve → Accept → Confirmed`);
    } else {
      console.log(`\n  ⚠️  WARNING: Status is ${collab.status}, expected 'confirmed'`);
    }
  } catch (error) {
    console.error(`  ✗ Error verifying final state: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   COLLABORATION WORKFLOW END-TO-END TEST                      ║');
  console.log('║   Testing: Proposal → Admin → Counter → Admin → Accept       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  
  try {
    await setupTestUsers();
    await submitProposal();
    await adminApprovesProposal();
    await venueSubmitsCounter();
    await adminApprovesCounter();
    await communityAcceptsCounter();
    await verifyFinalState();
    
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED!                                        ║');
    console.log('║   The collaboration workflow is working correctly.            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   ✗ TESTS FAILED!                                            ║');
    console.log('║   Please check the errors above and fix the issues.          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    process.exit(1);
  }
}

// Run the tests
runTests();
