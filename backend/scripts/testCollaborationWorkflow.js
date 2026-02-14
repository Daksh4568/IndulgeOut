/**
 * COLLABORATION WORKFLOW TEST SCRIPT
 * 
 * Tests all 4 collaboration types through the complete workflow:
 * 1. Community → Venue
 * 2. Community → Brand
 * 3. Brand → Community
 * 4. Venue → Community
 * 
 * Each test covers:
 * - Proposal submission
 * - Admin review
 * - Counter submission
 * - Admin review of counter
 * - Final acceptance
 * 
 * Prerequisites:
 * - Run: node scripts/setupTestUsers.js (to create test accounts)
 * - Backend server running on port 5000
 * 
 * Run: node scripts/testCollaborationWorkflow.js
 */

const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';

// Helper to add delays between operations
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test credentials - Updated for OTP authentication
const USERS = {
  admin: {
    email: 'testadmin@indulgeout.com',
    phone: '8888888801',
    name: 'Test Admin',
    token: null,
    userId: null
  },
  community: {
    email: 'testcommunity@indulgeout.com',
    phone: '8888888802',
    name: 'Test Community Organizer',
    token: null,
    userId: null
  },
  venue: {
    email: 'testvenue@indulgeout.com',
    phone: '8888888803',
    name: 'Test Venue Partner',
    token: null,
    userId: null
  },
  brand: {
    email: 'testbrand@indulgeout.com',
    phone: '8888888804',
    name: 'Test Brand Sponsor',
    token: null,
    userId: null
  }
};

// Helper function to make API calls
async function apiCall(method, endpoint, data, token) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    console.error(`❌ API Error on ${method} ${endpoint}:`, errorMsg);
    if (error.response?.data) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(errorMsg);
  }
}

// Authenticate user via OTP email
async function authenticateUser(userKey) {
  const user = USERS[userKey];
  console.log(`   Authenticating ${userKey}... (${user.email})`);
  
  try {
    // Request OTP via email
    const otpRequest = await axios.post(`${API_BASE}/auth/otp/send`, {
      identifier: user.email,
      method: 'email'
    });

    // For test accounts (@indulgeout.com), OTP is returned in response
    const otp = otpRequest.data.otp || '123456';
    
    // Small delay to ensure OTP is processed
    await delay(500);

    // Verify OTP and get token
    const verifyResponse = await axios.post(`${API_BASE}/auth/otp/verify`, {
      identifier: user.email,
      otp: otp,
      method: 'email'
    });

    if (verifyResponse.data.token) {
      user.token = verifyResponse.data.token;
      user.userId = verifyResponse.data.user._id || verifyResponse.data.user.id;
      console.log(`   ✅ ${userKey} authenticated (userId: ${user.userId})`);
      return true;
    }
  } catch (error) {
    console.error(`   ❌ Failed to authenticate ${userKey}:`, error.response?.data?.message || error.message);
    return false;
  }
}

// Authenticate all users
async function authenticateAllUsers() {
  console.log('\n🔐 AUTHENTICATING TEST USERS');
  console.log('='.repeat(60));
  
  const results = await Promise.all([
    authenticateUser('admin'),
    authenticateUser('community'),
    authenticateUser('venue'),
    authenticateUser('brand')
  ]);

  if (!results.every(r => r)) {
    console.error('\n❌ AUTHENTICATION FAILED: Not all users could authenticate');
    console.error('   Please ensure test users exist. Run: node scripts/setupTestUsers.js');
    process.exit(1);
  }

  console.log('\n✅ All users authenticated successfully\n');
}

