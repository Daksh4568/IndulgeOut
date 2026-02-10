/**
 * Setup Test Users Script
 * Creates all test users needed for collaboration workflow testing
 * 
 * Run: node setupTestUsers.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout';

const userSchema = new mongoose.Schema({
  phoneNumber: String,
  email: String,
  name: String,
  role: String,
  hostPartnerType: String,
  password: String,
  isVerified: Boolean,
  interests: [String],
  location: String,
  adminProfile: {
    accessLevel: String,
    permissions: [String],
    department: String
  },
  createdAt: { type: Date, default: Date.now }
});

const testUsers = [
  {
    phoneNumber: '9999999999',
    email: 'admin@indulgeout.com',
    name: 'Admin User',
    role: 'admin',
    password: 'admin123',
    adminProfile: {
      accessLevel: 'super_admin',
      permissions: ['manage_users', 'manage_events', 'manage_collaborations', 'view_analytics', 'manage_payments', 'moderate_content', 'system_settings'],
      department: 'System'
    }
  },
  {
    phoneNumber: '9999999991',
    email: 'community@test.com',
    name: 'Test Community',
    role: 'host_partner',
    hostPartnerType: 'community_organizer',
    password: 'test123'
  },
  {
    phoneNumber: '9999999992',
    email: 'venue@test.com',
    name: 'Test Venue',
    role: 'host_partner',
    hostPartnerType: 'venue',
    password: 'test123'
  },
  {
    phoneNumber: '9999999993',
    email: 'brand@test.com',
    name: 'Test Brand',
    role: 'host_partner',
    hostPartnerType: 'brand_sponsor',
    password: 'test123'
  }
];

async function setupTestUsers() {
  try {
    console.log('\n🔧 Setting up test users...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    const User = mongoose.model('User', userSchema);
    
    // Delete existing test users first
    console.log('\n🗑️  Removing existing test users...');
    const testEmails = testUsers.map(u => u.email);
    const testPhones = testUsers.map(u => u.phoneNumber);
    
    const deleteResult = await User.deleteMany({
      $or: [
        { email: { $in: testEmails } },
        { phoneNumber: { $in: testPhones } }
      ]
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log(`✓ Removed ${deleteResult.deletedCount} existing test user(s)`);
    } else {
      console.log('✓ No existing test users found');
    }
    
    console.log('\n📝 Creating fresh test users...\n');
    
    for (const userData of testUsers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create new user
      await User.create({
        ...userData,
        password: hashedPassword,
        isVerified: true
      });
      console.log(`✓ Created: ${userData.name} (${userData.role}${userData.hostPartnerType ? ' - ' + userData.hostPartnerType : ''})`);
    }
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST USER CREDENTIALS                      ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║                                                               ║');
    console.log('║  ADMIN                                                        ║');
    console.log('║    Phone:    9999999999                                      ║');
    console.log('║    Email:    admin@indulgeout.com                            ║');
    console.log('║    Password: admin123                                        ║');
    console.log('║                                                               ║');
    console.log('║  COMMUNITY ORGANIZER                                          ║');
    console.log('║    Phone:    9999999991                                      ║');
    console.log('║    Email:    community@test.com                              ║');
    console.log('║    Password: test123                                         ║');
    console.log('║                                                               ║');
    console.log('║  VENUE                                                        ║');
    console.log('║    Phone:    9999999992                                      ║');
    console.log('║    Email:    venue@test.com                                  ║');
    console.log('║    Password: test123                                         ║');
    console.log('║                                                               ║');
    console.log('║  BRAND                                                        ║');
    console.log('║    Phone:    9999999993                                      ║');
    console.log('║    Email:    brand@test.com                                  ║');
    console.log('║    Password: test123                                         ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    console.log('✅ All test users setup complete!\n');
    console.log('You can now:');
    console.log('  1. Login through the frontend with these credentials');
    console.log('  2. Run the test script: node testCollaborationWorkflow.js\n');
    
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting up test users:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupTestUsers();
