/**
 * Webhook Health Monitoring Model
 * 
 * PURPOSE: Track all webhook calls for monitoring and debugging
 * HELPS: Identify webhook failures, success rates, response times
 */

const mongoose = require('mongoose');

const WebhookLogSchema = new mongoose.Schema({
  // Webhook details
  type: {
    type: String,
    required: true,
    enum: ['PAYMENT_SUCCESS_WEBHOOK', 'PAYMENT_FAILED_WEBHOOK', 'UNKNOWN']
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  paymentId: String,
  amount: Number,
  
  // Processing details
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed', 'duplicate'],
    index: true
  },
  processingTime: Number, // in milliseconds
  
  // Error tracking
  error: {
    message: String,
    stack: String,
    code: String
  },
  
  // Verification
  signatureVerified: {
    type: Boolean,
    default: false
  },
  
  // Request details
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  headers: {
    signature: String,
    timestamp: String,
    userAgent: String
  },
  
  // Response
  responseStatus: Number,
  responseMessage: String,
  
  // Metadata
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  ticketCreated: {
    type: Boolean,
    default: false
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: Date
}, {
  timestamps: true
});

// Indexes for common queries
WebhookLogSchema.index({ createdAt: -1 });
WebhookLogSchema.index({ status: 1, createdAt: -1 });
WebhookLogSchema.index({ orderId: 1, createdAt: -1 });

// Static method to get webhook stats
WebhookLogSchema.statics.getStats = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        receivedAt: {
          $gte: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
          $lte: endDate || new Date()
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ]);

  const total = stats.reduce((sum, s) => sum + s.count, 0);
  const successful = stats.find(s => s._id === 'success')?.count || 0;
  const failed = stats.find(s => s._id === 'failed')?.count || 0;
  const duplicate = stats.find(s => s._id === 'duplicate')?.count || 0;

  return {
    total,
    successful,
    failed,
    duplicate,
    successRate: total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : '0%',
    avgProcessingTime: stats.find(s => s._id === 'success')?.avgProcessingTime || 0
  };
};

module.exports = mongoose.model('WebhookLog', WebhookLogSchema);
