const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  qrCode: {
    type: String, // Base64 encoded QR code image
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'checked_in', 'cancelled', 'refunded'],
    default: 'active'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  paymentId: {
    type: String // Payment gateway transaction ID
  },
  checkInTime: {
    type: Date
  },
  checkInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Staff/organizer who checked in
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
    required: true
  },
  metadata: {
    seatNumber: String,
    section: String,
    ticketType: {
      type: String,
      enum: ['general', 'vip', 'early_bird', 'group', 'complimentary'],
      default: 'general'
    },
    specialRequirements: String
  }
}, {
  timestamps: true
});

// Index for faster queries
ticketSchema.index({ user: 1, event: 1 });
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ status: 1 });

// Compound unique index to prevent duplicate tickets for same user-event combination
ticketSchema.index({ user: 1, event: 1 }, { unique: true });

// Method to check if ticket is valid
ticketSchema.methods.isValid = function() {
  return this.status === 'active' && new Date(this.event.date) > new Date();
};

// Method to check in ticket
ticketSchema.methods.checkIn = async function(staffUserId) {
  if (this.status !== 'active') {
    throw new Error('Ticket is not active');
  }
  
  this.status = 'checked_in';
  this.checkInTime = new Date();
  this.checkInBy = staffUserId;
  
  await this.save();
  return this;
};

// Method to cancel ticket
ticketSchema.methods.cancel = async function() {
  if (this.status === 'checked_in') {
    throw new Error('Cannot cancel checked-in ticket');
  }
  
  this.status = 'cancelled';
  await this.save();
  return this;
};

// Static method to generate unique ticket number
ticketSchema.statics.generateTicketNumber = async function() {
  const prefix = 'IND'; // IndulgeOut prefix
  const timestamp = Date.now().toString(36).toUpperCase(); // Base36 timestamp
  const random = Math.random().toString(36).substring(2, 6).toUpperCase(); // Random string
  
  const ticketNumber = `${prefix}-${timestamp}-${random}`;
  
  // Check if ticket number already exists (very unlikely)
  const exists = await this.findOne({ ticketNumber });
  if (exists) {
    return this.generateTicketNumber(); // Recursive retry
  }
  
  return ticketNumber;
};

module.exports = mongoose.model('Ticket', ticketSchema);
