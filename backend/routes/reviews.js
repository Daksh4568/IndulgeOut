const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Event = require('../models/Event');
const User = require('../models/User');
const { authMiddleware } = require('../utils/authUtils');

// @route   POST /api/events/:eventId/review
// @desc    Submit a review for an event
// @access  Private
router.post('/:eventId/review', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const { rating, comment, photos } = req.body;

    // Validation
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (comment.length < 10) {
      return res.status(400).json({ message: 'Review must be at least 10 characters long' });
    }

    if (photos && photos.length > 3) {
      return res.status(400).json({ message: 'Maximum 3 photos allowed' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event has already occurred
    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate > now) {
      return res.status(400).json({ 
        message: 'You can only review events that have already occurred' 
      });
    }

    // Check if user was a participant
    const participant = event.participants.find(
      p => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(403).json({ 
        message: 'You must have attended this event to leave a review' 
      });
    }

    // Check if user already reviewed this event
    const existingReview = await Review.findOne({ event: eventId, user: userId });
    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this event. You can edit your existing review.' 
      });
    }

    // Create review
    const review = new Review({
      event: eventId,
      user: userId,
      rating,
      comment,
      photos: photos || [],
      isVerifiedAttendee: participant.status === 'attended'
    });

    await review.save();

    // Update event rating statistics
    await updateEventRatingStats(eventId);

    // Populate user info for response
    await review.populate('user', 'name profilePicture');

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ 
      message: 'Error submitting review', 
      error: error.message 
    });
  }
});

// @route   GET /api/events/:eventId/reviews
// @desc    Get all reviews for an event
// @access  Public
router.get('/:eventId/reviews', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sort = 'recent', page = 1, limit = 10 } = req.query;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Determine sort order
    let sortOption = { createdAt: -1 }; // Default: most recent
    if (sort === 'highest') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'helpful') {
      sortOption = { helpfulCount: -1, createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch reviews
    const reviews = await Review.find({ event: eventId })
      .populate('user', 'name profilePicture')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalReviews = await Review.countDocuments({ event: eventId });

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { event: event._id } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    // Format distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
        hasMore: skip + reviews.length < totalReviews
      },
      statistics: {
        avgRating: event.avgRating || 0,
        totalReviews: event.totalReviews || 0,
        ratingDistribution: distribution
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      message: 'Error fetching reviews', 
      error: error.message 
    });
  }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update user's own review
// @access  Private
router.put('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, comment, photos } = req.body;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns this review
    if (review.user.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (comment && comment.length < 10) {
      return res.status(400).json({ message: 'Review must be at least 10 characters long' });
    }

    if (photos && photos.length > 3) {
      return res.status(400).json({ message: 'Maximum 3 photos allowed' });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    if (photos !== undefined) review.photos = photos;

    await review.save();

    // Update event rating statistics if rating changed
    if (rating) {
      await updateEventRatingStats(review.event);
    }

    await review.populate('user', 'name profilePicture');

    res.json({
      message: 'Review updated successfully',
      review
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ 
      message: 'Error updating review', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete user's own review
// @access  Private
router.delete('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns this review
    if (review.user.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    const eventId = review.event;

    // Delete review
    await Review.findByIdAndDelete(reviewId);

    // Update event rating statistics
    await updateEventRatingStats(eventId);

    res.json({ message: 'Review deleted successfully' });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ 
      message: 'Error deleting review', 
      error: error.message 
    });
  }
});

// @route   POST /api/reviews/:reviewId/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.markHelpful(userId);

    res.json({
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount
    });

  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ 
      message: 'Error updating review', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/reviews/:reviewId/helpful
// @desc    Unmark review as helpful
// @access  Private
router.delete('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.unmarkHelpful(userId);

    res.json({
      message: 'Review unmarked as helpful',
      helpfulCount: review.helpfulCount
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ 
      message: 'Error updating review', 
      error: error.message 
    });
  }
});

// Helper function to update event rating statistics
async function updateEventRatingStats(eventId) {
  try {
    const stats = await Review.aggregate([
      { $match: { event: eventId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await Event.findByIdAndUpdate(eventId, {
        avgRating: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal
        totalReviews: stats[0].totalReviews
      });
    } else {
      // No reviews, reset to 0
      await Event.findByIdAndUpdate(eventId, {
        avgRating: 0,
        totalReviews: 0
      });
    }
  } catch (error) {
    console.error('Error updating event rating stats:', error);
  }
}

module.exports = router;
