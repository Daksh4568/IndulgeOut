/**
 * Reset Workspace Script
 * Clears fieldAgreements, sectionStatus, fieldHistory and sets isActive=false
 * Preserves forumMessages and fieldNotes
 * 
 * Usage: node scripts/resetWorkspace.js <collaborationId>
 * Example: node scripts/resetWorkspace.js 69b2ddbb16b883bbedb08a7c
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Collaboration = require('../models/Collaboration');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function resetWorkspace(collaborationId) {
  if (!collaborationId) {
    console.error('Usage: node scripts/resetWorkspace.js <collaborationId>');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const collaboration = await Collaboration.findById(collaborationId);
    if (!collaboration) {
      console.error(`Collaboration ${collaborationId} not found`);
      process.exit(1);
    }

    console.log(`Found collaboration: ${collaboration.type}`);
    console.log(`Status: ${collaboration.status}`);
    console.log(`Workspace active: ${collaboration.workspace?.isActive}`);

    // Reset workspace fields but preserve forum messages and notes
    collaboration.workspace.isActive = false;
    collaboration.workspace.isLocked = false;
    collaboration.workspace.fieldAgreements = {};
    collaboration.workspace.fieldHistory = {};
    collaboration.workspace.sectionStatus = {};
    collaboration.workspace.confirmedBy = [];
    // Keep forumMessages and fieldNotes intact

    collaboration.markModified('workspace');
    await collaboration.save();

    console.log('Workspace reset successfully!');
    console.log('Forum messages and field notes preserved.');
    console.log('Open the workspace again in the browser to re-initialize with corrected data.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

const collaborationId = process.argv[2];
resetWorkspace(collaborationId);
