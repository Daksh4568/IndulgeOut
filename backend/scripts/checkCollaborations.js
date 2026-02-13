require('dotenv').config();
const mongoose = require('mongoose');
const Collaboration = require('../models/Collaboration');
const User = require('../models/User');

async function checkCollaborations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

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

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkCollaborations();
