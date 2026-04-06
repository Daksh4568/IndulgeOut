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
  qrCodeUrl: {
    type: String, // Cloudinary URL for QR code (better for emails)
    required: false
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
    specialRequirements: String,
    // Revenue breakdown (organizer's share)
    basePrice: {
      type: Number,
      default: 0
    },
    gstAndOtherCharges: {
      type: Number,
      default: 0
    },
    platformFees: {
      type: Number,
      default: 0
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    // Additional metadata
    registrationSource: String,
    registeredAt: Date,
    slotsBooked: Number,
    orderId: String,
    groupingOffer: String,
    tierPeople: Number,
    guestName: String,
    guestEmail: String,
    primaryUserId: mongoose.Schema.Types.ObjectId,
    // Coupon/discount tracking
    couponCode: String,
    couponDiscount: Number,
    couponDiscountType: String,
    couponDiscountValue: Number,
    originalAmount: Number,
    // Price timeline tracking - what price tier was active at purchase time
    priceAtPurchase: Number,
    pricingTimelineTier: String, // label of the timeline tier active at purchase
    // Gender-based pricing breakdown
    genderBreakdown: {
      male: { type: Number, default: 0 },
      female: { type: Number, default: 0 }
    }
  },
  // Settlement tracking fields
  settlementStatus: {
    type: String,
    enum: ['pending', 'captured', 'settled', 'reconciled', 'failed'],
    default: 'pending'
  },
  settlementDate: {
    type: Date
  },
  settlementUTR: {
    type: String // Bank transaction reference number
  },
  settlementAmount: {
    type: Number // Final amount settled to organizer (after gateway fees)
  },
  cashfreeServiceCharge: {
    type: Number // Cashfree's processing fee (1.2% of order amount)
  },
  cashfreeServiceTax: {
    type: Number // GST on Cashfree's service charge
  },
  gatewayResponse: {
    paymentId: String,
    paymentMethod: String,
    paymentStatus: String,
    bank: String,
    wallet: String,
    cardType: String,
    lastFourDigits: String
  },
  reconciliationStatus: {
    type: String,
    enum: ['pending', 'verified', 'mismatch', 'manual_review'],
    default: 'pending'
  },
  lastReconciliationDate: {
    type: Date
  },
  reconciliationNotes: {
    type: String
  },
  refund: {
    status: {
      type: String,
      enum: ['none', 'requested', 'processing', 'processed', 'rejected'],
      default: 'none'
    },
    requestedAt: Date,
    refundCategory: String,
    requestReason: String,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cashfreeRefundId: String,
    refundARN: String,
    refundAmount: Number,
    refundSpeed: {
      type: String,
      default: 'STANDARD'
    },
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String
  }
}, {
  timestamps: true
});

// Index for faster queries
ticketSchema.index({ user: 1, event: 1 });
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ settlementStatus: 1 });
ticketSchema.index({ reconciliationStatus: 1 });
ticketSchema.index({ 'refund.status': 1 });
ticketSchema.index({ purchaseDate: 1 });
ticketSchema.index({ 'metadata.orderId': 1 });

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

// Method to cancel ticket (DISABLED - Feature will be added later for B2C users)
// Kept for future implementation but currently not updating participant counts
ticketSchema.methods.cancel = async function() {
  throw new Error('Ticket cancellation is currently not available. This feature will be added soon.');
  
  // Future implementation:
  // if (this.status === 'checked_in') {
  //   throw new Error('Cannot cancel checked-in ticket');
  // }
  // this.status = 'cancelled';
  // await this.save();
  // return this;
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
