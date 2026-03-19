require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const pending = await Ticket.countDocuments({ settlementStatus: 'pending', 'price.amount': { $gt: 0 } });
  const captured = await Ticket.countDocuments({ settlementStatus: 'captured', 'price.amount': { $gt: 0 } });
  const settled = await Ticket.countDocuments({ settlementStatus: 'settled' });
  const verified = await Ticket.countDocuments({ reconciliationStatus: 'verified' });
  const reconPending = await Ticket.countDocuments({ reconciliationStatus: 'pending' });
  
  console.log('=== Settlement Status ===');
  console.log('Pending:', pending);
  console.log('Captured:', captured);
  console.log('Settled:', settled);
  console.log('');
  console.log('=== Reconciliation Status ===');
  console.log('Verified:', verified);
  console.log('Pending:', reconPending);
  
  await mongoose.disconnect();
});