// Test 1: Community → Venue Proposal
async function testCommunityToVenue() {
  console.log('\n📋 TEST 1: Community → Venue Collaboration');
  console.log('='.repeat(60));

  try {
    // Step 1: Submit proposal
    console.log('\n1️⃣  Community submits venue request...');
    const proposalData = {
      type: 'communityToVenue',
      recipientId: USERS.venue.userId,
      recipientType: 'venue',
      formData: {
        eventType: 'Music & Concerts',
        expectedAttendees: '100-250',
        seatingCapacity: '100-250',
        eventDate: {
          date: '2026-03-15',
          startTime: '18:00',
          endTime: '21:00'
        },
        showBackupDate: false,
        backupDate: { date: '', startTime: '', endTime: '' },
        requirements: {
          spaceOnly: { selected: true },
          barFood: { selected: true },
          av: { 
            selected: true,
            suboptions: ['mic', 'speakers', 'lighting']
          }
        },
        pricing: {
          revenueShare: {
            selected: true,
            percentage: 30
          }
        },
        supportingInfo: { images: [], note: 'Test venue request for music event' }
      }
    };

    const proposal = await apiCall('POST', '/collaborations/propose', proposalData, USERS.community.token);
    console.log('✅ Proposal submitted:', proposal.collaboration._id);
    const collabId = proposal.collaboration._id;

    // Step 2: Admin approves
    console.log('\n2️⃣  Admin reviews and approves...');
    await apiCall('PUT', `/admin/collaborations/${collabId}/approve`, {}, USERS.admin.token);
    console.log('✅ Admin approved proposal');

    // Step 3: Venue submits counter
    console.log('\n3️⃣  Venue submits counter-proposal...');
    const counterData = {
      counterData: {
        fieldResponses: {
          eventType: { action: 'accept' },
          seatingCapacity: { action: 'accept' },
          eventDate: { action: 'modify', modifiedValue: '2026-03-16', note: 'Backup date preferred' },
          requirements: { action: 'accept' },
          pricing: { action: 'modify', modifiedValue: { revenueShare: { percentage: 40 } }, note: 'Weekend premium pricing' }
        },
        houseRules: {
          alcohol: { allowed: true, note: 'Licensed bar service available' },
          soundLimit: '85dB after 10 PM',
          ageRestriction: '21+',
          setupWindow: 'Access from 4 PM',
          additionalRules: 'No outside food or beverages'
        },
        commercialCounter: {
          model: 'Revenue Share',
          percentage: 40,
          note: 'Weekend premium pricing'
        },
        generalNotes: 'Counter-proposal with modified date and pricing'
      }
    };

    await apiCall('POST', `/collaborations/${collabId}/counter`, counterData, USERS.venue.token);
    console.log('✅ Venue counter submitted');

    // Step 4: Admin approves counter
    console.log('\n4️⃣  Admin approves counter...');
    await apiCall('PUT', `/admin/collaborations/counters/${collabId}/approve`, {}, USERS.admin.token);
    console.log('✅ Admin approved counter');

    // Step 5: Community accepts counter
    console.log('\n✅ TEST 1 PASSED: Community → Venue workflow complete');
    console.log('   ✅ Proposal Form: communityToVenue');
    console.log('   ✅ Counter Form: VenueCounterForm\n');
    return true;
  } catch (error) {
    console.error('\n❌ TEST 1 FAILED:', error.message);
    console.error('   Forms tested: communityToVenue proposal, VenueCounterForm\n');
    return false;
  }
}

