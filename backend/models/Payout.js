const mongoose = require('mongoose');

/**
 * Earnings/Payout Model
 * Tracks all financial transactions for organizers
 */

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['booking_fee', 'platform_fee', 'refund', 'adjustment', 'payout'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const payoutSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Financial Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Period covered by this payout
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  
  // Transaction Details
  transactionId: String, // Payment gateway transaction ID
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'razorpay', 'other'],
    default: 'bank_transfer'
  },
  
  // Events included in this payout
  eventsIncluded: [{
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    eventName: String,
    ticketsSold: Number,
    grossRevenue: Number,
    platformFee: Number,
    netAmount: Number
  }],
  
  // Breakdown
  breakdown: {
    grossRevenue: Number,      // Total revenue from all events
    platformFee: Number,        // Platform commission (e.g., 15%)
    platformFeePercentage: {
      type: Number,
      default: 15
    },
    netAmount: Number,          // Amount to be paid out
    refunds: Number,            // Any refunds processed
    adjustments: Number         // Manual adjustments
  },
  
  // Bank Details (snapshot at payout time)
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    upiId: String
  },
  
  // Processing Information
  initiatedAt: Date,
  processedAt: Date,
  completedAt: Date,
  failureReason: String,
  
  // Notes
  notes: String,
  internalNotes: String  // Admin only
  
}, {
  timestamps: true
});

// Indexes for efficient queries
payoutSchema.index({ organizer: 1, status: 1 });
payoutSchema.index({ periodStart: 1, periodEnd: 1 });
payoutSchema.index({ createdAt: -1 });

// Methods
payoutSchema.methods.calculateBreakdown = function() {
  const grossRevenue = this.eventsIncluded.reduce((sum, e) => sum + (e.grossRevenue || 0), 0);
  const platformFeePercentage = this.breakdown?.platformFeePercentage || 15;
  const platformFee = (grossRevenue * platformFeePercentage) / 100;
  const refunds = this.breakdown?.refunds || 0;
  const adjustments = this.breakdown?.adjustments || 0;
  const netAmount = grossRevenue - platformFee - refunds + adjustments;
  
  this.breakdown = {
    grossRevenue,
    platformFee,
    platformFeePercentage,
    netAmount,
    refunds,
    adjustments
  };
  this.amount = netAmount;
};

payoutSchema.methods.markAsCompleted = function(transactionId) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.transactionId = transactionId;
};

payoutSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
};

// Statics
payoutSchema.statics.getPendingPayoutsForOrganizer = async function(organizerId) {
  return this.find({
    organizer: organizerId,
    status: { $in: ['pending', 'processing'] }
  }).sort({ createdAt: -1 });
};

payoutSchema.statics.getTotalEarningsForOrganizer = async function(organizerId) {
  const result = await this.aggregate([
    {
      $match: {
        organizer: mongoose.Types.ObjectId(organizerId),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$amount' },
        totalPayouts: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { totalEarnings: 0, totalPayouts: 0 };
};

/**
 * Earnings Overview Model
 * Aggregated earnings data per organizer for quick dashboard access
 */
const earningsOverviewSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Lifetime Stats
  totalLifetimeEarnings: {
    type: Number,
    default: 0
  },
  totalEventRevenue: {
    type: Number,
    default: 0
  },
  totalPlatformFees: {
    type: Number,
    default: 0
  },
  totalPayouts: {
    type: Number,
    default: 0
  },
  
  // Current Period (This Month)
  currentMonth: {
    earnings: { type: Number, default: 0 },
    events: { type: Number, default: 0 },
    ticketsSold: { type: Number, default: 0 }
  },
  
  // Last Month (For growth calculation)
  lastMonth: {
    earnings: { type: Number, default: 0 },
    events: { type: Number, default: 0 },
    ticketsSold: { type: Number, default: 0 }
  },
  
  // Pending Payouts
  pendingPayout: {
    amount: { type: Number, default: 0 },
    events: { type: Number, default: 0 },
    oldestPendingDate: Date
  },
  
  // Last Payout
  lastPayout: {
    amount: Number,
    date: Date,
    transactionId: String
  },
  
  // Next Payout Estimate
  nextPayoutDate: Date,
  
  // Payment Details Status
  paymentDetailsCompleted: {
    type: Boolean,
    default: false
  },
  kycCompleted: {
    type: Boolean,
    default: false
  },
  
  // Monthly History (Last 12 months)
  monthlyHistory: [{
    month: String,  // 'YYYY-MM'
    earnings: Number,
    events: Number,
    ticketsSold: Number
  }],
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true
});

// Methods
earningsOverviewSchema.methods.updateFromPayouts = async function() {
  const Payout = mongoose.model('Payout');
  
  // Get all completed payouts
  const completedPayouts = await Payout.find({
    organizer: this.organizer,
    status: 'completed'
  }).sort({ completedAt: -1 });
  
  // Calculate totals
  this.totalLifetimeEarnings = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
  this.totalPayouts = completedPayouts.length;
  
  // Last payout
  if (completedPayouts.length > 0) {
    const last = completedPayouts[0];
    this.lastPayout = {
      amount: last.amount,
      date: last.completedAt,
      transactionId: last.transactionId
    };
  }
  
  // Pending payouts
  const pendingPayouts = await Payout.find({
    organizer: this.organizer,
    status: { $in: ['pending', 'processing'] }
  }).sort({ createdAt: 1 });
  
  this.pendingPayout = {
    amount: pendingPayouts.reduce((sum, p) => sum + p.amount, 0),
    events: pendingPayouts.reduce((sum, p) => sum + p.eventsIncluded.length, 0),
    oldestPendingDate: pendingPayouts[0]?.createdAt
  };
  
  this.lastUpdated = new Date();
  await this.save();
};

module.exports = {
  Payout: mongoose.model('Payout', payoutSchema),
  EarningsOverview: mongoose.model('EarningsOverview', earningsOverviewSchema)
};
