const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event.js');
const User = require('../models/User.js');
const { sendEventRegistrationEmail, sendEventNotificationToHost } = require('../utils/emailService.js');
const { authMiddleware } = require('../utils/authUtils.js');
const recommendationEngine = require('../services/recommendationEngine.js');

const router = express.Router();

// Get all events (with filtering)
router.get('/', async (req, res) => {
  try {
    const { categories, city, date, page = 1, limit = 10 } = req.query;
    
    let filter = { status: 'published' };
    
    if (categories) {
      filter.categories = { $in: categories.split(',') };
    }
    
    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const events = await Event.find(filter)
      .populate('host', 'name email')
      .populate('participants.user', 'name email')
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get events hosted by the authenticated user
router.get('/my-hosted', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ host: req.user.id })
      .populate('host', 'name email')
      .populate('participants.user', 'name email')
      .sort({ date: 1 });

    res.json({
      events,
      total: events.length
    });
  } catch (error) {
    console.error('Get hosted events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('host', 'name email bio profilePicture')
      .populate('coHosts', 'name email bio profilePicture')
      .populate('participants.user', 'name email profilePicture');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new event (community members only)
router.post('/', authMiddleware, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('categories').isArray({ min: 1 }).withMessage('At least one category is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('location.city').notEmpty().withMessage('City is required'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    // Check if user is community member
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'community_member') {
      return res.status(403).json({ message: 'Only community members can create events' });
    }

    const eventData = {
      ...req.body,
      host: req.user.id,
      createdBy: req.user.id
    };

    const event = new Event(eventData);
    await event.save();

    // Add event to user's hosted events
    user.hostedEvents.push(event._id);
    await user.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('host', 'name email');

    res.status(201).json({
      message: 'Event created successfully',
      event: populatedEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register for event
router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('host', 'name email');
    const userId = req.user.userId || req.user.id;
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is full
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Check if user is already registered
    const alreadyRegistered = event.participants.some(
      p => p.user.toString() === req.user.userId
    );
    
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Add user to participants
    event.participants.push({
      user: req.user.userId,
      registeredAt: new Date(),
      status: 'registered'
    });

    await event.updateParticipantCount();

    const user = await User.findById(req.user.userId);
    user.registeredEvents.push(event._id);
    await user.save();

    // Update analytics for recommendation engine
    try {
      await recommendationEngine.updateEventRegistrationAnalytics(req.user.userId, event._id);
    } catch (analyticsError) {
      console.error('Failed to update analytics:', analyticsError);
      // Continue without failing the registration
    }

    // Update analytics for recommendation system
    try {
      await recommendationEngine.updateEventRegistrationAnalytics(userId, event._id);
    } catch (analyticsError) {
      console.error('Failed to update analytics:', analyticsError);
      // Don't fail the registration if analytics update fails
    }

    // Send confirmation email to user
    try {
      await sendEventRegistrationEmail(user.email, user.name, event);
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError);
    }

    // Send notification to host
    try {
      await sendEventNotificationToHost(event.host.email, event.host.name, user, event);
    } catch (emailError) {
      console.error('Failed to send host notification:', emailError);
    }

    res.json({
      message: 'Successfully registered for event',
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        currentParticipants: event.currentParticipants
      }
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get events by user interests
router.get('/recommended/for-me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.interests.length) {
      return res.status(400).json({ message: 'No interests found for user' });
    }

    const events = await Event.find({
      categories: { $in: user.interests },
      status: 'published',
      date: { $gte: new Date() }
    })
    .populate('host', 'name email')
    .sort({ date: 1 })
    .limit(20);

    res.json({ events });
  } catch (error) {
    console.error('Get recommended events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update event (host only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the host
    if (event.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only event host can update this event' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('host', 'name email');

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete event (host only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the host
    if (event.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only event host can delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;