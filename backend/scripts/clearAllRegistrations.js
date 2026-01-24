const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

async function clearAllRegistrations() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indulgeout';
    await mongoose.connect(mongoURI);
    console.log('📦 Connected to MongoDB');

    // 1. Clear all tickets
    const ticketResult = await Ticket.deleteMany({});
    console.log(`🎫 Deleted ${ticketResult.deletedCount} tickets`);

    // 2. Clear participants from all events and reset participant count
    const eventResult = await Event.updateMany(
      {},
      { 
        $set: { 
          participants: [],
          currentParticipants: 0
        } 
      }
    );
    console.log(`🎪 Cleared participants from ${eventResult.modifiedCount} events`);

    // 3. Clear registeredEvents from all users
    const userResult = await User.updateMany(
      {},
      { $set: { registeredEvents: [] } }
    );
    console.log(`👤 Cleared registeredEvents from ${userResult.modifiedCount} users`);

    console.log('\n✅ All event registrations cleared successfully!');
    console.log('Users can now register fresh and tickets will be generated at registration time.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing registrations:', error);
    process.exit(1);
  }
}

clearAllRegistrations();
