require('dotenv').config();
const mongoose = require('mongoose');
const Collaboration = require('../models/Collaboration');

async function listCollaborations() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  
  const collabs = await Collaboration.find({
    status: { $in: ['counter_delivered', 'completed'] }
  }).select('_id type status initiator.name recipient.name workspace.isActive').lean();

  console.log('\n=== Collaborations with Workspace Access ===\n');
  collabs.forEach(c => {
    console.log(`ID: ${c._id.toString()}`);
    console.log(`Type: ${c.type}`);
    console.log(`Status: ${c.status}`);
    console.log(`Parties: ${c.initiator?.name} x ${c.recipient?.name}`);
    console.log(`Workspace Active: ${!!c.workspace?.isActive}`);
    console.log('---');
  });

  if (!collabs.length) {
    console.log('No collaborations found with counter_delivered or completed status.');
  }

  await mongoose.disconnect();
}

listCollaborations().catch(err => { console.error(err); process.exit(1); });
