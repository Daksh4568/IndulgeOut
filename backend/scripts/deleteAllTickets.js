const mongoose = require('mongoose');
require('dotenv').config();

const Ticket = require('../models/Ticket');

const deleteAllTickets = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout');
    console.log('✅ Connected to MongoDB');

    // Delete all tickets
    const result = await Ticket.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} tickets from database`);

    console.log('🎉 All tickets cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting tickets:', error);
    process.exit(1);
  }
};

deleteAllTickets();