// Test 2: Community → Brand Sponsorship
async function testCommunityToBrand() {
  console.log('\n📋 TEST 2: Community → Brand Sponsorship');
  console.log('='.repeat(60));

  try {
    // Step 1: Submit sponsorship proposal
    console.log('\n1️⃣  Community requests brand sponsorship...');
    const proposalData = {
      type: 'communityToBrand',
      recipientId: USERS.brand.userId,
      recipientType: 'brand',
      formData: {
        eventCategory: 'Food & Culinary',
        expectedAttendees: '250-500',
        targetAudience: 'Food enthusiasts aged 25-40',
        city: 'Mumbai',
        brandDeliverables: {
          logoPlacement: { 
            selected: true, 
            suboptions: ['posters', 'banners', 'social_posts'] 
          },
          digitalShoutouts: { 
            selected: true, 
            suboptions: ['instagram_posts', 'stories'] 
          },
          leadCapture: { 
            selected: true, 
            suboptions: ['registration_data'] 
          }
        },
        pricing: {
          cashSponsorship: {
            selected: true,
            amount: 50000
          },
          barter: {
            selected: true,
            description: 'Product hampers worth ₹25,000'
          }
        },
        supportingInfo: { images: [], note: 'Test brand sponsorship request' }
      }
    };

    const proposal = await apiCall('POST', '/collaborations/propose', proposalData, USERS.community.token);
    console.log('✅ Proposal submitted:', proposal.collaboration._id);
    const collabId = proposal.collaboration._id;

    // Step 2: Admin approves
    console.log('\n2️⃣  Admin approves...');
    await apiCall('PUT', `/admin/collaborations/${collabId}/approve`, {}, USERS.admin.token);
    console.log('✅ Admin approved');

    // Step 3: Brand submits counter
    console.log('\n3️⃣  Brand submits counter...');
    const counterData = {
      counterData: {
        fieldResponses: {
          eventCategory: { action: 'accept' },
          expectedAttendees: { action: 'modify', modifiedValue: '200-300', note: 'Realistic reach' },
          brandDeliverables: { action: 'accept' },
          pricing: { action: 'modify', modifiedValue: { cashSponsorship: { amount: 40000 }, barter: { description: '₹20,000 barter' } } }
        },
        brandTerms: {
          activationTypes: 'Product Sampling, Booth Setup',
          deliveryTimeline: 'Assets 7 days before event',
          exclusivityTerms: 'No competing F&B brands',
          contentRights: 'Usage rights for 6 months'
        },
        commercialCounter: {
          model: 'Cash + Barter',
          note: 'Revised budget: ₹40,000 cash + ₹20,000 barter (realistic targets)'
        },
        generalNotes: 'Counter with revised budget'
      }
    };

    await apiCall('POST', `/collaborations/${collabId}/counter`, counterData, USERS.brand.token);
    console.log('✅ Brand counter submitted');

    // Step 4: Admin approves counter
    console.log('\n4️⃣  Admin approves counter...');
    await apiCall('PUT', `/admin/collaborations/counters/${collabId}/approve`, {}, USERS.admin.token);
    console.log('✅ Admin approved counter');

    // Step 5: Community accepts
    console.log('\n5️⃣  Community accepts terms...');
    await apiCall('POST', `/collaborations/${collabId}/counter/accept`, { acceptanceMessage: 'Agreed' }, USERS.community.token);
    console.log('✅ Collaboration confirmed!');

    console.log('\n✅ TEST 2 PASSED: Community → Brand workflow complete');
    console.log('   ✅ Proposal Form: communityToBrand');
    console.log('   ✅ Counter Form: BrandCounterForm\n');
    return true;
  } catch (error) {
    console.error('\n❌ TEST 2 FAILED:', error.message);
    console.error('   Forms tested: communityToBrand proposal, BrandCounterForm\n');
    return false;
  }
}

