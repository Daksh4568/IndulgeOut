const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    minlength: [10, 'Review must be at least 10 characters long'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  photos: [{
    type: String,
    validate: {
      validator: function(v) {
        return this.photos.length <= 3;
      },
      message: 'Maximum 3 photos allowed per review'
    }
  }],
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerifiedAttendee: {
    type: Boolean,
    default: true
  },
  response: {
    text: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per event
reviewSchema.index({ event: 1, user: 1 }, { unique: true });

// Index for sorting by rating and date
reviewSchema.index({ event: 1, rating: -1, createdAt: -1 });
reviewSchema.index({ event: 1, helpfulCount: -1 });

// Method to mark review as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  if (!this.helpfulBy.includes(userId)) {
    this.helpfulBy.push(userId);
    this.helpfulCount += 1;
    await this.save();
  }
};

// Method to unmark helpful
reviewSchema.methods.unmarkHelpful = async function(userId) {
  const index = this.helpfulBy.indexOf(userId);
  if (index > -1) {
    this.helpfulBy.splice(index, 1);
    this.helpfulCount = Math.max(0, this.helpfulCount - 1);
    await this.save();
  }
};

module.exports = mongoose.model('Review', reviewSchema);
