require('dotenv').config();
const mongoose = require('mongoose');
const Collaboration = require('../models/Collaboration');
const User = require('../models/User');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function checkCollaborations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collaborations
    const allCollabs = await Collaboration.find().lean();
    console.log('\n=== TOTAL COLLABORATIONS IN DATABASE ===');
    console.log('Count:', allCollabs.length);

    if (allCollabs.length > 0) {
      console.log('\n=== FIRST COLLABORATION - FULL STRUCTURE ===');
      console.log(JSON.stringify(allCollabs[0], null, 2));

      console.log('\n=== ALL COLLABORATIONS ===');
      allCollabs.forEach((collab, index) => {
        console.log(`\n[${index + 1}] Collaboration ID: ${collab._id}`);
        console.log(`  Type: ${collab.type}`);
        console.log(`  Status: ${collab.status}`);
        console.log(`  Initiator User ID: ${collab.initiator?.user}`);
        console.log(`  Initiator Name: ${collab.initiator?.name}`);
        console.log(`  Recipient User ID: ${collab.recipient?.user}`);
        console.log(`  Recipient Name: ${collab.recipient?.name}`);
        console.log(`  Created: ${collab.createdAt}`);
      });

      // Group by status
      console.log('\n=== COLLABORATIONS BY STATUS ===');
      const byStatus = {};
      allCollabs.forEach(c => {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      });
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });

      // Check for legacy structure usage
      console.log('\n=== LEGACY STRUCTURE CHECK ===');
      const legacyCount = allCollabs.filter(c => c.proposerId || c.recipientId).length;
      const newStructureCount = allCollabs.filter(c => c.initiator?.user || c.recipient?.user).length;
      console.log(`  Using Legacy Fields (proposerId/recipientId): ${legacyCount}`);
      console.log(`  Using New Structure (initiator/recipient): ${newStructureCount}`);
    }

    // Get all community organizer users
    console.log('\n=== COMMUNITY ORGANIZER USERS ===');
    const communityUsers = await User.find({ 
      hostPartnerType: 'community_organizer' 
    }).select('_id name email').lean();
    
    console.log('Count:', communityUsers.length);
    communityUsers.forEach(user => {
      console.log(`  ${user.name} (${user.email}) - ID: ${user._id}`);
    });

    // Check collaborations for each community user
    console.log('\n=== COLLABORATIONS BY USER ===');
    for (const user of communityUsers) {
      const sentCount = await Collaboration.countDocuments({ 'initiator.user': user._id });
      const receivedCount = await Collaboration.countDocuments({ 'recipient.user': user._id });
      console.log(`${user.name}:`);
      console.log(`  Sent: ${sentCount}`);
      console.log(`  Received: ${receivedCount}`);
    }

    // Ask user if they want to delete all collaborations
    if (allCollabs.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('⚠️  DELETE COLLABORATIONS');
      console.log('='.repeat(60));
      console.log(`\nFound ${allCollabs.length} collaboration(s) in the database.`);
      const answer = await askQuestion('\n❓ Do you want to DELETE ALL collaborations? (yes/no): ');
      
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('\n🗑️  Deleting all collaborations...');
        const result = await Collaboration.deleteMany({});
        console.log(`✅ Successfully deleted ${result.deletedCount} collaboration(s)`);
        
        // Verify deletion
        const remainingCount = await Collaboration.countDocuments();
        console.log(`\n📊 Remaining collaborations: ${remainingCount}`);
        
        if (remainingCount === 0) {
          console.log('\n✨ Database is now clean! All collaborations removed.');
          console.log('📝 Next step: Remove legacy fields from Collaboration model');
        }
      } else {
        console.log('\n❌ Deletion cancelled. No collaborations were removed.');
      }
    } else {
      console.log('\n✨ No collaborations found in database. Database is clean!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkCollaborations();