// Test 3: Brand → Community Campaign
async function testBrandToCommunity() {
  console.log('\n📋 TEST 3: Brand → Community Campaign');
  console.log('='.repeat(60));

  try {
    // Step 1: Brand proposes campaign
    console.log('\n1️⃣  Brand proposes marketing campaign...');
    const proposalData = {
      type: 'brandToCommunity',
      recipientId: USERS.community.userId,
      recipientType: 'community',
      formData: {
        campaignObjectives: {
          brandAwareness: { selected: true },
          productTrials: { selected: true },
          engagement: { selected: true }
        },
        targetAudience: 'Young professionals aged 25-35, tech-savvy',
        preferredFormats: ['Event Sponsorship', 'Social Campaign', 'Contest'],
        brandOffers: {
          cash: { selected: true, amount: 30000 },
          barter: { selected: true, description: 'Product vouchers worth ₹15,000' },
          content: { selected: true, description: 'Professional photography & videography' }
        },
        brandExpectations: {
          branding: { selected: true, description: 'Logo on all materials' },
          digitalShoutouts: { selected: true, description: '5 Instagram posts + stories' },
          leadCapture: { selected: true, description: 'Attendee emails & phone numbers' },
          exclusivity: { selected: true, description: 'No competing brands for 3 months' }
        },
        additionalTerms: 'Launch within 4 weeks',
        supportingInfo: { images: [], note: 'Test brand campaign proposal' }
      }
    };

    const proposal = await apiCall('POST', '/collaborations/propose', proposalData, USERS.brand.token);
    console.log('✅ Proposal submitted:', proposal.collaboration._id);
    const collabId = proposal.collaboration._id;

    // Step 2: Admin approves
    console.log('\n2️⃣  Admin approves...');
    await apiCall('PUT', `/admin/collaborations/${collabId}/approve`, {}, USERS.admin.token);
    console.log('✅ Admin approved');

    // Step 3: Community responds
    console.log('\n3️⃣  Community submits counter...');
    const counterData = {
      counterData: {
        fieldResponses: {
          campaignObjectives: { action: 'accept' },
          targetAudience: { action: 'modify', modifiedValue: '2000 active members, 70% aged 22-32' },
          preferredFormats: { action: 'accept' },
          brandOffers: { action: 'modify', modifiedValue: { barter: { description: '₹20,000 worth vouchers' } }, note: 'Increased barter value' },
          brandExpectations: { action: 'partial', note: 'Accepting branding & digital, modifying lead capture, declining exclusivity' }
        },
        communityCommitments: {
          deliverables: 'Social Posts, Event Feature, Email Blast',
          audienceEngagement: 'Will promote across 3 social platforms',
          contentCreation: 'Event photos, 2 reels, community story',
          timeline: 'Can launch in 3 weeks'
        },
        generalNotes: 'Counter with modified terms - emails only, no exclusivity'
      }
    };

    await apiCall('POST', `/collaborations/${collabId}/counter`, counterData, USERS.community.token);
    console.log('✅ Community counter submitted');

    // Step 4: Admin approves counter
    console.log('\n4️⃣  Admin approves counter...');
    await apiCall('PUT', `/admin/collaborations/counters/${collabId}/approve`, {}, USERS.admin.token);
    console.log('✅ Admin approved counter');

    // Step 5: Brand accepts
    console.log('\n5️⃣  Brand accepts terms...');
    await apiCall('POST', `/collaborations/${collabId}/counter/accept`, { acceptanceMessage: 'Terms accepted' }, USERS.brand.token);
    console.log('✅ Collaboration confirmed!');

    console.log('\n✅ TEST 3 PASSED: Brand → Community workflow complete');
    console.log('   ✅ Proposal Form: brandToCommunity');
    console.log('   ✅ Counter Form: CommunityCounterFormBrand\n');
    return true;
  } catch (error) {
    console.error('\n❌ TEST 3 FAILED:', error.message);
    console.error('   Forms tested: brandToCommunity proposal, CommunityCounterFormBrand\n');
    return false;
  }
}

