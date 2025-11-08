const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Update user interests
router.put('/interests', authenticateToken, async (req, res) => {
  try {
    const { interests } = req.body;
    
    if (!Array.isArray(interests)) {
      return res.status(400).json({ message: 'Interests must be an array' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { interests },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Interests updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests
      }
    });
  } catch (error) {
    console.error('Update interests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('registeredEvents', 'title date location categories')
      .populate('hostedEvents', 'title date location categories currentParticipants maxParticipants');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, bio, location } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        ...(name && { name }),
        ...(bio && { bio }),
        ...(location && { location })
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's registered events
router.get('/registered-events', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate({
        path: 'registeredEvents',
        populate: {
          path: 'host',
          select: 'name'
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out any null events (in case some events were deleted)
    const validEvents = user.registeredEvents.filter(event => event !== null);

    res.json({
      success: true,
      events: validEvents
    });
  } catch (error) {
    console.error('Error fetching registered events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;