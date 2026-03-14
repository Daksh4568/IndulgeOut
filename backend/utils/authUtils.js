const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ [Auth] No authorization header');
      return res.status(401).json({ message: 'No authorization header provided' });
    }
    
    // Extract token (handle both "Bearer token" and just "token" formats)
    let token;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else {
      token = authHeader;
    }
    
    // Check for invalid token values
    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ [Auth] Invalid token value:', token);
      return res.status(401).json({ message: 'No valid token provided' });
    }
    
    console.log('✅ [Auth] Valid token format received');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user by ID from token
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = { 
      _id: user._id,
      id: user._id.toString(), 
      userId: user._id.toString(), // Add userId for consistency
      email: user.email, 
      name: user.name,
      role: user.role,
      userType: user.hostPartnerType, // Add userType alias for workspace routes
      hostPartnerType: user.hostPartnerType // For B2B users (community_organizer, venue, brand_sponsor)
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = {
  authMiddleware
};