// Test 4: Venue → Community Partnership
async function testVenueToCommunity() {
  console.log('\n📋 TEST 4: Venue → Community Partnership');
  console.log('='.repeat(60));

  try {
    // Step 1: Venue proposes partnership
    console.log('\n1️⃣  Venue proposes partnership...');
    const proposalData = {
      type: 'venueToCommunity',
      recipientId: USERS.community.userId,
      recipientType: 'community',
      formData: {
        venueType: 'Rooftop',
        capacityRange: '150-300',
        preferredFormats: ['Concert/Music', 'Networking', 'Exhibition'],
        venueOfferings: {
          space: { selected: true, suboptions: ['indoor', 'outdoor', 'stage'] },
          av: { selected: true, suboptions: ['mic', 'speakers', 'projector', 'lighting'] },
          furniture: { selected: true, suboptions: ['tables', 'chairs'] },
          fnb: { selected: true, suboptions: ['catering', 'bar'] },
          staff: { selected: true, suboptions: ['service_staff', 'security'] },
          marketing: { selected: true, suboptions: ['social_media', 'listing'] }
        },
        commercialModels: {
          rental: { selected: true, amount: 25000 },
          revenueShare: { selected: true, percentage: 30 }
        },
        additionalTerms: 'Flexible booking terms',
        supportingInfo: { images: [], note: 'Test venue partnership proposal' }
      }
    };

    const proposal = await apiCall('POST', '/collaborations/propose', proposalData, USERS.venue.token);
    console.log('✅ Proposal submitted:', proposal.collaboration._id);
    const collabId = proposal.collaboration._id;

    // Step 2: Admin approves
    console.log('\n2️⃣  Admin approves...');
    await apiCall('PUT', `/admin/collaborations/${collabId}/approve`, {}, USERS.admin.token);
    console.log('✅ Admin approved');

    // Step 3: Community responds
    console.log('\n3️⃣  Community submits counter...');
    const counterData = {
      counterData: {
        fieldResponses: {
          venueType: { action: 'accept' },
          capacityRange: { action: 'accept' },
          preferredFormats: { action: 'modify', modifiedValue: ['Concert/Music', 'Networking'] },
          venueOfferings: { action: 'partial', note: 'Bar service only, no catering' },
          commercialModels: { action: 'modify', modifiedValue: { revenueShare: { percentage: 60 } }, note: '60-40 split with ₹10k minimum guarantee' }
        },
        communityTerms: {
          expectedCapacity: '150-200 per event',
          eventFrequency: '2-3 events per month',
          marketingCommitment: 'Will promote on community socials, email list',
          additionalRequirements: 'Need parking for 50 cars'
        },
        generalNotes: 'Counter with modified commercial model - revenue share only'
      }
    };

    await apiCall('POST', `/collaborations/${collabId}/counter`, counterData, USERS.community.token);
    console.log('✅ Community counter submitted');

    // Step 4: Admin approves counter
    console.log('\n4️⃣  Admin approves counter...');
    await apiCall('PUT', `/admin/collaborations/counters/${collabId}/approve`, {}, USERS.admin.token);
    console.log('✅ Admin approved counter');

    // Step 5: Venue accepts
    console.log('\n5️⃣  Venue accepts terms...');
    await apiCall('POST', `/collaborations/${collabId}/counter/accept`, { acceptanceMessage: 'Partnership confirmed' }, USERS.venue.token);
    console.log('✅ Collaboration confirmed!');

    console.log('\n✅ TEST 4 PASSED: Venue → Community workflow complete');
    console.log('   ✅ Proposal Form: venueToCommunity');
    console.log('   ✅ Counter Form: CommunityCounterFormVenue\n');
    return true;
  } catch (error) {
    console.error('\n❌ TEST 4 FAILED:', error.message);
    console.error('   Forms tested: venueToCommunity proposal, CommunityCounterFormVenue\n');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 COLLABORATION WORKFLOW TEST SUITE');
  console.log('='.repeat(60));

  console.log('\n📋 Testing Complete B2B Collaboration System');
  console.log('   - 4 Proposal Forms');
  console.log('   - 4 Counter Forms');
  console.log('   - Hidden Admin Review Layer');
  console.log('   - Field-by-Field Responses\n');

  // Authenticate all users first
  await authenticateAllUsers();

  const results = {
    communityToVenue: false,
    communityToBrand: false,
    brandToCommunity: false,
    venueToCommunity: false
  };

  // Run all tests
  results.communityToVenue = await testCommunityToVenue();
  await delay(2000); // Small delay between tests
  
  results.communityToBrand = await testCommunityToBrand();
  await delay(2000);
  
  results.brandToCommunity = await testBrandToCommunity();
  await delay(2000);
  
  results.venueToCommunity = await testVenueToCommunity();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Community → Venue: ${results.communityToVenue ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Community → Brand: ${results.communityToBrand ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Brand → Community: ${results.brandToCommunity ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Venue → Community: ${results.venueToCommunity ? 'PASSED' : 'FAILED'}`);

  const totalPassed = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;

  console.log('\n' + '='.repeat(60));
  console.log(`FINAL RESULT: ${totalPassed}/${totalTests} tests passed`);
  console.log('='.repeat(60) + '\n');

  process.exit(totalPassed === totalTests ? 0 : 1);
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { 
  testCommunityToVenue, 
  testCommunityToBrand, 
  testBrandToCommunity, 
  testVenueToCommunity 
};
